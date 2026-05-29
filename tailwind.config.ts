import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#f59e0b',   // 暖黄色—用于3天提醒
          mild: '#fde68a',
          strong: '#d97706',
        },
      },
    },
  },
  plugins: [],
}

export default config
