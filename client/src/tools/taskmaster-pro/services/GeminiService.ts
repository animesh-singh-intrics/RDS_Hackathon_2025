import type { 
  StructuredTask, 
  InferredTask, 
  FreeformParseResult, 
  TaskPriority, 
  InferenceConfidence 
} from '../types/index.js';

/**
 * Gemini API Service for TaskMaster Pro
 * Handles task parsing, inference, and reasoning generation
 */
export class GeminiService {
  private static instance: GeminiService;
  private _apiKey: string | null = null;

  private constructor() {}

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  /**
   * Set Gemini API key (for demo purposes, would use env vars in production)
   */
  public setApiKey(apiKey: string): void {
    this._apiKey = apiKey;
  }

  /**
   * Parse freeform text into structured tasks
   */
  public async parseFreeformTasks(freeformText: string): Promise<FreeformParseResult> {
    try {
      // Try real Gemini API first, fallback to mock if no API key or it fails
      if (this._apiKey) {
        return await this.realGeminiParsing(freeformText);
      } else {
        console.warn('No Gemini API key provided, using mock parsing');
        return await this.mockGeminiParsing(freeformText);
      }
    } catch (error) {
      console.error('Failed to parse freeform tasks:', error);
      console.warn('Falling back to mock parsing due to API error');
      return await this.mockGeminiParsing(freeformText);
    }
  }

  /**
   * Infer missing fields for a task
   */
  public async inferTaskFields(task: StructuredTask, context?: string): Promise<InferredTask> {
    try {
      // Mock Gemini inference for demo
      return await this.mockFieldInference(task, context);
    } catch (error) {
      console.error('Failed to infer task fields:', error);
      return {
        ...task,
        inferences: {},
        conditionalHints: []
      };
    }
  }

  /**
   * Generate reasoning for scheduling decisions
   */
  public async generateSchedulingReason(
    task: InferredTask,
    position: 'now' | 'next' | 'later',
    factors: Record<string, number>
  ): Promise<string> {
    try {
      // Mock reasoning generation
      return this.mockReasoningGeneration(task, position, factors);
    } catch (error) {
      console.error('Failed to generate scheduling reason:', error);
      return `Scheduled based on priority ${task.priority || 'unknown'} and deadline.`;
    }
  }

  /**
   * Real Gemini API parsing implementation
   */
  private async realGeminiParsing(text: string): Promise<FreeformParseResult> {
    if (!this._apiKey) {
      throw new Error('Gemini API key not provided');
    }

    const prompt = `
You are an expert task planning assistant. Parse the following text and extract structured tasks with detailed analysis.

Text to parse:
"""${text}"""

Please respond with a JSON object in this exact format:
{
  "extractedTasks": [
    {
      "id": "unique-id",
      "title": "Task title",
      "duration": number_in_minutes,
      "priority": number_1_to_5,
      "deadline": "ISO_date_string_or_null",
      "category": "inferred_category",
      "notes": "any_additional_context",
      "inferences": {
        "priority": {
          "value": number_1_to_5,
          "confidence": "low|medium|high",
          "rationale": "why_this_priority"
        },
        "duration": {
          "value": number_in_minutes,
          "confidence": "low|medium|high", 
          "rationale": "why_this_duration"
        },
        "deadline": {
          "value": "ISO_date_string_or_null",
          "confidence": "low|medium|high",
          "rationale": "why_this_deadline"
        }
      }
    }
  ],
  "ambiguousLines": ["lines_that_were_unclear"],
  "parsingErrors": ["any_errors_encountered"],
  "confidence": "low|medium|high"
}

Rules:
- Extract distinct tasks, avoid duplicates
- Infer reasonable durations (15-240 minutes)
- Assign priorities based on urgency/importance
- Parse deadlines from context (today, tomorrow, specific dates)
- Flag ambiguous or unclear text
- Be conservative with confidence levels
`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this._apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!generatedText) {
        throw new Error('No response from Gemini API');
      }

      // Extract JSON from the response (might be wrapped in markdown)
      const jsonMatch = generatedText.match(/```json\n([\s\S]*?)\n```/) || generatedText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : generatedText;
      
      const parsed = JSON.parse(jsonString.trim());
      
