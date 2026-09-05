import { WIDGET_GREEN_SOLID } from "@/constants/colors";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";

type RoutineThemeTokens = {
  background: string;
  surface: string;
  surfaceElevated: string;
  divider: string;
  ticketSurface: string;
  accent: string;
  text: string;
  textMuted: string;
  completion: string;
  completionSoft: string;
};

const ROUTINE_SCENE_SURFACES = {
  tibet: {
    surface: "rgba(31,42,98,0.72)",
    surfaceElevated: "rgba(45,28,82,0.88)",
    divider: "rgba(172,172,193,0.24)",
    ticketSurface: "#2D1C52",
  },
  profundo: {
    surface: "rgba(49,31,61,0.76)",
    surfaceElevated: "rgba(44,28,56,0.92)",
    divider: "rgba(172,172,193,0.22)",
    ticketSurface: "#311F3D",
  },
  indigo: {
    surface: "rgba(255,255,255,0.05)",
    surfaceElevated: "#292735",
    divider: "rgba(172,172,193,0.18)",
    ticketSurface: "#1C1B28",
  },
  resonancia: {
    surface: "rgba(255,255,255,0.05)",
    surfaceElevated: "#292735",
    divider: "rgba(172,172,193,0.18)",
    ticketSurface: "#1C1B28",
  },
  indigo2: {
    surface: "rgba(255,255,255,0.025)",
    surfaceElevated: "#1D1D25",
    divider: "rgba(255,255,255,0.10)",
    ticketSurface: "#191919",
  },
} as const;

export function useRoutineTheme(): RoutineThemeTokens {
  const colors = useColors();
  const { activeSceneId, theme } = useSceneTheme();
  const scene = ROUTINE_SCENE_SURFACES[activeSceneId];

  return {
    background: theme.solid,
    surface: scene.surface,
    surfaceElevated: scene.surfaceElevated,
    divider: scene.divider,
    ticketSurface: scene.ticketSurface,
    accent: theme.accent ?? colors.primary,
    text: colors.foreground,
    textMuted: colors.mutedForeground,
    completion: WIDGET_GREEN_SOLID,
    completionSoft: "rgba(41,139,115,0.18)",
  };
}