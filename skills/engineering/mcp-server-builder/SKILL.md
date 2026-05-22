---
name: mcp-server-builder
description: >-
  Build a Model Context Protocol (MCP) server from an OpenAPI specification,
  database schema, or internal API. Generates tool schemas, request handlers,
  error mapping, and server transport configuration. Enforces type safety,
  input validation, and least-privilege access patterns.
---

## When To Use

- Need to expose an internal REST API to Claude Code, Cursor, or another MCP client.
- Need to build a database query tool for an agent.
- Have an OpenAPI spec and want to convert it to MCP tools.
- User says "build an MCP server" or "let the agent query our API."

Related: `/api-contract-validate` for OpenAPI spec validation; `/prototype` for testing API ergonomics before building.

Do not use this skill for simple single-endpoint wrappers or when the existing API has no formal contract (OpenAPI, proto, or schema). In those cases, define the contract first.

## Core Stance

- MCP is the emerging standard for connecting AI agents to external data sources and tools. Building an MCP server is tedious: JSON schemas for every tool, HTTP-to-tool-call mapping, auth handling, transport management.
- Most attempts result in brittle, under-typed servers that fail silently when the upstream API changes.
- The OpenAPI spec (or DB schema) is the single source of truth — generate everything else from it.

## Research Backing

- **Anthropic (2024)**, *Model Context Protocol specification* — Standardized protocol for agent-tool communication; stdio and SSE transports with JSON-RPC message format.
- **Fielding (2000)**, *Architectural Styles and the Design of Network-based Software Architectures* (REST) — Resource-oriented API design principles applied to tool-to-API mapping.
- **OWASP (2024)**, *API Security Top 10* — Least-privilege access patterns and input validation are critical for API-exposing agent tools.

## Process

1. **Detect source of truth** — `openapi.json`/`openapi.yaml` → REST API. `schema.sql`/`prisma.schema`/`drizzle.config.ts` → Database. `proto` files → gRPC (advanced, warn user). Manual description → require example requests/responses.
2. **Generate tool schemas** — For each endpoint or query pattern, create MCP tool definition with mapped HTTP method and path in description. All query parameters become `inputSchema` properties. Use `minimum`, `maximum`, `pattern`, `enum` from OpenAPI spec. Mark required fields. Never expose internal IDs or admin-only endpoints unless explicitly requested.
3. **Implement handlers** — Validate input against schema using `zod` or `ajv`. Map tool name to HTTP method/path. Inject auth headers from env vars (never hardcoded). Set timeouts (default 10s). Map HTTP errors to MCP codes: 400→invalid_request, 401/403→permission_denied, 404→resource_not_found, 500→internal_error, timeout→timeout.
4. **Configure transport** — Generate both stdio (for local CLI tools, default) and SSE (for remote deployments). Include port, CORS origins, auth middleware config.
5. **Enforce type safety** — Generate TypeScript types from OpenAPI spec using `openapi-typescript`. Handlers must use these types; no `any`.
6. **Apply least-privilege** — Default to read-only (`GET`) tools. Do not generate `POST`/`PUT`/`DELETE` unless explicitly requested. If write tools included, add `MCP_ALLOW_WRITE` confirmation gate.
7. **Validate manifest** — Generate `manifest.json`. Validation script checks: all tools have descriptions, all required env vars documented, no duplicate tool names, all referenced paths exist.
8. **Generate documentation** — `README.md` with install, configure, test, connect instructions for Claude Code and Cursor.

## Operating Rules

- Never hardcode API keys or tokens — all auth from environment variables.
- Never expose admin-only endpoints unless explicitly requested.
- Default to read-only tools; require user to opt into writes.
- Use `zod` or `ajv` for runtime validation — don't trust OpenAPI types at runtime.
- Set timeouts on all handlers; default 10s.

## Output Format

Generate project structure:
```
my-api-mcp/
├── src/
│   ├── index.ts          # Server entry point
│   ├── tools/            # Generated tool handlers
│   ├── types/            # Generated from OpenAPI
│   └── auth.ts           # Auth middleware
├── tests/
│   └── tools.test.ts     # Mock server tests
├── manifest.json
├── package.json
├── tsconfig.json
└── README.md
```

## Example

**User**: "Build an MCP server from our `openapi.yaml` for the user management API."

**Agent**: Reads spec. Detects 3 GET endpoints, 2 POST, 1 DELETE. Generates read-only tools for all 3 GET endpoints by default. Asks: "Include `create_user` (POST) and `delete_user` (DELETE) tools? Requires `MCP_ALLOW_WRITE=true`. Risk: agents could accidentally create or delete users."

**User**: "Read-only for now."

**Agent**: Generates 3 tools (`list_users`, `get_user`, `search_users`) with zod validation, auth injection, error mapping, stdio transport, TypeScript types from `openapi-typescript`.
