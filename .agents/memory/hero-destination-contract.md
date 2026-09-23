---
name: Hero destination contract
description: How to keep Admin-configured navigation aligned with mobile collection and tag routes
---

Admin catalog option IDs are not automatically valid Mobile navigation IDs. For editorial links, use the destination screen's canonical route contract: some collections use stable built-in IDs or hashed custom IDs, thematic parents can have exceptional canonical slugs, and category editorial labels require an explicit editorial namespace.

**Why:** An initial implementation passed typechecks but its numeric option IDs and generic slugs led to empty Mobile screens. Several rounds of review were needed because the admin selector, API validator and mobile router each looked correct in isolation.

**How to apply:** When adding a new deep link configured in Admin, compare the actual Mobile screen lookup and route builder with the saved option value, validate against published content on save and read, and test the complete selector → published response → navigation chain.