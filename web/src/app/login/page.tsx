'use client';

/**
 * Login Page
 *
 * User authentication interface with AD/LDAP integration.
 * Handles login form submission, validation, and redirects.
 */

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login, getCurrentUser } from '@/lib/api/auth';
import { resetSessionTimeout } from '@/lib/auth/session';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await getCurrentUser();
        router.replace('/');
      } catch {
        // User is not authenticated, stay on login page
      }
    };

    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationError(null);

    if (!username.trim()) {
      setValidationError('Username is required');
      return;
    }

    if (!password.trim()) {
      setValidationError('Password is required');
      return;
    }

    setIsLoading(true);

    try {
      const response = await login({ username, password });

      document.cookie = `accessToken=${response.accessToken}; path=/; max-age=${response.expiresIn}`;
      document.cookie = `refreshToken=${response.refreshToken}; path=/; max-age=${response.expiresIn * 2}`;

      resetSessionTimeout();
      router.push('/');
    } catch (err) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError(err.message as string);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Shield className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-4 text-2xl font-bold tracking-tight">
            InvestInsight
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Investment Compliance & Insights Platform
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
              Sign In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="mt-1"
                />
              </div>

              {validationError && (
                <div className="text-sm text-destructive">
                  {validationError}
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                >
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
