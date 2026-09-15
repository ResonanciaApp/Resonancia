sed -i 's/const pointerEventsValue = opacity > 0.1 ? "box-none" : "none";//g' "artifacts/mobile/app/(tabs)/inicio8.tsx"
sed -i 's/pointerEvents: pointerEventsValue,/display: opacity > 0.05 ? "flex" : "none",/g' "artifacts/mobile/app/(tabs)/inicio8.tsx"
