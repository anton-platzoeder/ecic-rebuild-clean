/**
 * Workflow Information Section Component
 *
 * Displays current workflow stage, approver, time in stage, and approval history.
 */
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitBranch, CheckCircle, XCircle } from 'lucide-react';
import type { BatchApproval } from '@/lib/api/batches';

interface WorkflowInfoSectionProps {
  currentStage: string;
  lastUpdated: string;
  approvals: BatchApproval[];
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

export function WorkflowInfoSection({
  currentStage,
  lastUpdated,
  approvals,
}: WorkflowInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <GitBranch className="h-5 w-5" />
          Workflow Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm">
            <span className="font-semibold">Current Stage:</span> {currentStage}
          </p>
          <p className="text-sm text-muted-foreground">
            Last Updated: {formatTimestamp(lastUpdated)}
          </p>
        </div>

        {approvals.length > 0 && (
          <div>
            <p className="text-sm font-semibold mb-2">Approval History:</p>
            <div className="space-y-2">
              {approvals.map((approval) => (
                <div
                  key={approval.id}
                  className="flex items-center gap-2 text-sm"
                >
                  {approval.decision === 'Approved' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="font-medium">{approval.decidedBy}</span>
                  <Badge
                    variant={
                      approval.decision === 'Approved'
                        ? 'outline'
                        : 'destructive'
                    }
                  >
                    {approval.decision}
                  </Badge>
                  <span className="text-muted-foreground">
                    Level {approval.level}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
