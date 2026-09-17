export const globalConstants = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
};

export function withBasePath(path: string) {
  if (!globalConstants.basePath) return path;

  return `${globalConstants.basePath}/${path.replace(/^\/+/, "")}`;
}
