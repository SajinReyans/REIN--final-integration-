/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.ejs", "./public/js/**/*.js"],
  theme: {
    extend: {
      colors: {
        station: {
          bg: "#0F1613",
          panel: "#161F1B",
          panelLight: "#1E2A24",
          line: "#2A3A32",
          text: "#EAE7DC",
          muted: "#8FA096",
        },
        amber: {
          signal: "#E8A33D",
        },
        cyan: {
          signal: "#4FB6C7",
        },
        alert: {
          signal: "#D65A4A",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
        body: ["'Inter'", "sans-serif"],
      },
      boxShadow: {
        panel: "0 0 0 1px #2A3A32, 0 8px 24px rgba(0,0,0,0.35)",
      },
      backgroundImage: {
        grid: "linear-gradient(#1E2A24 1px, transparent 1px), linear-gradient(90deg, #1E2A24 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "24px 24px",
      },
    },
  },
  plugins: [],
};
