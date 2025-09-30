import React, { useState, useCallback, useRef } from 'react';
import { Upload, Search, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { OPENROUTER_MODEL_OPTIONS, DEFAULT_OPENROUTER_MODEL } from '@/constants/openRouterModels';

interface BugAnalysisResult {
  analysis: string;
  type: 'generic' | 'code-specific';
}

type AnalysisState = 'idle' | 'analyzing' | 'result';

const BugHunter: React.FC = () => {
  // State management
  const [bugDetails, setBugDetails] = useState<string>('');
  const [codeInput, setCodeInput] = useState<string>('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedFileContent, setAttachedFileContent] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_OPENROUTER_MODEL);
  const [analysisResult, setAnalysisResult] = useState<BugAnalysisResult | null>(null);
  const [analysisState, setAnalysisState] = useState<AnalysisState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available models
  const models = OPENROUTER_MODEL_OPTIONS;

  // File handling
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAttachedFile(file);
      
      // Read file content
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setAttachedFileContent(content);
      };
      reader.readAsText(file);
    }
  }, []);

  const removeFile = useCallback(() => {
    setAttachedFile(null);
    setAttachedFileContent('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Create prompt based on input type
  const createBugAnalysisPrompt = useCallback((bugText: string, code?: string, fileContent?: string): string => {
    const hasCodeOrFile = (code && code.trim()) || (fileContent && fileContent.trim());
    
    if (hasCodeOrFile) {
      // Scenario B: Bug Details + Code/File
      const codeToAnalyze = fileContent || code || '';
      return `You are an expert software debugging assistant. Analyze the provided code to identify the probable cause(s) of the reported bug.

## Bug Report
${bugText}

## Code to Analyze
\`\`\`
${codeToAnalyze}
\`\`\`

## Instructions
Scan the provided code from top to bottom and identify:
1. Probable cause(s) of the bug based on the code
2. Specific lines or sections that might be causing the issue
3. Why these code sections could lead to the reported bug

Focus on finding actual issues in the provided code that could cause the described bug. Be specific about line numbers or code sections when possible.`;
    } else {
      // Scenario A: Bug Details only
      return `You are an expert software debugging assistant. Provide a generic analysis of the reported bug.

## Bug Report
${bugText}

## Instructions
Since no specific code was provided, give a generic analysis including:
1. Probable causes for this type of bug
2. Common reasons why this bug occurs
3. What the user should check to identify the root cause
4. General debugging steps and areas to investigate

Provide practical guidance that helps the user understand what to look for in their codebase.`;
    }
  }, []);

  // Handle analysis
  const handleStartAnalysis = useCallback(async () => {
    // Reset previous state
    setErrorMessage('');
    setAnalysisResult(null);
    
    // Validation
    if (!bugDetails.trim()) {
      setErrorMessage('Bug Details are required to start analysis.');
      return;
    }

    if (!apiKey.trim()) {
      setErrorMessage('Please enter your OpenRouter API key.');
      return;
    }

    setAnalysisState('analyzing');

    try {
      const prompt = createBugAnalysisPrompt(bugDetails, codeInput, attachedFileContent);
      const hasCodeOrFile = (codeInput && codeInput.trim()) || (attachedFileContent && attachedFileContent.trim());

      const response = await apiClient.post('/chat', {
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        model: selectedModel,
        apiKey: apiKey
      });

      // Handle response (using the same logic as CodeCommenter)
      const responseData = (response.data || response) as any;
      
      if (responseData && typeof responseData === 'object') {
        if (responseData.choices?.[0]?.message?.content) {
          const content = responseData.choices[0].message.content;
          setAnalysisResult({
            analysis: content,
            type: hasCodeOrFile ? 'code-specific' : 'generic'
          });
          setAnalysisState('result');
        } else if (responseData.content) {
          setAnalysisResult({
            analysis: responseData.content,
            type: hasCodeOrFile ? 'code-specific' : 'generic'
          });
          setAnalysisState('result');
        } else {
          throw new Error('Invalid response format from API');
        }
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (error: any) {
      console.error('Error during bug analysis:', error);
      const apiErrorMessage = error?.response?.data?.error?.message;
      const detailedMessage = apiErrorMessage || error?.message || 'Unknown error occurred';
      setErrorMessage(`Analysis failed: ${detailedMessage}`);
      setAnalysisState('idle');
    }
  }, [bugDetails, codeInput, attachedFileContent, apiKey, selectedModel, createBugAnalysisPrompt]);

  // Reset to start new analysis
  const resetAnalysis = useCallback(() => {
    setAnalysisState('idle');
    setAnalysisResult(null);
    setErrorMessage('');
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🐛 Bug Hunter</h1>
        <p className="text-gray-600">Analyze bugs and find probable causes using AI</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
              Bug Report
            </h2>

            {/* Bug Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bug Details *
                </label>
                <textarea
                  value={bugDetails}
                  onChange={(e) => setBugDetails(e.target.value)}
                  placeholder="Describe the bug, error message, or issue you're experiencing..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  disabled={analysisState === 'analyzing'}
                />
              </div>

              {/* Code Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code Input (Optional)
                </label>
                <textarea
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="Paste relevant code here..."
                  className="w-full h-40 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                  disabled={analysisState === 'analyzing'}
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attach File (Optional)
                </label>
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.cs,.php,.rb,.go,.rs,.swift,.kt,.scala,.html,.css,.json,.xml,.yaml,.yml,.md,.txt"
                    disabled={analysisState === 'analyzing'}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    disabled={analysisState === 'analyzing'}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </button>
                  
                  {attachedFile && (
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-2 text-blue-500" />
                        <span className="text-sm text-gray-700">{attachedFile.name}</span>
                      </div>
                      <button
                        onClick={removeFile}
                        className="text-red-500 hover:text-red-700 text-sm"
                        disabled={analysisState === 'analyzing'}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* API Configuration */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">API Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  disabled={analysisState === 'analyzing'}
                >
                  {models.map(model => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OpenRouter API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your OpenRouter API key"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  disabled={analysisState === 'analyzing'}
                />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="space-y-2">
            {analysisState === 'idle' && (
              <button
                onClick={handleStartAnalysis}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-md transition-colors flex items-center justify-center"
              >
                <Search className="w-5 h-5 mr-2" />
                Start Analysis
              </button>
            )}

            {analysisState === 'analyzing' && (
              <button
                disabled
                className="w-full bg-gray-400 text-white font-semibold py-3 px-6 rounded-md flex items-center justify-center"
              >
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Analyzing...
              </button>
            )}

            {analysisState === 'result' && (
              <button
                onClick={resetAnalysis}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md transition-colors"
              >
                New Analysis
              </button>
            )}

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {errorMessage}
              </div>
            )}
          </div>
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border p-6 h-full">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
              Analysis Results
            </h2>

            {analysisState === 'idle' && (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Enter bug details and click "Start Analysis" to begin</p>
                </div>
              </div>
            )}

            {analysisState === 'analyzing' && (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                  <p>Analyzing the bug report...</p>
                  <p className="text-sm mt-2">This may take 10-30 seconds</p>
                </div>
              </div>
            )}

            {analysisState === 'result' && analysisResult && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    analysisResult.type === 'generic' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {analysisResult.type === 'generic' ? 'Generic Analysis' : 'Code-Specific Analysis'}
                  </span>
                </div>
                
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {analysisResult.analysis}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BugHunter;