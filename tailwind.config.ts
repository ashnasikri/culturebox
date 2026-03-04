import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        vault: {
          bg: "#0d0d14",
          surface: "#12121f",
          elevated: "#161625",
          warm: "#c4b5a0",
          cool: "#7a8ba0",
          "card-bg": "rgba(255,255,255,0.03)",
          "card-border": "rgba(255,255,255,0.06)",
          muted: "rgba(255,255,255,0.4)",
          text: "rgba(255,255,255,0.87)",
        },
      },
      fontFamily: {
        heading: ["var(--font-playfair)", "serif"],
        body: ["var(--font-dm-sans)", "sans-serif"],
        quote: ["var(--font-libre)", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
