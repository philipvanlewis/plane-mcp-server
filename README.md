# Plane MCP Server

A comprehensive [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) server for [Plane CE](https://plane.so/) — the open-source project management tool.

**51 tools** covering pages, assets, work items, projects, modules, cycles, labels, states, members, and instance/workspace customization.

## Key Features

- **Rich page editing** — Write in Markdown, auto-converted to Plane-compatible HTML with proper editor classes
- **Image uploads** — 3-step presigned upload flow wrapped in a single tool call
- **Fixed page reads** — Returns readable HTML content (not the raw Yjs CRDT binary)
- **Content append** — Add to existing pages without replacing everything
- **Full CRUD** — Complete management for work items, projects, modules, cycles, labels, and states
- **Comments & activity** — Add comments to issues, view activity history
- **Instance & workspace customization** — Manage instance config, workspace settings, logo uploads, user profiles
- **Dual auth** — v1 API key for public endpoints + session auth for internal APIs (pages, assets, customization)

## Quick Start

### 1. Install

```bash
git clone https://github.com/philipvanlewis/plane-mcp-server.git
cd plane-mcp-server
npm install
npm run build
```

### 2. Configure

Copy `.env.example` to `.env` and fill in your Plane CE details:

```bash
cp .env.example .env
```

```env
PLANE_BASE_URL=http://localhost       # Your Plane CE instance
PLANE_WORKSPACE_SLUG=my-workspace     # Workspace slug from URL
PLANE_API_KEY=plane_api_xxx           # Settings → API Tokens
PLANE_EMAIL=admin@example.com         # Login email
PLANE_PASSWORD=your-password          # Login password
```

### 3. Add to Claude Code

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "plane": {
      "command": "node",
      "args": ["/path/to/plane-mcp-server/dist/index.js"],
      "cwd": "/path/to/plane-mcp-server"
    }
  }
}
```

## Tools (51)

### Pages (9)
| Tool | Description |
|------|-------------|
| `plane-page-list` | List all pages in a project |
| `plane-page-detail` | Get page metadata + readable HTML content |
| `plane-page-get-content` | Get page content with optional class stripping or plain text conversion |
| `plane-page-create` | Create page with optional content in one call (accepts markdown) |
| `plane-page-update` | Update page metadata (title, access) |
| `plane-page-set-content` | Replace page body (markdown auto-converted to Plane HTML) |
| `plane-page-append-content` | Append to existing page without replacing |
| `plane-page-insert-image` | Insert uploaded image asset into page with alignment/caption |
| `plane-page-delete` | Delete a page |

### Assets (2)
| Tool | Description |
|------|-------------|
| `plane-asset-upload` | Upload file from local path or base64 (3-step presigned flow, max 5MB) |
| `plane-asset-delete` | Delete an uploaded asset |

### Work Items (10)
| Tool | Description |
|------|-------------|
| `plane-work-item-list` | List issues with state/priority/assignee/label filters |
| `plane-work-item-detail` | Get full issue details |
| `plane-work-item-create` | Create issue (markdown description, sub-issues, dates) |
| `plane-work-item-update` | Update any issue field |
| `plane-work-item-delete` | Delete an issue |
| `plane-work-item-comment-list` | List all comments on an issue |
| `plane-work-item-comment-add` | Add a comment (accepts markdown) |
| `plane-work-item-link-add` | Add a URL link to an issue |
| `plane-work-item-activity` | Get issue activity history |

### Projects (4)
| Tool | Description |
|------|-------------|
| `plane-project-list` | List all workspace projects |
| `plane-project-detail` | Get project details |
| `plane-project-create` | Create a project |
| `plane-project-update` | Update project settings |

### Modules (5)
| Tool | Description |
|------|-------------|
| `plane-module-list` | List all modules |
| `plane-module-detail` | Get module details |
| `plane-module-create` | Create a module |
| `plane-module-add-issues` | Add issues to a module |
| `plane-module-remove-issue` | Remove an issue from a module |

### Cycles (5)
| Tool | Description |
|------|-------------|
| `plane-cycle-list` | List all cycles (sprints) |
| `plane-cycle-detail` | Get cycle details |
| `plane-cycle-create` | Create a cycle |
| `plane-cycle-add-issues` | Add issues to a cycle |
| `plane-cycle-remove-issue` | Remove an issue from a cycle |

### Customization (8)
| Tool | Description |
|------|-------------|
| `plane-instance-get` | Get instance settings (name, version, edition, domain, auth config) |
| `plane-instance-update` | Update instance name, domain, telemetry |
| `plane-instance-config-get` | Get all 32 instance config keys (auth, SMTP, AI, Unsplash, etc.) |
| `plane-instance-config-update` | Update instance config keys (enable signup, SMTP, AI provider, etc.) |
| `plane-workspace-get` | Get workspace settings (name, slug, logo, org size, timezone) |
| `plane-workspace-update` | Update workspace name, org size, timezone |
| `plane-workspace-logo-upload` | Upload workspace logo via presigned URL flow |
| `plane-user-profile-get` | Get current user profile (display name, avatar, theme) |
| `plane-user-profile-update` | Update display name and theme preferences |

### States (2) · Labels (3) · Members (2) · Utility (1)
| Tool | Description |
|------|-------------|
| `plane-state-list` | List workflow states |
| `plane-state-create` | Create a workflow state |
| `plane-label-list` | List project labels |
| `plane-label-create` | Create a label |
| `plane-label-delete` | Delete a label |
| `plane-member-list` | List project members |
| `plane-workspace-member-list` | List workspace members |
| `plane-auth-status` | Check v1 API + session auth status |

## How Content Formatting Works

When you write content in Markdown, the server automatically:

1. Converts Markdown to HTML using [marked](https://marked.js.org/)
2. Adds Plane's TipTap editor CSS classes (`editor-heading-block`, `editor-paragraph-block`, etc.)
3. Passes the formatted HTML to Plane's API

This means pages render correctly in Plane's editor — headings, paragraphs, code blocks, tables, lists, and blockquotes all display properly.

### Image Embedding

Images use Plane's `<image-component>` custom element:

```
1. Upload:    plane-asset-upload → returns asset_id
2. Embed:     plane-page-insert-image with asset_id → inserts into page
```

The server handles the full presigned upload flow (create record → upload to MinIO/S3 → mark complete) in a single tool call.

### Instance Configuration

The customization tools give full control over the Plane CE instance:

```
Instance settings:  plane-instance-get / plane-instance-update
32 config keys:     plane-instance-config-get / plane-instance-config-update
Workspace branding: plane-workspace-update / plane-workspace-logo-upload
User preferences:   plane-user-profile-get / plane-user-profile-update
```

Config key categories: `AUTHENTICATION`, `GOOGLE`, `GITHUB`, `GITLAB`, `GITEA`, `SMTP`, `AI`, `UNSPLASH`, `WORKSPACE_MANAGEMENT`, `INTERCOM`

## Architecture

```
src/
├── index.ts            # MCP server bootstrap (stdio transport)
├── config.ts           # Zod-validated env config
├── client.ts           # Dual-auth HTTP client (v1 API key + session cookies + presigned uploads)
├── tools/              # 11 tool modules, 51 tools total
│   ├── pages.ts        # Rich page editing with markdown support
│   ├── assets.ts       # Presigned file uploads to MinIO/S3
│   ├── work-items.ts   # Issues + comments + links + activity
│   ├── customization.ts # Instance, workspace, and user profile management
│   ├── projects.ts     # Project CRUD
│   ├── modules.ts      # Module management
│   ├── cycles.ts       # Cycle/sprint management
│   ├── states.ts       # Workflow states
│   ├── labels.ts       # Label management
│   ├── members.ts      # Member queries
│   └── utility.ts      # Auth status diagnostics
└── utils/
    ├── html.ts         # Markdown → Plane HTML + editor class injection
    ├── errors.ts       # Error formatting for MCP responses
    └── logger.ts       # Stderr logger
```

## Known Issues / API Quirks

### Plane v1 API ignores query parameter filters

The `/api/v1/workspaces/{slug}/projects/{id}/issues/` endpoint ignores `?state=`, `?assignees=`, and other query parameter filters — it always returns **all** items regardless of the parameters passed. This is a Plane CE API bug (confirmed on v0.23).

**Impact:** Any automation that needs filtered results (e.g., "get all Todo items assigned to user X") must fetch all items and filter client-side.

**Workaround:** The `plane-work-item-list` tool accepts `state`, `priority`, `assignee`, and `label` filter parameters and applies them client-side after fetching the full list. If you are building your own automation on top of the Plane API, you will need to do the same.

**Discovered:** 2026-03-26, when a scheduled trigger failed to pick up a specific work item because the API returned unfiltered results and the caller trusted the query parameters.

## Requirements

- Node.js 18+
- Plane CE instance (tested with v0.23+)
- API key + admin email/password for full access

## License

MIT
