import React, { useCallback } from 'react';
import type { 
  InferredTask, 
  PlanningSettings, 
  PlannedTask,
  TaskPriority 
} from './types/index.js';
import { GeminiService } from './services/GeminiService.js';
import { SchedulingService } from './services/SchedulingService.js';
import { useApiKeyManager } from './hooks/useApiKeyManager.js';
import { useTaskPlanning } from './hooks/useTaskPlanning.js';

const defaultSettings: PlanningSettings = {
  workingHours: { start: '09:00', end: '17:00' },
  weekendsEnabled: false,
  focusBlockLength: 120,
  breakBuffer: 15,
  hardCommitments: []
};

export const TaskMasterPro: React.FC = () => {
  const {
    apiKey: geminiApiKey,
    showApiKeyModal,
    saveApiKey,
    showApiKeyConfiguration,
    hideApiKeyModal
  } = useApiKeyManager();

  const {
    freeformInput,
    setFreeformInput,
    structuredTasks,
    settings,
    currentPlan,
    setCurrentPlan,
    isProcessing,
    setIsProcessing,
    error,
    setError,
    addStructuredTask,
    updateStructuredTask,
    removeStructuredTask
  } = useTaskPlanning(defaultSettings);

  const geminiService = GeminiService.getInstance();
  const schedulingService = SchedulingService.getInstance();

  const handleFreeformSubmit = useCallback(async () => {
    if (!freeformInput.trim() || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Configure Gemini service with API key
      if (geminiApiKey) {
        geminiService.setApiKey(geminiApiKey);
      }
      
      const result = await geminiService.parseFreeformTasks(freeformInput);
      const plan = await schedulingService.generateDailyPlan(result.extractedTasks, settings);
      
      setCurrentPlan(plan);
      setIsProcessing(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process tasks');
      setIsProcessing(false);
    }
  }, [freeformInput, settings, isProcessing, geminiApiKey, geminiService, schedulingService, setIsProcessing, setError, setCurrentPlan]);

  const handleStructuredSubmit = useCallback(async () => {
    if (structuredTasks.length === 0 || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      const inferredTasks: InferredTask[] = structuredTasks.map(task => ({
        id: task.id,
        title: task.name,
        duration: task.duration,
        priority: task.priority as TaskPriority,
        deadline: task.deadline,
        inferences: {},
        conditionalHints: []
      }));

      const plan = await schedulingService.generateDailyPlan(inferredTasks, settings);
      
      setCurrentPlan(plan);
      setIsProcessing(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process tasks');
      setIsProcessing(false);
    }
  }, [structuredTasks, settings, isProcessing, schedulingService, setIsProcessing, setError, setCurrentPlan]);

  const copyPlanToClipboard = useCallback(async (format: 'markdown' | 'plain') => {
    if (!currentPlan) return;

    let text = '';
    
    if (format === 'markdown') {
      text = `# Daily Plan for ${currentPlan.date.toDateString()}\n\n`;
      text += `## Now (${currentPlan.sections.now.length} tasks)\n`;
      currentPlan.sections.now.forEach((task: PlannedTask) => {
        text += `- **${task.task.title}** (${task.task.duration}min)\n`;
        text += `  - Priority Score: ${task.priorityScore.total.toFixed(2)}\n`;
        text += `  - Reason: ${task.schedulingReason}\n\n`;
      });
      
      text += `## Next (${currentPlan.sections.next.length} tasks)\n`;
      currentPlan.sections.next.forEach((task: PlannedTask) => {
        text += `- **${task.task.title}** (${task.task.duration}min)\n`;
        text += `  - Priority Score: ${task.priorityScore.total.toFixed(2)}\n\n`;
      });

      text += `## Later (${currentPlan.sections.later.length} tasks)\n`;
      currentPlan.sections.later.forEach((task: PlannedTask) => {
        text += `- **${task.task.title}** (${task.task.duration}min)\n\n`;
      });
    } else {
      text = `Daily Plan for ${currentPlan.date.toDateString()}\n\n`;
      text += `NOW:\n`;
      currentPlan.sections.now.forEach((task: PlannedTask) => {
        text += `• ${task.task.title} (${task.task.duration}min)\n`;
      });
      text += `\nNEXT:\n`;
      currentPlan.sections.next.forEach((task: PlannedTask) => {
        text += `• ${task.task.title} (${task.task.duration}min)\n`;
      });
      text += `\nLATER:\n`;
      currentPlan.sections.later.forEach((task: PlannedTask) => {
        text += `• ${task.task.title} (${task.task.duration}min)\n`;
      });
    }

    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.warn('Could not copy to clipboard:', error);
    }
  }, [currentPlan]);

  const renderTaskCard = (plannedTask: PlannedTask) => (
    <div 
      key={plannedTask.task.id} 
      className="group bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
    >
      {/* Task Title */}
      <div className="mb-3">
        <h4 className="font-semibold text-gray-900 text-base leading-tight mb-1">
          {plannedTask.task.title}
        </h4>
        <div className="text-xs text-gray-500 font-medium">
          {plannedTask.schedulingReason}
        </div>
      </div>

      {/* Task Details */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <span className="text-gray-400">Duration:</span>
            <span className="font-medium text-gray-700">{plannedTask.task.duration || 60}m</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-gray-400">Priority:</span>
            <span className={`font-medium ${
              (plannedTask.task.priority || 3) >= 4 ? 'text-red-600' :
              (plannedTask.task.priority || 3) >= 3 ? 'text-blue-600' :
              'text-slate-600'
            }`}>
              {plannedTask.task.priority || 3}
            </span>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-xs font-semibold px-2 py-1 rounded ${
            plannedTask.priorityScore.total > 0.8 ? 'bg-red-100 text-red-700' :
            plannedTask.priorityScore.total > 0.5 ? 'bg-blue-100 text-blue-700' :
            'bg-slate-100 text-slate-700'
          }`}>
            {(plannedTask.priorityScore.total * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Hover Details */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 max-w-sm shadow-lg">
        <div className="font-semibold mb-2 text-gray-200">Task Analysis</div>
        <div className="mb-3">
          <span className="font-medium">Reasoning:</span> {plannedTask.schedulingReason}
        </div>
        
        {plannedTask.explainability.assumptions.length > 0 && (
          <div>
            <span className="font-medium text-gray-200">Assumptions:</span>
            <ul className="mt-1 space-y-1">
              {plannedTask.explainability.assumptions.slice(0, 2).map((assumption: string, idx: number) => (
                <li key={idx} className="text-gray-300">• {assumption}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">TaskMaster Pro</h1>
          <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
            Intelligent task planning and scheduling with AI-powered insights
          </p>
        </div>
        
        <div className="flex items-center justify-center gap-6">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
            geminiApiKey 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              geminiApiKey ? 'bg-emerald-500' : 'bg-amber-500'
            }`}></div>
            {geminiApiKey ? 'AI Analysis Active' : 'Demo Mode'}
          </div>
          <button
            onClick={showApiKeyConfiguration}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium underline underline-offset-4 decoration-2"
          >
            Configure API Key
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Freeform Input */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">.
          <div className="border-b border-gray-100 p-6 pb-4">
            <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Natural Language Input</h2>
            <p className="text-sm text-gray-600 mt-1">Describe your tasks in natural language and let AI parse them</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Describe your tasks and priorities
                </label>
                <textarea
                  value={freeformInput}
                  onChange={(e) => setFreeformInput(e.target.value)}
                  placeholder="Example: I need to finish the quarterly report by Thursday, call John about the project, review marketing materials, and prepare for the 3pm meeting..."
                  className="w-full h-36 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm leading-relaxed"
                />
              </div>
              <button
                onClick={handleFreeformSubmit}
                disabled={!freeformInput.trim() || isProcessing}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                {isProcessing ? 'Processing with AI...' : 'Generate AI Plan'}
              </button>
            </div>
          </div>
        </div>

        {/* Structured Input */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="border-b border-gray-100 p-6 pb-4">
            <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Structured Task Entry</h2>
            <p className="text-sm text-gray-600 mt-1">Add tasks manually with precise control over details</p>
          </div>
          <div className="p-6">
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {structuredTasks.map((task) => (
                <div key={task.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Task Name</label>
                      <input
                        type="text"
                        value={task.name}
                        onChange={(e) => updateStructuredTask(task.id, { name: e.target.value })}
                        placeholder="Enter task description"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Duration (minutes)</label>
                        <input
                          type="number"
                          value={task.duration}
                          onChange={(e) => updateStructuredTask(task.id, { duration: parseInt(e.target.value) || 60 })}
                          min="5"
                          max="480"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Priority Level</label>
                        <select
                          value={task.priority}
                          onChange={(e) => updateStructuredTask(task.id, { priority: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value={1}>Low Priority</option>
                          <option value={2}>Below Average</option>
                          <option value={3}>Medium Priority</option>
                          <option value={4}>High Priority</option>
                          <option value={5}>Critical</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => removeStructuredTask(task.id)}
                        className="text-red-600 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                      >
                        Remove Task
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {structuredTasks.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No tasks added yet</p>
                  <p className="text-xs mt-1">Click "Add Task" to get started</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={addStructuredTask}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
              >
                Add Task
              </button>
              <button
                onClick={handleStructuredSubmit}
                disabled={structuredTasks.length === 0 || isProcessing}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                {isProcessing ? 'Processing...' : 'Generate Plan'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="text-red-600 text-sm">
              <strong>Error:</strong> {error}
            </div>
          </div>
        </div>
      )}

      {/* Plan Output */}
      {currentPlan && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 p-8">
              {/* Enhanced Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
                    Daily Action Plan
                  </h2>
                  <div className="flex items-center text-gray-600 space-x-4">
                    <span className="font-medium">{currentPlan.date.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm">
                      {currentPlan.metadata.totalTasks} tasks
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm">
                      ~{Math.round(currentPlan.metadata.totalDuration / 60)}h {currentPlan.metadata.totalDuration % 60}m total
                    </span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => copyPlanToClipboard('plain')}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Copy Plan
                  </button>
                  <button
                    onClick={() => copyPlanToClipboard('markdown')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Export Markdown
                  </button>
                </div>
              </div>
            </div>

            <div className="p-8">

              {/* Action Sections */}
              <div className="space-y-12">
                {/* NOW Section - Urgent Action Required */}
                <div className="border-l-4 border-red-600 bg-red-50/30 rounded-r-lg">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-red-900 tracking-tight">
                          IMMEDIATE ACTION
                        </h3>
                        <p className="text-red-700 text-sm mt-1 font-medium">
                          High priority tasks requiring immediate attention
                        </p>
                      </div>
                      <div className="bg-red-600 text-white px-3 py-1 rounded text-sm font-medium">
                        {currentPlan.sections.now.length} tasks
                      </div>
                    </div>
                    {currentPlan.sections.now.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {currentPlan.sections.now.map((task: PlannedTask) => renderTaskCard(task))}
                      </div>
                    ) : (
                      <div className="bg-white border border-red-200 rounded-lg p-6 text-center">
                        <p className="text-red-700 text-sm font-medium">No urgent tasks scheduled</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* NEXT Section - Planned for Today */}
                <div className="border-l-4 border-blue-600 bg-blue-50/30 rounded-r-lg">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-blue-900 tracking-tight">
                          SCHEDULED TODAY
                        </h3>
                        <p className="text-blue-700 text-sm mt-1 font-medium">
                          Tasks to complete after immediate priorities
                        </p>
                      </div>
                      <div className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium">
                        {currentPlan.sections.next.length} tasks
                      </div>
                    </div>
                    {currentPlan.sections.next.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {currentPlan.sections.next.map((task: PlannedTask) => renderTaskCard(task))}
                      </div>
                    ) : (
                      <div className="bg-white border border-blue-200 rounded-lg p-6 text-center">
                        <p className="text-blue-700 text-sm font-medium">No tasks scheduled for today</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* LATER Section - Future Planning */}
                <div className="border-l-4 border-slate-600 bg-slate-50/30 rounded-r-lg">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900 tracking-tight">
                          FUTURE PLANNING
                        </h3>
                        <p className="text-slate-700 text-sm mt-1 font-medium">
                          Lower priority items for later or future days
                        </p>
                      </div>
                      <div className="bg-slate-600 text-white px-3 py-1 rounded text-sm font-medium">
                        {currentPlan.sections.later.length} tasks
                      </div>
                    </div>
                    {currentPlan.sections.later.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {currentPlan.sections.later.map((task: PlannedTask) => renderTaskCard(task))}
                      </div>
                    ) : (
                      <div className="bg-white border border-slate-200 rounded-lg p-6 text-center">
                        <p className="text-slate-700 text-sm font-medium">No future tasks planned</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Overdue Tasks */}
              {currentPlan.overdueTasks.length > 0 && (
                <div className="mt-8 pt-8 border-t border-red-200">
                  <div className="flex items-center mb-4">
                    <div className="w-3 h-3 bg-red-600 rounded-full mr-3"></div>
                    <h3 className="text-xl font-bold text-red-600">
                      ⚠️ Overdue Tasks
                    </h3>
                    <span className="ml-3 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                      {currentPlan.overdueTasks.length} overdue
                    </span>
                  </div>
                  <p className="text-red-600 mb-4 text-sm">
                    These tasks have passed their deadlines and need immediate attention.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {currentPlan.overdueTasks.map((task: PlannedTask) => renderTaskCard(task))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      
      {/* API Key Configuration Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Configure Gemini API Key
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter your Google Gemini API key to enable real AI-powered task analysis. 
              Without an API key, the app will use mock responses for demonstration.
            </p>
            <div className="space-y-4">
              <input
                type="password"
                placeholder="Enter your Gemini API key"
                defaultValue={geminiApiKey}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const target = e.target as HTMLInputElement;
                    saveApiKey(target.value);
                  }
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const input = document.querySelector('input[type="password"]') as HTMLInputElement;
                    saveApiKey(input.value);
                  }}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save API Key
                </button>
                <button
                  onClick={hideApiKeyModal}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Your API key is stored locally in your browser and never sent to our servers.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskMasterPro;