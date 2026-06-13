/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,vue,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "rgba(var(--primary) / <alpha-value>)",
        secondary: "rgba(var(--secondary) / <alpha-value>)",
        "text-clr": "rgba(var(--text-clr) / <alpha-value>)",
        accent: "rgba(var(--accent) / <alpha-value>)",
        orangebg: "rgba(var(--orange) / <alpha-value>)",
        "base-clr": "rgba(var(--base-clr) / <alpha-value>)",
        "base-clr2": "rgba(var(--base-clr2) / <alpha-value>)",
        "base-clr3": "rgba(var(--base-clr3) / <alpha-value>)",
        "base-clr4": "rgba(var(--base-clr4) / <alpha-value>)",
        dark: "rgba(var(--dark) / <alpha-value>)",
        error: "rgba(var(--error) / <alpha-value>)",
        surface: {
          DEFAULT: "#ffffff",
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
        },
        border: {
          DEFAULT: "#e2e8f0",
          light: "#f1f5f9",
          focus: "rgba(var(--primary) / 0.5)",
        },
      },
      fontSize: {
        lg: ["1.25rem", "1.75rem"],
        md: ["1.125rem", "1.575rem"],
        base: ["1rem", "1.4rem"],
        sm: ["0.875rem", "1.225rem"],
        xs: ["0.75rem", "1rem"],
        xxs: ["0.625rem", "0.75rem"],
      },
      spacing: {
        "drawer-width": "var(--drawer-width)",
        "navbar-height": "var(--navbar-height)",
      },
      boxShadow: {
        "xs": "0 1px 2px 0 rgb(0 0 0 / 0.03)",
        "soft": "0 2px 8px -2px rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        "medium": "0 4px 16px -4px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.04)",
        "elevated": "0 8px 32px -8px rgb(0 0 0 / 0.12), 0 4px 8px -4px rgb(0 0 0 / 0.04)",
        "glow-primary": "0 0 0 3px rgba(var(--primary) / 0.15)",
        "glow-error": "0 0 0 3px rgba(239, 68, 68, 0.15)",
        "glow-success": "0 0 0 3px rgba(34, 197, 94, 0.15)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.2s ease-out",
        "slide-down": "slideDown 0.2s ease-out",
        "scale-in": "scaleIn 0.15s ease-out",
        "spin-slow": "spin 2s linear infinite",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      transitionTimingFunction: {
        "bounce-in": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};
