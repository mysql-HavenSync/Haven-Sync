/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")], // ✅ Add this line
  theme: {
    extend: {
      colors: {
        primary: "#6366F1",
        secondary: "#A5B4FC",
      },
    },
  },
  plugins: [],
};
