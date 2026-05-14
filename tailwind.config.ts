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
        background: "#F8FAFC",
        surface: "#FFFFFF",
        "surface-container": "#F1F5F9",
        "surface-tint": "#0C2E5E",
        "surface-dim": "#E2E8F0",
        "surface-container-lowest": "#FFFFFF",
        "surface-container-highest": "#E2E8F0",
        "surface-bright": "#FCFDFE",
        "surface-variant": "#F1F5F9",
        "surface-container-low": "#F8FAFC",
        "surface-container-high": "#F1F5F9",
        "inverse-surface": "#051630",
        "inverse-on-surface": "#F1F5F9",

        primary: "#0C2E5E",
        "on-primary": "#ffffff",
        "primary-container": "#0E3E7A",
        "on-primary-container": "#E2E8F0",
        "inverse-primary": "#00C6FF",
        "primary-fixed": "#0C2E5E",
        "primary-fixed-dim": "#0E3E7A",
        "on-primary-fixed-variant": "#0C2E5E",
        "on-primary-fixed": "#FFFFFF",

        secondary: "#00C6FF",
        "on-secondary": "#ffffff",
        "secondary-container": "#E0F2FE",
        "on-secondary-container": "#0369A1",
        "secondary-fixed": "#E0F2FE",
        "secondary-fixed-dim": "#BAE6FD",
        "on-secondary-fixed": "#0C2E5E",
        "on-secondary-fixed-variant": "#0C2E5E",

        tertiary: "#DCA837",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#FEF3C7",
        "on-tertiary-container": "#92400E",
        "tertiary-fixed": "#FEF3C7",
        "tertiary-fixed-dim": "#FDE68A",
        "on-tertiary-fixed": "#451A03",
        "on-tertiary-fixed-variant": "#DCA837",

        error: "#EF4444",
        "on-error": "#ffffff",
        "error-container": "#FEE2E2",
        "on-error-container": "#991B1B",

        "on-surface": "#0C2E5E",
        "on-surface-variant": "#64748B",
        "on-background": "#0C2E5E",
        
        outline: "#CBD5E1",
        "outline-variant": "#E2E8F0",
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
