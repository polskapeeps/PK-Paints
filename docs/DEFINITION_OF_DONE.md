# Definition of Done

A change is "Done" only if:
- Acceptance criteria are met and proven by tests or a runnable example.
- Lint, format, and type checks pass.
- Unit coverage >= 80% on new or changed lines; critical paths covered.
- At least one integration path proves the main workflow.
- Performance stays within the documented budget (p95 latency/memory) or is measured and justified.
- Security: inputs validated; no secrets logged; no new HIGH or CRITICAL vulnerabilities.
- Observability: structured logs, basic metrics, trace notes as needed.
- Docs updated (README, CHANGELOG, ADR if applicable).
- Feature flags and rollback steps documented when the change is risky.
