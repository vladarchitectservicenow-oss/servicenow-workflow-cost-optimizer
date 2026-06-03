// ServiceNow Workflow Cost Optimizer — Monthly Cost Scan
// Copyright (C) 2026 Vladimir Kapustin
// SPDX-License-Identifier: AGPL-3.0
//
// Scheduled Job — Runs 1st of month at 02:00.
/** Monthly Cost Scan — Scheduled Job. Runs 1st of month at 02:00. */
(function() {
    var profiler = new x_snc_wco.WorkflowProfiler(); profiler.profileAll();
    var engine = new x_snc_wco.RoutingEngine();
    var result = engine.generateOptimalRouting(null);
    gs.info("WCO Monthly Scan: " + result.routing_map.length + " workflows routed. Monthly: $" + result.total_monthly_cost);
})();