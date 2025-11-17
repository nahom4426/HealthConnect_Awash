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
        accent: "rgba(var(--accent) / <alpha-value>)",
        dark: "rgba(var(--dark) / <alpha-value>)",
        error: "rgba(var(--error) / <alpha-value>)",
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
    },
  },
  plugins: [],
};
