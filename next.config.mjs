/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development';

const nextConfig = {
  serverExternalPackages: ['mongodb'],
  // Dev-only: LocatorJS loader tags every rendered element with a
  // data-locatorjs="/path/file.tsx:line:col" attribute so you can inspect any
  // span/div and jump straight to its source. Turbopack/SWC can't run Babel
  // plugins, so this uses the loader variant. Stripped entirely in prod builds.
  ...(isDev && {
    turbopack: {
      rules: {
        '**/*.{tsx,jsx}': {
          loaders: [
            {
              loader: '@locator/webpack-loader',
              options: { env: 'development' },
            },
          ],
        },
      },
    },
  }),
};

export default nextConfig;
