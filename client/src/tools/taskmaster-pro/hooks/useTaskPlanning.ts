import { useState, useCallback } from 'react';
import type { DailyPlan, PlanningSettings } from '../types/index.js';

interface StructuredTask {
  readonly id: string;
  name: string;
  duration: number;
  priority: number;
  deadline?: Date;
  isCompleted: boolean;
}

/**
 * Task planning hook return type
 */
interface TaskPlanningReturn {
  readonly freeformInput: string;
  readonly setFreeformInput: (value: string) => void;
  readonly structuredTasks: readonly StructuredTask[];
  readonly settings: PlanningSettings;
  readonly currentPlan: DailyPlan | null;
  readonly setCurrentPlan: (plan: DailyPlan | null) => void;
  readonly isProcessing: boolean;
  readonly setIsProcessing: (processing: boolean) => void;
  readonly error: string | null;
  readonly setError: (error: string | null) => void;
  readonly addStructuredTask: () => void;
  readonly updateStructuredTask: (id: string, updates: Partial<StructuredTask>) => void;
  readonly removeStructuredTask: (id: string) => void;
}

/**
 * Custom hook for managing task planning state and operations
 * Follows React best practices for state management
 */
export const useTaskPlanning = (initialSettings: PlanningSettings): TaskPlanningReturn => {
  const [freeformInput, setFreeformInput] = useState<string>('');
  const [structuredTasks, setStructuredTasks] = useState<StructuredTask[]>([]);
  const [settings] = useState<PlanningSettings>(initialSettings);
  const [currentPlan, setCurrentPlan] = useState<DailyPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const addStructuredTask = useCallback((): void => {
    const newTask: StructuredTask = {
      id: Date.now().toString(),
      name: '',
      duration: 30,
      priority: 5,
      deadline: undefined,
      isCompleted: false
    } as const;
    setStructuredTasks(prev => [...prev, newTask]);
  }, []);

  const updateStructuredTask = useCallback((id: string, updates: Partial<StructuredTask>): void => {
    setStructuredTasks(prev => 
      prev.map(task =>
        task.id === id ? { ...task, ...updates } : task
      )
    );
  }, []);

  const removeStructuredTask = useCallback((id: string): void => {
    setStructuredTasks(prev => prev.filter(task => task.id !== id));
  }, []);

  return {
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
  } as const;
};