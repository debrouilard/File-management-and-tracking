/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Source Sans 3'", "system-ui", "sans-serif"],
        display: ["'Fraunces'", "Georgia", "serif"],
      },
      colors: {
        brand: {
          bannerFrom: "#EAF2F6",
          bannerTo: "#DCE6EC",
          sidebar: "#3F79A8",
          hover: "#C8DDBF",
          headerFrom: "#4F86B5",
          headerTo: "#2F5F8A",
        },
        ink: {
          950: "#0b1220",
          900: "#111827",
          700: "#374151",
          500: "#6b7280",
          300: "#d1d5db",
        },
        line: "#e5e7eb",
        surface: "#fafafa",
        accent: "#1e3a5f",
        accent2: "#b45309",
      },
    },
  },
  plugins: [],
};
