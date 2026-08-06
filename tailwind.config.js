/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        ink: {
          950: "#0a0908",
          900: "#100e0c",
          850: "#161412",
          800: "#1c1916",
          700: "#262220",
          600: "#332e2a",
          500: "#46403a",
        },
        bone: {
          50: "#f7f3ec",
          100: "#f0ebe1",
          200: "#dfd7c8",
          300: "#bdb2a0",
          400: "#8a807a",
          500: "#6b625b",
        },
        gold: {
          300: "#ffd95e",
          400: "#ffc83d",
          500: "#f5b800",
          600: "#d99c00",
          700: "#a87600",
        },
        fission: {
          300: "#ff7aae",
          400: "#ff2e7e",
          500: "#e91e63",
          600: "#c01550",
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        sans: ['"Hanken Grotesk"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(245,184,0,0.35), 0 8px 40px -8px rgba(245,184,0,0.35)",
        fissionglow:
          "0 0 0 1px rgba(255,46,126,0.35), 0 8px 40px -8px rgba(255,46,126,0.4)",
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 24px 48px -24px rgba(0,0,0,0.8)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
        "radial-gold":
          "radial-gradient(circle at 50% 0%, rgba(245,184,0,0.18), transparent 60%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseglow: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        scansheen: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both",
        shimmer: "shimmer 2.5s linear infinite",
        pulseglow: "pulseglow 2.4s ease-in-out infinite",
        scansheen: "scansheen 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
