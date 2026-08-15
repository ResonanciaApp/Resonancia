/**
 * Corrige URLs de assets (fuentes, imágenes, audio) cuando el dev client se
 * conectó por http://: el túnel *.replit.dev responde a http con una página
 * de redirección, y Android registra fuentes corruptas en silencio → tofu.
 * Reescribimos http→https para dominios replit.dev en TODAS las rutas de
 * resolución de assets. Solo afecta desarrollo (en producción los assets van
 * embebidos en el binario y no pasan por aquí).
 */
import { Asset } from "expo-asset";

const toHttps = (u: string | null | undefined): string | undefined => {
  if (u && u.startsWith("http://") && u.includes(".replit.dev")) {
    return "https://" + u.slice("http://".length);
  }
  return u ?? undefined;
};

// 1) Imágenes / audio cargados con require() vía React Native.
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const resolveAssetSource = require("react-native/Libraries/Image/resolveAssetSource");
  const mod = resolveAssetSource.default ?? resolveAssetSource;
  const transformer = (resolver: any) => {
    const res = resolver.defaultAsset();
    if (res?.uri) {
      const fixed = toHttps(res.uri);
      if (fixed) res.uri = fixed;
    }
    return res;
  };
  if (typeof mod.addCustomSourceTransformer === "function") {
    mod.addCustomSourceTransformer(transformer);
  } else if (typeof mod.setCustomSourceTransformer === "function") {
    mod.setCustomSourceTransformer(transformer);
  }
} catch (e) {
  console.log(`[fix-http-assets] resolveAssetSource no parchado: ${String(e)}`);
}

// 2) Fuentes y otros assets cargados vía expo-asset (expo-font incluido).
try {
  const origFromModule = Asset.fromModule.bind(Asset);
  (Asset as any).fromModule = (virtualAssetModule: any) => {
    const asset = origFromModule(virtualAssetModule);
    const fixed = toHttps(asset.uri);
    if (fixed && fixed !== asset.uri) asset.uri = fixed;
    return asset;
  };
} catch (e) {
  console.log(`[fix-http-assets] Asset.fromModule no parchado: ${String(e)}`);
}
