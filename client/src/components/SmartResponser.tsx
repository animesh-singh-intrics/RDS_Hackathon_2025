import React, { useState, useCallback } from 'react';
import { Send, Mail, MessageSquare, Sparkles } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { OPENROUTER_MODEL_OPTIONS, DEFAULT_OPENROUTER_MODEL } from '@/constants/openRouterModels';

interface EmailResponse {
  generatedReply: string;
  responseType: string;
  hasEmailContext: boolean;
}

type GenerationState = 'idle' | 'generating' | 'result';

const SmartResponser: React.FC = () => {
  // State management
  const [emailThread, setEmailThread] = useState<string>('');
  const [responseType, setResponseType] = useState<string>('');
  const [additionalInstructions, setAdditionalInstructions] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_OPENROUTER_MODEL);
  const [generatedResponse, setGeneratedResponse] = useState<EmailResponse | null>(null);
  const [generationState, setGenerationState] = useState<GenerationState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Response type options
  const responseTypes = [
    { value: 'professional', label: 'Professional', description: 'Formal, business-appropriate tone' },
    { value: 'casual', label: 'Casual', description: 'Friendly, relaxed communication' },
    { value: 'funny', label: 'Funny', description: 'Light-hearted with appropriate humor' },
    { value: 'short', label: 'Short/Quick', description: 'Brief and to-the-point' },
    { value: 'normalized', label: 'Normalized/Bot-like', description: 'Standard, neutral response' }
  ];

  // Available models (fetched from central config to keep OpenRouter mappings fresh)
  const models = OPENROUTER_MODEL_OPTIONS;

  // Create prompt based on available input
  const createEmailResponsePrompt = useCallback((
    responseStyle: string, 
    emailContext?: string, 
    instructions?: string
  ): string => {
    const hasEmailThread = emailContext && emailContext.trim();
    const hasInstructions = instructions && instructions.trim();
    
    let prompt = `You are an expert email communication assistant. Generate a smart, well-crafted email response in the specified style.

## Response Style: ${responseStyle.charAt(0).toUpperCase() + responseStyle.slice(1)}
`;

    if (hasEmailThread) {
      // Scenario A: With email thread context
      prompt += `
## Email Thread Context
${emailContext}

## Instructions
Read and understand the entire email conversation context above. Generate a reply that:
1. Considers the full conversation history and context
2. Responds appropriately to the most recent message
3. Matches the ${responseStyle} tone and style
4. Maintains conversation continuity and relevance
`;
    } else {
      // Scenario B: Without email thread context
      prompt += `
## Instructions
Since no email thread was provided, generate a ${responseStyle} email response that:
1. Uses appropriate ${responseStyle} tone and language
2. Is suitable as a general reply in that style
3. Can be adapted for various email situations
`;
    }

    if (hasInstructions) {
      prompt += `
## Additional Requirements
Please ensure the response includes or addresses the following specific instructions:
${instructions}
`;
    }

    prompt += `
## Output Guidelines
- Generate only the email response content (no subject line unless specifically requested)
- Use appropriate greeting and closing for the ${responseStyle} style
- Keep the response natural and contextually appropriate
- Do not include any meta-commentary or explanations about the response
- Make it ready to copy and use directly

Generate the email response now:`;

    return prompt;
  }, []);

  // Handle response generation
  const handleGenerateResponse = useCallback(async () => {
    // Reset previous state
    setErrorMessage('');
    setGeneratedResponse(null);
    
    // Validation
    if (!responseType) {
      setErrorMessage('Please select a Response Type to generate a reply.');
      return;
    }

    if (!apiKey.trim()) {
      setErrorMessage('Please enter your OpenRouter API key.');
      return;
    }

    setGenerationState('generating');

    try {
      const prompt = createEmailResponsePrompt(responseType, emailThread, additionalInstructions);
      const hasEmailContext = !!(emailThread && emailThread.trim());

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

      // Handle response (using the same logic as other tools)
      const responseData = (response.data || response) as any;
      
      if (responseData && typeof responseData === 'object') {
        if (responseData.choices?.[0]?.message?.content) {
          const content = responseData.choices[0].message.content;
          setGeneratedResponse({
            generatedReply: content,
            responseType: responseTypes.find(rt => rt.value === responseType)?.label || responseType,
            hasEmailContext
          });
          setGenerationState('result');
        } else if (responseData.content) {
          setGeneratedResponse({
            generatedReply: responseData.content,
            responseType: responseTypes.find(rt => rt.value === responseType)?.label || responseType,
            hasEmailContext
          });
          setGenerationState('result');
        } else {
          throw new Error('Invalid response format from API');
        }
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (error: any) {
      console.error('Error during email response generation:', error);
      const apiErrorMessage = error?.response?.data?.error?.message;
      const detailedMessage = apiErrorMessage || error?.message || 'Unknown error occurred';
      setErrorMessage(`Generation failed: ${detailedMessage}`);
      setGenerationState('idle');
    }
  }, [responseType, emailThread, additionalInstructions, apiKey, selectedModel, createEmailResponsePrompt, responseTypes]);

  // Reset to start new generation
  const resetGeneration = useCallback(() => {
    setGenerationState('idle');
    setGeneratedResponse(null);
    setErrorMessage('');
  }, []);

  // Copy to clipboard
  const copyToClipboard = useCallback(async () => {
    if (generatedResponse?.generatedReply) {
      try {
        await navigator.clipboard.writeText(generatedResponse.generatedReply);
        // You could add a toast notification here
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
      }
    }
  }, [generatedResponse]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">💬 Smart Responser</h1>
        <p className="text-gray-600">Generate professional email responses with AI assistance</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Mail className="w-5 h-5 mr-2 text-green-500" />
              Email Details
            </h2>

            {/* Email Thread Input */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Thread Input (Optional)
                </label>
                <textarea
                  value={emailThread}
                  onChange={(e) => setEmailThread(e.target.value)}
                  placeholder="Paste the entire email conversation chain here for context..."
                  className="w-full h-40 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  disabled={generationState === 'generating'}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Include the full conversation history to generate contextually aware responses
                </p>
              </div>

              {/* Response Type Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Response Type *
                </label>
                <select
                  value={responseType}
                  onChange={(e) => setResponseType(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={generationState === 'generating'}
                >
                  <option value="">Select response style...</option>
                  {responseTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label} - {type.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Additional Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Instructions (Optional)
                </label>
                <textarea
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  placeholder="Specify anything specific to include (e.g., 'Schedule meeting with Andy at 9:30 PM today')..."
                  className="w-full h-24 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  disabled={generationState === 'generating'}
                />
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
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  disabled={generationState === 'generating'}
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
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  disabled={generationState === 'generating'}
                />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="space-y-2">
            {generationState === 'idle' && (
              <button
                onClick={handleGenerateResponse}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-md transition-colors flex items-center justify-center"
              >
                <Send className="w-5 h-5 mr-2" />
                Generate Response
              </button>
            )}

            {generationState === 'generating' && (
              <button
                disabled
                className="w-full bg-gray-400 text-white font-semibold py-3 px-6 rounded-md flex items-center justify-center"
              >
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Generating...
              </button>
            )}

            {generationState === 'result' && (
              <div className="space-y-2">
                <button
                  onClick={resetGeneration}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md transition-colors"
                >
                  Generate New Response
                </button>
                <button
                  onClick={copyToClipboard}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-md transition-colors flex items-center justify-center"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Copy Response
                </button>
              </div>
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
              <Sparkles className="w-5 h-5 mr-2 text-green-500" />
              Generated Response
            </h2>

            {generationState === 'idle' && (
              <div className="flex items-center justify-center h-96 text-gray-500">
                <div className="text-center">
                  <Send className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a response type and click "Generate Response" to begin</p>
                </div>
              </div>
            )}

            {generationState === 'generating' && (
              <div className="flex items-center justify-center h-96 text-gray-500">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                  <p>Generating your email response...</p>
                  <p className="text-sm mt-2">This may take 10-30 seconds</p>
                </div>
              </div>
            )}

            {generationState === 'result' && generatedResponse && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                    {generatedResponse.responseType} Style
                  </span>
                  <span className="text-xs text-gray-500">
                    {generatedResponse.hasEmailContext ? 'With Email Context' : 'Generic Response'}
                  </span>
                </div>
                
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed font-mono text-sm">
                    {generatedResponse.generatedReply}
                  </div>
                </div>

                <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-md">
                  💡 <strong>Tip:</strong> Review the generated response before sending. You can click "Generate New Response" for alternatives or copy this response to use in your email client.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartResponser;