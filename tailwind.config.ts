import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0f',
        surface: '#12121a',
        card: '#1a1a2e',
        'accent-gold': '#d4a843',
        'accent-purple': '#7c3aed',
        'text-primary': '#e2e2e8',
        'text-muted': '#888892',
      },
      fontFamily: {
        pixel: ['DungGeunMo', 'monospace'],
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
