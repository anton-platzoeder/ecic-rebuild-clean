/**
 * Admin Users Page (Server Component Wrapper)
 *
 * Requires Administrator role.
 * Renders UsersClient component for client-side functionality.
 */

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/auth-server';
import { UserRole } from '@/types/roles';
import UsersClient from './users-client';

export default async function AdminUsersPage() {
  const user = await getSession();

  if (!user) {
    redirect('/login');
  }

  if (!user.roles.includes(UserRole.Administrator)) {
    redirect('/auth/forbidden');
  }

  return <UsersClient />;
}
