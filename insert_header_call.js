const fs = require('fs');
const content = fs.readFileSync('artifacts/mobile/app/(tabs)/inicio8.tsx', 'utf8');

const updated = content.replace(
  '{/* ── Header fijo: Menú + Racha (solo Inicio original) ── */}',
  `{variant === "inicio3" && (
        <Inicio3StickyHeader
          topPad={topPad}
          inicio3ScrollY={inicio3ScrollY}
          onOpenSearch={handleSearchBtnPress}
          onOpenProfile={() => router.push("/progreso" as never)}
          giftScaleAnim={giftScaleAnim}
          activeTheme={activeTheme}
        />
      )}

      {/* ── Header fijo: Menú + Racha (solo Inicio original) ── */}`
);

fs.writeFileSync('artifacts/mobile/app/(tabs)/inicio8.tsx', updated);
