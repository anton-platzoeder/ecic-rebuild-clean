/**
 * Tests for Workflow Stage Constants and Helpers
 *
 * Tests stage enums, configuration, and helper functions
 * for determining stage status based on current workflow stage.
 */
import { describe, it, expect } from 'vitest';
import {
  WorkflowStage,
  WORKFLOW_STAGES,
  getStageStatus,
  getStageConfig,
  getNextStage,
} from '@/lib/constants/workflow-stages';

describe('Workflow Stage Constants', () => {
  describe('WORKFLOW_STAGES configuration', () => {
    it('contains all 5 workflow stages in correct order', () => {
      expect(WORKFLOW_STAGES).toHaveLength(5);
      expect(WORKFLOW_STAGES[0].key).toBe(WorkflowStage.DataPreparation);
      expect(WORKFLOW_STAGES[1].key).toBe(WorkflowStage.Level1Pending);
      expect(WORKFLOW_STAGES[2].key).toBe(WorkflowStage.Level2Pending);
      expect(WORKFLOW_STAGES[3].key).toBe(WorkflowStage.Level3Pending);
      expect(WORKFLOW_STAGES[4].key).toBe(WorkflowStage.Approved);
    });

    it('has complete configuration for DataPreparation stage', () => {
      const dataPrep = WORKFLOW_STAGES.find(
        (s) => s.key === WorkflowStage.DataPreparation,
      );
      expect(dataPrep).toBeDefined();
      expect(dataPrep?.label).toBe('Data Preparation');
      expect(dataPrep?.shortLabel).toBe('Data Prep');
      expect(dataPrep?.description).toContain(
        'All required data must be collected, validated, and confirmed',
      );
    });

    it('has complete configuration for Level1Pending stage', () => {
      const level1 = WORKFLOW_STAGES.find(
        (s) => s.key === WorkflowStage.Level1Pending,
      );
      expect(level1).toBeDefined();
      expect(level1?.label).toBe('Level 1 Approval');
      expect(level1?.shortLabel).toBe('L1');
      expect(level1?.description).toContain(
        'Operations approval focusing on file receipt and data validation',
      );
    });

    it('has complete configuration for Level2Pending stage', () => {
      const level2 = WORKFLOW_STAGES.find(
        (s) => s.key === WorkflowStage.Level2Pending,
      );
      expect(level2).toBeDefined();
      expect(level2?.label).toBe('Level 2 Approval');
      expect(level2?.shortLabel).toBe('L2');
      expect(level2?.description).toContain(
        'Portfolio Manager approval focusing on holdings reasonableness',
      );
    });

    it('has complete configuration for Level3Pending stage', () => {
      const level3 = WORKFLOW_STAGES.find(
        (s) => s.key === WorkflowStage.Level3Pending,
      );
      expect(level3).toBeDefined();
      expect(level3?.label).toBe('Level 3 Approval');
      expect(level3?.shortLabel).toBe('L3');
      expect(level3?.description).toContain(
        'Executive approval for final sign-off before publication',
      );
    });

    it('has complete configuration for Approved stage', () => {
      const approved = WORKFLOW_STAGES.find(
        (s) => s.key === WorkflowStage.Approved,
      );
      expect(approved).toBeDefined();
      expect(approved?.label).toBe('Approved');
      expect(approved?.shortLabel).toBe('Published');
      expect(approved?.description).toBeDefined();
    });
  });

  describe('getStageStatus()', () => {
    it('returns "complete" for stages before current stage', () => {
      const currentStage = WorkflowStage.Level2Pending;
      expect(getStageStatus(WorkflowStage.DataPreparation, currentStage)).toBe(
        'complete',
      );
      expect(getStageStatus(WorkflowStage.Level1Pending, currentStage)).toBe(
        'complete',
      );
    });

    it('returns "current" for the current stage', () => {
      const currentStage = WorkflowStage.Level2Pending;
      expect(getStageStatus(WorkflowStage.Level2Pending, currentStage)).toBe(
        'current',
      );
    });

    it('returns "pending" for stages after current stage', () => {
      const currentStage = WorkflowStage.Level1Pending;
      expect(getStageStatus(WorkflowStage.Level2Pending, currentStage)).toBe(
        'pending',
      );
      expect(getStageStatus(WorkflowStage.Level3Pending, currentStage)).toBe(
        'pending',
      );
      expect(getStageStatus(WorkflowStage.Approved, currentStage)).toBe(
        'pending',
      );
    });

    it('returns correct status when current stage is DataPreparation', () => {
      const currentStage = WorkflowStage.DataPreparation;
      expect(getStageStatus(WorkflowStage.DataPreparation, currentStage)).toBe(
        'current',
      );
      expect(getStageStatus(WorkflowStage.Level1Pending, currentStage)).toBe(
        'pending',
      );
      expect(getStageStatus(WorkflowStage.Level2Pending, currentStage)).toBe(
        'pending',
      );
      expect(getStageStatus(WorkflowStage.Level3Pending, currentStage)).toBe(
        'pending',
      );
      expect(getStageStatus(WorkflowStage.Approved, currentStage)).toBe(
        'pending',
      );
    });

    it('returns correct status when current stage is Approved', () => {
      const currentStage = WorkflowStage.Approved;
      expect(getStageStatus(WorkflowStage.DataPreparation, currentStage)).toBe(
        'complete',
      );
      expect(getStageStatus(WorkflowStage.Level1Pending, currentStage)).toBe(
        'complete',
      );
      expect(getStageStatus(WorkflowStage.Level2Pending, currentStage)).toBe(
        'complete',
      );
      expect(getStageStatus(WorkflowStage.Level3Pending, currentStage)).toBe(
        'complete',
      );
      expect(getStageStatus(WorkflowStage.Approved, currentStage)).toBe(
        'current',
      );
    });
  });

  describe('getStageConfig()', () => {
    it('returns configuration for DataPreparation stage', () => {
      const config = getStageConfig(WorkflowStage.DataPreparation);
      expect(config).toBeDefined();
      expect(config.key).toBe(WorkflowStage.DataPreparation);
      expect(config.label).toBe('Data Preparation');
    });

    it('returns configuration for Level1Pending stage', () => {
      const config = getStageConfig(WorkflowStage.Level1Pending);
      expect(config).toBeDefined();
      expect(config.key).toBe(WorkflowStage.Level1Pending);
      expect(config.label).toBe('Level 1 Approval');
    });

    it('returns configuration for Level2Pending stage', () => {
      const config = getStageConfig(WorkflowStage.Level2Pending);
      expect(config).toBeDefined();
      expect(config.key).toBe(WorkflowStage.Level2Pending);
      expect(config.label).toBe('Level 2 Approval');
    });

    it('returns configuration for string stage names', () => {
      const config = getStageConfig('Level2Pending');
      expect(config).toBeDefined();
      expect(config.key).toBe(WorkflowStage.Level2Pending);
    });
  });

  describe('getNextStage()', () => {
    it('returns Level1Pending after DataPreparation', () => {
      expect(getNextStage(WorkflowStage.DataPreparation)).toBe(
        WorkflowStage.Level1Pending,
      );
    });

    it('returns Level2Pending after Level1Pending', () => {
      expect(getNextStage(WorkflowStage.Level1Pending)).toBe(
        WorkflowStage.Level2Pending,
      );
    });

    it('returns Level3Pending after Level2Pending', () => {
      expect(getNextStage(WorkflowStage.Level2Pending)).toBe(
        WorkflowStage.Level3Pending,
      );
    });

    it('returns Approved after Level3Pending', () => {
      expect(getNextStage(WorkflowStage.Level3Pending)).toBe(
        WorkflowStage.Approved,
      );
    });

    it('returns null when stage is already Approved', () => {
      expect(getNextStage(WorkflowStage.Approved)).toBeNull();
    });
  });
});
