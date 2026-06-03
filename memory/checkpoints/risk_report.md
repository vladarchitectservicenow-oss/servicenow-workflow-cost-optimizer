# Risk Report: servicenow-workflow-cost-optimizer

**Product:** ServiceNow Workflow Cost Optimizer (WCO)
**Scope:** x_snc_wco
**Author:** Vladimir Kapustin
**Date:** 2026-06-03

## Risk Register

### P0 — Critical (Service Unavailable)

| ID | Risk | Probability | Impact | Mitigation |
|----|------|------------|--------|------------|
| R01 | Flow Designer plugin disabled — monthly scan cannot trigger | Low | High | Startup health check in scheduled job; alert to admin |
| R02 | AI Gateway misconfigured — all AI routing fails | Low | Critical | Fallback to direct API calls per platform; config validation on install |
| R03 | x_snc_wco_pricing table empty — zero-cost calculations produce wrong routing | Medium | Critical | Default pricing baked into CostCalculator; startup validation |
| R04 | All external AI platforms unreachable — no routing possible | Low | Critical | Multi-platform design inherently reduces single-vendor risk |

### P1 — High (Degraded Functionality)

| ID | Risk | Probability | Impact | Mitigation |
|----|------|------------|--------|------------|
| R05 | OAuth token expiry during scan — REST endpoints reject requests | Medium | High | Token refresh handling; scan retry with exponential backoff |
| R06 | Batch GlideRecord query exceeds memory — scan crashes on large instances | Medium | High | Chunked queries with `setLimit()`; batch_size configurable |
| R07 | Concurrent scans cause duplicate routing rules | Low | Medium | `setWorkflow(false)` on create; unique constraint on workflow_profile |
| R08 | Pricing data drift — costs change between scans, routing becomes stale | High | Medium | Monthly scan frequency; `rule_expires` field forces refresh |

### P2 — Medium (Usability/Performance)

| ID | Risk | Probability | Impact | Mitigation |
|----|------|------------|--------|------------|
| R09 | 50k+ items scanned — timeout before completion | Medium | Medium | Batch processing with checkpoint/resume; configurable scan ceiling |
| R10 | Unicode in catalog item names breaks JSON export | Low | Medium | `GlideStringUtil.escapeHTML()` sanitization before JSON serialization |
| R11 | Performance Analytics widget times out loading cost dashboard | Low | Low | Materialized pre-computed aggregates in scan_log; lazy-load detail |
| R12 | Multi-instance deployment — pricing table diverges between instances | Medium | Medium | Export/import template for x_snc_wco_pricing; Git-backed config |

### P3 — Low (Cosmetic/Edge)

| ID | Risk | Probability | Impact | Mitigation |
|----|------|------------|--------|------------|
| R13 | Log table x_snc_wco_scan_log grows unbounded | High | Low | Scheduled cleanup job (>90 days); configurable retention |

## Risk Scoring Matrix

| Score | Probability | Impact | Response |
|-------|-------------|--------|----------|
| Critical | High + Critical | P0 | Immediate fix before deploy |
| High | High/Medium + High | P1 | Fix within first sprint |
| Medium | Medium/Low + Medium | P2 | Scheduled for next release |
| Low | Any + Low | P3 | Accept / monitor |

## Residual Risk After Mitigation
All P0 risks are mitigated to P2 or below after implementing default pricing, health checks,
and multi-platform fallback. The highest residual risk is R08 (pricing drift) at P1 —
monthly scan frequency is the best mitigation without real-time pricing feeds.

## Acceptance Criteria
- All P0 risks mitigated (health check, defaults, multi-platform)
- P1 risks documented with monitoring plan
- P2 risks accepted with scheduled remediation dates
- P3 risks accepted as-is with periodic review
