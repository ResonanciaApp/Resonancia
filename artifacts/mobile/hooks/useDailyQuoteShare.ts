import { useEffect, useRef, useState } from "react";
import type { View } from "react-native";

import {
  isQuoteShareCancellation,
  shareDailyQuote,
  type DailyQuoteShareAction,
  type SharedDailyQuote,
} from "@/utils/dailyQuoteShare";

export function useDailyQuoteShare(quote: SharedDailyQuote) {
  const [visible, setVisible] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<SharedDailyQuote>(quote);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const busyRef = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  function open() {
    if (busyRef.current) return;
    setSelectedQuote({ text: quote.text, author: quote.author });
    setFeedback(null);
    setVisible(true);
  }

  async function onAction(action: DailyQuoteShareAction, artwork: View | null) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setFeedback(action === "messenger" ? "Elige Messenger cuando se abran las opciones." : null);
    try {
      const result = await shareDailyQuote(action, selectedQuote, artwork);
      if (mounted.current) setFeedback(result || null);
    } catch (error) {
      if (mounted.current && !isQuoteShareCancellation(error)) {
        const detail = error instanceof Error ? error.message : String(error);
        setFeedback(/permission|authorization|access.*photos/i.test(detail)
          ? "Permite el acceso a Fotos para compartir en Instagram, o usa Más."
          : /app móvil|navegador|imagen aún|versión actualizada/.test(detail)
          ? detail
          : "No se pudo compartir. Comprueba que la app esté instalada o usa Más.");
      }
    } finally {
      busyRef.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  return {
    open,
    sheetProps: {
      visible, quote: selectedQuote, busy, feedback, onAction,
      onClose: () => { if (!busyRef.current) setVisible(false); },
    },
  };
}
