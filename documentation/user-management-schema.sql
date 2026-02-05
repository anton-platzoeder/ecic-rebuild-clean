-- ============================================
-- User Management Tables for InvestInsight
-- Addresses gap identified in reconciliation
-- ============================================

USE [InvestInsight]
GO

-- ============================================
-- User History Table (for temporal versioning)
-- ============================================
CREATE TABLE [dbo].[UserHistory](
    [Id] [int] NOT NULL,
    [Username] [varchar](100) NOT NULL,
    [DisplayName] [varchar](200) NOT NULL,
    [Email] [varchar](200) NULL,
    [IsActive] [bit] NOT NULL,
    [LastChangedUser] [varchar](100) NOT NULL,
    [ValidFrom] [datetime2](7) NOT NULL,
    [ValidTo] [datetime2](7) NOT NULL
) ON [PRIMARY]
GO

-- ============================================
-- User Table (with temporal versioning)
-- ============================================
CREATE TABLE [dbo].[User](
    [Id] [int] IDENTITY(1,1) NOT NULL,
    [Username] [varchar](100) NOT NULL,
    [DisplayName] [varchar](200) NOT NULL,
    [Email] [varchar](200) NULL,
    [IsActive] [bit] NOT NULL CONSTRAINT [DfUserIsActive] DEFAULT (1),
    [LastChangedUser] [varchar](100) NOT NULL,
    [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
    [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
    CONSTRAINT [PkUser] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UcUserUsername] UNIQUE NONCLUSTERED ([Username] ASC),
    PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
) ON [PRIMARY]
WITH (SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[UserHistory]))
GO

-- ============================================
-- Role Table
-- ============================================
CREATE TABLE [dbo].[Role](
    [Id] [int] IDENTITY(1,1) NOT NULL,
    [Name] [varchar](50) NOT NULL,
    [Description] [varchar](500) NULL,
    [IsSystemRole] [bit] NOT NULL CONSTRAINT [DfRoleIsSystemRole] DEFAULT (0),
    CONSTRAINT [PkRole] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UcRoleName] UNIQUE NONCLUSTERED ([Name] ASC)
) ON [PRIMARY]
GO

-- Insert default roles per BRD BR-SEC-002
INSERT INTO [dbo].[Role] ([Name], [Description], [IsSystemRole]) VALUES
('OperationsLead', 'Full data entry, file management, workflow orchestration', 1),
('Analyst', 'Data correction and maintenance, commentary', 1),
('ApproverL1', 'Operations level approval - data completeness verification', 1),
('ApproverL2', 'Portfolio Manager level approval - holdings reasonableness', 1),
('ApproverL3', 'Executive level approval - final sign-off', 1),
('Administrator', 'User management, configuration, audit access', 1),
('ReadOnly', 'View access for reporting and analysis', 1)
GO

-- ============================================
-- Permission Table
-- ============================================
CREATE TABLE [dbo].[Permission](
    [Id] [int] IDENTITY(1,1) NOT NULL,
    [Name] [varchar](100) NOT NULL,
    [Description] [varchar](500) NULL,
    [Category] [varchar](50) NOT NULL,
    CONSTRAINT [PkPermission] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UcPermissionName] UNIQUE NONCLUSTERED ([Name] ASC)
) ON [PRIMARY]
GO

-- Insert default permissions
INSERT INTO [dbo].[Permission] ([Name], [Description], [Category]) VALUES
-- Batch Management
('batch.create', 'Create new report batches', 'Batch'),
('batch.view', 'View report batches', 'Batch'),
('batch.confirm', 'Confirm data preparation complete', 'Batch'),

-- File Management
('file.upload', 'Upload files manually', 'File'),
('file.view', 'View file status', 'File'),
('file.retry', 'Retry failed file imports', 'File'),

-- Master Data
('instrument.create', 'Create instruments', 'MasterData'),
('instrument.update', 'Update instruments', 'MasterData'),
('instrument.view', 'View instruments', 'MasterData'),

('portfolio.create', 'Create portfolios', 'MasterData'),
('portfolio.update', 'Update portfolios', 'MasterData'),
('portfolio.view', 'View portfolios', 'MasterData'),

('indexPrice.create', 'Create/update index prices', 'MasterData'),
('indexPrice.view', 'View index prices', 'MasterData'),

('duration.create', 'Create/update instrument durations', 'MasterData'),
('duration.view', 'View instrument durations', 'MasterData'),

