---
type: task
id: NS-010
title: P0 Code Cleanup
product: yhealth-platform
status: queued
priority: P0
assignee: Unassigned
item_type: Technical
source: @PRODUCTS/yhealth-platform/PROGRESS-DEV.md
story_ids: [S01.0.1]
discovery_pending: true
curated: 2026-02-08
started:
completed:
---

# [NS-010] P0 Code Cleanup

## Description
Remove debug instrumentation (fetch to localhost:7242) from 5 server files, remove unused npm dependencies (Redux Toolkit, React Query from client/package.json), and delete server/src/routes/index.ts.bak backup file. This cleanup ensures the codebase is free of development artifacts before further work proceeds.

## Story Linkage
> **Traceability**: Technical debt cleanup mapped to foundation story S01.0.1. Discovery pending for additional cleanup items.

| Story ID | Story Title | Epic | Link |
|----------|-------------|------|------|
| S01.0.1 | Technical Foundation | E01 | `stories/Epic-01-Stories.md` |

## AI Context
| Context Type | Reference |
|--------------|-----------|
| **Skills to Activate** | DEV-01 (Code Review) |
| **Patterns to Apply** | Dead code elimination, dependency audit |

## Dependencies
| Type | Item | Status |
|------|------|--------|
| None | - | - |

## Acceptance Criteria
- [ ] No debug fetch calls remain in server source code
- [ ] @reduxjs/toolkit and react-redux removed from client/package.json
- [ ] @tanstack/react-query removed from client/package.json
- [ ] index.ts.bak deleted
- [ ] Application builds successfully after cleanup

## Definition of Done
- [ ] Acceptance criteria met
- [ ] PROGRESS.md updated with decisions
- [ ] Relevant tests passing (if applicable)
- [ ] Documentation updated (if applicable)

## Session Notes
>

---
*Created: 2026-02-08 | Product: yhealth-platform | Task: NS-010*
