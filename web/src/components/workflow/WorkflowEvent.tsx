/**
 * Workflow Event Component
 *
 * Displays a single workflow event with icon, timestamp, user, action, and expandable automated actions.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  FileText,
  Calculator,
  Database,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { format } from 'date-fns';

interface WorkflowEventProps {
  eventType: string;
  timestamp: string;
  user: string;
  action: string;
  automatedActions: string[];
}

const EVENT_TYPE_CONFIG: Record<
  string,
  {
    icon: React.ReactNode;
    label: string;
    variant: 'default' | 'destructive' | 'secondary';
  }
> = {
  BATCH_CREATED: {
    icon: <FileText className="h-4 w-4" />,
    label: 'BATCH CREATED',
    variant: 'default',
  },
  DATA_CONFIRMED: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    label: 'DATA CONFIRMED',
    variant: 'secondary',
  },
  LEVEL_1_APPROVED: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    label: 'LEVEL 1 APPROVED',
    variant: 'secondary',
  },
  LEVEL_2_APPROVED: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    label: 'LEVEL 2 APPROVED',
    variant: 'secondary',
  },
  LEVEL_3_APPROVED: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    label: 'LEVEL 3 APPROVED',
    variant: 'secondary',
  },
  LEVEL_1_REJECTED: {
    icon: <XCircle className="h-4 w-4" />,
    label: 'LEVEL 1 REJECTED',
    variant: 'destructive',
  },
  LEVEL_2_REJECTED: {
    icon: <XCircle className="h-4 w-4" />,
    label: 'LEVEL 2 REJECTED',
    variant: 'destructive',
  },
  LEVEL_3_REJECTED: {
    icon: <XCircle className="h-4 w-4" />,
    label: 'LEVEL 3 REJECTED',
    variant: 'destructive',
  },
  CALCULATIONS_COMPLETED: {
    icon: <Calculator className="h-4 w-4" />,
    label: 'CALCULATIONS COMPLETED',
    variant: 'secondary',
  },
  MASTER_DATA_UPDATED: {
    icon: <Database className="h-4 w-4" />,
    label: 'MASTER DATA UPDATED',
    variant: 'default',
  },
};

export function WorkflowEvent({
  eventType,
  timestamp,
  user,
  action,
  automatedActions,
}: WorkflowEventProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = EVENT_TYPE_CONFIG[eventType] || {
    icon: <FileText className="h-4 w-4" />,
    label: eventType,
    variant: 'default' as const,
  };

  const formattedDate = format(new Date(timestamp), 'MMM dd, yyyy');
  const formattedTime = format(new Date(timestamp), 'HH:mm');

  return (
    <article className="flex gap-4 border-b pb-4 last:border-b-0">
      <div className="flex flex-col items-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          {config.icon}
        </div>
        <div className="h-full w-px bg-border mt-2" />
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant={config.variant}>{config.label}</Badge>
          <span className="text-sm text-muted-foreground">
            {formattedDate} at {formattedTime}
          </span>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium">{action}</p>
          <p className="text-sm text-muted-foreground">by {user}</p>
        </div>

        {automatedActions.length > 0 && (
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-auto p-0 hover:bg-transparent"
              aria-label="View automated actions"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 mr-1" />
              ) : (
                <ChevronDown className="h-4 w-4 mr-1" />
              )}
              <span className="text-sm">
                {automatedActions.length} Automated Action
                {automatedActions.length !== 1 ? 's' : ''}
              </span>
            </Button>

            {isExpanded && (
              <ul className="mt-2 ml-5 space-y-1">
                {automatedActions.map((action, index) => (
                  <li
                    key={index}
                    className="text-sm text-muted-foreground list-disc"
                  >
                    {action}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
