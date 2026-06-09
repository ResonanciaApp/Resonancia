---
name: mockup-sandbox verification gotchas
description: How to reliably verify a mockup-sandbox component fix (caching + subagent template-literal bug)
---

# Verifying mockup-sandbox previews

When you fix a component in `artifacts/mockup-sandbox` and need to confirm it now
compiles, do NOT rely on `screenshot type=external_url` of the `/__mockup/preview/...`
URL — that fetcher caches by URL and will keep showing a stale Vite error overlay
even after the file is fixed and the workflow restarted.

**Authoritative check:** curl the Vite-transformed module through the proxy and grep
for a real babel signature:
`curl -s "http://localhost:80/__mockup/src/components/mockups/<dir>/<Comp>.tsx" | grep "plugin:vite:react-babel\|Expecting Unicode\|Unexpected token"`
A clean fix returns valid transformed JS (starts with the `@vite/client` hot-context
import) and no babel match. Note a loose grep for "Error" gives false positives —
the compiled JS legitimately contains that word.

**Why:** external screenshot caching wasted multiple cycles chasing an already-fixed
error. The transform curl reflects the live dev server state immediately.

## DESIGN subagent template-literal bug
DESIGN subagents occasionally emit ESCAPED backticks/dollars inside `style={{}}`
template literals (e.g. `` border: \`1px solid \${PALETTE.border}\` ``), which is a
Vite `plugin:vite:react-babel` "Expecting Unicode escape sequence \uXXXX" parse error.
After a fan-out, grep the generated files for `\\\`` and unescape before presenting.
