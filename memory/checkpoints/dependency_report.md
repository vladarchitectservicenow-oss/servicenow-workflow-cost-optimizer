# Dependency Report: servicenow-workflow-cost-optimizer

**Product:** ServiceNow Workflow Cost Optimizer (WCO)
**Scope:** x_snc_wco
**Author:** Vladimir Kapustin
**Date:** 2026-06-03

## ServiceNow Platform Dependencies

### Required Plugins (Must be Active)
| Plugin ID | Name | Purpose | Minimum Version |
|-----------|------|---------|-----------------|
| com.glide.hub | Flow Designer | Workflow trigger integration | Utah+ |
| com.snc.pa | Performance Analytics | Cost dashboard widgets | Utah+ |
| com.glide.rest.api | REST API Framework | Scripted REST endpoints | Platform default |
| com.snc.scheduled_jobs | Scheduled Jobs | Monthly cost scan trigger | Platform default |
| com.glide.scripting | Server-side Scripting | Script Includes execution | Platform default |

### System Properties
| Property | Required | Default | Description |
|----------|----------|---------|-------------|
| x_snc_wco.pricing.default_platform | No | now_assist | Fallback platform when no rule matches |
| x_snc_wco.scan.max_items | No | 10000 | Max items scanned per monthly job |
| x_snc_wco.scan.batch_size | No | 500 | Batch size for GlideRecord queries |
| x_snc_wco.routing.cache_ttl_seconds | No | 3600 | Routing rule cache lifetime |
| x_snc_wco.log.level | No | info | Logging: debug, info, warn, error |

### Database Tables (Internal)
| Table | Extends | ACLs |
|-------|---------|------|
| x_snc_wco_workflow_profile | (base) | create/write: admin; read: admin, viewer |
| x_snc_wco_pricing | (base) | create/write: admin; read: admin, viewer |
| x_snc_wco_routing_rule | (base) | create/write: admin; read: admin, viewer |
| x_snc_wco_scan_log | (base) | create: system; read: admin, viewer |

### Roles
| Role | Description | Permissions |
|------|-------------|-------------|
| x_snc_wco.admin | Full administrative access | CRUD all tables, execute REST APIs, configure pricing |
| x_snc_wco.viewer | Read-only access to reports | Read tables, GET report endpoint |

## External Dependencies

### AI Platforms (Configurable via Pricing Table)
| Platform | API Endpoint | Auth Method |
|----------|-------------|-------------|
| ServiceNow Now Assist | Internal (AI Gateway) | Instance session |
| OpenAI | api.openai.com/v1 | API Key (stored in sys_properties) |
| Azure OpenAI | {resource}.openai.azure.com | API Key + Resource |
| AWS Bedrock | bedrock-runtime.{region}.amazonaws.com | IAM Role / Access Key |
| Google Vertex AI | {region}-aiplatform.googleapis.com | Service Account |
| Anthropic | api.anthropic.com | API Key |
| BYOK (Bring Your Own Key) | Custom | Configurable per platform |

### REST API Dependencies
| Endpoint | Method | Auth | Rate Limit |
|----------|--------|------|------------|
| /api/x_snc_wco/v1/optimize | POST | Basic / OAuth | 100 req/min |
| /api/x_snc_wco/v1/cost-scan | POST | Basic / OAuth (admin) | 10 req/min |
| /api/x_snc_wco/v1/report | GET | Basic / OAuth | 200 req/min |

## Test Dependencies
| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.10+ | Test runner |
| pytest | 7.0+ | Unit/integration tests |
| requests | 2.28+ | REST API testing |
| jsonschema | 4.17+ | Response validation |

## Version Compatibility Matrix
| ServiceNow Version | Status | Notes |
|--------------------|--------|-------|
| Utah | Supported | Minimum requirement |
| Vancouver | Supported | |
| Washington DC | Supported | OAuth scope update needed |
| Xanadu | Supported | |
| Yokohama | Supported | |
| Zurich | Supported | |
| Australia | Supported | |

## Risk Assessment
| Dependency | Risk Level | Mitigation |
|------------|-----------|------------|
| Flow Designer plugin disabled | P0 Critical | Startup check in scheduled job |
| AI Gateway unconfigured | P1 High | Fallback to direct API calls |
| External API outage (OpenAI) | P1 High | Multi-platform routing spreads risk |
| Pricing table empty | P2 Medium | Default pricing in CostCalculator |
| OAuth token expiry | P2 Medium | Refresh token handling, alert on failure |

## Upgrade Impact
- Scoped app update: No data migration needed — tables are additive.
- Plugin version change: Monitor Flow Designer breaking changes in release notes.
- API deprecation: Pricing table supports adding/removing platforms without code changes.
