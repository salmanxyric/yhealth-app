# yHealth Platform - Product Context

This folder contains product-specific context files used by Claude skills when generating documents for yHealth Platform.

## Purpose

These files provide consolidated reference information extracted from vision documents, PRDs, and other product documentation. Skills can load relevant context files to:

1. **Maintain consistency** - Use established personas, pillars, and terminology
2. **Save context** - Avoid re-reading large source documents
3. **Ensure accuracy** - Reference verified product decisions

## Context Files

| File | Description | Primary Source |
|------|-------------|----------------|
| `product-identity.md` | Mission, vision, positioning | Executive Vision Document |
| `personas.md` | User personas with behaviors | PRD Section 4 |
| `pillars.md` | Product pillars/domains | PRD Epic Overview |
| `design-decisions.md` | Key design choices | Vision + PRD |
| `constraints.md` | Technical/business constraints | PRD Sections 11-14 |
| `terminology.md` | Product vocabulary | All documents |

## Usage in Skills

Skills reference these files via the "Template & Context Loading" section:

```markdown
### Product Context
Load from: `PRODUCTS/yhealth-platform/context/`
- Required: product-identity.md, personas.md
- Optional: pillars.md, design-decisions.md, constraints.md, terminology.md
```

## Maintenance

- **Update when:** Source documents change significantly
- **Owner:** Product Team
- **Review:** Quarterly or after major PRD updates

---

*yHealth Platform Context v1.0 | Xyric Solutions*
