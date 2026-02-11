/**
 * Batches Page
 *
 * Requires OperationsLead role only (strict role-based access).
 */

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/auth-server';
import { UserRole } from '@/types/roles';

export default async function BatchesPage() {
  const user = await getSession();

  if (!user) {
    redirect('/login');
  }

  if (!user.roles.includes(UserRole.OperationsLead)) {
    redirect('/auth/forbidden');
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">Batches</h1>
        <p className="text-muted-foreground mt-2">
          Manage instrument batches and submissions.
        </p>
      </div>
    </main>
  );
}
