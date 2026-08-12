const isGitHubPages = process.env.GITHUB_ACTIONS === "true";
const repositoryBasePath = "/portfolio";

/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  ...(isGitHubPages
    ? {
        basePath: repositoryBasePath,
        assetPrefix: repositoryBasePath,
      }
    : {}),
};

export default nextConfig;
