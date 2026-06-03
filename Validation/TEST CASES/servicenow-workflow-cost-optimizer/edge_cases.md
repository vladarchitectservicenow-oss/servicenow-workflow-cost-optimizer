# Edge Cases: servicenow-workflow-cost-optimizer

**Product:** ServiceNow Workflow Cost Optimizer (WCO)
**Scope:** x_snc_wco
**Author:** Vladimir Kapustin
**License:** AGPL-3.0
**Date:** 2026-06-03

## Purpose
Edge case tests cover boundary conditions, unusual inputs, and stress scenarios that may
expose bugs not caught by functional or regression tests.

---

## E01 — Empty Table: Zero Items in Scope
**Scenario:** Instance has no catalog items or incidents configured.  
**Execution:** Run `profiler.profileAll()` on empty instance.  
**Expected:** Function returns gracefully with {profiles_created: 0, message: "No items in scope"}. No exceptions. No ghost records in x_snc_wco_workflow_profile.

---

## E02 — 50,000+ Items: Maximum Scale
**Scenario:** Instance has 50,000+ catalog items. Batch size = 500.  
**Execution:** Run `profiler.profileAll()` with max_items = 50000.  
**Expected:** All 50,000 items profiled within 5 minutes. No memory overflow. Batch checkpoint/resume works — if interrupted at item 25,000, restart continues from checkpoint.

---

## E03 — Null Configuration: Missing System Properties
**Scenario:** System properties x_snc_wco.pricing.default_platform, x_snc_wco.scan.max_items are null/deleted.  
**Execution:** Run routing engine without configured properties.  
**Expected:** Falls back to hardcoded defaults: default_platform = 'now_assist', max_items = 10000. Logs warning: "Using default values — system properties missing". No crash.

---

## E04 — Invalid Pricing: Zero or Negative Costs
**Scenario:** Pricing table has platform with cost_per_1k_tokens = 0 or -1.  
**Execution:** Run cost calculation with invalid pricing.  
**Expected:** Zero cost treated as valid (Now Assist is free). Negative cost raises validation error: {error: "Invalid pricing: cost_per_1k_tokens must be >= 0"}. Platform excluded from comparison.

---

## E05 — Concurrent Scan Race Condition
**Scenario:** Two scheduled job instances triggered simultaneously (clock skew).  
**Execution:** Both instances call `profiler.profileAll()` concurrently.  
**Expected:** First instance acquires lock (scan_in_progress flag on x_snc_wco_scan_log). Second instance detects lock and returns {error: "Scan already in progress by another job", in_progress_since: "<timestamp>"}. No duplicate profiles. No corrupted routing rules.

---

## E06 — Unicode/Special Characters in Item Names
**Scenario:** Catalog item name contains emoji, CJK characters, or special symbols (e.g., "IT サービス要求 🚀").  
**Execution:** Profile item with special chars, export to JSON via GET /report.  
**Expected:** Item name preserved correctly in export. No mojibake. JSON properly escaped with \uXXXX sequences. MD export renders correctly.

---

## E07 — Platform API Timeout
**Scenario:** External AI platform (OpenAI) takes >30s to respond to pricing refresh.  
**Execution:** Trigger pricing refresh with timeout set to 30 seconds.  
**Expected:** Platform marked as "unreachable" in scan_log. Routing excludes timed-out platform for this scan. Previous routing rules for that platform preserved (no data loss). Alert logged: "Platform openai unreachable — using cached pricing".

---

## Execution
```bash
pytest tests/edge/ -v --timeout=300
```

**Pass threshold:** 7/7 must pass. Edge case failures = P2 (do not block deployment but must be triaged).
