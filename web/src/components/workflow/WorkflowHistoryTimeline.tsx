/**
 * Workflow History Timeline Component
 *
 * Displays a paginated timeline of workflow events in reverse chronological order.
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { WorkflowEvent } from './WorkflowEvent';
import { Loader2 } from 'lucide-react';
import type { BatchAuditEvent } from '@/lib/api/batches';

interface WorkflowHistoryTimelineProps {
  events: BatchAuditEvent[];
  totalPages: number;
  currentPage: number;
  onLoadMore: () => void;
  isLoading?: boolean;
}

export function WorkflowHistoryTimeline({
  events,
  totalPages,
  currentPage,
  onLoadMore,
  isLoading = false,
}: WorkflowHistoryTimelineProps) {
  const hasMorePages = currentPage < totalPages;

  if (events.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Workflow History</h2>
        <p className="text-sm text-muted-foreground">
          No workflow events yet. Events will appear here as the batch
          progresses through the workflow.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Workflow History</h2>

      <div className="space-y-4">
        {events.map((event) => (
          <WorkflowEvent
            key={event.id}
            eventType={event.eventType}
            timestamp={event.timestamp}
            user={event.user}
            action={event.action}
            automatedActions={event.automatedActions}
          />
        ))}
      </div>

      {hasMorePages && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" onClick={onLoadMore} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load Earlier Events'
            )}
          </Button>
        </div>
      )}
    </Card>
  );
}
