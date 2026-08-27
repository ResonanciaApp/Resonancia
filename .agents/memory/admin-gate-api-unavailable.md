---
name: Admin gate when API is unavailable
description: The admin web gate currently renders access denied when its /api/me query fails or returns no user, so verify the API workflow before changing roles.
---

The AdminGate treats a missing `me` result as insufficient authorization. If the API workflow is stopped, the symptom is the same “Acceso restringido” screen shown for a real non-admin role.

**Why:** A stopped or unreachable API produces no authenticated profile response, but the frontend has no separate error state.

**How to apply:** Before changing Clerk users or database roles for an Admin access complaint, confirm the API workflow is running and query the development user record; then refresh the admin session.