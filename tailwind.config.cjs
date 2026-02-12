/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Changa", "Cairo", "system-ui", "sans-serif"],
        body: ["Cairo", "system-ui", "sans-serif"],
      },
      borderRadius: { xl2: "1.25rem", xl3: "1.75rem", xl4: "2.25rem" },
      boxShadow: {
        glow: "0 0 0 1px rgba(17, 94, 89, 0.18), 0 24px 70px rgba(40, 28, 20, 0.2)",
        soft: "0 14px 35px rgba(40, 28, 20, 0.14)",
        inset: "inset 0 0 0 1px rgba(31, 27, 22, 0.12)"
      },
      keyframes: {
        floaty: { "0%,100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-10px)" } },
        shimmer: { "0%": { backgroundPosition: "0% 50%" }, "100%": { backgroundPosition: "100% 50%" } },
        pulseGlow: { "0%,100%": { opacity: "0.55", transform: "scale(1)" }, "50%": { opacity: "1", transform: "scale(1.08)" } },
        scan: { "0%": { transform: "translateY(-120%)" }, "100%": { transform: "translateY(120%)" } }
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
        shimmer: "shimmer 7s ease-in-out infinite",
        pulseGlow: "pulseGlow 1.8s ease-in-out infinite",
        scan: "scan 2.8s ease-in-out infinite",
      }
    },
  },
  plugins: [],
};
