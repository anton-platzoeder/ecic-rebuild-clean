/**
 * Approvals Page
 *
 * Requires ApproverL1, ApproverL2, or ApproverL3 role.
 */

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/auth-server';
import { UserRole } from '@/types/roles';

const APPROVER_ROLES = [
  UserRole.ApproverL1,
  UserRole.ApproverL2,
  UserRole.ApproverL3,
];

export default async function ApprovalsPage() {
  const user = await getSession();

  if (!user) {
    redirect('/login');
  }

  const hasApproverRole = user.roles.some((role) =>
    APPROVER_ROLES.includes(role as UserRole),
  );

  if (!hasApproverRole) {
    redirect('/auth/forbidden');
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">Approvals</h1>
        <p className="text-muted-foreground mt-2">
          Review and approve pending submissions.
        </p>
      </div>
    </main>
  );
}
