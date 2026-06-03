# Test Suite SOP: servicenow-workflow-cost-optimizer

**Product:** ServiceNow Workflow Cost Optimizer (WCO)
**Scope:** x_snc_wco
**Author:** Vladimir Kapustin
**License:** AGPL-3.0
**Version:** 2.0
**Date:** 2026-06-03

## Purpose
This document defines the complete test suite for the ServiceNow Workflow Cost Optimizer scoped application.
All scenarios include setup, execution steps, expected results, and pass/fail criteria.

---

## Test Scenarios

### T01 — Workflow Profiler: Single Catalog Item
**Priority:** P0 | **Type:** Functional | **Estimated:** <5s

**Setup:**
- 1 catalog item exists in sc_cat_item table
- Pricing table x_snc_wco_pricing has records for now_assist, openai, azure_openai

**Steps:**
1. Instantiate `new x_snc_wco.WorkflowProfiler()`
2. Call `profiler.profileItem(catalogItemSysId)`
3. Check x_snc_wco_workflow_profile for new record

**Expected:**
- Profile record created with item_sys_id = input
- volume_per_month populated from request history
- complexity_score between 0-100
- data_sensitivity set (low/medium/high)
- channel_affinity set (virtual_agent/chat/email/portal)

**Pass Criteria:** Profile record exists with all fields populated, no nulls.

---

### T02 — Workflow Profiler: Profile All (Batch)
**Priority:** P0 | **Type:** Functional | **Estimated:** <10s

**Setup:**
- 50 catalog items + 30 incident categories in scope
- Pricing table populated

**Steps:**
1. Call `profiler.profileAll()`
2. Query x_snc_wco_workflow_profile for record count

**Expected:**
- 80 profiles created (one per item/category)
- No duplicates (unique constraint on item_sys_id)
- Batch completes within 10 seconds

**Pass Criteria:** 80 profiles created, no duplicates, execution time <10s.

---

### T03 — CostCalculator: Single Platform
**Priority:** P0 | **Type:** Unit | **Estimated:** <1s

**Setup:**
- Pricing table: openai = $0.03/1K tokens, latency 200ms
- Profile with avg_tokens = 5000, volume_per_month = 10000

**Steps:**
1. Instantiate `new x_snc_wco.CostCalculator()`
2. Call `calculator.calculatePlatformCost(profileSysId, 'openai')`

**Expected:**
- Per-call cost: (5000/1000) * 0.03 = $0.15
- Monthly cost: $0.15 * 10000 = $1500.00
- Annual cost: $1500.00 * 12 = $18,000.00

**Pass Criteria:** All three cost figures match expected values to 2 decimal places.

---

### T04 — CostCalculator: Multi-Platform Comparison
**Priority:** P0 | **Type:** Unit | **Estimated:** <1s

**Setup:**
- Pricing: now_assist=$0.00, openai=$0.03, azure=$0.025, bedrock=$0.02
- Profile: 5000 avg_tokens, 10000 volume

**Steps:**
1. Call `calculator.compareAllPlatforms(profileSysId)`
2. Check sorted results

**Expected:**
- Returned array sorted by monthly cost ascending
- now_assist: $0.00 (cheapest)
- bedrock: $833.33
- azure: $1,041.67
- openai: $1,500.00 (most expensive)

**Pass Criteria:** Results sorted correctly, all platforms present, costs accurate.

---

### T05 — RoutingEngine: Constraint Satisfaction
**Priority:** P0 | **Type:** Functional | **Estimated:** <5s

**Setup:**
- Profile with data_sensitivity = high (requires compliance_tier = fedramp_high)
- Pricing: openai (fedramp_high), azure (soc2), bedrock (fedramp_high)
- Budget constraint: $500/month

**Steps:**
1. Call `routing.generateOptimalRouting(profileSysId, {budget: 500})`
2. Check recommended platform
3. Verify compliance constraint respected

**Expected:**
- azure excluded (soc2 != fedramp_high)
- openai vs bedrock compared
- Recommended platform is cheapest fedramp_high option
- Routing rule created in x_snc_wco_routing_rule

**Pass Criteria:** Compliance constraint respected, budget not exceeded, rule created.

---

### T06 — RoutingEngine: Budget Exceeded
**Priority:** P1 | **Type:** Edge/Error | **Estimated:** <5s

**Setup:**
- Profile: 100000 avg_tokens, 50000 volume → high cost
- Budget: $100/month (unrealistically low)
- All platforms cost >$100/month

**Steps:**
1. Call `routing.generateOptimalRouting(profileSysId, {budget: 100})`
2. Check response

**Expected:**
- Function returns error object: {error: true, message: "Budget constraint cannot be satisfied"}
- No routing rule created
- Log entry in x_snc_wco_scan_log with severity = warn

**Pass Criteria:** Error returned, no routing rule, log entry created.

---

### T07 — REST API: POST /optimize
**Priority:** P0 | **Type:** Integration | **Estimated:** <5s

**Setup:**
- Valid profile exists in x_snc_wco_workflow_profile
- Authenticated session

