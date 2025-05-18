module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: [
    {
      pattern: /data-\[state=active\].*/,
      variants: ["responsive", "hover", "focus", "active"],
    }
  ]
};
