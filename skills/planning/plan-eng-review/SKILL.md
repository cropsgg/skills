---
name: plan-eng-review
description: "Lock architecture, data flow, edge cases, and test coverage before implementation."
---

## When To Use

- After product direction is set (`/requirements-grill`, `/plan-ceo-review`) and before coding.
- When a plan touches multiple services, databases, or async boundaries.
- When the user asks for architecture review, technical review, or "lock the plan."
- Before large refactors or migrations.

Related: `/plan-ceo-review` for product scope; `/database-review` when migrations are central; `/rollback-plan` for irreversible changes.

Do not use this skill for single-file typo fixes or plans with no behavioral change.

## Core Stance

- Diagrams expose hidden assumptions — require at least one diagram (sequence, component, or data flow).
- Every external call needs timeout, retry policy, and failure behavior stated.
- Edge cases are not optional appendix items — they are part of the plan.
- Test matrix maps behaviors to test types (unit/integration/e2e).

## Research Backing

- **Beyer et al. (Google, 2016)**, *Site Reliability Engineering* — design for operability and explicit failure modes.
- **Fielding (2000)**, REST architectural constraints — boundaries and statelessness for API design review.
- **OWASP ASVS** — verification levels for security-relevant architecture decisions.

## Process

1. **Restate requirements** as testable acceptance criteria.
2. **Component diagram**
   - Boxes: services, stores, queues, third parties; arrows: sync/async calls.
3. **Data flow**
   - Critical path step-by-step; note PII, auth checks, idempotency keys.
4. **Sequence diagram** for the riskiest interaction (payment, publish, delete).
5. **Edge case matrix**

   | Scenario | Expected behavior | Test type |
   |----------|-------------------|-----------|

6. **Migration / rollout** (if applicable)
   - Backfill, feature flags, rollback trigger.
7. **Test plan**
   - List tests to add before merge; mark existing coverage gaps.
8. **Open technical risks** with mitigations.

## Operating Rules

- Be opinionated — recommend one approach when alternatives are close.
- Flag scope creep into the plan that belongs in `/plan-ceo-review`.
- Use mermaid in markdown for diagrams when helpful.
- Do not write production code during review unless user asks to proceed.

## Output Format

Return a markdown report with these exact sections:

- Acceptance Criteria
- Architecture Summary
- Diagrams (component + sequence or data flow)
- Edge Case Matrix
- Security and Trust Boundaries
- Test Plan
- Rollout and Rollback Notes
- Technical Risks
- Go / No-Go Recommendation

## Example

### Go / No-Go Recommendation

**Go** with condition: add idempotency key on webhook handler before implementing retry logic.

### Technical Risks

- Duplicate webhook delivery without idempotency → double charge (mitigate: store event ID unique index).
