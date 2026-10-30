import type { Theme } from "../content/types"

/** Theme presets: used by the seed decks and offered in the editor's theme picker. */
export const THEMES = {
  midnight: {
    name: "Midnight Orange",
    primary: "#1E1B4B",
    onPrimary: "#FFFFFF",
    secondary: "#F97316",
    background: "#FFFFFF",
    surface: "#F1F5F9",
    text: "#0F172A",
    muted: "#64748B",
    fontHeading: "Arial",
    fontBody: "Arial",
  },
  ocean: {
    name: "Ocean Teal",
    primary: "#0F766E",
    onPrimary: "#F0FDFA",
    secondary: "#F59E0B",
    background: "#FFFFFF",
    surface: "#ECFDF5",
    text: "#134E4A",
    muted: "#5B7C79",
    fontHeading: "Segoe UI",
    fontBody: "Segoe UI",
  },
  violet: {
    name: "Violet Fresh",
    primary: "#5B21B6",
    onPrimary: "#FFFFFF",
    secondary: "#22D3EE",
    background: "#FAF5FF",
    surface: "#FFFFFF",
    text: "#2E1065",
    muted: "#6B5B8A",
    fontHeading: "Trebuchet MS",
    fontBody: "Verdana",
  },
  classic: {
    name: "Classic Crimson",
    primary: "#9F1239",
    onPrimary: "#FFF1F2",
    secondary: "#FBBF24",
    background: "#FFFBF5",
    surface: "#FFFFFF",
    text: "#1C1917",
    muted: "#78716C",
    fontHeading: "Georgia",
    fontBody: "Calibri",
  },
} satisfies Record<string, Theme>

export const THEME_PRESETS: Theme[] = Object.values(THEMES)
