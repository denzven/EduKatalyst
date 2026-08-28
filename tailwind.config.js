/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Direct 5-Color Palette Swatches
        'dry-sage': '#C9CBA3',
        'soft-peach': '#FFE1A8',
        'vibrant-coral': '#E26D5C',
        'wine-plum': '#723D46',
        'mauve-shadow': '#472D30',

        // Dynamic Semantic Theme Variables
        ground: 'var(--bg-ground)',
        surface: {
          DEFAULT: 'var(--bg-surface)',
          hover: 'var(--bg-surface-hover)',
          active: 'var(--bg-surface-active)',
        },
        theme: {
          border: 'var(--border-color)',
        },
        main: 'var(--text-primary)',
        sub: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        coral: {
          DEFAULT: 'var(--accent-coral)',
        },
        peach: 'var(--accent-peach)',
        sage: 'var(--accent-sage)',
        plum: 'var(--accent-plum)',
        shadow: 'var(--accent-shadow)',
      }
    },
  },
  plugins: [],
}