('beta.create', 'Create/update instrument betas', 'MasterData'),
('beta.view', 'View instrument betas', 'MasterData'),

('creditRating.update', 'Update credit ratings', 'MasterData'),
('creditRating.view', 'View credit ratings', 'MasterData'),

('customHolding.create', 'Create custom holdings', 'MasterData'),
('customHolding.view', 'View holdings', 'MasterData'),

-- Reference Data
('referenceData.manage', 'Manage reference data (currencies, countries, etc.)', 'ReferenceData'),
('referenceData.view', 'View reference data', 'ReferenceData'),

-- Approvals
('approval.level1', 'Approve/reject at Level 1 (Operations)', 'Approval'),
('approval.level2', 'Approve/reject at Level 2 (Portfolio Manager)', 'Approval'),
('approval.level3', 'Approve/reject at Level 3 (Executive)', 'Approval'),
('approval.view', 'View approval status and history', 'Approval'),

-- Comments
('comment.create', 'Add report comments', 'Comment'),
('comment.view', 'View report comments', 'Comment'),

-- Administration
('user.manage', 'Create, update, deactivate users', 'Admin'),
('user.view', 'View user list', 'Admin'),
('role.manage', 'Manage role assignments', 'Admin'),
('approvalAuthority.manage', 'Configure approval authorities', 'Admin'),

-- Audit
('audit.view', 'View audit trails', 'Audit'),
('audit.export', 'Export audit data', 'Audit')
GO

-- ============================================
-- RolePermission Table (Many-to-Many)
-- ============================================
CREATE TABLE [dbo].[RolePermission](
    [RoleId] [int] NOT NULL,
    [PermissionId] [int] NOT NULL,
    CONSTRAINT [PkRolePermission] PRIMARY KEY CLUSTERED ([RoleId] ASC, [PermissionId] ASC),
    CONSTRAINT [FkRolePermissionRole] FOREIGN KEY ([RoleId]) REFERENCES [dbo].[Role]([Id]),
    CONSTRAINT [FkRolePermissionPermission] FOREIGN KEY ([PermissionId]) REFERENCES [dbo].[Permission]([Id])
) ON [PRIMARY]
GO

-- Assign permissions to roles
-- OperationsLead: Full data entry, file management, workflow orchestration
INSERT INTO [dbo].[RolePermission] ([RoleId], [PermissionId])
SELECT r.Id, p.Id FROM [dbo].[Role] r, [dbo].[Permission] p
WHERE r.Name = 'OperationsLead' AND p.Name IN (
    'batch.create', 'batch.view', 'batch.confirm',
    'file.upload', 'file.view', 'file.retry',
    'instrument.create', 'instrument.update', 'instrument.view',
    'portfolio.create', 'portfolio.update', 'portfolio.view',
    'indexPrice.create', 'indexPrice.view',
    'duration.create', 'duration.view',
    'beta.create', 'beta.view',
    'creditRating.update', 'creditRating.view',
    'customHolding.create', 'customHolding.view',
    'referenceData.view',
    'approval.view',
    'comment.create', 'comment.view',
    'audit.view'
)
GO

-- Analyst: Data correction and maintenance, commentary
INSERT INTO [dbo].[RolePermission] ([RoleId], [PermissionId])
SELECT r.Id, p.Id FROM [dbo].[Role] r, [dbo].[Permission] p
WHERE r.Name = 'Analyst' AND p.Name IN (
    'batch.view',
    'file.view',
    'instrument.update', 'instrument.view',
    'portfolio.view',
    'indexPrice.create', 'indexPrice.view',
    'duration.create', 'duration.view',
    'beta.create', 'beta.view',
    'creditRating.update', 'creditRating.view',
    'customHolding.create', 'customHolding.view',
    'referenceData.view',
    'approval.view',
    'comment.create', 'comment.view',
    'audit.view'
)
GO

-- ApproverL1: Operations level approval
INSERT INTO [dbo].[RolePermission] ([RoleId], [PermissionId])
SELECT r.Id, p.Id FROM [dbo].[Role] r, [dbo].[Permission] p
WHERE r.Name = 'ApproverL1' AND p.Name IN (
    'batch.view',
    'file.view',
    'instrument.view',
    'portfolio.view',
    'indexPrice.view',
    'duration.view',
    'beta.view',
    'creditRating.view',
    'customHolding.view',
    'referenceData.view',
    'approval.level1', 'approval.view',
    'comment.view',
    'audit.view'
)
GO

