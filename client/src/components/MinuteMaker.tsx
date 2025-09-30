import React, { useState, useRef } from 'react';
import { Button } from './ui/Button';
import { OPENROUTER_MODEL_OPTIONS, DEFAULT_OPENROUTER_MODEL } from '@/constants/openRouterModels';

interface MeetingMinutes {
  dateOfMeeting: string;
  attendees: string[];
  minutesOfMeeting: string[];
  actionItems: { item: string; assignee: string; dueDate: string }[];
  nextSteps: string[];
}

interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  currentStep: string;
}

export const MinuteMaker: React.FC = () => {
  const [transcript, setTranscript] = useState<string>('');
  const [generatedMinutes, setGeneratedMinutes] = useState<MeetingMinutes | null>(null);
  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
    currentStep: ''
  });
  const [selectedModel, setSelectedModel] = useState(DEFAULT_OPENROUTER_MODEL);
  const [apiKey, setApiKey] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const models = OPENROUTER_MODEL_OPTIONS;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setTranscript(content);
      };
      reader.readAsText(file);
    }
  };

  const generateMinutes = async () => {
    if (!transcript.trim()) {
      alert('Please upload or paste a meeting transcript first.');
      return;
    }

    if (!apiKey.trim()) {
      alert('Please enter your OpenRouter API key.');
      return;
    }

    setProcessing({
      isProcessing: true,
      progress: 0,
      currentStep: 'Analyzing transcript...'
    });

    try {
      // Simulate progress updates
      const progressSteps = [
        { progress: 20, step: 'Identifying participants...' },
        { progress: 40, step: 'Extracting key discussion points...' },
        { progress: 60, step: 'Identifying action items...' },
        { progress: 80, step: 'Formatting meeting minutes...' },
        { progress: 100, step: 'Finalizing document...' }
      ];

      for (const step of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setProcessing(prev => ({
          ...prev,
          progress: step.progress,
          currentStep: step.step
        }));
      }

      const prompt = `Please analyze the following meeting transcript and convert it into professional meeting minutes with the following exact format:

TRANSCRIPT:
${transcript}

Please format your response as JSON with the following structure:
{
  "dateOfMeeting": "Extract or estimate the meeting date (format: YYYY-MM-DD)",
  "attendees": ["List of participant names mentioned in the transcript"],
  "minutesOfMeeting": ["Key discussion points, decisions made, and important topics covered - each as a separate bullet point"],
  "actionItems": [
    {
      "item": "Specific action item description",
      "assignee": "Person responsible (if mentioned)",
      "dueDate": "Due date if mentioned, otherwise 'TBD'"
    }
  ],
  "nextSteps": ["Future actions, follow-up meetings, or next phases mentioned"]
}

Focus on:
1. Extracting clear, actionable items
2. Identifying decision points and outcomes  
3. Capturing who said what when relevant
4. Organizing information logically
5. Using professional, concise language

Ensure the response is valid JSON only.`;

      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          model: selectedModel,
          apiKey: apiKey
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate meeting minutes');
      }

      const data = await response.json();
      
      try {
        // Get AI response from OpenRouter format
        const aiResponse = data.choices?.[0]?.message?.content || data.response || '';
        
        // Extract JSON from markdown code block if present
        const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/);
        const jsonString = jsonMatch ? jsonMatch[1] : aiResponse;
        
        const minutes = JSON.parse(jsonString);
        setGeneratedMinutes(minutes);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        throw new Error('Failed to parse meeting minutes from AI response');
      }

    } catch (error) {
      console.error('Error generating minutes:', error);
      const detailedMessage = (error as any)?.response?.data?.error?.message || (error as Error).message;
      alert(`Failed to generate meeting minutes: ${detailedMessage}`);
    } finally {
      setProcessing({
        isProcessing: false,
        progress: 0,
        currentStep: ''
      });
    }
  };

  const exportMinutes = () => {
    if (!generatedMinutes) return;

    const formatDate = (dateStr: string) => {
      try {
        return new Date(dateStr).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch {
        return dateStr;
      }
    };

    const content = `MEETING MINUTES

Date of Meeting: ${formatDate(generatedMinutes.dateOfMeeting)}

Attendees:
${generatedMinutes.attendees.map(attendee => `• ${attendee}`).join('\n')}

Minutes of the Meeting:
${generatedMinutes.minutesOfMeeting.map((minute, index) => `${index + 1}. ${minute}`).join('\n')}

Action Items:
${generatedMinutes.actionItems.map((item, index) => 
  `${index + 1}. ${item.item}${item.assignee ? ` (Assigned to: ${item.assignee})` : ''}${item.dueDate && item.dueDate !== 'TBD' ? ` - Due: ${item.dueDate}` : ''}`
).join('\n')}

Next Steps:
${generatedMinutes.nextSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

Generated by MinuteMaker on ${new Date().toLocaleDateString()}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-minutes-${generatedMinutes.dateOfMeeting || 'unknown-date'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-indigo-600 p-3 rounded-full mr-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900">MinuteMaker</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your meeting transcripts into professional, structured meeting minutes with AI-powered intelligence
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Input */}
          <div className="space-y-6">
            {/* AI Configuration */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">AI Configuration</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    OpenRouter API Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your OpenRouter API key"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AI Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {models.map((model) => (
                      <option key={model.value} value={model.value}>
                        {model.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Transcript Input */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Meeting Transcript</h2>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload File
                  </Button>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".txt,.doc,.docx"
                    className="hidden"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or paste transcript here:
                  </label>
                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Paste your meeting transcript here..."
                    rows={12}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  />
                  <div className="text-sm text-gray-500 mt-2">
                    Characters: {transcript.length}
                  </div>
                </div>

                <Button
                  onClick={generateMinutes}
                  disabled={processing.isProcessing || !transcript.trim() || !apiKey.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  {processing.isProcessing ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Generating Minutes...</span>
                    </div>
                  ) : (
                    'Generate Meeting Minutes'
                  )}
                </Button>

                {processing.isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{processing.currentStep}</span>
                      <span>{processing.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${processing.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Output */}
          <div className="space-y-6">
            {generatedMinutes ? (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800">Generated Minutes</h2>
                  <Button
                    onClick={exportMinutes}
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Minutes
                  </Button>
                </div>

                <div className="space-y-6 text-gray-800">
                  {/* Date of Meeting */}
                  <div>
                    <h3 className="text-lg font-semibold text-indigo-600 mb-2">Date of Meeting</h3>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {new Date(generatedMinutes.dateOfMeeting).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  {/* Attendees */}
                  <div>
                    <h3 className="text-lg font-semibold text-indigo-600 mb-2">Attendees</h3>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <ul className="space-y-1">
                        {generatedMinutes.attendees.map((attendee, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                            <span>{attendee}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Minutes of Meeting */}
                  <div>
                    <h3 className="text-lg font-semibold text-indigo-600 mb-2">Minutes of the Meeting</h3>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <ol className="space-y-2">
                        {generatedMinutes.minutesOfMeeting.map((minute, index) => (
                          <li key={index} className="flex gap-3">
                            <span className="text-indigo-600 font-semibold min-w-[1.5rem]">{index + 1}.</span>
                            <span>{minute}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  {/* Action Items */}
                  <div>
                    <h3 className="text-lg font-semibold text-indigo-600 mb-2">Action Items</h3>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      {generatedMinutes.actionItems.length > 0 ? (
                        <div className="space-y-3">
                          {generatedMinutes.actionItems.map((item, index) => (
                            <div key={index} className="border-l-4 border-yellow-400 pl-4">
                              <div className="flex gap-3">
                                <span className="text-indigo-600 font-semibold min-w-[1.5rem]">{index + 1}.</span>
                                <div className="flex-1">
                                  <p className="font-medium">{item.item}</p>
                                  <div className="text-sm text-gray-600 mt-1 space-x-4">
                                    {item.assignee && (
                                      <span>👤 Assigned to: <strong>{item.assignee}</strong></span>
                                    )}
                                    {item.dueDate && item.dueDate !== 'TBD' && (
                                      <span>📅 Due: <strong>{item.dueDate}</strong></span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No specific action items identified</p>
                      )}
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div>
                    <h3 className="text-lg font-semibold text-indigo-600 mb-2">Next Steps</h3>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      {generatedMinutes.nextSteps.length > 0 ? (
                        <ol className="space-y-2">
                          {generatedMinutes.nextSteps.map((step, index) => (
                            <li key={index} className="flex gap-3">
                              <span className="text-indigo-600 font-semibold min-w-[1.5rem]">{index + 1}.</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="text-gray-500 italic">No specific next steps identified</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Minutes Generated Yet</h3>
                  <p className="text-gray-500">
                    Upload or paste your meeting transcript and click "Generate Meeting Minutes" to get started.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};