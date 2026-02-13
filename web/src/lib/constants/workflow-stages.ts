/**
 * Workflow Stage Constants and Helpers
 *
 * Centralized configuration for workflow stages with labels,
 * descriptions, and helper functions for stage status determination.
 */

export enum WorkflowStage {
  DataPreparation = 'DataPreparation',
  Level1Pending = 'Level1Pending',
  Level2Pending = 'Level2Pending',
  Level3Pending = 'Level3Pending',
  Approved = 'Approved',
}

export interface WorkflowStageConfig {
  key: WorkflowStage;
  label: string;
  shortLabel: string;
  description: string;
}

export const WORKFLOW_STAGES: WorkflowStageConfig[] = [
  {
    key: WorkflowStage.DataPreparation,
    label: 'Data Preparation',
    shortLabel: 'Data Prep',
    description:
      'All required data must be collected, validated, and confirmed before progression',
  },
  {
    key: WorkflowStage.Level1Pending,
    label: 'Level 1 Approval',
    shortLabel: 'L1',
    description:
      'Operations approval focusing on file receipt and data validation checks',
  },
  {
    key: WorkflowStage.Level2Pending,
    label: 'Level 2 Approval',
    shortLabel: 'L2',
    description:
      'Portfolio Manager approval focusing on holdings reasonableness and performance results',
  },
  {
    key: WorkflowStage.Level3Pending,
    label: 'Level 3 Approval',
    shortLabel: 'L3',
    description: 'Executive approval for final sign-off before publication',
  },
  {
    key: WorkflowStage.Approved,
    label: 'Approved',
    shortLabel: 'Published',
    description: 'Batch has been approved and published',
  },
];

/**
 * Determine the status of a stage relative to the current workflow stage.
 * Returns 'complete' for stages before current, 'current' for current stage, 'pending' for future stages.
 */
export function getStageStatus(
  stage: WorkflowStage | string,
  currentStage: WorkflowStage | string,
): 'complete' | 'current' | 'pending' {
  const stages = WORKFLOW_STAGES.map((s) => s.key);
  const currentIndex = stages.indexOf(currentStage as WorkflowStage);
  const stageIndex = stages.indexOf(stage as WorkflowStage);

  if (stageIndex < currentIndex) return 'complete';
  if (stageIndex === currentIndex) return 'current';
  return 'pending';
}

/**
 * Get the configuration for a specific workflow stage.
 */
export function getStageConfig(
  stage: WorkflowStage | string,
): WorkflowStageConfig {
  const config = WORKFLOW_STAGES.find((s) => s.key === stage);
  if (!config) {
    throw new Error(`Unknown workflow stage: ${stage}`);
  }
  return config;
}

/**
 * Get the next workflow stage after the given stage.
 * Returns null if the stage is already Approved (final stage).
 */
export function getNextStage(
  stage: WorkflowStage | string,
): WorkflowStage | null {
  const stages = WORKFLOW_STAGES.map((s) => s.key);
  const currentIndex = stages.indexOf(stage as WorkflowStage);

  if (currentIndex === -1 || currentIndex === stages.length - 1) {
    return null;
  }

  return stages[currentIndex + 1];
}
