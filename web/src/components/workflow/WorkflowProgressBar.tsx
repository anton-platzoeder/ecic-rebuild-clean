/**
 * Workflow Progress Bar Component
 *
 * Visual progress indicator showing all workflow stages with their status.
 * Uses data-stage and data-stage-state attributes for testing.
 */
'use client';

import { Check, Circle, Dot, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  WORKFLOW_STAGES,
  getStageStatus,
  type WorkflowStage,
} from '@/lib/constants/workflow-stages';

interface WorkflowProgressBarProps {
  currentStage: string;
  lastRejection?: { level: string; reason: string; date: string } | null;
  onStageClick?: (stageName: string) => void;
}

export function WorkflowProgressBar({
  currentStage,
  lastRejection = null,
  onStageClick,
}: WorkflowProgressBarProps) {
  const getRejectedStage = (): string | null => {
    if (!lastRejection) return null;
    // Map rejection level text to stage enum
    const levelMap: Record<string, string> = {
      'Level 1': 'Level1Pending',
      'Level 2': 'Level2Pending',
      'Level 3': 'Level3Pending',
    };
    return levelMap[lastRejection.level] || null;
  };

  const rejectedStage = getRejectedStage();

  const getStageIcon = (
    stageKey: WorkflowStage,
    status: 'complete' | 'current' | 'pending',
  ) => {
    if (rejectedStage === stageKey) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }

    switch (status) {
      case 'complete':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'current':
        return <Dot className="h-4 w-4 text-yellow-600" />;
      case 'pending':
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStageVariant = (
    status: 'complete' | 'current' | 'pending',
  ): 'default' | 'secondary' | 'outline' => {
    switch (status) {
      case 'complete':
        return 'default';
      case 'current':
        return 'secondary';
      case 'pending':
        return 'outline';
    }
  };

  return (
    <TooltipProvider>
      <div
        className="flex items-center justify-between gap-2 rounded-lg border bg-card p-4"
        role="navigation"
        aria-label="workflow progress"
      >
        {WORKFLOW_STAGES.map((stage, index) => {
          const status = getStageStatus(stage.key, currentStage);
          const isRejected = rejectedStage === stage.key;

          return (
            <div key={stage.key} className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    data-stage={stage.key}
                    data-stage-state={status}
                    data-rejected={isRejected ? 'true' : undefined}
                    title={stage.description}
                    onClick={() => onStageClick?.(stage.key)}
                    role={onStageClick ? 'button' : undefined}
                    className={onStageClick ? 'cursor-pointer' : undefined}
                  >
                    <Badge variant={getStageVariant(status)}>
                      {getStageIcon(stage.key, status)}
                      <span className="ml-1">{stage.shortLabel}</span>
                    </Badge>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold">{stage.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {stage.description}
                  </p>
                </TooltipContent>
              </Tooltip>
              {index < WORKFLOW_STAGES.length - 1 && (
                <div className="h-0.5 w-8 bg-gray-300" />
              )}
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
