/**
 * File Status Section Component
 *
 * Displays file upload progress and link to file details.
 */
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface FileStatusSectionProps {
  batchId: number;
  received: number;
  total: number;
}

export function FileStatusSection({
  batchId,
  received,
  total,
}: FileStatusSectionProps) {
  const percentage = total > 0 ? Math.round((received / total) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <FileText className="h-5 w-5" />
          File Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold mb-2">
          Files: {received}/{total} ({percentage}%)
        </p>
        <Link
          href={`/batches/${batchId}/files`}
          className="text-sm text-primary hover:underline"
        >
          View Files
        </Link>
      </CardContent>
    </Card>
  );
}
