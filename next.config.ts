import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // the interview's answer route reads what it knows about him from this file at run time
  outputFileTracingIncludes: { '/api/ask': ['./src/meet/knowledge/**'] },
};

export default nextConfig;
