# Discovered Impacts

This file tracks cross-story impacts discovered during implementation.

**Last Updated:** 2026-02-06

---

## Epic 1, Story 1: User Authentication with AD/LDAP Integration

### Impact: Missing API Endpoints in OpenAPI Spec — RESOLVED

**Discovered During:** REALIGN phase
**Severity:** High
**Type:** API Contract Mismatch
**Resolution:** Option A — Use existing endpoints (decided 2026-02-06)

**Changes Applied:**
- `GET /v1/auth/session` → replaced with `GET /v1/auth/me` in story
- `POST /v1/auth/logout` → removed; logout handled client-side (cookie clearing + redirect)
- Story file updated accordingly

---

## Instructions

When processing impacts:
1. Read this file before implementing each story
2. Check if any impacts affect the current story
3. Propose story revisions if needed
4. Remove impacts from this file after processing
