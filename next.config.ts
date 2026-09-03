import type { NextConfig } from "next";

/**
 * 站点部署在 GitHub 项目页子路径 https://dreamofxm.github.io/dailybox/
 * 因此必须设置 basePath + assetPrefix，否则构建产物的路由/资源会指向根域导致 404。
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: "/dailybox",
  assetPrefix: "/dailybox",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
