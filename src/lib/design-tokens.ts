/**
 * Design tokens – single source of truth for colors, spacing, typography, etc.
 * Change semantic tokens here (TEXT_*, BRAND_*, INPUT_BG, etc.) to update the app.
 * Tailwind theme in tailwind.config.ts extends from COLORS for utility classes
 * (text-title, text-muted, bg-brand, bg-input-bg, etc.).
 */
export const COLORS = {
  BLACK: "#000000",
  WHITE: "#ffffff",
  BRAND_02: "#5B4CCC",
  // Grays
  GRAY_50: "#fafafa",
  GRAY_100: "#f4f4f5",
  GRAY_200: "#e4e4e7",
  GRAY_300: "#d4d4d8",
  GRAY_400: "#a1a1aa",
  GRAY_500: "#71717a",
  GRAY_600: "#52525b",
  GRAY_700: "#3f3f46",
  GRAY_800: "#27272a",
  GRAY_900: "#18181b",
  GRAY_950: "#09090b",
  // Semantic text (use for headings, body, muted – change here to update app-wide)
  /** Bold / heading text */
  TEXT_TITLE: "#18181b",
  /** Semi-bold / subtitle text */
  TEXT_SUBTITLE: "#27272a",
  /** Body copy */
  TEXT_BODY: "#3f3f46",
  /** Muted / secondary text */
  TEXT_MUTED: "#71717a",
  /** Placeholder / footer text */
  TEXT_PLACEHOLDER: "#787878",
  // Brand (primary actions, links, active states)
  /** Primary brand color */
  BRAND: "#5B4CCC",
  /** Brand accent for titles / active labels (e.g. filter panel, stepper) */
  BRAND_TITLE: "#2A218A",
  /** Light brand background (chips, hover) */
  BRAND_ACTIVE_BG: "#F3F1FF",
  /** Brand border (outline, focus) */
  BRAND_BORDER: "#9C8EF4",
  INPUT_BRAND_SELECTED: "#F8F7FF",
  // Surfaces
  INPUT_BG: "#fafafa",
  CARD_BG: "#fafafa",
  PAGE_BG: "#FAFBFC",
  TABLE_HEADER_BG: "#FAF9FF",
  TABLE_HEADER_BG_ALT: "#F7F5FB",
  CARD_BORDER: "#DADADA",
  CARD_BORDER_LIGHT: "#E5E5E5",
  SEARCH_BG: "#F9FAFB",
  /** Tab selected state (e.g. Follow Ups filters) */
  TAB_SELECTED_BG: "#F9F8FF",
  CARD_TEXT_COLOR: "#787878",
  /** Stat card ellipsis (three dots); also notification/bell in header */
  ICON_ELLIPSIS: "#28303F",
  /** Search icon, header icons (fill) */
  ICON_PRIMARY: "#202020",
  /** Sidebar and UI icon strokes */
  ICON_SECONDARY: "#2A2A2A",
  /** Dark icon fill (e.g. inbox) */
  ICON_DARK: "#1F1F1F",
  // Semantic (reference the base colors or use hex)
  PRIMARY: "#000000",
  SECONDARY: "#52525b",
  SUCCESS: "#16a34a",
  DANGER: "#dc2626",
  WARNING: "#d97706",
  MUTED: "#71717a",
  BACKGROUND: "#ffffff",
  BACKGROUND_SECONDARY: "#fafafa",
  FOREGROUND: "#18181b",
  FOREGROUND_MUTED: "#71717a",
  SUBTEXT: "#787878",
  // Named palette
  RED: "#dc2626",
  ORANGE: "#ea580c",
  AMBER: "#d97706",
  YELLOW: "#ca8a04",
  LIME: "#65a30d",
  GREEN: "#16a34a",
  EMERALD: "#059669",
  TEAL: "#0d9488",
  CYAN: "#0891b2",
  SKY: "#0284c7",
  BLUE: "#2563eb",
  INDIGO: "#4f46e5",
  VIOLET: "#7c3aed",
  PURPLE: "#9333ea",
  FUCHSIA: "#c026d3",
  PINK: "#db2777",
  ROSE: "#e11d48",
  ACTIVE_COLOR: "#E8FFEB",
  ACTIVE_COLOR_TEXT: "#41A71C",
  /** Stepper / progress inactive track */
  BORDER_INACTIVE: "#E5E7EB",
  /** Preview / decorative brand tint */
  BRAND_TINT: "#E0D9F7",
  // Leads / dashboard empty state and callouts (no hardcoded colors in components)
  /** Avatar online status indicator */
  STATUS_ONLINE: "#16a34a",
  /** Empty state main icon container (person + plus) */
  EMPTY_STATE_ICON_BG: "#EDE9FE",
  EMPTY_STATE_ICON_BORDER: "#A78BFA",
  /** Feature callout icon backgrounds (target, calendar, chart) */
  CALLOUT_ICON_BG_1: "#EEF2FF",
  CALLOUT_ICON_BG_2: "#EDE9FE",
  CALLOUT_ICON_BG_3: "#ECFDF5",
  CALLOUT_ICON_BORDER_1: "#C7D2FE",
  CALLOUT_ICON_BORDER_2: "#C4B5FD",
  CALLOUT_ICON_BORDER_3: "#A7F3D0",
  /** Scheduled activity card icon backgrounds (blue, purple, green, yellow) */
  ACTIVITY_ICON_BG_BLUE: "#DBEAFE",
  ACTIVITY_ICON_BG_PURPLE: "#EDE9FE",
  ACTIVITY_ICON_BG_GREEN: "#D1FAE5",
  ACTIVITY_ICON_BG_YELLOW: "#FEF3C7",
} as const;

