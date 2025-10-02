// /assets/colors.js
// Professional, "decent" palette for consistent theming across the app.
// Usage: import { theme, palette, chartColors, getColors } from "@/assets/colors";

const palette = {
  slate: {
    50:  "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1F2937",
    900: "#0F172A",
  },
  indigo: {
    50:  "#EEF2FF",
    100: "#E0E7FF",
    200: "#C7D2FE",
    300: "#A5B4FC",
    400: "#818CF8",
    500: "#6366F1",
    600: "#4F46E5", // brand primary (light)
    700: "#4338CA",
    800: "#3730A3",
    900: "#312E81",
  },
  teal: {
    50:  "#F0FDFA",
    100: "#CCFBF1",
    200: "#99F6E4",
    300: "#5EEAD4",
    400: "#2DD4BF",
    500: "#14B8A6",
    600: "#0D9488", // brand secondary (light)
    700: "#0F766E",
    800: "#115E59",
    900: "#134E4A",
  },
  amber: {
    50:  "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#F59E0B", // brand accent (light)
    600: "#D97706",
    700: "#B45309",
    800: "#92400E",
    900: "#78350F",
  },
  red: {
    50:  "#FEF2F2",
    100: "#FEE2E2",
    200: "#FECACA",
    300: "#FCA5A5",
    400: "#F87171",
    500: "#EF4444",
    600: "#DC2626",
    700: "#B91C1C",
    800: "#991B1B",
    900: "#7F1D1D",
  },
  blue: {
    50:  "#EFF6FF",
    100: "#DBEAFE",
    200: "#BFDBFE",
    300: "#93C5FD",
    400: "#60A5FA",
    500: "#3B82F6",
    600: "#2563EB",
    700: "#1D4ED8",
    800: "#1E40AF",
    900: "#1E3A8A",
  },
  emerald: {
    50:  "#ECFDF5",
    100: "#D1FAE5",
    200: "#A7F3D0",
    300: "#6EE7B7",
    400: "#34D399",
    500: "#10B981",
    600: "#059669",
    700: "#047857",
    800: "#065F46",
    900: "#064E3B",
  },
};

// Light & dark themes with semantic tokens
const theme = {
  light: {
    background: palette.slate[50],
    surface: "#FFFFFF",
    surfaceAlt: palette.slate[100],
    text: palette.slate[900],
    textMuted: palette.slate[600],
    border: palette.slate[200],
    brand: {
      primary: palette.indigo[600],
      primaryHover: palette.indigo[700],
      onPrimary: "#FFFFFF",
      primarySoft: palette.indigo[50],

      secondary: palette.teal[600],
      secondaryHover: palette.teal[700],
      onSecondary: "#FFFFFF",
      secondarySoft: palette.teal[50],

      accent: palette.amber[500],
      onAccent: palette.slate[900],
      accentSoft: palette.amber[50],
    },
    states: {
      success: "#16A34A", // green-600
      warning: palette.amber[600],
      danger: palette.red[600],
      info: palette.blue[600],
    },
    overlay: "rgba(2, 6, 23, 0.5)", // slate-950 @50%
    focusRing: palette.indigo[300],
  },

  dark: {
    background: "#0B1220",            // elegant deep navy
    surface: palette.slate[900],
    surfaceAlt: "#111827",            // gray-900-ish
    text: "#E5E7EB",                  // gray-200
    textMuted: "#94A3B8",             // slate-400
    border: "#1F2937",                // slate-800
    brand: {
      primary: palette.indigo[500],
      primaryHover: palette.indigo[400],
      onPrimary: "#0B1220",
      primarySoft: "rgba(99, 102, 241, 0.14)", // indigo-500 @14%

      secondary: palette.teal[500],
      secondaryHover: palette.teal[400],
      onSecondary: "#0B1220",
      secondarySoft: "rgba(20, 184, 166, 0.14)",

      accent: palette.amber[400],
      onAccent: "#0B1220",
      accentSoft: "rgba(251, 191, 36, 0.18)",
    },
    states: {
      success: "#22C55E", // green-500
      warning: palette.amber[500],
      danger: palette.red[500],
      info: palette.blue[500],
    },
    overlay: "rgba(0, 0, 0, 0.45)",
    focusRing: palette.indigo[400],
  },
};

// Neutral chart-friendly sequence (works in both themes)
const chartColors = [
  palette.indigo[600],
  palette.teal[600],
  palette.amber[500],
  palette.blue[600],
  palette.emerald[600],
  palette.red[600],
  palette.indigo[400],
  palette.teal[400],
];

// Helpers
const hexToRgba = (hex, alpha = 1) => {
  const h = hex.replace("#", "");
  const bigint = parseInt(h.length === 3
    ? h.split("").map((c) => c + c).join("")
    : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Get theme set by mode: 'light' | 'dark'
const getColors = (mode = "light") => theme[mode] || theme.light;

export { chartColors, getColors, hexToRgba, palette, theme };
export default theme;