**Steps:**
1. POST to /api/x_snc_wco/v1/optimize with body: {"profile_sys_id": "<valid>"}
2. Check HTTP status and response body

**Expected:**
- HTTP 200
- Response contains: {recommended_platform, monthly_cost, annual_savings, routing_rule_sys_id}
- estimated_monthly_cost > 0
- Content-Type: application/json

**Pass Criteria:** HTTP 200, valid JSON response, all fields present.

---

### T08 — REST API: GET /report
**Priority:** P1 | **Type:** Integration | **Estimated:** <5s

**Setup:**
- At least one completed scan exists in x_snc_wco_scan_log
- Authenticated session

**Steps:**
1. GET /api/x_snc_wco/v1/report
2. Check HTTP status and response

**Expected:**
- HTTP 200
- Response contains: {scan_date, items_scanned, savings_identified, total_monthly_cost, platform_breakdown}
- platform_breakdown is an array of platform → cost mappings
- JSON format

**Pass Criteria:** HTTP 200, valid JSON, all fields populated.

---

### T09 — REST API: Unauthorized Access Blocked
**Priority:** P1 | **Type:** Security | **Estimated:** <5s

**Setup:**
- No authentication token provided
- No basic auth header

**Steps:**
1. POST to /api/x_snc_wco/v1/optimize without auth
2. GET /api/x_snc_wco/v1/report without auth

**Expected:**
- HTTP 401 Unauthorized on both endpoints
- No data returned
- No log entry created (no processing occurred)

**Pass Criteria:** HTTP 401, empty response body.

---

### T10 — Scheduled Job: Monthly Cost Scan
**Priority:** P1 | **Type:** Functional | **Estimated:** <30s

**Setup:**
- 100 workflow profiles exist
- Pricing table populated (4 platforms)
- Scheduled job monthly_cost_scan configured

**Steps:**
1. Execute scheduled job script manually
2. Check x_snc_wco_scan_log for new record
3. Check x_snc_wco_routing_rule for new/updated rules
4. Verify no errors in execution

**Expected:**
- 100 routing rules created/updated
- 1 scan_log record with items_scanned = 100
- savings_identified > 0 (if any routes changed from default)
- Execution completes without errors

**Pass Criteria:** Scan log created, routing rules generated, no errors.

---

### T11 — Empty Data: No Profiles Available
**Priority:** P2 | **Type:** Edge | **Estimated:** <5s

**Setup:**
- x_snc_wco_workflow_profile table is empty
- Pricing table populated

**Steps:**
1. Call `routing.generateOptimalRouting(null)` (scan all)
2. Check response

**Expected:**
- Function returns {message: "No profiles available", profiles_scanned: 0}
- No routing rules created
- No exceptions thrown

**Pass Criteria:** Graceful empty response, no errors.

---

### T12 — Concurrent Scan Prevention
**Priority:** P2 | **Type:** Edge | **Estimated:** <10s

**Setup:**
- 100 profiles exist
- Race condition simulation

**Steps:**
1. Start scan via `profiler.profileAll()`
2. Start second scan immediately (concurrent)
3. Check for duplicate routing rules

**Expected:**
- Second scan detects in-progress scan and returns {error: "Scan already in progress"}
- No duplicate routing rules created
- No data corruption

**Pass Criteria:** Concurrent scan blocked, no duplicates.

---

## Priority Summary

| Priority | Scenarios | Count |
|----------|-----------|-------|
| P0 | T01, T02, T03, T04, T05, T07 | 6 |
| P1 | T06, T08, T09, T10 | 4 |
| P2 | T11, T12 | 2 |
| **Total** | | **12** |

## Execution Instructions

### Prerequisites
```bash
pip install pytest requests jsonschema
```

### Run All Tests
```bash
pytest tests/ -v --tb=short
```

### Run by Priority
```bash
pytest tests/ -v -m "p0"   # Critical only
pytest tests/ -v -m "p1"   # High priority
pytest tests/ -v -m "p2"   # Edge cases
```

### Expected Output
```
tests/test_profiler.py::test_profile_single_item PASSED
tests/test_profiler.py::test_profile_all_batch PASSED
tests/test_cost_calculator.py::test_single_platform PASSED
tests/test_cost_calculator.py::test_multi_platform_comparison PASSED
tests/test_routing_engine.py::test_constraint_satisfaction PASSED
tests/test_routing_engine.py::test_budget_exceeded PASSED
tests/test_rest_api.py::test_optimize_endpoint PASSED
tests/test_rest_api.py::test_report_endpoint PASSED
tests/test_rest_api.py::test_unauthorized_blocked PASSED
tests/test_scheduled_job.py::test_monthly_scan PASSED
tests/test_edge_cases.py::test_empty_profiles PASSED
tests/test_edge_cases.py::test_concurrent_scan_prevention PASSED

12 passed in 45.23s
```

## Pass/Fail Criteria
- **ALL PASS:** Application ready for deployment
- **1-2 FAIL:** P0/P1 failures require immediate fix before deploy
- **3+ FAIL:** Architectural review needed before proceeding
