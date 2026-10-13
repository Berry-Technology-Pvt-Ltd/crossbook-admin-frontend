import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // Disable Next.js 16's auto-generated AGENTS.md/CLAUDE.md "agent rules"
  // block — this repo's own CLAUDE.md/AGENTS.md already document the project
  // for coding agents, and the managed block is re-written on every `next
  // dev` run, which fights hand-edits to those files.
  agentRules: false,
};

export default nextConfig;
