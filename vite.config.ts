import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Link previews (WhatsApp, iMessage, Facebook, X…) need the share image as a full https:// address, so the site's
 * public address is injected into index.html at build time. Set it before building for production, e.g.
 *   SITE_URL=https://dileep-kavya.example npm run build      (or put SITE_URL=… in a .env file)
 */
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const siteUrl = (env.SITE_URL ?? '').trim().replace(/\/+$/, '');
  return {
    plugins: [
      react(),
      {
        name: 'site-url',
        // 'pre': substitute before Vite parses the page's URLs (it cannot decode the %SITE_URL% placeholder).
        transformIndexHtml: {
          order: 'pre' as const,
          handler(html: string) {
            if (command === 'build' && !siteUrl) {
              console.warn(
                '\n⚠  SITE_URL is not set: link previews (the share image) will not show until the site is built with its ' +
                  'public address, e.g. SITE_URL=https://your-domain npm run build\n',
              );
            }
            return html.replaceAll('%SITE_URL%', siteUrl);
          },
        },
      },
    ],
    base: './',
    build: { target: 'es2020', cssCodeSplit: true },
    test: { environment: 'node' },
  };
}) as never;
