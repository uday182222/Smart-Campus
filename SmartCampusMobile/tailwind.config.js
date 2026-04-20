/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./navigation/**/*.{js,jsx,ts,tsx}",
    "./contexts/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // NEW LIGHT THEME
        primary: "#2B5CE6", // Main blue
        "primary-dark": "#1E3FA0", // Darker blue (headers)
        "primary-light": "#EEF2FF", // Very light blue (backgrounds)
        secondary: "#22C55E", // Green accent
        "secondary-light": "#DCFCE7", // Light green
        background: "#EEF2FF", // Light lavender background
        "bg-gradient-start": "#E8EFFE",
        "bg-gradient-end": "#F0F4FF",
        card: "#FFFFFF",
        "card-border": "#E2E8F0",
        dark: "#1A1A2E", // Dark navy text
        muted: "#64748B", // Gray text
        "muted-light": "#94A3B8", // Lighter gray
        border: "#E2E8F0",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",

        // Keep dark theme colors for super admin
        "sa-bg": "#0D0D0D",
        "sa-card": "#1A1A1A",
        lime: "#CBFF00",
      },
      borderRadius: {
        "2xl": "20px",
        "3xl": "28px",
        "4xl": "36px",
      },
      fontSize: {
        display: ["40px", { lineHeight: "44px", letterSpacing: "-1px" }],
        heading: ["28px", { lineHeight: "32px", letterSpacing: "-0.5px" }],
        title: ["20px", { lineHeight: "24px", letterSpacing: "-0.3px" }],
      },
      fontWeight: {
        black: "900",
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
