# Regression Cases: servicenow-workflow-cost-optimizer

**Product:** ServiceNow Workflow Cost Optimizer (WCO)
**Scope:** x_snc_wco
**Author:** Vladimir Kapustin
**License:** AGPL-3.0
**Date:** 2026-06-03

## Purpose
Regression cases verify that changes to the codebase do not break existing functionality.
These tests must pass before any release or PR merge.

---

## R01 — Idempotent Routing
**Risk Area:** RoutingEngine consistency  
**Steps:**
1. Call `routing.generateOptimalRouting(profileSysId)` twice with same profile
2. Compare both results

**Expected:** Both calls return identical platform recommendation, cost figures, and rule sys_id (no duplicate). No re-creation of existing routing rules.

---

## R02 — Pricing Update Propagation
**Risk Area:** CostCalculator accuracy after config change  
**Steps:**
1. Run cost calculation with openai = $0.03/1K
2. Update pricing to openai = $0.05/1K
3. Re-run cost calculation
4. Compare results

**Expected:** Updated calculation reflects new pricing. Old routing rules flagged for refresh (rule_expires triggered). No stale cached costs.

---

## R03 — Profile Re-profiling After Item Change
**Risk Area:** WorkflowProfiler consistency  
**Steps:**
1. Profile a catalog item (volume = 1000/month)
2. Increase item usage volume (simulate time passing)
3. Re-profile the item
4. Compare old and new profiles

**Expected:** New profile reflects updated volume. Old profile record updated (not duplicated). complexity_score recalculated.

---

## R04 — Role Permissions After Upgrade
**Risk Area:** ACL integrity across version upgrades  
**Steps:**
1. Assign x_snc_wco.viewer role to test user
2. Attempt CRUD operations on x_snc_wco_workflow_profile
3. Upgrade scoped app to new version
4. Re-test same CRUD operations

**Expected:** Viewer can read after upgrade (no regression). Viewer still cannot create/write/delete. ACLs unchanged by upgrade process.

---

## R05 — Scan Log Integrity Across Runs
**Risk Area:** Scheduled job data consistency  
**Steps:**
1. Run monthly scan (creates scan_log record, routing rules)
2. Run second scan without changes
3. Compare scan logs

**Expected:** Second scan log shows items_scanned same as first. savings_identified = 0 (no changes). No orphaned routing rules from previous scan. Old rules updated in-place, not duplicated.

---

## R06 — REST API Response Format Consistency
**Risk Area:** API contract stability  
**Steps:**
1. Call POST /optimize and GET /report in Utah instance
2. Call same endpoints in Australia instance
3. Compare response JSON schemas

**Expected:** Both instances return identical JSON structure. Same keys, same types. No version-dependent field additions/removals. Schema validates against jsonschema definition.

---

## R07 — Multi-Platform Pricing Parity
**Risk Area:** Cost calculation across all configured platforms  
**Steps:**
1. Add 6 platforms to pricing table (Now Assist, OpenAI, Azure, Bedrock, Vertex, Anthropic)
2. Run cost comparison for a single profile
3. Verify all 6 platforms appear in results

**Expected:** All 6 platforms present in comparison output. Costs correctly calculated per platform's pricing model. No platform silently dropped.

---

## R08 — Token Refresh Resilience
**Risk Area:** OAuth token lifecycle  
**Steps:**
1. Authenticate with a token expiring in 60 seconds
2. Trigger a scan that takes >60 seconds
3. Check if scan completes with refreshed token

**Expected:** Token refresh happens mid-scan without interruption. Scan completes successfully. No 401 errors in scan_log.

---

## R09 — Data Export Format Stability
**Risk Area:** Report export consistency  
**Steps:**
1. Generate report via GET /report
2. Export to JSON, CSV, and MD formats
3. Run diffs across 3 consecutive scans with identical data

**Expected:** All 3 formats produce identical output across runs. No timestamp noise in export. JSON structure stable, CSV columns consistent, MD table format unchanged.

---

## Execution
```bash
pytest tests/regression/ -v --tb=long
```

**Pass threshold:** 9/9 must pass. Any regression failure = BLOCKED deployment.
