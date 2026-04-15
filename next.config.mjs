/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" }
    ]
  },
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: "javascript/esm",
      resolve: { fullySpecified: false },
    });
    // onnxruntime-web usa `new URL(...)` internamente; webpack lo convierte en
    // objetos URL y rompe RelativeURL. Desactivamos el asset resolution para ese paquete.
    config.module.rules.push({
      test: /\.m?js$/,
      include: /node_modules[\\/]onnxruntime-web/,
      parser: { url: false },
    });
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;
