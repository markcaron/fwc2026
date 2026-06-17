import { esbuildPlugin } from '@web/dev-server-esbuild';

export default {
  nodeResolve: true,
  open: true,
  middleware: [
    // In production, build.mjs copies public/sw.js → dist/sw.js so it is
    // served at /sw.js. In dev there is no build step, so rewrite the request
    // here so the registration at /sw.js resolves correctly.
    async (ctx, next) => {
      if (ctx.path === '/sw.js') ctx.path = '/public/sw.js';
      return next();
    },
  ],
  plugins: [
    esbuildPlugin({
      ts: true,
      target: 'es2022',
      tsconfig: './tsconfig.json',
    }),
  ],
};
