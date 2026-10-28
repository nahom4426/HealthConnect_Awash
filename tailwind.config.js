/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{js,vue,ts,jsx,tsx}"],
  // `dark:` follows the in-app theme toggle (stores/darkMode sets both `.dark` and data-theme on <html>)
  darkMode: ["variant", [':root[data-theme="dark"] &', ":root.dark &"]],
  theme: {
    extend: {
      // Brand-coloured text/icons use a lighter shade in dark mode (see --primary-fg)
      textColor: {
        primary: {
          DEFAULT: token("primary-fg"),
          hover: token("primary-hover"),
        },
      },
      colors: {
        // Brand
        primary: {
          DEFAULT: token("primary"),
          hover: token("primary-hover"),
        },
        "primary-light": token("primary-light"),
        "primary-dark": token("primary-dark"),
        "brand-accent": token("brand-accent"),
        secondary: token("secondary"),

        // Semantic neutrals
        canvas: token("canvas"),
        surface: {
          DEFAULT: token("surface"),
          muted: token("surface-muted"),
          raised: token("surface-raised"),
        },
        line: {
          DEFAULT: token("line"),
          strong: token("line-strong"),
        },
        ink: {
          DEFAULT: token("ink"),
          muted: token("ink-muted"),
          subtle: token("ink-subtle"),
        },

        // Feedback
        success: { DEFAULT: token("success"), soft: token("success-soft"), strong: token("success-strong") },
        warning: { DEFAULT: token("warning"), soft: token("warning-soft"), strong: token("warning-strong") },
        error: { DEFAULT: token("error"), soft: token("error-soft"), strong: token("error-strong") },
        info: token("info"),

        // Legacy names used across feature pages
        "text-clr": token("text-clr"),
        accent: token("accent"),
        orangebg: token("orange"),
        "base-clr": token("base-clr"),
        "base-clr2": token("base-clr2"),
        "base-clr3": token("base-clr3"),
        "base-clr4": token("base-clr4"),
        dark: token("dark"),
      },
      fontSize: {
        lg: ["1.25rem", "1.75rem"],
        md: ["1.125rem", "1.575rem"],
        base: ["1rem", "1.4rem"],
        sm: ["0.875rem", "1.25rem"],
        xs: ["0.75rem", "1rem"],
        xxs: ["0.625rem", "0.75rem"],
      },
      spacing: {
        "drawer-width": "var(--drawer-width)",
        "drawer-collapsed": "var(--drawer-collapsed-width)",
        "navbar-height": "var(--navbar-height)",
        control: "var(--control-h)",
        "control-sm": "var(--control-h-sm)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        pop: "var(--shadow-pop)",
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.03)",
        soft: "0 2px 8px -2px rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        medium: "0 4px 16px -4px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.04)",
        elevated: "0 8px 32px -8px rgb(0 0 0 / 0.12), 0 4px 8px -4px rgb(0 0 0 / 0.04)",
        focus: "var(--focus-ring)",
        "primary-sm": "0 2px 8px rgba(13,79,128,0.18)",
        "primary-md": "0 4px 16px rgba(13,79,128,0.28)",
        "primary-lg": "0 8px 32px rgba(13,79,128,0.35)",
      },
      transitionTimingFunction: {
        out: "var(--ease-out)",
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-down": "slideDown 0.2s ease-out",
        "scale-in": "scaleIn 0.15s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
