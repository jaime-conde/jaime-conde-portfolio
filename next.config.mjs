const isGitHubPages = process.env.GITHUB_ACTIONS === "true";
const repositoryBasePath = "/jaime-conde-portfolio";

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
