/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
    "./data/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        leaf: "var(--leaf)",
        "leaf-deep": "var(--leaf-deep)",
        cream: "var(--cream)",
        sun: "var(--sun)",
        earth: "var(--earth)",
        ink: "var(--ink)",
        "glass-line": "var(--glass-line)",
        "muted-foreground": "var(--muted-foreground)",
      },
      fontFamily: {
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
        sans: ["DM Sans", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

