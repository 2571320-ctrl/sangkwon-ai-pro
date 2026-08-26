import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },
  webpack: (config, { isServer, webpack: wp }) => {
    if (!isServer) {
      // Strip `node:` URI prefix so webpack fallbacks can handle built-ins
      // (pptxgenjs uses node:fs and node:https internally)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      config.plugins = config.plugins ?? []
      config.plugins.push(
        new (wp as any).NormalModuleReplacementPlugin(
          /^node:/,
          (resource: { request: string }) => {
            resource.request = resource.request.replace(/^node:/, '')
          }
        )
      )

      config.resolve = config.resolve ?? {}
      config.resolve.fallback = {
        ...(config.resolve.fallback as Record<string, false | string> ?? {}),
        fs: false,
        https: false,
        http: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        os: false,
        stream: false,
        zlib: false,
        buffer: false,
      }
    }
    return config
  },
}

export default nextConfig