-- ApproverL2: Portfolio Manager level approval
INSERT INTO [dbo].[RolePermission] ([RoleId], [PermissionId])
SELECT r.Id, p.Id FROM [dbo].[Role] r, [dbo].[Permission] p
WHERE r.Name = 'ApproverL2' AND p.Name IN (
    'batch.view',
    'file.view',
    'instrument.view',
    'portfolio.view',
    'indexPrice.view',
    'duration.view',
    'beta.view',
    'creditRating.view',
    'customHolding.view',
    'referenceData.view',
    'approval.level2', 'approval.view',
    'comment.view',
    'audit.view'
)
GO

-- ApproverL3: Executive level approval
INSERT INTO [dbo].[RolePermission] ([RoleId], [PermissionId])
SELECT r.Id, p.Id FROM [dbo].[Role] r, [dbo].[Permission] p
WHERE r.Name = 'ApproverL3' AND p.Name IN (
    'batch.view',
    'file.view',
    'instrument.view',
    'portfolio.view',
    'indexPrice.view',
    'duration.view',
    'beta.view',
    'creditRating.view',
    'customHolding.view',
    'referenceData.view',
    'approval.level3', 'approval.view',
    'comment.view',
    'audit.view'
)
GO

-- Administrator: Full admin access
INSERT INTO [dbo].[RolePermission] ([RoleId], [PermissionId])
SELECT r.Id, p.Id FROM [dbo].[Role] r, [dbo].[Permission] p
WHERE r.Name = 'Administrator' AND p.Name IN (
    'batch.view',
    'file.view',
    'instrument.view',
    'portfolio.view',
    'indexPrice.view',
    'duration.view',
    'beta.view',
    'creditRating.view',
    'customHolding.view',
    'referenceData.manage', 'referenceData.view',
    'approval.view',
    'comment.view',
    'user.manage', 'user.view',
    'role.manage',
    'approvalAuthority.manage',
    'audit.view', 'audit.export'
)
GO

-- ReadOnly: View access only
INSERT INTO [dbo].[RolePermission] ([RoleId], [PermissionId])
SELECT r.Id, p.Id FROM [dbo].[Role] r, [dbo].[Permission] p
WHERE r.Name = 'ReadOnly' AND p.Name IN (
    'batch.view',
    'file.view',
    'instrument.view',
    'portfolio.view',
    'indexPrice.view',
    'duration.view',
    'beta.view',
    'creditRating.view',
    'customHolding.view',
    'referenceData.view',
    'approval.view',
    'comment.view'
)
GO

-- ============================================
-- UserRole Table (Many-to-Many)
-- ============================================
CREATE TABLE [dbo].[UserRole](
    [Id] [int] IDENTITY(1,1) NOT NULL,
    [UserId] [int] NOT NULL,
    [RoleId] [int] NOT NULL,
    [AssignedBy] [varchar](100) NOT NULL,
    [AssignedAt] [datetime2](7) NOT NULL CONSTRAINT [DfUserRoleAssignedAt] DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [PkUserRole] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [UcUserRole] UNIQUE NONCLUSTERED ([UserId] ASC, [RoleId] ASC),
    CONSTRAINT [FkUserRoleUser] FOREIGN KEY ([UserId]) REFERENCES [dbo].[User]([Id]),
    CONSTRAINT [FkUserRoleRole] FOREIGN KEY ([RoleId]) REFERENCES [dbo].[Role]([Id])
) ON [PRIMARY]
GO

-- ============================================
-- ApprovalAuthority Table
-- Configures who can approve at each level
-- Per BR-SEC-003
-- ============================================
CREATE TABLE [dbo].[ApprovalAuthority](
    [Id] [int] IDENTITY(1,1) NOT NULL,
    [UserId] [int] NOT NULL,
    [ApprovalLevel] [int] NOT NULL,  -- 1, 2, or 3
    [IsBackup] [bit] NOT NULL CONSTRAINT [DfApprovalAuthorityIsBackup] DEFAULT (0),
    [IsActive] [bit] NOT NULL CONSTRAINT [DfApprovalAuthorityIsActive] DEFAULT (1),
    [EffectiveFrom] [date] NOT NULL,
    [EffectiveTo] [date] NULL,
    [AssignedBy] [varchar](100) NOT NULL,
    [AssignedAt] [datetime2](7) NOT NULL CONSTRAINT [DfApprovalAuthorityAssignedAt] DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [PkApprovalAuthority] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FkApprovalAuthorityUser] FOREIGN KEY ([UserId]) REFERENCES [dbo].[User]([Id]),
    CONSTRAINT [CkApprovalAuthorityLevel] CHECK ([ApprovalLevel] IN (1, 2, 3))
) ON [PRIMARY]
GO

