---
name: api-contract-validate
description: "Align implementations with OpenAPI/schemas and strict typing to prevent silent contract drift."
---

## When To Use

- When handlers, DTOs, SDK clients, or serializers change alongside an HTTP/JSON API.
- When bumping API versions, introducing pagination/cursors, or changing error handling conventions.
- When multiple clients (web, mobile, partners) consume the same endpoints.
- When adopting or tightening TypeScript strictness that surfaces previously implicit `any` contracts.
- After codegen from OpenAPI/Protobuf/GraphQL—generated types often diverge silently from runtime payloads.

Related: `/regression-check` for contract tests, snapshot tests, and consumer-driven test failures.

Do not use this skill for redesigning an API from scratch unless requested; validate the **current intended** contract and highlight drift.

## Core Stance

- Treat the contract as the product surface for integrators; breaking changes are costly and often silent until production.
- Prefer explicit optional fields and discriminated unions over ambiguous “sometimes present” JSON.
- Errors are part of the contract: shape, codes, and stability matter as much as success payloads.
- Backward compatibility is a set of mechanical rules, not a vibe.

## Research Backing

- **API contract drift in microservices** (industry standard problem) — services evolve independently; without contract tests, producers and consumers diverge at runtime.
- **TypeScript strict mode** — reduces unsound assumptions at compile time when paired with validated boundaries.
- **OpenAPI specification alignment practices** — treat OpenAPI (or equivalent) as the authoritative integration document; code must match it or update it in the same change.

## Process

1. **Locate sources of truth**
   - Find OpenAPI files: `openapi.yaml`, `swagger.json`, `spec/**`, `contracts/**`.
   - Find server routes and serializers: `**/routes/**`, `**/controllers/**`, `**/schemas/**`, `zod`/`typia`/`pydantic` models.
2. **Diff contract vs implementation**
   - Verify paths, methods, query params, headers (auth, versioning), request/response bodies.
   - Check pagination fields: stable cursor/token semantics; `limit` caps; empty page behavior.
3. **Validate error contract consistency**
   - Ensure consistent envelope: problem+json vs custom `{ code, message, details }` — pick one and enforce.
   - Confirm status code mapping is intentional (`409` vs `400`, idempotency conflicts).
4. **Check nullable/optional discipline**
   - JSON `null` vs missing field: document which is allowed; ensure serializers do not collapse distinctions accidentally.
5. **Run contract tests or generators if present**
   - Examples: Dredd, Schemathesis, Prism mock, Pact consumer tests, `openapi-generator` diff review.
6. **Produce a migration note**
   - If breaking changes are required: versioning strategy (`v2` path, header negotiation), rollout window, client update sequence.

## Operating Rules

- Be precise, technical, and critical.
- Do not skip complex areas because they are hard to verify; call out missing contract artifacts as a project risk.
- Prefer evidence from code paths and validation output over intuition.
- Never “fix” drift only in the client while leaving the server contract undocumented.
- If you cannot access all clients, list consumers as unknown risk.
- Breaking changes must include detection: tests, monitoring signals, or compile-time failures—not hope.

## Output Format

Return a markdown report with these exact sections:

- Contract Sources (files, tooling)
- Endpoint / Operation Inventory (changed items highlighted)
- Contract Diffs (intentional vs unintentional)
- Breaking Changes (yes/no + details)
- Compatibility Matrix (producer vs consumers, as known)
- Client Impact Assessment
- Required Follow-ups (tests/docs/versioning)

## Example

### Contract Diffs

- `GET /items` response added `meta.nextCursor` but OpenAPI still marks only `items` — documentation drift.
- `POST /items` now returns `409` on duplicate `clientRequestId`; clients only handled `400/422`.

### Compatibility Matrix

- Web client updated; mobile client unknown — flag as **unverified consumer**.

### Required Follow-ups

- Update `spec/openapi.yaml`; add contract test asserting `409` for replayed idempotency key; notify mobile owners.
