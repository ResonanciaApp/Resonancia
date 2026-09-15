const fs = require('fs');
const content = fs.readFileSync('artifacts/mobile/app/(tabs)/inicio8.tsx', 'utf8');

const updated = content.replace(
  /<View style=\{styles.inicio3HeroRightActions\}>([\s\S]*?)<\/View>\s*<\/RAnimated.View>/,
  '<RAnimated.View style={[styles.inicio3HeroRightActions, heroControlsOpacity]}>$1</RAnimated.View>\n      </RAnimated.View>'
);

fs.writeFileSync('artifacts/mobile/app/(tabs)/inicio8.tsx', updated);
