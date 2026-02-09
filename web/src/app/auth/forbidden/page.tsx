import Link from 'next/link';
import { Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { roleDescriptions } from '@/types/roles';

interface ForbiddenPageProps {
  searchParams: Promise<{
    required?: string;
    current?: string;
  }>;
}

export default async function ForbiddenPage({
  searchParams,
}: ForbiddenPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const requiredRole = params.required;
  const currentRole = params.current;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <Shield className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="text-4xl font-bold text-destructive">403</h1>
          <h2 className="text-2xl font-semibold">Access Forbidden</h2>
          <p className="text-muted-foreground">
            You do not have permission to access this page.
          </p>
        </div>

        {requiredRole && currentRole && (
          <Card>
            <CardContent className="pt-6 text-left">
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="font-semibold text-foreground">
                    Required Role:
                  </dt>
                  <dd className="text-muted-foreground">
                    {roleDescriptions[
                      requiredRole as keyof typeof roleDescriptions
                    ] || requiredRole}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-foreground">Your Role:</dt>
                  <dd className="text-muted-foreground">
                    {roleDescriptions[
                      currentRole as keyof typeof roleDescriptions
                    ] || currentRole}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link href="/">Return to Home</Link>
          </Button>
          <Link
            href="/login"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign out and switch accounts
          </Link>
        </div>

        <p className="text-xs text-muted-foreground">
          If you believe you should have access to this page, please contact
          your administrator.
        </p>
      </div>
    </div>
  );
}
