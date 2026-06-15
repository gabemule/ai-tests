# ADR 013 — Managed-first positioning

**Status:** Accepted · 2026-06-14

## Context

With the no-markup / routing-spread model (ADR 009, ADR 014), every Managed message earns the spread,
and pricing is directly comparable to bundled competitors via TCO. Every BYOK tenant, by contrast, is
a tenant where we earn **$0 on tokens** *and* who can deduce our margin (`PRICING.md` §1.4).

## Decision

- **Managed is the default/recommended mode on every tier — including Free.** It's where the routing
  spread (~85%, ADR 014) is earned, across the whole ladder. Free runs on the economy tier with a
  small included starter balance + hard wallet cap (`PRICING.md` §6.2).
- **BYOK is not a self-serve option** on the paid ladder — it's the **Enterprise-only paid add-on**
  (ADR 009; `PRICING.md` §4.3), sold on governance, never as cost-saving.
- Default onboarding steers to Managed.

## Consequences

- Margin exists across the whole ladder (Free → Enterprise), not just from Pro up.
- Marketing copy sells Managed on **convenience + predictable price**, never "no markup"
  (`PRICING.md` §1.4).
