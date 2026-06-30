/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        primary:   { DEFAULT: '#6366F1', light: '#818CF8', dark: '#4F46E5' },
        accent:    { DEFAULT: '#06B6D4', light: '#67E8F9', dark: '#0891B2' },
        success:   { DEFAULT: '#22C55E', light: '#86EFAC', dark: '#16A34A' },
        warning:   { DEFAULT: '#F59E0B', light: '#FCD34D', dark: '#D97706' },
        danger:    { DEFAULT: '#EF4444', light: '#FCA5A5', dark: '#DC2626' },
        surface:   { DEFAULT: '#FFFFFF',   dark: '#1E293B' },
        bg:        { DEFAULT: '#F8FAFC',   dark: '#0F172A' },
        border:    { DEFAULT: '#E2E8F0',   dark: '#334155' },
        muted:     { DEFAULT: '#64748B',   dark: '#94A3B8' },
        heading:   { DEFAULT: '#0F172A',   dark: '#F1F5F9' },
      },
      borderRadius: { xl2: '16px', xl3: '20px' },
      boxShadow: {
        card:   '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08)',
        modal:  '0 20px 60px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
};
