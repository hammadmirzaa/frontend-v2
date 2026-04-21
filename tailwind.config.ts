import type { Config } from "tailwindcss";

/**
 * Force light-only: dark variant only applies when .dark is present.
 * We never add .dark, so the app always stays light regardless of system/browser theme.
 *
 * Semantic colors below must match src/lib/design-tokens.ts COLORS.
 * Update both when changing design colors (text-title, text-muted, brand, etc.).
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: false,
  theme: {
    extend: {
      colors: {
        title: "#18181b",
        subtitle: "#27272a",
        body: "#3f3f46",
        muted: "#71717a",
        placeholder: "#787878",
        brand: "#5B4CCC",
        "brand-title": "#2A218A",
        "brand-active": "#F3F1FF",
        "brand-border": "#9C8EF4",
        "input-bg": "#FDFDFD",
        "card-bg": "#fafafa",
        "table-header": "#FAF9FF",
        "table-header-alt": "#F7F5FB",
        "page-bg": "#FAFBFC",
        "search-bg": "#F9FAFB",
        "tab-selected": "#F9F8FF",
        "card-border": "#DADADA",
      },
    },
  },
  plugins: [],
};

export default config;
