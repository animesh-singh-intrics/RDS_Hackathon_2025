import type { BaseTool } from '@/tools/shared/types/index.js';

/**
 * Task priority levels (1-5 scale)
 * Using const assertion for better type safety
 */
export const TASK_PRIORITIES = [1, 2, 3, 4, 5] as const;
export type TaskPriority = typeof TASK_PRIORITIES[number];

/**
 * Inference confidence levels
 * Using const assertion for better type safety
 */
export const INFERENCE_CONFIDENCE_LEVELS = ['low', 'medium', 'high'] as const;
export type InferenceConfidence = typeof INFERENCE_CONFIDENCE_LEVELS[number];

/**
 * Input method types
 * Using const assertion for better type safety
 */
export const INPUT_METHODS = ['structured', 'freeform'] as const;
export type InputMethod = typeof INPUT_METHODS[number];

/**
 * Structured task input from form
 * Using readonly properties where appropriate
 */
export interface StructuredTask {
  readonly id: string;
  title: string;
  deadline?: Date;
  priority?: TaskPriority;
  duration?: number; // minutes
  readonly dependencies?: readonly string[]; // task IDs
  notes?: string;
  category?: string;
  splittable?: boolean;
}

/**
 * Task with AI inferences
 */
export interface InferredTask extends StructuredTask {
  inferences: {
    priority?: {
      value: TaskPriority;
      confidence: InferenceConfidence;
      rationale: string;
    };
    duration?: {
      value: number;
      confidence: InferenceConfidence;
      rationale: string;
    };
    deadline?: {
      value: Date;
      confidence: InferenceConfidence;
      rationale: string;
    };
    category?: {
      value: string;
      confidence: InferenceConfidence;
      rationale: string;
    };
  };
  conditionalHints: string[];
}

/**
 * Planning settings
 */
export interface PlanningSettings {
  workingHours: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
  weekendsEnabled: boolean;
  focusBlockLength: number; // minutes
  breakBuffer: number; // minutes
  hardCommitments: HardCommitment[];
}

/**
 * Hard commitment (read-only in plan)
 */
export interface HardCommitment {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  description?: string;
}

/**
 * Priority scoring factors
 */
export interface PriorityScore {
  urgency: number;      // time to deadline
  importance: number;   // priority level
  effortFit: number;   // duration vs block size
  dependencyReady: number; // dependencies met
  slackRisk: number;   // risk factor
  uncertaintyPenalty: number; // downgrades inferred items
  total: number;
}

/**
 * Planned task with scheduling information
 */
export interface PlannedTask {
  task: InferredTask;
  timeWindow?: {
    start: Date;
    end: Date;
  };
  priorityScore: PriorityScore;
  schedulingReason: string;
  explainability: {
    factors: Record<string, number>;
    assumptions: string[];
    conditionalGuidance: string[];
  };
}

/**
 * Daily plan sections
 */
export interface DailyPlan {
  id: string;
  date: Date;
  sections: {
    now: PlannedTask[];
    next: PlannedTask[];
    later: PlannedTask[];
  };
  ambiguousTasks: string[]; // tasks needing clarification
  overdueTasks: PlannedTask[];
  metadata: {
    totalTasks: number;
    totalDuration: number;
    planningDate: Date;
  };
}

/**
 * Freeform input result
 */
export interface FreeformParseResult {
  extractedTasks: InferredTask[];
  ambiguousLines: string[];
  parsingErrors: string[];
  confidence: InferenceConfidence;
}

/**
 * Planning request
 */
export interface PlanningRequest {
  tasks: StructuredTask[] | string; // structured tasks or freeform text
  inputMethod: InputMethod;
  settings: PlanningSettings;
  planDate?: Date;
}

/**
 * Planning response
 */
export interface PlanningResponse {
  plan: DailyPlan;
  parseResult?: FreeformParseResult; // only for freeform input
  errors: string[];
  warnings: string[];
}

/**
 * TaskMaster Pro tool configuration
 */
export interface TaskMasterProTool extends BaseTool {
  id: 'taskmaster-pro';
  name: 'TaskMaster Pro';
  category: 'Productivity';
}