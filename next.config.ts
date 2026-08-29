import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pptxgenjs", "better-sqlite3", "xlsx"],
};

export default nextConfig;
