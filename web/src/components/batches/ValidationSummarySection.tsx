/**
 * Validation Summary Section Component
 *
 * Displays error and warning counts with expandable breakdown.
 */
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { BatchValidationResult } from '@/lib/api/batches';

interface ValidationSummarySectionProps {
  errors: number;
  warnings: number;
  validationDetails?: BatchValidationResult;
}

export function ValidationSummarySection({
  errors,
  warnings,
  validationDetails,
}: ValidationSummarySectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <AlertCircle className="h-5 w-5" />
          Validation Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-3">
          <p className="text-sm">
            <span className="font-semibold text-destructive">
              {errors} Errors
            </span>
          </p>
          <p className="text-sm">
            <span className="font-semibold text-warning">
              {warnings} Warnings
            </span>
          </p>
        </div>

        {validationDetails && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="gap-2"
            >
              View Breakdown
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {isExpanded && (
              <div className="mt-3 space-y-2 text-sm">
                <p className="font-medium">Reference Data Issues:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {validationDetails.referenceDataCompleteness
                    .instrumentsMissingRatings > 0 && (
                    <li>
                      {
                        validationDetails.referenceDataCompleteness
                          .instrumentsMissingRatings
                      }{' '}
                      instruments missing ratings
                    </li>
                  )}
                  {validationDetails.referenceDataCompleteness
                    .instrumentsMissingDurations > 0 && (
                    <li>
                      {
                        validationDetails.referenceDataCompleteness
                          .instrumentsMissingDurations
                      }{' '}
                      instruments missing durations
                    </li>
                  )}
                  {validationDetails.referenceDataCompleteness
                    .instrumentsMissingBetas > 0 && (
                    <li>
                      {
                        validationDetails.referenceDataCompleteness
                          .instrumentsMissingBetas
                      }{' '}
                      instruments missing betas
                    </li>
                  )}
                  {validationDetails.referenceDataCompleteness
                    .missingIndexPrices > 0 && (
                    <li>
                      {
                        validationDetails.referenceDataCompleteness
                          .missingIndexPrices
                      }{' '}
                      missing index prices
                    </li>
                  )}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
