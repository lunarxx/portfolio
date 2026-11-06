import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // the interview's answer route reads what it knows about him from this file at run time
  outputFileTracingIncludes: { '/api/ask': ['./src/meet/knowledge/**'] },
  // the call is the homepage now; links people already have keep working
  async redirects() { return [{ source: '/meet', destination: '/', permanent: false }] },
};

export default nextConfig;
