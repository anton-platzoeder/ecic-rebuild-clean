/**
 * Story Metadata:
 * - Epic: 1
 * - Story: 4
 * - Route: /admin/roles
 * - Target File: app/admin/roles/page.tsx
 * - Page Action: modify_existing
 *
 * Tests for Role Assignment & Permission Management
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useRouter } from 'next/navigation';
import RolesPage from '@/app/admin/roles/page';
import * as authApi from '@/lib/api/auth';
import * as rolesApi from '@/lib/api/roles';
import * as usersApi from '@/lib/api/users';
import * as approvalAuthorityApi from '@/lib/api/approval-authority';
import type { AuthUser } from '@/lib/api/auth';
import type { RoleWithPermissions, Permission } from '@/lib/api/roles';
import type { UserDetail, Role } from '@/lib/api/users';
import type {
  ApprovalAuthorityEntry,
  ApprovalRulesConfig,
} from '@/lib/api/approval-authority';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock auth API
vi.mock('@/lib/api/auth', () => ({
  getCurrentUser: vi.fn(),
}));

// Mock roles API
vi.mock('@/lib/api/roles', () => ({
  listRoles: vi.fn(),
  getRoleWithPermissions: vi.fn(),
  getUsersWithRole: vi.fn(),
  createRole: vi.fn(),
  updateRole: vi.fn(),
  listPermissions: vi.fn(),
}));

// Mock users API
vi.mock('@/lib/api/users', () => ({
  listUsers: vi.fn(),
  getUserRoles: vi.fn(),
  updateUserRoles: vi.fn(),
}));

// Mock approval authority API
vi.mock('@/lib/api/approval-authority', () => ({
  listApprovalAuthorities: vi.fn(),
  assignApprovalAuthority: vi.fn(),
  removeApprovalAuthority: vi.fn(),
  configureBackupApprovers: vi.fn(),
  getApprovalRules: vi.fn(),
  updateApprovalRules: vi.fn(),
}));

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
};

// Mock data factories
const createMockAdminUser = (overrides: Partial<AuthUser> = {}): AuthUser => ({
  id: 'admin-1',
  username: 'admin',
  displayName: 'Admin User',
  email: 'admin@investinsight.com',
  roles: ['Administrator'],
  permissions: ['manage_roles', 'manage_users', 'view_audit_trail'],
  allowedPages: ['/admin/users', '/admin/roles', '/admin/audit-trail'],
  ...overrides,
});

const createMockNonAdminUser = (
  overrides: Partial<AuthUser> = {},
): AuthUser => ({
  id: 'analyst-1',
  username: 'analyst',
  displayName: 'Regular User',
  email: 'analyst@investinsight.com',
  roles: ['Analyst'],
  permissions: ['view_portfolios'],
  allowedPages: ['/dashboard', '/batches'],
  ...overrides,
});

const createMockPermission = (
  overrides: Partial<Permission> = {},
): Permission => ({
  id: 1,
  name: 'view_batches',
  description: 'View batch information',
  category: 'Batch Management',
  ...overrides,
});

const createMockRole = (
  overrides: Partial<RoleWithPermissions> = {},
): RoleWithPermissions => ({
  id: 2,
  name: 'Analyst',
  description: 'Data analyst role with access to batch operations',
  isSystemRole: true,
  permissions: [
    createMockPermission({
      id: 1,
      name: 'view_batches',
      category: 'Batch Management',
    }),
    createMockPermission({
      id: 2,
      name: 'edit_batches',
      category: 'Batch Management',
    }),
  ],
  allowedPages: [
    '/',
    '/batches',
    '/files',
    '/validation',
    '/master-data',
    '/admin/audit-trail',
  ],
  ...overrides,
});

const createMockUserDetail = (
  overrides: Partial<UserDetail> = {},
): UserDetail => ({
  id: 1,
  username: 'jsmith',
  firstName: 'John',
  lastName: 'Smith',
  displayName: 'John Smith',
  email: 'john.smith@company.com',
  department: 'Operations',
  jobTitle: 'Operations Lead',
  employeeId: 'EMP001',
  managerId: null,
  managerName: null,
  isActive: true,
  deactivationReason: null,
  deactivatedAt: null,
  roles: [
    {
      id: 2,
      name: 'Analyst',
      description: 'Analyst Role',
      isSystemRole: true,
      allowedPages: [],
    },
  ],
  lastLoginAt: '2026-02-09T08:30:00Z',
  createdAt: '2026-01-15T10:00:00Z',
  lastChangedUser: 'admin',
  validFrom: '2026-01-15T10:00:00Z',
  validTo: '9999-12-31T23:59:59Z',
  ...overrides,
});

const createMockApprovalAuthority = (
  overrides: Partial<ApprovalAuthorityEntry> = {},
): ApprovalAuthorityEntry => ({
  id: 1,
  userId: 10,
  displayName: 'Sarah Chen',
  username: 'schen',
  email: 'schen@company.com',
  approvalLevel: 1,
  roleName: 'Approver Level 1',
  effectiveFrom: '2026-01-01',
  effectiveTo: null,
  assignedBy: 'admin',
  assignedAt: '2026-01-01T00:00:00Z',
  isBackup: false,
  isActive: true,
  isOutOfOffice: false,
  outOfOfficeUntil: null,
  backupApprovers: [],
  pendingApprovalCount: 0,
  ...overrides,
});

describe('Role & Permission Management Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue(mockRouter);
  });

  describe('Authorization Check', () => {
    it('redirects non-admin users with access denied message', async () => {
      const mockUser = createMockNonAdminUser();
      (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUser,
      );

      render(<RolesPage />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/access denied/i)).toBeInTheDocument();
        expect(
          screen.getByText(/administrator role required/i),
        ).toBeInTheDocument();
      });

      expect(mockRouter.replace).toHaveBeenCalledWith('/');
    });

    it('allows access to users with Administrator role', async () => {
      const mockUser = createMockAdminUser();
      const mockRoles = [
        createMockRole(),
        createMockRole({
          id: 3,
          name: 'ApproverL1',
          description: 'Level 1 Approver',
          allowedPages: ['/approvals/level-1'],
        }),
      ];

      (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUser,
      );
      (rolesApi.listRoles as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockRoles,
      );
      (rolesApi.getUsersWithRole as ReturnType<typeof vi.fn>).mockResolvedValue(
        [],
      );

      render(<RolesPage />);

      await waitFor(() => {
        expect(
          screen.getByText('Role & Permission Management'),
        ).toBeInTheDocument();
      });

      expect(mockRouter.replace).not.toHaveBeenCalled();
    });
  });

  describe('Happy Path - View Role Definitions', () => {
    it('displays three tabs: Role Definitions, User Role Assignments, Approval Authority Config', async () => {
      const mockUser = createMockAdminUser();
      const mockRoles = [createMockRole()];

      (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUser,
      );
      (rolesApi.listRoles as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockRoles,
      );
      (rolesApi.getUsersWithRole as ReturnType<typeof vi.fn>).mockResolvedValue(
        [],
      );

      render(<RolesPage />);

      await waitFor(() => {
        expect(
          screen.getByRole('tab', { name: /role definitions/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole('tab', { name: /user role assignments/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole('tab', { name: /approval authority config/i }),
        ).toBeInTheDocument();
      });
    });

    it('displays default roles on Role Definitions tab', async () => {
      const mockUser = createMockAdminUser();
      const mockRoles = [
        createMockRole({ id: 2, name: 'Analyst' }),
        createMockRole({ id: 3, name: 'ApproverL1' }),
        createMockRole({ id: 4, name: 'ApproverL2' }),
        createMockRole({ id: 5, name: 'ApproverL3' }),
        createMockRole({ id: 1, name: 'Administrator' }),
      ];

      (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUser,
      );
      (rolesApi.listRoles as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockRoles,
      );
      (rolesApi.getUsersWithRole as ReturnType<typeof vi.fn>).mockResolvedValue(
        [],
      );

      render(<RolesPage />);

      await waitFor(() => {
        expect(screen.getByText('Analyst')).toBeInTheDocument();
        expect(screen.getByText('Approver Level 1')).toBeInTheDocument();
        expect(screen.getByText('Approver Level 2')).toBeInTheDocument();
        expect(screen.getByText('Approver Level 3')).toBeInTheDocument();
        expect(screen.getByText('Administrator')).toBeInTheDocument();
      });
    });

    it('displays role card with name, description, user count, page access, and action buttons', async () => {
      const mockUser = createMockAdminUser();
      const mockRoles = [createMockRole()];
      const mockUsersWithRole = [
        createMockUserDetail(),
        createMockUserDetail({ id: 2 }),
      ];

      (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUser,
      );
      (rolesApi.listRoles as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockRoles,
      );
      (rolesApi.getUsersWithRole as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUsersWithRole,
      );

      render(<RolesPage />);

      await waitFor(() => {
        expect(screen.getByText('Analyst')).toBeInTheDocument();
        expect(
          screen.getByText(
            /data analyst role with access to batch operations/i,
          ),
        ).toBeInTheDocument();
        expect(screen.getByText(/2 users/i)).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /view permissions/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /view assigned users/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /edit role/i }),
        ).toBeInTheDocument();
      });
    });

    it('displays page access summary in role card', async () => {
      const mockUser = createMockAdminUser();
      const mockRoles = [
        createMockRole({
          name: 'Analyst',
          allowedPages: ['/', '/batches', '/files'],
        }),
      ];

      (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUser,
      );
      (rolesApi.listRoles as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockRoles,
      );
      (rolesApi.getUsersWithRole as ReturnType<typeof vi.fn>).mockResolvedValue(
        [],
      );

      render(<RolesPage />);

      await waitFor(() => {
        expect(screen.getByText(/pages:/i)).toBeInTheDocument();
        expect(screen.getByText(/\/, \/batches, \/files/i)).toBeInTheDocument();
      });
    });
  });

  describe('Create New Role', () => {
    it('opens Create Role modal when Create Role button is clicked', async () => {
      const user = userEvent.setup();
      const mockUser = createMockAdminUser();
      const mockRoles = [createMockRole()];
      const mockPermissions = [
        createMockPermission({
          id: 1,
          name: 'view_batches',
          category: 'Batch Management',
        }),
        createMockPermission({
          id: 2,
          name: 'edit_batches',
          category: 'Batch Management',
        }),
      ];

      (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUser,
      );
      (rolesApi.listRoles as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockRoles,
      );
      (rolesApi.getUsersWithRole as ReturnType<typeof vi.fn>).mockResolvedValue(
        [],
      );
      (rolesApi.listPermissions as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockPermissions,
      );

      render(<RolesPage />);

      await waitFor(() => {
        expect(screen.getByText('Analyst')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', {
        name: /\+ create role/i,
      });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/create new role/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/role name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      });
    });

    it('displays page access checklist in Create Role modal', async () => {
      const user = userEvent.setup();
      const mockUser = createMockAdminUser();
      const mockRoles = [createMockRole()];
      const mockPermissions = [createMockPermission()];

      (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUser,
      );
      (rolesApi.listRoles as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockRoles,
      );
      (rolesApi.getUsersWithRole as ReturnType<typeof vi.fn>).mockResolvedValue(
        [],
      );
      (rolesApi.listPermissions as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockPermissions,
      );

      render(<RolesPage />);

      await waitFor(() => {
        expect(screen.getByText('Analyst')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', {
        name: /\+ create role/i,
      });
      await user.click(createButton);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        // Check for specific page checkboxes instead of generic "page access" text
        expect(
          within(dialog).getByRole('checkbox', { name: /dashboard \(\/\)/i }),
        ).toBeInTheDocument();
        expect(
          within(dialog).getByRole('checkbox', {
            name: /batches \(\/batches\)/i,
          }),
        ).toBeInTheDocument();
        expect(
          within(dialog).getByRole('checkbox', { name: /approval level 1/i }),
        ).toBeInTheDocument();
        expect(
          within(dialog).getByRole('checkbox', {
            name: /users \(\/admin\/users\)/i,
          }),
        ).toBeInTheDocument();
      });
    });

    it('displays action permissions checklist in Create Role modal', async () => {
      const user = userEvent.setup();
      const mockUser = createMockAdminUser();
      const mockRoles = [createMockRole()];
      const mockPermissions = [
        createMockPermission({
          id: 1,
          name: 'view_batches',
          category: 'Batch Management',
        }),
        createMockPermission({
          id: 2,
          name: 'edit_batches',
          category: 'Batch Management',
        }),
      ];

      (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUser,
      );
      (rolesApi.listRoles as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockRoles,
      );
      (rolesApi.getUsersWithRole as ReturnType<typeof vi.fn>).mockResolvedValue(
        [],
      );
      (rolesApi.listPermissions as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockPermissions,
      );

      render(<RolesPage />);

      await waitFor(() => {
        expect(screen.getByText('Analyst')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', {
        name: /\+ create role/i,
      });
      await user.click(createButton);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(
          within(dialog).getByRole('checkbox', { name: /view_batches/i }),
        ).toBeInTheDocument();
        expect(
          within(dialog).getByRole('checkbox', { name: /edit_batches/i }),
        ).toBeInTheDocument();
      });
    });

    it('creates new role with name, description, page access, and permissions', async () => {
      const user = userEvent.setup();
      const mockUser = createMockAdminUser();
      const mockRoles = [createMockRole()];
      const mockPermissions = [
        createMockPermission({
          id: 1,
          name: 'view_batches',
          category: 'Batch Management',
        }),
      ];
      const newRole = createMockRole({
        id: 10,
        name: 'Data Reviewer',
        description: 'Read-only access to all data pages',
        permissions: [
          createMockPermission({
            id: 1,
            name: 'view_batches',
            category: 'Batch Management',
          }),
        ],
        allowedPages: ['/', '/batches', '/files', '/validation'],
      });

      (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUser,
      );
      (rolesApi.listRoles as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(mockRoles)
        .mockResolvedValueOnce([...mockRoles, newRole]);
      (rolesApi.getUsersWithRole as ReturnType<typeof vi.fn>).mockResolvedValue(
        [],
      );
      (rolesApi.listPermissions as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockPermissions,
      );
      (rolesApi.createRole as ReturnType<typeof vi.fn>).mockResolvedValue(
        newRole,
      );

      render(<RolesPage />);

      await waitFor(() => {
        expect(screen.getByText('Analyst')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', {
        name: /\+ create role/i,
      });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/role name/i);
      const descInput = screen.getByLabelText(/description/i);
      await user.type(nameInput, 'Data Reviewer');
      await user.type(descInput, 'Read-only access to all data pages');

      const dashboardCheckbox = screen.getByRole('checkbox', {
        name: /dashboard \(\/\)/i,
      });
      await user.click(dashboardCheckbox);

      const permissionCheckbox = screen.getByRole('checkbox', {
        name: /view_batches/i,
      });
      await user.click(permissionCheckbox);

      const saveButton = screen.getByRole('button', { name: /create role/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(rolesApi.createRole).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Data Reviewer',
            description: 'Read-only access to all data pages',
            permissionIds: [1],
            allowedPages: expect.arrayContaining(['/']),
          }),
        );
      });
    }, 15000);
  });

  describe('Create New Role - Validation', () => {
    it('shows error when role name is empty', async () => {
      const user = userEvent.setup();
      const mockUser = createMockAdminUser();
      const mockRoles = [createMockRole()];

      (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUser,
      );
      (rolesApi.listRoles as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockRoles,
      );
      (rolesApi.getUsersWithRole as ReturnType<typeof vi.fn>).mockResolvedValue(
        [],
      );
      (rolesApi.listPermissions as ReturnType<typeof vi.fn>).mockResolvedValue(
        [],
      );

      render(<RolesPage />);

      await waitFor(() => {
        expect(screen.getByText('Analyst')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', {
        name: /\+ create role/i,
      });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /create role/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/role name is required/i)).toBeInTheDocument();
      });

      expect(rolesApi.createRole).not.toHaveBeenCalled();
    });
  });

  describe('Edit Existing Role', () => {
    it('opens Edit Role modal with pre-filled data when Edit Role is clicked', async () => {
      const user = userEvent.setup();
      const mockUser = createMockAdminUser();
      const mockRole = createMockRole();
      const mockPermissions = [
        createMockPermission({ id: 1, name: 'view_batches' }),
        createMockPermission({ id: 2, name: 'edit_batches' }),
      ];

      (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUser,
      );
      (rolesApi.listRoles as ReturnType<typeof vi.fn>).mockResolvedValue([
        mockRole,
      ]);
      (rolesApi.getUsersWithRole as ReturnType<typeof vi.fn>).mockResolvedValue(
        [],
      );
      (rolesApi.listPermissions as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockPermissions,
      );

      render(<RolesPage />);

      await waitFor(() => {
        expect(screen.getByText('Analyst')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit role/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/edit role: analyst/i)).toBeInTheDocument();
        expect(
          screen.getByDisplayValue(
            /data analyst role with access to batch operations/i,
          ),
        ).toBeInTheDocument();
      });
    });

    it('updates role page access and permissions', async () => {
      const user = userEvent.setup();
      const mockUser = createMockAdminUser();
      const mockRole = createMockRole();
      const mockPermissions = mockRole.permissions;

      (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUser,
      );
      (rolesApi.listRoles as ReturnType<typeof vi.fn>).mockResolvedValue([
        mockRole,
      ]);
      (rolesApi.getUsersWithRole as ReturnType<typeof vi.fn>).mockResolvedValue(
        [],
      );
      (rolesApi.listPermissions as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockPermissions,
      );
      (rolesApi.updateRole as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockRole,
      );

      render(<RolesPage />);

      await waitFor(() => {
        expect(screen.getByText('Analyst')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit role/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(rolesApi.updateRole).toHaveBeenCalledWith(
          2,
          expect.objectContaining({
            permissionIds: expect.any(Array),
            allowedPages: expect.any(Array),
          }),
        );
      });
    });
  });

  describe('View Role Permissions Detail', () => {
    it('opens View Permissions modal when View Permissions button is clicked', async () => {
      const user = userEvent.setup();
      const mockUser = createMockAdminUser();
      const mockRole = createMockRole();

      (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUser,
      );
      (rolesApi.listRoles as ReturnType<typeof vi.fn>).mockResolvedValue([
        mockRole,
      ]);
      (rolesApi.getUsersWithRole as ReturnType<typeof vi.fn>).mockResolvedValue(
        [],
      );
      (
        rolesApi.getRoleWithPermissions as ReturnType<typeof vi.fn>
      ).mockResolvedValue(mockRole);

      render(<RolesPage />);

      await waitFor(() => {
        expect(screen.getByText('Analyst')).toBeInTheDocument();
      });

      const viewPermButton = screen.getByRole('button', {
        name: /view permissions/i,
      });
      await user.click(viewPermButton);

      await waitFor(() => {
        const dialogs = screen.getAllByRole('dialog');
        const permDialog = dialogs[dialogs.length - 1];
        expect(within(permDialog).getByText(/analyst/i)).toBeInTheDocument();
        expect(
          within(permDialog).getByText(/permissions breakdown/i),
        ).toBeInTheDocument();
      });
    });

    it('displays permissions grouped by category', async () => {
      const user = userEvent.setup();
      const mockUser = createMockAdminUser();
      const mockRole = createMockRole({
        permissions: [
          createMockPermission({
            id: 1,
            name: 'view_batches',
            description: 'View batch information',
            category: 'Batch Management',
          }),
          createMockPermission({
            id: 2,
            name: 'edit_batches',
            description: 'Edit batch data',
            category: 'Batch Management',
          }),
        ],
      });

      (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUser,
      );
      (rolesApi.listRoles as ReturnType<typeof vi.fn>).mockResolvedValue([
        mockRole,
      ]);
      (rolesApi.getUsersWithRole as ReturnType<typeof vi.fn>).mockResolvedValue(
        [],
      );
      (
        rolesApi.getRoleWithPermissions as ReturnType<typeof vi.fn>
      ).mockResolvedValue(mockRole);

      render(<RolesPage />);

      await waitFor(() => {
        expect(screen.getByText('Analyst')).toBeInTheDocument();
      });

      const viewPermButton = screen.getByRole('button', {
        name: /view permissions/i,
      });
      await user.click(viewPermButton);

      await waitFor(() => {
        const dialogs = screen.getAllByRole('dialog');
        const permDialog = dialogs[dialogs.length - 1];
        expect(
          within(permDialog).getByText(/batch management/i),
        ).toBeInTheDocument();
        expect(
          within(permDialog).getByText(/view_batches/i),
        ).toBeInTheDocument();
        expect(
          within(permDialog).getByText(/view batch information/i),
        ).toBeInTheDocument();
      });
    });

    it('displays state-based access control note', async () => {
      const user = userEvent.setup();
      const mockUser = createMockAdminUser();
      const mockRole = createMockRole();

      (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUser,
      );
      (rolesApi.listRoles as ReturnType<typeof vi.fn>).mockResolvedValue([
        mockRole,
      ]);
      (rolesApi.getUsersWithRole as ReturnType<typeof vi.fn>).mockResolvedValue(
        [],
      );
      (
        rolesApi.getRoleWithPermissions as ReturnType<typeof vi.fn>
      ).mockResolvedValue(mockRole);

      render(<RolesPage />);

      await waitFor(() => {
        expect(screen.getByText('Analyst')).toBeInTheDocument();
      });

      const viewPermButton = screen.getByRole('button', {
        name: /view permissions/i,
      });
      await user.click(viewPermButton);

      await waitFor(() => {
        expect(
          screen.getByText(/state-based access control/i),
        ).toBeInTheDocument();
        expect(screen.getByText(/data preparation phase/i)).toBeInTheDocument();
        expect(screen.getByText(/approval phase/i)).toBeInTheDocument();
      });
    });
  });

  describe('View Assigned Users', () => {
    it('opens View Assigned Users modal with user list', async () => {
      const user = userEvent.setup();
      const mockUser = createMockAdminUser();
      const mockRole = createMockRole();
      const mockUsersWithRole = [
        createMockUserDetail({
          id: 1,
          firstName: 'John',
          lastName: 'Smith',
          displayName: 'John Smith',
        }),
        createMockUserDetail({
          id: 2,
          firstName: 'Mary',
          lastName: 'Jones',
          displayName: 'Mary Jones',
        }),
      ];

      (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUser,
      );
      (rolesApi.listRoles as ReturnType<typeof vi.fn>).mockResolvedValue([
        mockRole,
      ]);
      (rolesApi.getUsersWithRole as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(mockUsersWithRole);

      render(<RolesPage />);

      await waitFor(() => {
        expect(screen.getByText('Analyst')).toBeInTheDocument();
      });

      const viewUsersButton = screen.getByRole('button', {
        name: /view assigned users/i,
      });
      await user.click(viewUsersButton);

      await waitFor(() => {
        const dialogs = screen.getAllByRole('dialog');
        const usersDialog = dialogs[dialogs.length - 1];
        expect(
          within(usersDialog).getByText(/users assigned to analyst/i),
        ).toBeInTheDocument();
        expect(within(usersDialog).getAllByText('John Smith')).toHaveLength(1);
        expect(within(usersDialog).getAllByText('Mary Jones')).toHaveLength(1);
      });
    });
  });

  describe('User Role Assignments Tab', () => {
    it('displays searchable user list when User Role Assignments tab is clicked', async () => {
      const user = userEvent.setup();
      const mockUser = createMockAdminUser();
      const mockRoles = [createMockRole()];
      const mockUsers = {
        items: [
          createMockUserDetail({
            id: 1,
            firstName: 'John',
            lastName: 'Smith',
            displayName: 'John Smith',
          }),
          createMockUserDetail({
            id: 2,
            firstName: 'Mary',
            lastName: 'Jones',
            displayName: 'Mary Jones',
          }),
        ],
        meta: { page: 1, pageSize: 20, totalItems: 2, totalPages: 1 },
      };

      (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUser,
      );
      (rolesApi.listRoles as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockRoles,
      );
      (rolesApi.getUsersWithRole as ReturnType<typeof vi.fn>).mockResolvedValue(
        [],
      );
      (usersApi.listUsers as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUsers,
      );

      render(<RolesPage />);

      await waitFor(() => {
        expect(screen.getByText('Analyst')).toBeInTheDocument();
      });

      const assignmentsTab = screen.getByRole('tab', {
        name: /user role assignments/i,
      });
      await user.click(assignmentsTab);

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
        expect(screen.getByText('Mary Jones')).toBeInTheDocument();
        expect(
          screen.getByRole('textbox', { name: /search/i }),
        ).toBeInTheDocument();
      });
    });

    it('filters users by search query', async () => {
      const user = userEvent.setup();
      const mockUser = createMockAdminUser();
      const mockRoles = [createMockRole()];
      const allUsers = {
        items: [
          createMockUserDetail({ id: 1, displayName: 'John Smith' }),
          createMockUserDetail({ id: 2, displayName: 'Mary Jones' }),
        ],
        meta: { page: 1, pageSize: 20, totalItems: 2, totalPages: 1 },
      };
      const filteredUsers = {
        items: [createMockUserDetail({ id: 2, displayName: 'Mary Jones' })],
        meta: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
      };

      (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUser,
      );
      (rolesApi.listRoles as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockRoles,
      );
      (rolesApi.getUsersWithRole as ReturnType<typeof vi.fn>).mockResolvedValue(
        [],
      );
      (usersApi.listUsers as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(allUsers)
        .mockResolvedValueOnce(filteredUsers);

      render(<RolesPage />);

      await waitFor(() => {
        expect(screen.getByText('Analyst')).toBeInTheDocument();
      });

      const assignmentsTab = screen.getByRole('tab', {
        name: /user role assignments/i,
      });
      await user.click(assignmentsTab);

      await waitFor(() => {
        expect(screen.getAllByText('John Smith')[0]).toBeInTheDocument();
      });

      const searchInput = screen.getByRole('textbox', { name: /search/i });
      await user.type(searchInput, 'mary');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(usersApi.listUsers).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'mary' }),
        );
      });
    });

    it('filters users by role', async () => {
      const user = userEvent.setup();
      const mockUser = createMockAdminUser();
      const mockRoles = [createMockRole()];
      const allUsers = {
        items: [createMockUserDetail()],
        meta: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
      };

      (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUser,
      );
      (rolesApi.listRoles as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockRoles,
      );
      (rolesApi.getUsersWithRole as ReturnType<typeof vi.fn>).mockResolvedValue(
        [],
      );
      (usersApi.listUsers as ReturnType<typeof vi.fn>).mockResolvedValue(
        allUsers,
      );

      render(<RolesPage />);

      await waitFor(() => {
        expect(screen.getByText('Analyst')).toBeInTheDocument();
      });

      const assignmentsTab = screen.getByRole('tab', {
        name: /user role assignments/i,
      });
      await user.click(assignmentsTab);

      await waitFor(() => {
        expect(screen.getAllByText('John Smith')[0]).toBeInTheDocument();
      });

      const roleFilter = screen.getByRole('combobox', {
        name: /filter by role/i,
      });
      await user.click(roleFilter);
      await user.click(screen.getByRole('option', { name: /analyst/i }));

      await waitFor(() => {
        expect(usersApi.listUsers).toHaveBeenCalledWith(
          expect.objectContaining({ roleId: 2 }),
        );
      });
    });
  });

  describe('Modify User Roles', () => {
    it('opens Modify User Roles modal when Modify Roles button is clicked', async () => {
      const user = userEvent.setup();
      const mockUser = createMockAdminUser();
      const mockRoles = [createMockRole()];
      const mockUsers = {
        items: [createMockUserDetail()],
        meta: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
      };
      const currentRoles: Role[] = [
        {
          id: 2,
          name: 'Analyst',
          description: 'Analyst Role',
          isSystemRole: true,
          allowedPages: [],
        },
      ];

      (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUser,
      );
      (rolesApi.listRoles as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockRoles,
      );
      (rolesApi.getUsersWithRole as ReturnType<typeof vi.fn>).mockResolvedValue(
        [],
      );
      (usersApi.listUsers as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUsers,
      );
      (usersApi.getUserRoles as ReturnType<typeof vi.fn>).mockResolvedValue(
        currentRoles,
      );

      render(<RolesPage />);

      await waitFor(() => {
        expect(screen.getByText('Analyst')).toBeInTheDocument();
      });

      const assignmentsTab = screen.getByRole('tab', {
        name: /user role assignments/i,
      });
      await user.click(assignmentsTab);

      await waitFor(() => {
        expect(screen.getAllByText('John Smith')[0]).toBeInTheDocument();
      });

      const modifyButton = screen.getByRole('button', {
        name: /modify roles/i,
      });
      await user.click(modifyButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/modify user roles/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/effective date/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/reason for change/i)).toBeInTheDocument();
      });
    });

    it('updates user roles with effective date and reason', async () => {
      const user = userEvent.setup();
      const mockUser = createMockAdminUser();
      const mockRoles = [createMockRole()];
      const mockUsers = {
        items: [createMockUserDetail()],
        meta: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
      };
      const currentRoles: Role[] = [
        {
          id: 2,
          name: 'Analyst',
          description: 'Analyst Role',
          isSystemRole: true,
          allowedPages: [],
        },
      ];

      (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUser,
      );
      (rolesApi.listRoles as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockRoles,
      );
      (rolesApi.getUsersWithRole as ReturnType<typeof vi.fn>).mockResolvedValue(
        [],
      );
      (usersApi.listUsers as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUsers,
      );
      (usersApi.getUserRoles as ReturnType<typeof vi.fn>).mockResolvedValue(
        currentRoles,
      );
      (usersApi.updateUserRoles as ReturnType<typeof vi.fn>).mockResolvedValue(
        currentRoles,
      );

      render(<RolesPage />);

      await waitFor(() => {
        expect(screen.getByText('Analyst')).toBeInTheDocument();
      });

      const assignmentsTab = screen.getByRole('tab', {
        name: /user role assignments/i,
      });
      await user.click(assignmentsTab);

      await waitFor(() => {
        expect(screen.getAllByText('John Smith')[0]).toBeInTheDocument();
      });

      const modifyButton = screen.getByRole('button', {
        name: /modify roles/i,
      });
      await user.click(modifyButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const effectiveDateInput = screen.getByLabelText(/effective date/i);
      await user.type(effectiveDateInput, '2026-01-06');

      const reasonInput = screen.getByLabelText(/reason for change/i);
      await user.type(reasonInput, 'Promotion to team lead role');

      const saveButton = screen.getByRole('button', {
        name: /save role changes/i,
      });
      await user.click(saveButton);

      await waitFor(() => {
        expect(usersApi.updateUserRoles).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            roleIds: [2],
            effectiveDate: '2026-01-06',
            reason: 'Promotion to team lead role',
          }),
          'admin',
        );
      });
    }, 15000);
  });

  describe('Modify User Roles - Validation', () => {
    it('shows error when no roles are selected', async () => {
      const user = userEvent.setup();
      const mockUser = createMockAdminUser();
      const mockRoles = [createMockRole()];
      const mockUsers = {
        items: [createMockUserDetail()],
        meta: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
      };
      const currentRoles: Role[] = [
        {
          id: 2,
          name: 'Analyst',
          description: 'Analyst Role',
          isSystemRole: true,
          allowedPages: [],
        },
      ];

      (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUser,
      );
      (rolesApi.listRoles as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockRoles,
      );
      (rolesApi.getUsersWithRole as ReturnType<typeof vi.fn>).mockResolvedValue(
        [],
      );
      (usersApi.listUsers as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUsers,
      );
      (usersApi.getUserRoles as ReturnType<typeof vi.fn>).mockResolvedValue(
        currentRoles,
      );

      render(<RolesPage />);

      await waitFor(() => {
        expect(screen.getByText('Analyst')).toBeInTheDocument();
      });

      const assignmentsTab = screen.getByRole('tab', {
        name: /user role assignments/i,
      });
      await user.click(assignmentsTab);

      await waitFor(() => {
        expect(screen.getAllByText('John Smith')[0]).toBeInTheDocument();
      });

      const modifyButton = screen.getByRole('button', {
        name: /modify roles/i,
      });
      await user.click(modifyButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const analystCheckbox = screen.getByRole('checkbox', {
        name: /analyst/i,
      });
      await user.click(analystCheckbox);

      const saveButton = screen.getByRole('button', {
        name: /save role changes/i,
      });
      await user.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText(/at least one role must be assigned/i),
        ).toBeInTheDocument();
      });

      expect(usersApi.updateUserRoles).not.toHaveBeenCalled();
    });

    it('shows error when reason is empty', async () => {
      const user = userEvent.setup();
      const mockUser = createMockAdminUser();
      const mockRoles = [createMockRole()];
      const mockUsers = {
        items: [createMockUserDetail()],
        meta: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
      };
      const currentRoles: Role[] = [
        {
          id: 2,
          name: 'Analyst',
          description: 'Analyst Role',
          isSystemRole: true,
          allowedPages: [],
        },
      ];

      (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUser,
      );
      (rolesApi.listRoles as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockRoles,
      );
      (rolesApi.getUsersWithRole as ReturnType<typeof vi.fn>).mockResolvedValue(
        [],
      );
      (usersApi.listUsers as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUsers,
      );
      (usersApi.getUserRoles as ReturnType<typeof vi.fn>).mockResolvedValue(
        currentRoles,
      );

      render(<RolesPage />);

      await waitFor(() => {
        expect(screen.getByText('Analyst')).toBeInTheDocument();
      });

      const assignmentsTab = screen.getByRole('tab', {
        name: /user role assignments/i,
      });
      await user.click(assignmentsTab);

      await waitFor(() => {
        expect(screen.getAllByText('John Smith')[0]).toBeInTheDocument();
      });

      const modifyButton = screen.getByRole('button', {
        name: /modify roles/i,
      });
      await user.click(modifyButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', {
        name: /save role changes/i,
      });
      await user.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText(/reason for change is required for audit trail/i),
        ).toBeInTheDocument();
      });

      expect(usersApi.updateUserRoles).not.toHaveBeenCalled();
    });
  });

  describe('Segregation of Duties Warning', () => {
    it('shows warning modal when Analyst and Approver L1 roles are selected', async () => {
      const user = userEvent.setup();
      const mockUser = createMockAdminUser();
      const mockRoles = [
        createMockRole({ id: 2, name: 'Analyst' }),
        createMockRole({ id: 3, name: 'ApproverL1' }),
      ];
      const mockUsers = {
        items: [createMockUserDetail()],
        meta: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
      };
      const currentRoles: Role[] = [
        {
          id: 2,
          name: 'Analyst',
          description: 'Analyst Role',
          isSystemRole: true,
          allowedPages: [],
        },
      ];

      (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUser,
      );
      (rolesApi.listRoles as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockRoles,
      );
      (rolesApi.getUsersWithRole as ReturnType<typeof vi.fn>).mockResolvedValue(
        [],
      );
      (usersApi.listUsers as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUsers,
      );
      (usersApi.getUserRoles as ReturnType<typeof vi.fn>).mockResolvedValue(
        currentRoles,
      );

      render(<RolesPage />);

      await waitFor(() => {
        expect(screen.getByText('Analyst')).toBeInTheDocument();
      });

      const assignmentsTab = screen.getByRole('tab', {
        name: /user role assignments/i,
      });
      await user.click(assignmentsTab);

      await waitFor(() => {
        expect(screen.getAllByText('John Smith')[0]).toBeInTheDocument();
      });

      const modifyButton = screen.getByRole('button', {
        name: /modify roles/i,
      });
      await user.click(modifyButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const approverCheckbox = screen.getByRole('checkbox', {
        name: /approver level 1/i,
      });
      await user.click(approverCheckbox);

      const reasonInput = screen.getByLabelText(/reason for change/i);
      await user.type(reasonInput, 'Adding approver role');

      const saveButton = screen.getByRole('button', {
        name: /save role changes/i,
      });
      await user.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText(/segregation of duties violation/i),
        ).toBeInTheDocument();
        expect(
          screen.getByText(/user cannot approve batches they prepared/i),
        ).toBeInTheDocument();
      });
    }, 15000);

    it('displays options for Allow with System Check and Restrict to Single Role', async () => {
      const user = userEvent.setup();
      const mockUser = createMockAdminUser();
      const mockRoles = [
        createMockRole({ id: 2, name: 'Analyst' }),
        createMockRole({ id: 3, name: 'ApproverL1' }),
      ];
      const mockUsers = {
        items: [createMockUserDetail()],
        meta: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
      };
      const currentRoles: Role[] = [
        {
          id: 2,
          name: 'Analyst',
          description: 'Analyst Role',
          isSystemRole: true,
          allowedPages: [],
        },
      ];

      (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUser,
      );
      (rolesApi.listRoles as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockRoles,
      );
      (rolesApi.getUsersWithRole as ReturnType<typeof vi.fn>).mockResolvedValue(
        [],
      );
      (usersApi.listUsers as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUsers,
      );
      (usersApi.getUserRoles as ReturnType<typeof vi.fn>).mockResolvedValue(
        currentRoles,
      );

      render(<RolesPage />);

      await waitFor(() => {
        expect(screen.getByText('Analyst')).toBeInTheDocument();
      });

      const assignmentsTab = screen.getByRole('tab', {
        name: /user role assignments/i,
      });
      await user.click(assignmentsTab);

      await waitFor(() => {
        expect(screen.getAllByText('John Smith')[0]).toBeInTheDocument();
      });

      const modifyButton = screen.getByRole('button', {
        name: /modify roles/i,
      });
      await user.click(modifyButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const approverCheckbox = screen.getByRole('checkbox', {
        name: /approver level 1/i,
      });
      await user.click(approverCheckbox);

      const reasonInput = screen.getByLabelText(/reason for change/i);
      await user.type(reasonInput, 'Adding approver role');

      const saveButton = screen.getByRole('button', {
        name: /save role changes/i,
      });
      await user.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /allow with system check/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /restrict to single role/i }),
        ).toBeInTheDocument();
      });
    }, 15000);

    it('allows role assignment when Allow with System Check is clicked', async () => {
      const user = userEvent.setup();
      const mockUser = createMockAdminUser();
      const mockRoles = [
        createMockRole({ id: 2, name: 'Analyst' }),
        createMockRole({ id: 3, name: 'ApproverL1' }),
      ];
      const mockUsers = {
        items: [createMockUserDetail()],
        meta: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
      };
      const currentRoles: Role[] = [
        {
          id: 2,
          name: 'Analyst',
          description: 'Analyst Role',
          isSystemRole: true,
          allowedPages: [],
        },
      ];

      (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUser,
      );
      (rolesApi.listRoles as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockRoles,
      );
      (rolesApi.getUsersWithRole as ReturnType<typeof vi.fn>).mockResolvedValue(
        [],
      );
      (usersApi.listUsers as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUsers,
      );
      (usersApi.getUserRoles as ReturnType<typeof vi.fn>).mockResolvedValue(
        currentRoles,
      );
      (usersApi.updateUserRoles as ReturnType<typeof vi.fn>).mockResolvedValue([
        ...currentRoles,
        {
          id: 3,
          name: 'ApproverL1',
          description: 'Approver L1 Role',
          isSystemRole: true,
          allowedPages: [],
        },
      ]);

      render(<RolesPage />);

      await waitFor(() => {
        expect(screen.getByText('Analyst')).toBeInTheDocument();
      });

      const assignmentsTab = screen.getByRole('tab', {
        name: /user role assignments/i,
      });
      await user.click(assignmentsTab);

      await waitFor(() => {
        expect(screen.getAllByText('John Smith')[0]).toBeInTheDocument();
      });

      const modifyButton = screen.getByRole('button', {
        name: /modify roles/i,
      });
      await user.click(modifyButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const approverCheckbox = screen.getByRole('checkbox', {
        name: /approver level 1/i,
      });
      await user.click(approverCheckbox);

      const reasonInput = screen.getByLabelText(/reason for change/i);
      await user.type(reasonInput, 'Adding approver role');

      const saveButton = screen.getByRole('button', {
        name: /save role changes/i,
      });
      await user.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /allow with system check/i }),
        ).toBeInTheDocument();
      });

      const allowButton = screen.getByRole('button', {
        name: /allow with system check/i,
      });
      await user.click(allowButton);

      await waitFor(() => {
        expect(usersApi.updateUserRoles).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            roleIds: expect.arrayContaining([2, 3]),
          }),
          'admin',
        );
      });
    }, 15000);
  });

  describe('Permission Conflicts Note', () => {
    it('displays note about most restrictive permission applying', async () => {
      const user = userEvent.setup();
      const mockUser = createMockAdminUser();
      const mockRoles = [createMockRole()];
      const mockUsers = {
        items: [createMockUserDetail()],
        meta: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
      };
      const currentRoles: Role[] = [
        {
          id: 2,
          name: 'Analyst',
          description: 'Analyst Role',
          isSystemRole: true,
          allowedPages: [],
        },
      ];

      (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUser,
      );
      (rolesApi.listRoles as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockRoles,
      );
      (rolesApi.getUsersWithRole as ReturnType<typeof vi.fn>).mockResolvedValue(
        [],
      );
      (usersApi.listUsers as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUsers,
      );
      (usersApi.getUserRoles as ReturnType<typeof vi.fn>).mockResolvedValue(
        currentRoles,
      );

      render(<RolesPage />);

      await waitFor(() => {
        expect(screen.getByText('Analyst')).toBeInTheDocument();
      });

      const assignmentsTab = screen.getByRole('tab', {
        name: /user role assignments/i,
      });
      await user.click(assignmentsTab);

      await waitFor(() => {
        expect(screen.getAllByText('John Smith')[0]).toBeInTheDocument();
      });

      const modifyButton = screen.getByRole('button', {
        name: /modify roles/i,
      });
      await user.click(modifyButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            /most restrictive permission applies when conflicts exist/i,
          ),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Approval Authority Config Tab', () => {
    it('displays approval authority configuration when tab is clicked', async () => {
      const user = userEvent.setup();
      const mockUser = createMockAdminUser();
      const mockRoles = [createMockRole()];
      const mockAuthorities = [
        createMockApprovalAuthority({
          id: 1,
          displayName: 'Sarah Chen',
          approvalLevel: 1,
        }),
      ];
      const mockRules: ApprovalRulesConfig[] = [
        { level: 1, rule: 'any_one' },
        { level: 2, rule: 'specific' },
        { level: 3, rule: 'consensus' },
      ];

      (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUser,
      );
      (rolesApi.listRoles as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockRoles,
      );
      (rolesApi.getUsersWithRole as ReturnType<typeof vi.fn>).mockResolvedValue(
        [],
      );
      (
        approvalAuthorityApi.listApprovalAuthorities as ReturnType<typeof vi.fn>
      ).mockResolvedValue(mockAuthorities);
      (
        approvalAuthorityApi.getApprovalRules as ReturnType<typeof vi.fn>
      ).mockResolvedValue(mockRules);

      render(<RolesPage />);

      await waitFor(() => {
        expect(screen.getByText('Analyst')).toBeInTheDocument();
      });

      const authorityTab = screen.getByRole('tab', {
        name: /approval authority config/i,
      });
      await user.click(authorityTab);

      await waitFor(() => {
        expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /add approver/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /remove selected/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /configure backup approvers/i }),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const mockUser = createMockAdminUser();
      const mockRoles = [createMockRole()];

      (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockUser,
      );
      (rolesApi.listRoles as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockRoles,
      );
      (rolesApi.getUsersWithRole as ReturnType<typeof vi.fn>).mockResolvedValue(
        [],
      );

      const { container } = render(<RolesPage />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
