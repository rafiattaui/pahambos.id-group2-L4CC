/** @type {import("prettier").Config} */
const config = {
  // --- Standard Styles ---
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 80,

  // --- Plugins ---
  // This automatically sorts your Tailwind classes
  plugins: ['prettier-plugin-tailwindcss'],
};

export default config;