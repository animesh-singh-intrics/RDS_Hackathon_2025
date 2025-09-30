import React, { useState, useRef, useCallback } from 'react';
import { Copy, Trash2, Play, FileCode, Brain, BarChart3 } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { OPENROUTER_MODEL_OPTIONS, DEFAULT_OPENROUTER_MODEL } from '@/constants/openRouterModels';

interface CodeCommenterStats {
  linesProcessed: number;
  commentsAdded: number;
  complexityScore: number;
}

interface CodeCommenterResult {
  commentedCode: string;
  analysis: string;
  stats: CodeCommenterStats;
}

const MODEL_OPTIONS = OPENROUTER_MODEL_OPTIONS;

const LANGUAGE_OPTIONS = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' }
];

const MAX_CHARACTERS = 8000;
const MAX_LINES = 1000;

export const CodeCommenterTool: React.FC = () => {
  const [inputCode, setInputCode] = useState('');
  const [outputCode, setOutputCode] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('auto');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [stats, setStats] = useState<CodeCommenterStats>({
    linesProcessed: 0,
    commentsAdded: 0,
    complexityScore: 0
  });
  const [copyNotification, setCopyNotification] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState(DEFAULT_OPENROUTER_MODEL);

  const outputTextareaRef = useRef<HTMLTextAreaElement>(null);

  const getCharacterCount = () => inputCode.length;
  const getLineCount = () => inputCode.split('\n').length;

  const getCharCountClass = () => {
    const charCount = getCharacterCount();
    const lineCount = getLineCount();
    
    if (charCount > MAX_CHARACTERS || lineCount > MAX_LINES) return 'text-red-600';
    if (charCount > MAX_CHARACTERS * 0.8 || lineCount > MAX_LINES * 0.8) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const createCodeCommenterPrompt = (code: string, language: string) => {
    return `You are an expert code documentation assistant with deep knowledge of software engineering best practices. Your task is to analyze code and add high-quality, meaningful comments that follow industry standards.

## Your Mission
Analyze the provided code and add professional-quality comments that:
1. Explain complex business logic and non-obvious algorithms
2. Document function/method contracts (parameters, return values, exceptions)
3. Clarify edge cases, assumptions, and gotchas
4. Follow language-specific documentation standards
5. Avoid redundant or obvious comments

## Language: ${language}

## Code to analyze:
\`\`\`${language}
${code}
\`\`\`

Please provide your response in this exact format:

## Code Analysis
[Brief analysis of the code complexity, main functionality, and key areas needing documentation]

## Commented Code
[The original code with professional comments added, preserving original formatting]

## Comment Rationale
[Explanation of why specific comments were added and any refactoring suggestions]

## Assessment
[Quality assessment including complexity score (1-10), lines processed, estimated comments added]

Remember: Focus on WHY rather than WHAT. Add value through explanations of business logic, algorithms, edge cases, and API contracts.`;
  };

  const detectLanguage = (code: string): string => {
    if (code.includes('function') || code.includes('const') || code.includes('let') || code.includes('=>')) return 'javascript';
    if (code.includes('def ') || code.includes('import ') || code.includes('from ')) return 'python';
    if (code.includes('public class') || code.includes('private ') || code.includes('System.out')) return 'java';
    if (code.includes('#include') || code.includes('int main') || code.includes('std::')) return 'cpp';
    if (code.includes('using System') || code.includes('Console.Write')) return 'csharp';
    if (code.includes('<?php') || code.includes('echo ')) return 'php';
    if (code.includes('func ') || code.includes('package main')) return 'go';
    if (code.includes('fn ') || code.includes('let mut')) return 'rust';
    return 'javascript'; // default
  };

  const parseApiResponse = (response: string): CodeCommenterResult => {
    // Split by ## to get sections
    const sections = response.split('##').map(s => s.trim()).filter(s => s.length > 0);
    
    let commentedCode = '';
    let analysisText = '';
    
    for (const section of sections) {
      // More flexible matching for section headers
      const lowerSection = section.toLowerCase();
      
      if (lowerSection.startsWith('commented code')) {
        // Extract everything after the header
        const content = section.substring(section.indexOf('\n') + 1).trim();
        commentedCode = content;
        
        // Remove code block markers if present
        if (commentedCode.startsWith('```')) {
          const lines = commentedCode.split('\n');
          if (lines.length > 2 && lines[lines.length - 1].trim() === '```') {
            // Remove first and last line (the ``` markers)
            commentedCode = lines.slice(1, -1).join('\n');
          }
        }
      } else if (lowerSection.startsWith('code analysis')) {
        const content = section.substring(section.indexOf('\n') + 1).trim();
        analysisText += 'Analysis:\n' + content + '\n\n';
      } else if (lowerSection.startsWith('comment rationale')) {
        const content = section.substring(section.indexOf('\n') + 1).trim();
        analysisText += 'Rationale:\n' + content + '\n\n';
      } else if (lowerSection.startsWith('assessment')) {
        const content = section.substring(section.indexOf('\n') + 1).trim();
        analysisText += 'Assessment:\n' + content;
      }
    }

    // Calculate stats
    const lines = commentedCode ? commentedCode.split('\n').length : 0;
    const comments = (commentedCode.match(/\/\*\*|\*\/|\/\/|#|"""|'''/g) || []).length;
    const complexity = Math.min(10, Math.max(1, Math.floor(lines / 5) + 2));

    return {
      commentedCode: commentedCode || 'Failed to parse commented code from response.',
      analysis: analysisText || 'No analysis available.',
      stats: {
        linesProcessed: lines,
        commentsAdded: comments,
        complexityScore: complexity
      }
    };
  };

  const handleCommentCode = async () => {
    if (!inputCode.trim()) {
      alert('Please enter some code to comment.');
      return;
    }

    if (!apiKey.trim()) {
      alert('Please enter your OpenRouter API key.');
      return;
    }

    if (getCharacterCount() > MAX_CHARACTERS) {
      alert(`Code is too long. Please limit to ${MAX_CHARACTERS} characters.`);
      return;
    }

    if (getLineCount() > MAX_LINES) {
      alert(`Code has too many lines. Please limit to ${MAX_LINES} lines.`);
      return;
    }

    setIsProcessing(true);
    setOutputCode('Analyzing your code and adding professional comments...\n\nThis may take 10-30 seconds depending on code complexity.');
    setShowAnalysis(false);

    try {
      const language = selectedLanguage === 'auto' ? detectLanguage(inputCode) : selectedLanguage;
      const prompt = createCodeCommenterPrompt(inputCode, language);

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

      // The response might be directly the data object, or nested under response.data
      const responseData = (response.data || response) as any;
      
      if (responseData && typeof responseData === 'object') {
        if (responseData.choices?.[0]?.message?.content) {
          const content = responseData.choices[0].message.content;
          const result = parseApiResponse(content);
          setOutputCode(result.commentedCode);
          setAnalysis(result.analysis);
          setStats(result.stats);
          setShowAnalysis(true);
        } else if (responseData.content) {
          // Handle direct content response
          const result = parseApiResponse(responseData.content);
          setOutputCode(result.commentedCode);
          setAnalysis(result.analysis);
          setStats(result.stats);
          setShowAnalysis(true);
        } else {
          throw new Error('Invalid response format from API');
        }
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (error: any) {
      console.error('Error processing code:', error);
      const apiErrorMessage = error?.response?.data?.error?.message;
      const detailedMessage = apiErrorMessage || error?.message || 'Unknown error occurred';
      setOutputCode(`Error processing code. Please try again.\n\nError details: ${detailedMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };



  const handleCopyToClipboard = useCallback(() => {
    if (outputTextareaRef.current) {
      outputTextareaRef.current.select();
      document.execCommand('copy');
      setCopyNotification(true);
      setTimeout(() => setCopyNotification(false), 3000);
    }
  }, []);

  const handleClearAll = () => {
    setInputCode('');
    setOutputCode('');
    setAnalysis('');
    setShowAnalysis(false);
    setStats({ linesProcessed: 0, commentsAdded: 0, complexityScore: 0 });
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-purple-800 p-4">
      <div className="max-w-7xl mx-auto px-4 w-full overflow-hidden">
        {/* Header */}
        <div className="text-center mb-8 text-white">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileCode className="w-12 h-12" />
            <h1 className="text-4xl font-bold">Code Commenter Tool</h1>
          </div>
          <p className="text-xl opacity-90 mb-6">
            Add professional comments to your code using AI-powered analysis
          </p>
          
          {/* Stats */}
          <div className="flex justify-center gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{stats.linesProcessed}</div>
              <div className="text-sm opacity-80">Lines Processed</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{stats.commentsAdded}</div>
              <div className="text-sm opacity-80">Comments Added</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">
                {stats.complexityScore > 0 ? `${stats.complexityScore}/10` : '-'}
              </div>
              <div className="text-sm opacity-80">Complexity Score</div>
            </div>
          </div>
        </div>

        {/* Main Panel */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          {/* Language Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Programming Language:
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {LANGUAGE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* API Configuration */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OpenRouter API Key
                </label>
                <input
                  type="password"
                  placeholder="Enter your OpenRouter API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {MODEL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Split Layout with Center Button */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_2fr] gap-4 mb-6 items-start max-w-full overflow-hidden">
            {/* Input Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FileCode className="w-5 h-5" />
                  Input Code
                </h3>
                <span className={`text-sm ${getCharCountClass()}`}>
                  {getCharacterCount()} / {MAX_CHARACTERS} characters ({getLineCount()} lines)
                </span>
              </div>
              
              {(getCharacterCount() > MAX_CHARACTERS || getLineCount() > MAX_LINES) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  ⚠️ Code exceeds maximum limit of {MAX_LINES} lines or {MAX_CHARACTERS} characters. Please reduce the code size.
                </div>
              )}
              
              <textarea
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-w-full overflow-auto"
                placeholder="Paste your code here...

The AI will analyze your code and add professional comments following industry best practices."
              />
            </div>

            {/* Center Action Button */}
            <div className="flex flex-col items-center justify-center space-y-4 w-full px-2">
              <button
                onClick={handleCommentCode}
                disabled={isProcessing || !inputCode.trim() || !apiKey.trim()}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md text-sm w-full min-w-[120px]"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    <span>Add Comments</span>
                  </>
                )}
              </button>
              
              <button
                onClick={handleClearAll}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors text-sm w-full"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            </div>

            {/* Output Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Commented Code
                </h3>
                <button
                  onClick={handleCopyToClipboard}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors"
                  disabled={!outputCode}
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
              </div>
              
              <textarea
                ref={outputTextareaRef}
                value={outputCode}
                readOnly
                className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm bg-gray-50 resize-none max-w-full overflow-auto"
                placeholder="Your commented code will appear here...

The AI will:
✓ Add JSDoc/docstring documentation
✓ Explain complex algorithms  
✓ Document parameters and return values
✓ Note edge cases and assumptions
✓ Follow language-specific standards
✓ Avoid redundant comments"
              />
            </div>
          </div>



          {/* Analysis Section */}
          {showAnalysis && analysis && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5" />
                Analysis Report
              </h3>
              <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {analysis}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Copy Notification */}
      {copyNotification && (
        <div className="fixed top-6 right-6 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-transform">
          ✅ Code copied to clipboard!
        </div>
      )}
    </div>
  );
};