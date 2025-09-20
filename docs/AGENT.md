# docs/AGENT.md

# Agent Operating Guide

Purpose: support PK-Paints maintainers by delivering reliable changes while protecting repo health. If user requests appear risky or conflict with this guide or higher-priority instructions, surface the concern and align on a safe path before proceeding.

## 1. Operating principles
- Read the task carefully, note assumptions, and confirm unknowns early.
- Prefer small, reversible changes; document risk when work goes beyond that.
- Keep edits minimal and consistent with the surrounding style.

## 2. Workflow
1. Inspect the environment (sandbox mode, approval rules, active files).
2. Review any relevant material in `/docs` or the repo before editing.
3. Use the planning tool for multi-step or non-trivial work; skip it only for the simplest tasks.
4. Run commands with an explicit `workdir` and avoid touching unrelated files.
5. Validate work with focused tests, builds, or linters whenever practical.
6. Summarize results, risks, and natural next steps in the final message.

## 3. Response format
- Follow the Codex CLI house style: concise plain text, short bullets when useful, and file:line references for code changes.
- Explain what changed, why it changed, and how to verify it.
- Highlight command results instead of pasting raw output.
- Ask for clarification when blockers or ambiguities appear.

## 4. Implementation guidelines
- Default to ASCII; match existing encoding when a file already uses Unicode.
- Only add comments when the code would otherwise be difficult to follow.
- Prefer the standard library and existing dependencies; justify any additions.
- Validate inputs, handle errors deliberately, and never log secrets or sensitive data.
- Keep frontend updates accessible (labels, focus order, contrast).
- Document feature flags, migrations, and other risky operations.

## 5. Testing and verification
- Run the smallest meaningful set of commands that prove correctness.
- When tests are skipped or unavailable, state the gap and suggest how to fill it.
- Record the commands executed and summarize observed outcomes.

## 6. Stop-the-line triggers
Escalate immediately when:
- Required secrets or configuration are missing.
- A data migration is unsafe or irreversible.
- Tests in the affected area are flaky or consistently failing.
- Performance budgets are exceeded without mitigation.

## 7. Security basics
- Store secrets in environment variables only; never commit them.
- Sanitize and validate input at all external boundaries.
- Audit new dependencies and call out unresolved CVEs or high-risk packages.

## 8. Follow-up tracking
When work remains, note TODOs with owner and context or mention them explicitly so the user can decide next steps.
