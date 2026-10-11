import { createContext, useContext } from "react";
import { CARD_TEXT_BELOW } from "@/constants/colors";

// Separate from the full palette: captions only update when their color changes.
export const CardCaptionColorContext = createContext<string>(CARD_TEXT_BELOW);
export function useCardCaptionColor() {
  return useContext(CardCaptionColorContext);
}
