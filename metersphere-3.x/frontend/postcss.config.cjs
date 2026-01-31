const tailwindcss = require('tailwindcss');

// Custom plugin to skip Tailwind processing for Less files
const skipTailwindForLess = () => {
  return {
    postcssPlugin: 'skip-tailwind-for-less',
    Once(root, { result }) {
      const file = result.opts.from || '';
      if (file.endsWith('.less') || file.includes('.less?')) {
        // Remove @apply rules from Less files to prevent errors
        root.walkAtRules('apply', (rule) => {
          // Convert @apply to comments to preserve the structure
          rule.remove();
        });
      }
    },
  };
};
skipTailwindForLess.postcss = true;

module.exports = {
  plugins: [
    require('postcss-import'),
    require('tailwindcss/nesting'), // Use Tailwind's nesting plugin
    skipTailwindForLess(),
    tailwindcss(),
    require('autoprefixer'),
  ],
};