-- Index for querying active approvers by level
CREATE NONCLUSTERED INDEX [IxApprovalAuthorityLevel]
ON [dbo].[ApprovalAuthority] ([ApprovalLevel], [IsActive])
INCLUDE ([UserId], [IsBackup])
GO

-- ============================================
-- UserLoginLog Table
-- Tracks login attempts per BR-AUD-004
-- ============================================
CREATE TABLE [dbo].[UserLoginLog](
    [Id] [bigint] IDENTITY(1,1) NOT NULL,
    [Username] [varchar](100) NOT NULL,
    [UserId] [int] NULL,  -- NULL if user doesn't exist
    [IsSuccessful] [bit] NOT NULL,
    [IpAddress] [varchar](50) NULL,
    [UserAgent] [varchar](500) NULL,
    [FailureReason] [varchar](200) NULL,
    [Timestamp] [datetime2](7) NOT NULL CONSTRAINT [DfUserLoginLogTimestamp] DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [PkUserLoginLog] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY]
GO

-- Index for security audits
CREATE NONCLUSTERED INDEX [IxUserLoginLogUsername]
ON [dbo].[UserLoginLog] ([Username], [Timestamp] DESC)
GO

CREATE NONCLUSTERED INDEX [IxUserLoginLogFailed]
ON [dbo].[UserLoginLog] ([IsSuccessful], [Timestamp] DESC)
WHERE [IsSuccessful] = 0
GO

-- ============================================
-- UserActivityLog Table
-- Tracks user actions per BR-AUD-004
-- ============================================
CREATE TABLE [dbo].[UserActivityLog](
    [Id] [bigint] IDENTITY(1,1) NOT NULL,
    [UserId] [int] NOT NULL,
    [Username] [varchar](100) NOT NULL,
    [Action] [varchar](100) NOT NULL,
    [EntityType] [varchar](50) NULL,
    [EntityId] [int] NULL,
    [Details] [nvarchar](max) NULL,
    [IpAddress] [varchar](50) NULL,
    [Timestamp] [datetime2](7) NOT NULL CONSTRAINT [DfUserActivityLogTimestamp] DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT [PkUserActivityLog] PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY]
GO

-- Index for activity queries
CREATE NONCLUSTERED INDEX [IxUserActivityLogUser]
ON [dbo].[UserActivityLog] ([UserId], [Timestamp] DESC)
GO

CREATE NONCLUSTERED INDEX [IxUserActivityLogEntity]
ON [dbo].[UserActivityLog] ([EntityType], [EntityId], [Timestamp] DESC)
GO

-- ============================================
-- View: Active Users with Roles
-- ============================================
CREATE VIEW [dbo].[vwUserWithRoles]
AS
SELECT
    u.Id AS UserId,
    u.Username,
    u.DisplayName,
    u.Email,
    u.IsActive,
    STRING_AGG(r.Name, ', ') WITHIN GROUP (ORDER BY r.Name) AS Roles
FROM [dbo].[User] u
LEFT JOIN [dbo].[UserRole] ur ON u.Id = ur.UserId
LEFT JOIN [dbo].[Role] r ON ur.RoleId = r.Id
GROUP BY u.Id, u.Username, u.DisplayName, u.Email, u.IsActive
GO

-- ============================================
-- View: Current Approval Authorities
-- ============================================
CREATE VIEW [dbo].[vwActiveApprovalAuthority]
AS
SELECT
    aa.Id,
    aa.ApprovalLevel,
    aa.IsBackup,
    u.Id AS UserId,
    u.Username,
    u.DisplayName,
    u.Email
FROM [dbo].[ApprovalAuthority] aa
INNER JOIN [dbo].[User] u ON aa.UserId = u.Id
WHERE aa.IsActive = 1
  AND u.IsActive = 1
  AND aa.EffectiveFrom <= CAST(GETDATE() AS DATE)
  AND (aa.EffectiveTo IS NULL OR aa.EffectiveTo >= CAST(GETDATE() AS DATE))
GO

PRINT 'User management tables created successfully.'
GO
