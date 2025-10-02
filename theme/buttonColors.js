// theme/buttonColors.js
import { baseColors } from "./colors";

export const buttonColors = (mode = "light") => {
  const c = baseColors[mode];
  return {
    start: { color1: c.brand.primary, color2: c.brand.primaryDark },
    pause: { color1: c.states.warning, color2: "#d97706" },
    stop: { color1: c.states.danger, color2: "#b91c1c" },
    schedule: { color1: c.states.success, color2: "#15803d" },
    import: { color1: "#9333ea", color2: "#7e22ce" },
    queue: { color1: c.states.info, color2: "#1e40af" },
    report: { color1: c.states.success, color2: "#065f46" },
    settings: { color1: c.states.warning, color2: "#b45309" },
    default: { color1: c.textMuted, color2: c.border },
  };
};
