# Changelog

## [0.2.0] - 2026-03-31

### Added
- **Workspace invitations** — Invite users by email with role assignment (`plane-workspace-invite`)
- **Invitation management** — List and revoke pending invitations (`plane-workspace-invitation-list`, `plane-workspace-invitation-delete`)
- **Project member management** — Add existing workspace members to projects with role control (`plane-project-member-add`)
- **Project member removal** — Remove members from projects (`plane-project-member-remove`)
- `form-data` dependency for multipart upload support

### Changed
- Tool count: 51 → 56
- Updated README badges and tool table

## [0.1.0] - 2026-03-25

### Added
- Initial release with 51 tools
- Pages: create, read, update, delete, append, set content, insert images
- Assets: upload, delete with presigned URL flow
- Work items: full CRUD, comments, activity, links
- Projects, modules, cycles, labels, states management
- Instance and workspace customization
- Dual auth: v1 API key + session cookie for internal APIs
- Markdown-to-HTML auto-conversion for pages
