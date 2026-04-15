import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://zach-wrtn.github.io',
  base: '/zzem-orchestrator',
  integrations: [react(), mdx()],
  output: 'static',
  build: { format: 'directory' }
});
