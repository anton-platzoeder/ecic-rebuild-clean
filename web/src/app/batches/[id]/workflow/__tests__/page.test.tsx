/**
 * Tests for Workflow Page Server Component
 *
 * Tests authentication, authorization, parameter validation,
 * and redirects for the workflow state visualization page.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { redirect } from 'next/navigation';
import WorkflowPage from '@/app/batches/[id]/workflow/page';
import { getSession } from '@/lib/auth/auth-server';
import { hasPageAccess } from '@/lib/auth/auth-helpers';
import type { AuthUser } from '@/lib/api/auth';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// Mock auth server
vi.mock('@/lib/auth/auth-server', () => ({
  getSession: vi.fn(),
}));

// Mock auth helpers
vi.mock('@/lib/auth/auth-helpers', () => ({
  hasPageAccess: vi.fn(),
}));

// Mock WorkflowClient component
vi.mock('@/app/batches/[id]/workflow/WorkflowClient', () => ({
  default: ({ batchId }: { batchId: number }) => (
    <div data-testid="workflow-client">Workflow Client: {batchId}</div>
  ),
}));

const createMockUser = (overrides: Partial<AuthUser> = {}): AuthUser => ({
  id: 'user-1',
  username: 'sthomas',
  displayName: 'Sarah Thomas',
  email: 'sthomas@investinsight.com',
  roles: ['Analyst'],
  permissions: ['batch.view'],
  allowedPages: ['/batches'],
  ...overrides,
});

const mockRedirect = redirect as unknown as ReturnType<typeof vi.fn>;

describe('Workflow Page (Server Component)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Make redirect throw to stop execution (like real Next.js behavior)
    mockRedirect.mockImplementation((url: string) => {
      throw new Error(`NEXT_REDIRECT: ${url}`);
    });
  });

  describe('Authentication', () => {
    it('redirects to login when user is not authenticated', async () => {
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(
        WorkflowPage({ params: Promise.resolve({ id: '1' }) }),
      ).rejects.toThrow('NEXT_REDIRECT: /login');

      expect(redirect).toHaveBeenCalledWith('/login');
    });

    it('does not redirect when user is authenticated', async () => {
      const mockUser = createMockUser();
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
      (hasPageAccess as ReturnType<typeof vi.fn>).mockReturnValue(true);

      await WorkflowPage({ params: Promise.resolve({ id: '1' }) });

      expect(redirect).not.toHaveBeenCalledWith('/login');
    });
  });

  describe('Authorization', () => {
    it('redirects to forbidden page when user lacks permission to view batches', async () => {
      const mockUser = createMockUser({ allowedPages: [] });
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
      (hasPageAccess as ReturnType<typeof vi.fn>).mockReturnValue(false);

      await expect(
        WorkflowPage({ params: Promise.resolve({ id: '1' }) }),
      ).rejects.toThrow('NEXT_REDIRECT: /auth/forbidden');

      expect(redirect).toHaveBeenCalledWith('/auth/forbidden');
    });

    it('allows access when user has batch.view permission', async () => {
      const mockUser = createMockUser({ permissions: ['batch.view'] });
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
      (hasPageAccess as ReturnType<typeof vi.fn>).mockReturnValue(true);

      await WorkflowPage({ params: Promise.resolve({ id: '1' }) });

      expect(redirect).not.toHaveBeenCalled();
    });

    it('allows access for Analyst role', async () => {
      const mockUser = createMockUser({ roles: ['Analyst'] });
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
      (hasPageAccess as ReturnType<typeof vi.fn>).mockReturnValue(true);

      await WorkflowPage({ params: Promise.resolve({ id: '1' }) });

      expect(redirect).not.toHaveBeenCalled();
    });

    it('allows access for ApproverL2 role', async () => {
      const mockUser = createMockUser({ roles: ['ApproverL2'] });
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
      (hasPageAccess as ReturnType<typeof vi.fn>).mockReturnValue(true);

      await WorkflowPage({ params: Promise.resolve({ id: '1' }) });

      expect(redirect).not.toHaveBeenCalled();
    });
  });

  describe('Parameter Validation', () => {
    it('redirects to batches page when batch ID is not a number', async () => {
      const mockUser = createMockUser();
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
      (hasPageAccess as ReturnType<typeof vi.fn>).mockReturnValue(true);

      await expect(
        WorkflowPage({ params: Promise.resolve({ id: 'abc' }) }),
      ).rejects.toThrow('NEXT_REDIRECT: /batches');

      expect(redirect).toHaveBeenCalledWith('/batches');
    });

    it('redirects to batches page when batch ID is NaN', async () => {
      const mockUser = createMockUser();
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
      (hasPageAccess as ReturnType<typeof vi.fn>).mockReturnValue(true);

      await expect(
        WorkflowPage({ params: Promise.resolve({ id: 'NaN' }) }),
      ).rejects.toThrow('NEXT_REDIRECT: /batches');

      expect(redirect).toHaveBeenCalledWith('/batches');
    });

    it('accepts valid numeric batch ID', async () => {
      const mockUser = createMockUser();
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
      (hasPageAccess as ReturnType<typeof vi.fn>).mockReturnValue(true);

      await WorkflowPage({ params: Promise.resolve({ id: '42' }) });

      expect(redirect).not.toHaveBeenCalled();
    });

    it('accepts batch ID of 0', async () => {
      const mockUser = createMockUser();
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
      (hasPageAccess as ReturnType<typeof vi.fn>).mockReturnValue(true);

      await WorkflowPage({ params: Promise.resolve({ id: '0' }) });

      expect(redirect).not.toHaveBeenCalled();
    });
  });

  describe('Component Rendering', () => {
    it('renders WorkflowClient with correct batch ID', async () => {
      const mockUser = createMockUser();
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
      (hasPageAccess as ReturnType<typeof vi.fn>).mockReturnValue(true);

      const result = await WorkflowPage({
        params: Promise.resolve({ id: '1' }),
      });

      expect(result).toBeDefined();
      expect(result.props).toMatchObject({ batchId: 1 });
    });

    it('passes correct batch ID when ID is 42', async () => {
      const mockUser = createMockUser();
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
      (hasPageAccess as ReturnType<typeof vi.fn>).mockReturnValue(true);

      const result = await WorkflowPage({
        params: Promise.resolve({ id: '42' }),
      });

      expect(result.props).toMatchObject({ batchId: 42 });
    });

    it('converts string ID to number correctly', async () => {
      const mockUser = createMockUser();
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
      (hasPageAccess as ReturnType<typeof vi.fn>).mockReturnValue(true);

      const result = await WorkflowPage({
        params: Promise.resolve({ id: '123' }),
      });

      expect(result.props.batchId).toBe(123);
      expect(typeof result.props.batchId).toBe('number');
    });
  });

  describe('Redirect Priority', () => {
    it('checks authentication before authorization', async () => {
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(
        WorkflowPage({ params: Promise.resolve({ id: '1' }) }),
      ).rejects.toThrow('NEXT_REDIRECT: /login');

      expect(redirect).toHaveBeenCalledWith('/login');
      expect(hasPageAccess).not.toHaveBeenCalled();
    });

    it('checks authorization before parameter validation', async () => {
      const mockUser = createMockUser();
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
      (hasPageAccess as ReturnType<typeof vi.fn>).mockReturnValue(false);

      await expect(
        WorkflowPage({ params: Promise.resolve({ id: 'invalid' }) }),
      ).rejects.toThrow('NEXT_REDIRECT: /auth/forbidden');

      expect(redirect).toHaveBeenCalledWith('/auth/forbidden');
      // Should not reach parameter validation redirect
      expect(redirect).not.toHaveBeenCalledWith('/batches');
    });

    it('validates parameters after authentication and authorization', async () => {
      const mockUser = createMockUser();
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
      (hasPageAccess as ReturnType<typeof vi.fn>).mockReturnValue(true);

      await expect(
        WorkflowPage({ params: Promise.resolve({ id: 'invalid' }) }),
      ).rejects.toThrow('NEXT_REDIRECT: /batches');

      expect(redirect).toHaveBeenCalledWith('/batches');
    });
  });
});