      // Validate and transform the response to match our types
      return this.validateAndTransformGeminiResponse(parsed);
      
    } catch (error) {
      console.error('Real Gemini API failed:', error);
      throw error;
    }
  }

  /**
   * Validate and transform Gemini API response to our type system
   */
  private validateAndTransformGeminiResponse(response: any): FreeformParseResult {
    const extractedTasks: InferredTask[] = (response.extractedTasks || []).map((task: any, index: number) => ({
      id: task.id || `task-${Date.now()}-${index}`,
      title: task.title || 'Untitled Task',
      duration: Math.max(15, Math.min(240, task.duration || 60)),
      priority: Math.max(1, Math.min(5, task.priority || 3)) as TaskPriority,
      deadline: task.deadline ? new Date(task.deadline) : undefined,
      category: task.category,
      notes: task.notes,
      dependencies: task.dependencies || [],
      splittable: task.splittable || false,
      inferences: {
        priority: task.inferences?.priority ? {
          value: Math.max(1, Math.min(5, task.inferences.priority.value || 3)) as TaskPriority,
          confidence: ['low', 'medium', 'high'].includes(task.inferences.priority.confidence) 
            ? task.inferences.priority.confidence as InferenceConfidence 
            : 'medium',
          rationale: task.inferences.priority.rationale || 'Inferred from context'
        } : undefined,
        duration: task.inferences?.duration ? {
          value: Math.max(15, Math.min(240, task.inferences.duration.value || 60)),
          confidence: ['low', 'medium', 'high'].includes(task.inferences.duration.confidence) 
            ? task.inferences.duration.confidence as InferenceConfidence 
            : 'medium',
          rationale: task.inferences.duration.rationale || 'Estimated based on task complexity'
        } : undefined,
        deadline: task.inferences?.deadline ? {
          value: task.inferences.deadline.value ? new Date(task.inferences.deadline.value) : undefined,
          confidence: ['low', 'medium', 'high'].includes(task.inferences.deadline.confidence) 
            ? task.inferences.deadline.confidence as InferenceConfidence 
            : 'low',
          rationale: task.inferences.deadline.rationale || 'Inferred from context clues'
        } : undefined
      },
      conditionalHints: []
    }));

    return {
      extractedTasks,
      ambiguousLines: response.ambiguousLines || [],
      parsingErrors: response.parsingErrors || [],
      confidence: ['low', 'medium', 'high'].includes(response.confidence) 
        ? response.confidence as InferenceConfidence 
        : 'medium'
    };
  }

  /**
   * Mock Gemini parsing for demo purposes (fallback when no API key)
   */
  private async mockGeminiParsing(text: string): Promise<FreeformParseResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const lines = text.split('\n').filter(line => line.trim());
    const extractedTasks: InferredTask[] = [];
    const ambiguousLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length === 0) continue;

      // Simple parsing logic for demo
      const taskMatch = this.parseTaskLine(line);
      if (taskMatch) {
        extractedTasks.push(taskMatch);
      } else {
        ambiguousLines.push(line);
      }
    }

    return {
      extractedTasks,
      ambiguousLines,
      parsingErrors: [],
      confidence: extractedTasks.length > 0 ? 'medium' : 'low'
    };
  }

  /**
   * Simple task line parsing for demo
   */
  private parseTaskLine(line: string): InferredTask | null {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Extract priority indicators
    let priority: TaskPriority | undefined;
    let priorityConfidence: InferenceConfidence = 'medium';
    let priorityRationale = '';

    if (/urgent|asap|critical|!!!/i.test(line)) {
      priority = 5;
      priorityRationale = 'Detected urgency keywords';
      priorityConfidence = 'high';
    } else if (/important|high|!!/i.test(line)) {
      priority = 4;
      priorityRationale = 'Detected importance keywords';
      priorityConfidence = 'medium';
    } else if (/low|minor|when time/i.test(line)) {
      priority = 2;
      priorityRationale = 'Detected low priority indicators';
      priorityConfidence = 'medium';
    } else {
      priority = 3;
      priorityRationale = 'Assumed medium priority (no indicators found)';
      priorityConfidence = 'low';
    }

    // Extract duration estimates
    let duration: number | undefined;
    let durationConfidence: InferenceConfidence = 'low';
    let durationRationale = '';

    const durationMatch = line.match(/(\d+)\s*(hour|hr|min|minute)s?/i);
    if (durationMatch) {
      const value = parseInt(durationMatch[1]);
      const unit = durationMatch[2].toLowerCase();
      duration = unit.startsWith('h') ? value * 60 : value;
      durationRationale = 'Extracted from text';
      durationConfidence = 'high';
    } else {
      // Infer based on task complexity
      if (line.length > 100 || /research|analyze|develop|create/i.test(line)) {
        duration = 120; // 2 hours
        durationRationale = 'Estimated based on task complexity';
      } else if (line.length > 50 || /write|review|plan/i.test(line)) {
        duration = 60; // 1 hour
        durationRationale = 'Estimated based on task type';
      } else {
        duration = 30; // 30 minutes
        durationRationale = 'Default estimate for simple tasks';
      }
    }

    // Extract deadline
    let deadline: Date | undefined;
    let deadlineConfidence: InferenceConfidence = 'low';
    let deadlineRationale = '';

    const deadlineMatch = line.match(/(today|tomorrow|by (\w+)|due (\w+))/i);
    if (deadlineMatch) {
      const now = new Date();
      if (deadlineMatch[1].toLowerCase() === 'today') {
        deadline = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0); // End of work day
        deadlineRationale = 'Due today by end of work day';
        deadlineConfidence = 'high';
      } else if (deadlineMatch[1].toLowerCase() === 'tomorrow') {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        deadline = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 17, 0);
        deadlineRationale = 'Due tomorrow by end of work day';
        deadlineConfidence = 'high';
      }
    }

    // Clean title
    let title = line
      .replace(/urgent|asap|critical|important|high|low|minor|!!+/gi, '')
      .replace(/(\d+)\s*(hour|hr|min|minute)s?/gi, '')
      .replace(/(today|tomorrow|by \w+|due \w+)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (title.length === 0) {
      return null;
    }

    const inferredTask: InferredTask = {
      id: taskId,
      title,
      priority,
      duration,
      deadline,
      inferences: {
        priority: {
          value: priority,
          confidence: priorityConfidence,
          rationale: priorityRationale
        },
        duration: {
          value: duration,
          confidence: durationConfidence,
          rationale: durationRationale
        },
        ...(deadline && {
          deadline: {
            value: deadline,
            confidence: deadlineConfidence,
            rationale: deadlineRationale
          }
        })
      },
      conditionalHints: this.generateConditionalHints(priority, duration)
    };

    return inferredTask;
  }

  /**
   * Mock field inference for structured tasks
   */
  private async mockFieldInference(task: StructuredTask, _context?: string): Promise<InferredTask> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const inferences: InferredTask['inferences'] = {};
    const conditionalHints: string[] = [];

    // Infer priority if missing
    if (!task.priority) {
      let inferredPriority: TaskPriority = 3;
      let confidence: InferenceConfidence = 'medium';
      let rationale = 'Default medium priority';

      if (task.deadline) {
        const hoursUntilDeadline = (task.deadline.getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursUntilDeadline < 24) {
          inferredPriority = 5;
          confidence = 'high';
          rationale = 'High priority due to approaching deadline';
        } else if (hoursUntilDeadline < 72) {
          inferredPriority = 4;
          confidence = 'medium';
          rationale = 'Medium-high priority due to deadline in 3 days';
        }
      }

      inferences.priority = {
        value: inferredPriority,
        confidence,
        rationale
      };

      conditionalHints.push(`If this task is actually low priority, it will be scheduled after other medium priority tasks.`);
    }

    // Infer duration if missing
    if (!task.duration) {
      let inferredDuration = 60; // Default 1 hour
      let confidence: InferenceConfidence = 'low';
      let rationale = 'Default 1-hour estimate';

      // Base on title length and content
      if (task.title.length > 50 || /research|analyze|develop|design|create|build/i.test(task.title)) {
        inferredDuration = 120;
        rationale = 'Estimated 2 hours based on task complexity';
        confidence = 'medium';
      } else if (task.title.length < 20 && /check|review|send|call|email/i.test(task.title)) {
        inferredDuration = 30;
        rationale = 'Estimated 30 minutes for quick task';
        confidence = 'medium';
      }

      inferences.duration = {
        value: inferredDuration,
        confidence,
        rationale
      };

      conditionalHints.push(`Duration estimate can be adjusted. Shorter tasks will be scheduled in available gaps.`);
    }

    return {
      ...task,
      inferences,
      conditionalHints
    };
  }

  /**
   * Generate conditional hints
   */
  private generateConditionalHints(priority: TaskPriority, duration: number): string[] {
    const hints: string[] = [];

    if (priority >= 4) {
      hints.push('If priority drops to medium, this task will be rescheduled after other high-priority items.');
    }

    if (duration > 90) {
      hints.push('This task may be split into smaller blocks if schedule is tight.');
    }

    if (priority <= 2) {
      hints.push('This task will be scheduled in available time slots after higher priority work.');
    }

    return hints;
  }

  /**
   * Mock reasoning generation
   */
  private mockReasoningGeneration(
    _task: InferredTask,
    position: 'now' | 'next' | 'later',
    factors: Record<string, number>
  ): string {
    const reasons: string[] = [];

    if (position === 'now') {
      if (factors.urgency > 0.8) {
        reasons.push('urgent deadline');
      }
      if (factors.importance > 0.8) {
        reasons.push('high priority');
      }
      if (factors.dependencyReady > 0.7) {
        reasons.push('dependencies ready');
      }
    } else if (position === 'next') {
      reasons.push('scheduled after current priority tasks');
      if (factors.effortFit > 0.6) {
        reasons.push('good fit for available time blocks');
      }
    } else {
      reasons.push('lower priority');
      if (factors.uncertaintyPenalty > 0.3) {
        reasons.push('high uncertainty in requirements');
      }
    }

    const baseReason = `Placed in "${position}" section`;
    return reasons.length > 0 
      ? `${baseReason} due to ${reasons.join(', ')}.`
      : `${baseReason}.`;
  }
}