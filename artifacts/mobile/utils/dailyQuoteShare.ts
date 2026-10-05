import type { View } from "react-native";

export type DailyQuoteShareAction = "copy" | "sms" | "instagram" | "whatsapp" | "messenger" | "more";
export type SharedDailyQuote = { text: string; author: string };
type Payload = { message: string; title: string; url?: string; type?: string };
type ShareDependencies = {
  platform: string;
  copy: (message: string) => Promise<void>;
  capture: () => Promise<string>;
  system: (payload: Payload) => Promise<void>;
  app: (action: "sms" | "instagram" | "whatsapp" | "messenger", payload: Payload) => Promise<void>;
};

export function dailyQuoteMessage(quote: SharedDailyQuote) {
  return `“${quote.text}”\n\n— ${quote.author}\n\nVía RESONANCIA`;
}

export async function performDailyQuoteShare(
  action: DailyQuoteShareAction,
  quote: SharedDailyQuote,
  deps: ShareDependencies,
): Promise<string> {
  const message = dailyQuoteMessage(quote);
  if (action === "copy") {
    await deps.copy(message);
    return "Frase copiada.";
  }
  if (deps.platform === "web") {
    if (action !== "more") {
      throw new Error("Esta opción está disponible en la app móvil. Puedes copiar la frase o usar Más.");
    }
    await deps.system({ message, title: "Frase del día · RESONANCIA" });
    return "";
  }
  const payload: Payload = { message, title: "Frase del día · RESONANCIA" };
  if (action !== "sms") {
    payload.url = await deps.capture();
    payload.type = "image/png";
  }
  // Messenger's iOS URL scheme accepts web links, not local quote images.
  // Use its actual share extension through the system sheet instead.
  if (action === "more" || (action === "messenger" && deps.platform === "ios")) {
    await deps.system(payload);
    return action === "messenger" ? "Elige Messenger en las opciones de compartir." : "";
  }
  await deps.app(action, payload);
  return "";
}

export function isQuoteShareCancellation(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /cancelled|canceled|user did not share|AbortError/i.test(message)
    || (error instanceof Error && error.name === "AbortError");
}

export async function shareDailyQuote(
  action: DailyQuoteShareAction,
  quote: SharedDailyQuote,
  artwork: View | null,
) {
  const { Platform, Linking } = await import("react-native");
  return performDailyQuoteShare(action, quote, {
    platform: Platform.OS,
    copy: async (message) => {
      const Clipboard = await import("expo-clipboard");
      await Clipboard.setStringAsync(message);
    },
    capture: async () => {
      if (!artwork) throw new Error("La imagen aún no está lista. Vuelve a intentarlo.");
      const { captureRef } = await import("react-native-view-shot");
      return captureRef(artwork, { format: "png", quality: 1, result: "tmpfile" });
    },
    system: async (payload) => {
      if (Platform.OS === "web") {
        if (typeof navigator !== "undefined" && navigator.share) {
          await navigator.share({ title: payload.title, text: payload.message });
          return;
        }
        throw new Error("Este navegador no permite compartir. Usa Copiar frase.");
      }
      const { default: NativeShare } = await import("react-native-share");
      await NativeShare.open({ ...payload, failOnCancel: false });
    },
    app: async (target, payload) => {
      if (Platform.OS === "ios" && (target === "instagram" || target === "whatsapp")) {
        const available = await Linking.canOpenURL(`${target}://`);
        if (!available) {
          throw new Error("No se pudo abrir esta app. Comprueba que esté instalada y usa la versión actualizada de RESONANCIA, o elige Más.");
        }
      }
      const { default: NativeShare, Social } = await import("react-native-share");
      const socials = {
        sms: Social.Sms,
        instagram: Social.Instagram,
        whatsapp: Social.Whatsapp,
        messenger: Social.Messenger,
      } as const;
      await NativeShare.shareSingle({ ...payload, social: socials[target] });
    },
  });
}
