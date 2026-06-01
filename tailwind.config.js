/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        score: {
          fire: "#f97316",
          good: "#22c55e",
          maybe: "#eab308",
          poor: "#64748b",
          sketchy: "#ef4444",
        },
        ink: {
          base: "#0b1220",
          panel: "#111a2c",
          line: "#1e2a44",
          muted: "#8aa0c6",
          text: "#e5edff",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
