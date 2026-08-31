export function getSceneTabSurface(sceneId: string): string {
  if (sceneId === "tibet") return "rgba(0,0,0,0.15)";
  if (sceneId === "indigo") return "rgba(42,40,64,0.65)";
  return "rgba(255,255,255,0.05)";
}