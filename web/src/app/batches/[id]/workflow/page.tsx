/**
 * Workflow State Viewer Page
 *
 * Server component that handles authentication and authorization,
 * then renders the client-side workflow visualization UI.
 */

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/auth-server';
import { hasPageAccess } from '@/lib/auth/auth-helpers';
import WorkflowClient from './WorkflowClient';

export default async function WorkflowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSession();

  if (!user) {
    redirect('/login');
  }

  if (!hasPageAccess(user, '/batches')) {
    redirect('/auth/forbidden');
  }

  const { id } = await params;
  const batchId = parseInt(id, 10);

  if (isNaN(batchId)) {
    redirect('/batches');
  }

  return <WorkflowClient batchId={batchId} />;
}
