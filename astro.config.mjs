// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import typography from '@tailwindcss/typography';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss({
      config: {
          plugins: [typography],
      },
  })],
  },

  integrations: [react()],
});