/** Explicit colors for onboarding – do not change with browser dark mode */
export const ONBOARDING = {
  BG_DARK: "#1A1A1A",
  WHITE: "#FFFFFF",
  CARD_WHITE: "#FFFFFF",
  CARD_OFF_WHITE: "#F8F8FC",
  LABEL_TOP: "#CCCCCC",
  TEXT_TITLE: "#000000",
  TEXT_BODY: "#333333",
  TEXT_MUTED: "#666666",
  TEXT_FOOTER: "#A0A0A0",
  INPUT_BG: "#FDFDFD",
  INPUT_BORDER: "#FDFDFD",
  INPUT_BORDER_STEP2: "#DDDDDD",
  INPUT_PLACEHOLDER: "#A0A0A0",
  CHIP_BG: "#F8F8F8",
  CHIP_BG_SELECTED: "#EEEEEE",
  CHIP_BORDER: "#E0E0E0",
  GOAL_BUTTON_BG: "#EEEEF4",
  GOAL_BUTTON_BORDER: "#DDDDDD",
  PROGRESS_ACTIVE: "#6E50FF",
  PROGRESS_ACTIVE_STEP2: "#6633CC",
  PROGRESS_INACTIVE: "#E0E0E0",
  PROGRESS_INACTIVE_STEP2: "#EEEEF4",
  BUTTON_PRIMARY: "#6E50FF",
  BUTTON_PRIMARY_STEP2: "#6633CC",
  BUTTON_SKIP_BG: "#F0F0F0",
  BUTTON_SKIP_STEP2_BG: "#EEEEF4",
} as const;

export const typography = {
  fontFamily: {
    sans: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
    mono: "var(--font-geist-mono), ui-monospace, monospace",
    serif: "ui-serif, Georgia, serif",
  },
  fontSize: {
    xs: ["0.75rem", { lineHeight: "1rem" }],
    sm: ["0.875rem", { lineHeight: "1.25rem" }],
    base: ["1rem", { lineHeight: "1.5rem" }],
    lg: ["1.125rem", { lineHeight: "1.75rem" }],
    xl: ["1.25rem", { lineHeight: "1.75rem" }],
    "2xl": ["1.5rem", { lineHeight: "2rem" }],
    "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
    "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
    "5xl": ["3rem", { lineHeight: "1" }],
    "6xl": ["3.75rem", { lineHeight: "1" }],
  },
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
} as const;

export const spacing = {
  0: "0",
  0.5: "0.125rem",  // 2px
  1: "0.25rem",     // 4px
  1.5: "0.375rem",  // 6px
  2: "0.5rem",      // 8px
  2.5: "0.625rem",  // 10px
  3: "0.75rem",     // 12px
  3.5: "0.875rem",  // 14px
  4: "1rem",        // 16px
  5: "1.25rem",     // 20px
  6: "1.5rem",      // 24px
  7: "1.75rem",     // 28px
  8: "2rem",        // 32px
  9: "2.25rem",     // 36px
  10: "2.5rem",     // 40px
  11: "2.75rem",    // 44px
  12: "3rem",       // 48px
  14: "3.5rem",     // 56px
  16: "4rem",       // 64px
  20: "5rem",       // 80px
  24: "6rem",       // 96px
} as const;

export const radius = {
  none: "0",
  sm: "0.125rem",   // 2px
  DEFAULT: "0.25rem", // 4px
  md: "0.375rem",   // 6px
  lg: "0.5rem",     // 8px
  xl: "0.75rem",    // 12px
  "2xl": "1rem",    // 16px
  "3xl": "1.5rem",  // 24px
  full: "9999px",
} as const;

export const shadows = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
  none: "none",
} as const;

export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  toast: 1600,
  max: 9999,
} as const;

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;
