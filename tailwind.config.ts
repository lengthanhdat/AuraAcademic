import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        background: "#f7f9fb",
        surface: "#f7f9fb",
        "surface-container": "#eceef0",
        "surface-tint": "#2d6197",
        "surface-dim": "#d8dadc",
        "surface-container-lowest": "#ffffff",
        "surface-container-highest": "#e0e3e5",
        "surface-bright": "#f7f9fb",
        "surface-variant": "#e0e3e5",
        "surface-container-low": "#f2f4f6",
        "surface-container-high": "#e6e8ea",
        "inverse-surface": "#2d3133",
        "inverse-on-surface": "#eff1f3",

        primary: "#00355f",
        "on-primary": "#ffffff",
        "primary-container": "#0f4c81",
        "on-primary-container": "#8ebdf9",
        "inverse-primary": "#a0c9ff",
        "primary-fixed": "#d2e4ff",
        "primary-fixed-dim": "#a0c9ff",
        "on-primary-fixed-variant": "#07497d",
        "on-primary-fixed": "#001c37",

        secondary: "#4f6076",
        "on-secondary": "#ffffff",
        "secondary-container": "#d2e4ff",
        "on-secondary-container": "#55667d",
        "secondary-fixed": "#d2e4ff",
        "secondary-fixed-dim": "#b6c8e2",
        "on-secondary-fixed": "#0a1c30",
        "on-secondary-fixed-variant": "#37485e",

        tertiary: "#532800",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#743b00",
        "on-tertiary-container": "#f9a767",
        "tertiary-fixed": "#ffdcc4",
        "tertiary-fixed-dim": "#ffb780",
        "on-tertiary-fixed": "#2f1400",
        "on-tertiary-fixed-variant": "#6f3800",

        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",

        "on-surface": "#191c1e",
        "on-surface-variant": "#42474f",
        "on-background": "#191c1e",
        
        outline: "#727780",
        "outline-variant": "#c2c7d1",
      },
      fontFamily: {
        headline: ["var(--font-manrope)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        label: ["var(--font-inter)", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
