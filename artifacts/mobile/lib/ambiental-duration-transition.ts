export const CIRCLE_DIAMETER = 76;
export const CIRCLE_SHRINK_MS = 270;
export const MANUAL_HEIGHT_INCREASE = 130;
export const CANCEL_BUTTON_HEIGHT = 54;
export const DURATION_CONTROL_GAP = 12;
export const MANUAL_START_SHIFT = CANCEL_BUTTON_HEIGHT + DURATION_CONTROL_GAP;
export const SHEET_EXPAND_MS = 460;
export const MANUAL_REVEAL_DELAY_MS = 200;
export const MANUAL_FADE_MS = 180;
export type DurationPhase = "presets" | "shrinking" | "expanding" | "revealing" | "manual";

type Value = { setValue: (value: number) => void };
type Animation = {
  start: (callback: (result: { finished: boolean }) => void) => void;
  stop: () => void;
};
type TimingConfig = {
  toValue: number;
  duration: number;
  delay?: number;
  useNativeDriver: boolean;
  easing?: (value: number) => number;
};
export type DurationAnimationValues<T extends Value = Value> = {
  scales: T[];
  circleOpacities: T[];
  sheetHeight: T;
  startShift: T;
  manualOpacity: T;
};

/** Callback-driven sequence; stale completions cannot advance a closed sheet. */
export function createDurationTransition<T extends Value>({
  values, timing, onPhase, shrinkEasing, expandEasing,
}: {
  values: DurationAnimationValues<T>;
  timing: (value: T, config: TimingConfig) => Animation;
  onPhase: (phase: DurationPhase) => void;
  shrinkEasing?: (value: number) => number;
  expandEasing?: (value: number) => number;
}) {
  let phase: DurationPhase = "presets";
  let generation = 0;
  let active = false;
  let expandedHeight = 0;
  const animations = new Set<Animation>();
  const changePhase = (next: DurationPhase) => {
    phase = next;
    onPhase(next);
  };
  const cancel = () => {
    generation++;
    active = false;
    const pending = [...animations];
    animations.clear();
    pending.forEach(animation => animation.stop());
  };
  const reset = () => {
    cancel();
    values.scales.forEach(value => value.setValue(1));
    values.circleOpacities.forEach(value => value.setValue(1));
    values.manualOpacity.setValue(0);
    values.startShift.setValue(0);
    changePhase("presets");
  };
  const finishImmediately = () => {
    if (!active) return;
    cancel();
    values.scales.forEach(value => value.setValue(1 / CIRCLE_DIAMETER));
    values.circleOpacities.forEach(value => value.setValue(0));
    values.sheetHeight.setValue(expandedHeight);
    values.startShift.setValue(-MANUAL_START_SHIFT);
    values.manualOpacity.setValue(1);
    changePhase("manual");
  };
  const start = (baselineHeight: number, reducedMotion: boolean) => {
    if (active || phase !== "presets" || !(baselineHeight > 0)) return false;
    const token = ++generation;
    active = true;
    expandedHeight = baselineHeight + MANUAL_HEIGHT_INCREASE;
    values.sheetHeight.setValue(baselineHeight);
    changePhase("shrinking");
    if (reducedMotion) {
      finishImmediately();
      return true;
    }
    const animate = (value: T, config: TimingConfig, next: () => void) => {
      if (token !== generation || !active) return;
      const animation = timing(value, config);
      animations.add(animation);
      animation.start(({ finished }) => {
        animations.delete(animation);
        if (token !== generation || !active) return;
        if (!finished) {
          reset();
          return;
        }
        next();
      });
    };
    const reveal = () => {
      changePhase("revealing");
      animate(values.manualOpacity, {
        toValue: 1, duration: MANUAL_FADE_MS, delay: MANUAL_REVEAL_DELAY_MS, useNativeDriver: true,
      }, () => {
        active = false;
        changePhase("manual");
      });
    };
    const expand = () => {
      changePhase("expanding");
      let completed = 0;
      const finishExpansion = () => {
        if (++completed === 2) reveal();
      };
      animate(values.sheetHeight, {
        toValue: expandedHeight, duration: SHEET_EXPAND_MS,
        useNativeDriver: false, easing: expandEasing,
      }, finishExpansion);
      animate(values.startShift, {
        toValue: -MANUAL_START_SHIFT, duration: SHEET_EXPAND_MS,
        useNativeDriver: true, easing: expandEasing,
      }, finishExpansion);
    };
    const shrink = (index: number) => {
      animate(values.scales[index], {
        toValue: 1 / CIRCLE_DIAMETER, duration: CIRCLE_SHRINK_MS,
        useNativeDriver: true, easing: shrinkEasing,
      }, () => {
        values.circleOpacities[index].setValue(0);
        if (index > 0) shrink(index - 1);
        else expand();
      });
    };
    shrink(values.scales.length - 1);
    return true;
  };
  return {
    start, cancel, reset, finishImmediately,
    getPhase: () => phase,
    isTransitioning: () => active,
  };
}