import { fileURLToPath } from "node:url";

// Both src/ (tsx) and dist/ (bundled deployment) sit beside assets/.
export const growthWorldCoverRoot = fileURLToPath(new URL("../assets/growth-worlds/", import.meta.url));
