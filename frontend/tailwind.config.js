/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#FAF9F5",
          card: "#FFFFFF",
          soft: "#F5F3EC",
          subtle: "#EFECE6",
        },
        charcoal: {
          DEFAULT: "#141413",
          secondary: "#636159",
          muted: "#8F8D84",
          light: "#B8B6AD",
        },
        terracotta: {
          DEFAULT: "#D97757",
          hover: "#C26547",
          light: "#FDF4F0",
          border: "#F4D7CE",
          dark: "#A84E33",
        },
        beige: {
          DEFAULT: "#E8E6DC",
          subtle: "#F0EEE6",
          strong: "#D6D3C8",
        },
        sage: {
          DEFAULT: "#2E7D5B",
          light: "#F1F8F5",
          border: "#D1EAE0",
        },
        ochre: {
          DEFAULT: "#B45309",
          light: "#FEF7ED",
          border: "#FDE68A",
        },
        rust: {
          DEFAULT: "#B91C1C",
          light: "#FEF2F2",
          border: "#FCA5A5",
        },
      },
      fontFamily: {
        serif: [
          '"Newsreader"',
          'ui-serif',
          'Georgia',
          'Cambria',
          '"Times New Roman"',
          'Times',
          'serif',
        ],
        sans: [
          '"Inter"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(20, 20, 19, 0.04), 0 1px 2px -1px rgba(20, 20, 19, 0.04)",
        card: "0 2px 6px -1px rgba(20, 20, 19, 0.05), 0 1px 4px -1px rgba(20, 20, 19, 0.03)",
        elevated: "0 10px 25px -3px rgba(20, 20, 19, 0.07), 0 4px 10px -2px rgba(20, 20, 19, 0.04)",
      },
    },
  },
  plugins: [],
};
