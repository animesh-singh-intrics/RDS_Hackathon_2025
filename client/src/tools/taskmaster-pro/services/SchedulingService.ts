import type { 
  InferredTask, 
  DailyPlan, 
  PlannedTask, 
  PlanningSettings, 
  PriorityScore
} from '../types/index.js';

/**
 * Deterministic scheduling service for TaskMaster Pro
 */
export class SchedulingService {
  private static instance: SchedulingService;

  private constructor() {}

  public static getInstance(): SchedulingService {
    if (!SchedulingService.instance) {
      SchedulingService.instance = new SchedulingService();
    }
    return SchedulingService.instance;
  }

  public async generateDailyPlan(
    tasks: InferredTask[],
    settings: PlanningSettings,
    planDate: Date = new Date()
  ): Promise<DailyPlan> {
    const scoredTasks = tasks.map(task => ({
      task,
      score: this.calculatePriorityScore(task, settings, planDate)
    }));

    scoredTasks.sort((a, b) => b.score.total - a.score.total);

    const plannedTasks = await this.scheduleTasks(scoredTasks, settings, planDate);
    const sections = this.categorizeTasks(plannedTasks, planDate, settings);
    const overdueTasks = this.identifyOverdueTasks(plannedTasks, planDate);

    return {
      id: `plan-${planDate.getTime()}-${Date.now()}`,
      date: planDate,
      sections,
      ambiguousTasks: [],
      overdueTasks,
      metadata: {
        totalTasks: tasks.length,
        totalDuration: tasks.reduce((sum, task) => sum + (task.duration || 0), 0),
        planningDate: new Date()
      }
    };
  }

  private calculatePriorityScore(
    task: InferredTask,
    _settings: PlanningSettings,
    _planDate: Date
  ): PriorityScore {
    const now = new Date();

    let urgency = 0.5;
    if (task.deadline) {
      const timeToDeadline = task.deadline.getTime() - now.getTime();
      const hoursToDeadline = timeToDeadline / (1000 * 60 * 60);
      
      if (hoursToDeadline < 4) urgency = 1.0;
      else if (hoursToDeadline < 24) urgency = 0.9;
      else if (hoursToDeadline < 72) urgency = 0.7;
      else urgency = 0.3;
    }

    const importance = task.priority ? (task.priority / 5) : 0.6;
    const effortFit = 1.0;
    const dependencyReady = 1.0;
    const slackRisk = 1.0;

    let uncertaintyPenalty = 0;
    Object.values(task.inferences).forEach(inference => {
      if (inference.confidence === 'low') {
        uncertaintyPenalty += 0.1;
      } else if (inference.confidence === 'medium') {
        uncertaintyPenalty += 0.05;
      }
    });

    const baseScore = (urgency * 0.3) + (importance * 0.25) + (effortFit * 0.15) + 
                     (dependencyReady * 0.15) + (slackRisk * 0.15);
    const total = Math.max(0, baseScore - uncertaintyPenalty);

    return {
      urgency,
      importance,
      effortFit,
      dependencyReady,
      slackRisk,
      uncertaintyPenalty,
      total
    };
  }

  private async scheduleTasks(
    scoredTasks: Array<{ task: InferredTask; score: PriorityScore }>,
    _settings: PlanningSettings,
    _planDate: Date
  ): Promise<PlannedTask[]> {
    const plannedTasks: PlannedTask[] = [];
    
    for (const item of scoredTasks) {
      const { task, score } = item;
      
      const plannedTask: PlannedTask = {
        task,
        timeWindow: undefined,
        priorityScore: score,
        schedulingReason: this.generateSchedulingReason(task, score),
        explainability: {
          factors: {
            urgency: score.urgency,
            importance: score.importance,
            effortFit: score.effortFit,
            dependencyReady: score.dependencyReady,
            slackRisk: score.slackRisk,
            uncertaintyPenalty: score.uncertaintyPenalty
          },
          assumptions: this.extractAssumptions(task),
          conditionalGuidance: task.conditionalHints
        }
      };

      plannedTasks.push(plannedTask);
    }

    return plannedTasks;
  }

  private categorizeTasks(
    plannedTasks: PlannedTask[],
    _planDate: Date,
    _settings: PlanningSettings
  ): DailyPlan['sections'] {
    const sections: DailyPlan['sections'] = {
      now: [],
      next: [],
      later: []
    };

    plannedTasks.forEach(plannedTask => {
      if (plannedTask.priorityScore.urgency > 0.8 || plannedTask.priorityScore.total > 0.8) {
        sections.now.push(plannedTask);
      } else if (plannedTask.priorityScore.total > 0.5) {
        sections.next.push(plannedTask);
      } else {
        sections.later.push(plannedTask);
      }
    });

    return sections;
  }

  private identifyOverdueTasks(plannedTasks: PlannedTask[], _planDate: Date): PlannedTask[] {
    const now = new Date();
    return plannedTasks.filter(task => {
      return task.task.deadline && task.task.deadline < now;
    });
  }

  private generateSchedulingReason(_task: InferredTask, score: PriorityScore): string {
    const reasons: string[] = [];

    if (score.urgency > 0.8) {
      reasons.push('urgent deadline');
    } else if (score.urgency > 0.6) {
      reasons.push('approaching deadline');
    }

    if (score.importance > 0.8) {
      reasons.push('high priority');
    } else if (score.importance < 0.4) {
      reasons.push('lower priority');
    }

    if (score.uncertaintyPenalty > 0.1) {
      reasons.push('adjusted for inference uncertainty');
    }

    return reasons.length > 0 
      ? `Scheduled due to ${reasons.join(', ')}.`
      : 'Scheduled based on availability.';
  }

  private extractAssumptions(task: InferredTask): string[] {
    const assumptions: string[] = [];

    Object.entries(task.inferences).forEach(([field, inference]) => {
      if (inference.confidence === 'low' || inference.confidence === 'medium') {
        assumptions.push(`${field}: ${inference.rationale}`);
      }
    });

    return assumptions;
  }
}