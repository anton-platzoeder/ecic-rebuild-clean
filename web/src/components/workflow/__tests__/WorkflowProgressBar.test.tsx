/**
 * Tests for WorkflowProgressBar Component
 *
 * Tests visual progress bar with stage indicators,
 * icons for completed/current/pending stages, and rejection indicators.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { WorkflowProgressBar } from '@/components/workflow/WorkflowProgressBar';

describe('WorkflowProgressBar', () => {
  describe('Stage Rendering', () => {
    it('renders all 5 workflow stages', () => {
      render(<WorkflowProgressBar currentStage="Level2Pending" />);

      expect(screen.getByText('Data Prep')).toBeInTheDocument();
      expect(screen.getByText('L1')).toBeInTheDocument();
      expect(screen.getByText('L2')).toBeInTheDocument();
      expect(screen.getByText('L3')).toBeInTheDocument();
      expect(screen.getByText('Published')).toBeInTheDocument();
    });

    it('displays stages in correct sequential order', () => {
      const { container } = render(
        <WorkflowProgressBar currentStage="Level2Pending" />,
      );

      const stages = container.querySelectorAll('[data-stage]');
      expect(stages[0]).toHaveTextContent('Data Prep');
      expect(stages[1]).toHaveTextContent('L1');
      expect(stages[2]).toHaveTextContent('L2');
      expect(stages[3]).toHaveTextContent('L3');
      expect(stages[4]).toHaveTextContent('Published');
    });
  });

  describe('Stage Status Icons', () => {
    it('shows completed icon for stages before current stage', () => {
      const { container } = render(
        <WorkflowProgressBar currentStage="Level2Pending" />,
      );

      const dataPrep = container.querySelector(
        '[data-stage="DataPreparation"]',
      );
      const level1 = container.querySelector('[data-stage="Level1Pending"]');

      expect(dataPrep).toHaveAttribute('data-stage-state', 'complete');
      expect(level1).toHaveAttribute('data-stage-state', 'complete');
    });

    it('shows current icon for the active stage', () => {
      const { container } = render(
        <WorkflowProgressBar currentStage="Level2Pending" />,
      );

      const level2 = container.querySelector('[data-stage="Level2Pending"]');
      expect(level2).toHaveAttribute('data-stage-state', 'current');
    });

    it('shows pending icon for stages after current stage', () => {
      const { container } = render(
        <WorkflowProgressBar currentStage="Level1Pending" />,
      );

      const level2 = container.querySelector('[data-stage="Level2Pending"]');
      const level3 = container.querySelector('[data-stage="Level3Pending"]');
      const approved = container.querySelector('[data-stage="Approved"]');

      expect(level2).toHaveAttribute('data-stage-state', 'pending');
      expect(level3).toHaveAttribute('data-stage-state', 'pending');
      expect(approved).toHaveAttribute('data-stage-state', 'pending');
    });

    it('shows all stages as pending when current stage is DataPreparation', () => {
      const { container } = render(
        <WorkflowProgressBar currentStage="DataPreparation" />,
      );

      const dataPrepStage = container.querySelector(
        '[data-stage="DataPreparation"]',
      );
      const level1 = container.querySelector('[data-stage="Level1Pending"]');
      const level2 = container.querySelector('[data-stage="Level2Pending"]');

      expect(dataPrepStage).toHaveAttribute('data-stage-state', 'current');
      expect(level1).toHaveAttribute('data-stage-state', 'pending');
      expect(level2).toHaveAttribute('data-stage-state', 'pending');
    });

    it('shows all stages as complete when current stage is Approved', () => {
      const { container } = render(
        <WorkflowProgressBar currentStage="Approved" />,
      );

      const dataPrep = container.querySelector(
        '[data-stage="DataPreparation"]',
      );
      const level1 = container.querySelector('[data-stage="Level1Pending"]');
      const level2 = container.querySelector('[data-stage="Level2Pending"]');
      const level3 = container.querySelector('[data-stage="Level3Pending"]');

      expect(dataPrep).toHaveAttribute('data-stage-state', 'complete');
      expect(level1).toHaveAttribute('data-stage-state', 'complete');
      expect(level2).toHaveAttribute('data-stage-state', 'complete');
      expect(level3).toHaveAttribute('data-stage-state', 'complete');
    });
  });

  describe('Rejection Indicators', () => {
    it('shows rejection warning on Level1 when batch was rejected at Level 1', () => {
      const { container } = render(
        <WorkflowProgressBar
          currentStage="DataPreparation"
          lastRejection={{
            date: '2026-01-20T14:30:00Z',
            level: 'Level 1',
            reason: 'Missing data',
          }}
        />,
      );

      const level1 = container.querySelector('[data-stage="Level1Pending"]');
      expect(level1).toHaveAttribute('data-rejected', 'true');
    });

    it('shows rejection warning on Level2 when batch was rejected at Level 2', () => {
      const { container } = render(
        <WorkflowProgressBar
          currentStage="DataPreparation"
          lastRejection={{
            date: '2026-01-20T14:30:00Z',
            level: 'Level 2',
            reason: 'Missing credit ratings',
          }}
        />,
      );

      const level2 = container.querySelector('[data-stage="Level2Pending"]');
      expect(level2).toHaveAttribute('data-rejected', 'true');
    });

    it('shows rejection warning on Level3 when batch was rejected at Level 3', () => {
      const { container } = render(
        <WorkflowProgressBar
          currentStage="DataPreparation"
          lastRejection={{
            date: '2026-01-20T14:30:00Z',
            level: 'Level 3',
            reason: 'Executive concerns',
          }}
        />,
      );

      const level3 = container.querySelector('[data-stage="Level3Pending"]');
      expect(level3).toHaveAttribute('data-rejected', 'true');
    });

    it('does not show rejection warning when lastRejection is null', () => {
      const { container } = render(
        <WorkflowProgressBar currentStage="Level2Pending" />,
      );

      const rejectedStages = container.querySelectorAll(
        '[data-rejected="true"]',
      );
      expect(rejectedStages).toHaveLength(0);
    });
  });

  describe('Stage Tooltips', () => {
    it('provides stage description via accessible title attribute for L1', () => {
      const { container } = render(
        <WorkflowProgressBar currentStage="Level2Pending" />,
      );

      const level1Stage = container.querySelector(
        '[data-stage="Level1Pending"]',
      );
      expect(level1Stage).toHaveAttribute(
        'title',
        expect.stringContaining('Operations approval'),
      );
    });

    it('provides stage description via accessible title attribute for Data Prep', () => {
      const { container } = render(
        <WorkflowProgressBar currentStage="Level2Pending" />,
      );

      const dataPrepStage = container.querySelector(
        '[data-stage="DataPreparation"]',
      );
      expect(dataPrepStage).toHaveAttribute(
        'title',
        expect.stringContaining('data must be collected'),
      );
    });

    it('provides stage description via accessible title attribute for current stage', () => {
      const { container } = render(
        <WorkflowProgressBar currentStage="Level2Pending" />,
      );

      const level2Stage = container.querySelector(
        '[data-stage="Level2Pending"]',
      );
      expect(level2Stage).toHaveAttribute(
        'title',
        expect.stringContaining('Portfolio Manager approval'),
      );
    });
  });

  describe('Stage Click Handler', () => {
    it('calls onStageClick with stage name when stage is clicked', async () => {
      const user = userEvent.setup();
      const onStageClick = vi.fn();

      render(
        <WorkflowProgressBar
          currentStage="Level2Pending"
          onStageClick={onStageClick}
        />,
      );

      const level1Stage = screen.getByText('L1');
      await user.click(level1Stage);

      expect(onStageClick).toHaveBeenCalledWith('Level1Pending');
    });

    it('does not call onStageClick when not provided', async () => {
      const user = userEvent.setup();

      render(<WorkflowProgressBar currentStage="Level2Pending" />);

      const level1Stage = screen.getByText('L1');
      await user.click(level1Stage);

      // Should not throw error
      expect(level1Stage).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible labels for screen readers', () => {
      render(<WorkflowProgressBar currentStage="Level2Pending" />);

      expect(screen.getByLabelText(/workflow progress/i)).toBeInTheDocument();
    });

    it('uses semantic HTML for progress bar', () => {
      const { container } = render(
        <WorkflowProgressBar currentStage="Level2Pending" />,
      );

      // Should have a progress or navigation landmark
      const progressBar = container.querySelector('[role="navigation"]');
      expect(progressBar).toBeInTheDocument();
    });
  });
});
