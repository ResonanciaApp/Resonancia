#!/usr/bin/env bash
# Patch react-native src/private/specs_DEPRECATED/components files that produce
# requireNativeComponent('StubComponent') due to codegen@0.81.5 Flow-type
# parsing failures. Without this patch, the iOS dev bundle crashes at runtime
# with "Tried to register two views with the same name StubComponent".
set -euo pipefail

NULL_CONTENT=$'\'use strict\';\nmodule.exports = null;'

patch_dir() {
  local dir="$1"
  if [ -d "$dir" ]; then
    echo "[patch-rn-specs] Patching: $dir"
    for f in "$dir"/*.js; do
      [ -f "$f" ] || continue
      # EXCEPCIÓN: RCTModalHostViewNativeComponent es la vista nativa detrás de
      # <Modal>; stubbearlo hace que TODOS los Modals rendericen en la nada en
      # silencio (visible=true, sin error). Debe cargar real.
      case "$(basename "$f")" in
        RCTModalHostViewNativeComponent.js)
          echo "[patch-rn-specs] SKIP (Modal): $(basename "$f")"
          continue
          ;;
      esac
      printf "'use strict';\nmodule.exports = null;\n" > "$f"
    done
  fi
}

PNPM_ROOT="$(pwd)/node_modules/.pnpm"

# Patch all react-native installs that have src/private/specs_DEPRECATED
for rn_dir in "$PNPM_ROOT"/react-native@*/node_modules/react-native; do
  specs_dir="$rn_dir/src/private/specs_DEPRECATED/components"
  patch_dir "$specs_dir"
  # Also patch virtualview NativeComponent files
  vv_dir="$rn_dir/src/private/components/virtualview"
  for f in "$vv_dir"/*NativeComponent.js; do
    [ -f "$f" ] || continue
    printf "'use strict';\nmodule.exports = null;\n" > "$f"
    echo "[patch-rn-specs] Patched virtualview: $(basename $f)"
  done
done

echo "[patch-rn-specs] Done."
