import React from "react";
import Svg, { Circle, Ellipse, Line, Path, Rect } from "react-native-svg";

type Props = { size?: number; color?: string };

/** Cuenco tibetano: cuenco hemisférico con base y palillo */
export function IconCuencoTibetano({ size = 24, color = "#B6955F" }: Props) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      {/* Bowl body */}
      <Path
        d="M4 11 Q4 18 12 18 Q20 18 20 11"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Rim */}
      <Ellipse cx="12" cy="11" rx="8" ry="2" stroke={color} strokeWidth="1.6" fill="none" />
      {/* Base */}
      <Path d="M8 18 L8 20 Q12 21 16 20 L16 18" stroke={color} strokeWidth="1.4" strokeLinecap="round" fill="none" />
      {/* Mallet */}
      <Line x1="18" y1="6" x2="21" y2="3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Circle cx="21" cy="3" r="1.2" fill={color} />
      {/* Sound waves */}
      <Path d="M2 8 Q1 9.5 2 11" stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.6" />
      <Path d="M0.5 6.5 Q-0.5 9 0.5 12" stroke={color} strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.35" />
    </Svg>
  );
}

/** Cuenco de cuarzo: bowl más esférico con destellos de cristal */
export function IconCuencoCuarzo({ size = 24, color = "#B6955F" }: Props) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      {/* Bowl - más redondeado */}
      <Path
        d="M3 10 Q2.5 17.5 12 18.5 Q21.5 17.5 21 10"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Rim */}
      <Ellipse cx="12" cy="10" rx="9" ry="2.2" stroke={color} strokeWidth="1.6" fill="none" />
      {/* Base line */}
      <Path d="M9 18.5 Q12 19.5 15 18.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" fill="none" />
      {/* Crystal sparkles */}
      <Path d="M7 6 L7 4 M6 5 L8 5" stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity="0.9" />
      <Path d="M16 5 L16 3.5 M15.2 4.2 L16.8 4.2" stroke={color} strokeWidth="1.1" strokeLinecap="round" opacity="0.7" />
      <Path d="M12 3.5 L12 2.5 M11.4 3 L12.6 3" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.55" />
    </Svg>
  );
}

/** Mix: dos cuencos superpuestos, uno más pequeño */
export function IconMixCuencos({ size = 24, color = "#B6955F" }: Props) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      {/* Cuenco trasero (tibetano) - desplazado */}
      <Path d="M7 12 Q6.5 17 13 17.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.55" />
      <Ellipse cx="13" cy="12" rx="6" ry="1.6" stroke={color} strokeWidth="1.4" fill="none" opacity="0.55" />
      {/* Cuenco frontal (cuarzo) */}
      <Path d="M2 11 Q1.5 18 11 19 Q20.5 18 20 11" stroke={color} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <Ellipse cx="11" cy="11" rx="9" ry="2.2" stroke={color} strokeWidth="1.6" fill="none" />
      {/* Base */}
      <Path d="M8 19 Q11 20 14 19" stroke={color} strokeWidth="1.3" strokeLinecap="round" fill="none" />
      {/* Sparkle */}
      <Path d="M5 7 L5 5.5 M4.3 6.2 L5.7 6.2" stroke={color} strokeWidth="1.1" strokeLinecap="round" opacity="0.8" />
    </Svg>
  );
}

/** Gong: disco circular con aro exterior y punto central */
export function IconGong({ size = 24, color = "#B6955F" }: Props) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      {/* Outer ring */}
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.6" fill="none" />
      {/* Inner ring */}
      <Circle cx="12" cy="12" r="5.5" stroke={color} strokeWidth="1.2" fill="none" opacity="0.6" />
      {/* Center dot */}
      <Circle cx="12" cy="12" r="1.5" fill={color} />
      {/* Hanging cord */}
      <Path d="M12 3 L12 1 M10 1 L14 1" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      {/* Mallet */}
      <Line x1="20" y1="9" x2="22" y2="7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Circle cx="22" cy="7" r="1.3" fill={color} />
    </Svg>
  );
}

/** Cuencos y Gongs: cuenco a la izquierda, gong a la derecha */
export function IconCuencosYGongs({ size = 24, color = "#B6955F" }: Props) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      {/* Mini bowl left */}
      <Path d="M1.5 12 Q1.5 16.5 7 17 Q12.5 16.5 12.5 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <Ellipse cx="7" cy="12" rx="5.5" ry="1.5" stroke={color} strokeWidth="1.5" fill="none" />
      <Path d="M4.5 17 Q7 17.8 9.5 17" stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none" />
      {/* Gong right */}
      <Circle cx="18" cy="11" r="5.5" stroke={color} strokeWidth="1.5" fill="none" />
      <Circle cx="18" cy="11" r="2" stroke={color} strokeWidth="1" fill="none" opacity="0.55" />
      <Circle cx="18" cy="11" r="0.8" fill={color} />
      {/* Cord */}
      <Path d="M18 5.5 L18 4" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  );
}

/** Sonidos de la Selva: hoja con ondas de sonido */
export function IconSelva({ size = 24, color = "#B6955F" }: Props) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      {/* Leaf shape */}
      <Path
        d="M12 20 Q4 16 5 8 Q8 3 12 4 Q16 3 19 8 Q20 16 12 20Z"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        strokeLinejoin="round"
      />
      {/* Stem */}
      <Line x1="12" y1="20" x2="12" y2="22" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      {/* Vein center */}
      <Line x1="12" y1="6" x2="12" y2="18" stroke={color} strokeWidth="1.1" strokeLinecap="round" opacity="0.55" />
      {/* Side veins */}
      <Path d="M12 10 Q9.5 11.5 8 11" stroke={color} strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.5" />
      <Path d="M12 13.5 Q9 15 7.5 14.5" stroke={color} strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.5" />
      <Path d="M12 10 Q14.5 11.5 16 11" stroke={color} strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.5" />
      <Path d="M12 13.5 Q15 15 16.5 14.5" stroke={color} strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.5" />
    </Svg>
  );
}
