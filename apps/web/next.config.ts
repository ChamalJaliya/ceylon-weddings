import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const s3Host = process.env.NEXT_PUBLIC_S3_IMAGE_HOST?.trim();
const s3Base = process.env.S3_PUBLIC_BASE_URL?.trim() || process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL?.trim();
let s3Hostname = s3Host;
if (!s3Hostname && s3Base) {
  try {
    s3Hostname = new URL(s3Base).hostname;
  } catch {
    s3Hostname = undefined;
  }
}

const remotePatterns: Array<{ protocol: "https"; hostname: string }> = [
  { protocol: "https", hostname: "images.unsplash.com" },
  { protocol: "https", hostname: "i.ytimg.com" },
];
if (s3Hostname) {
  remotePatterns.push({ protocol: "https", hostname: s3Hostname });
}

const config: NextConfig = {
  transpilePackages: [
    "@ceylonweddings/ui",
    "@ceylonweddings/web",
    "@ceylonweddings/contracts",
    "@ceylonweddings/i18n",
  ],
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns,
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days cache for images
  },
};

export default withNextIntl(config);

