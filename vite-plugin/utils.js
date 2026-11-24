import { readFileSync, existsSync } from "fs";
import { join } from "path";

/**
 * Return the subset of `packages` that are actually declared in the project's
 * package.json (deps/devDeps/peerDeps). Used to seed Vite's optimizeDeps.include
 * without listing packages the app doesn't have.
 */
export function filterPackagesInProject(packages, root) {
  try {
    const packageJsonPath = join(root, "package.json");
    if (!existsSync(packageJsonPath)) {
      return [];
    }

    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies,
    };

    return packages.filter((pkg) => pkg in allDeps);
  } catch (error) {
    console.warn("Failed to read project package.json:", error);
    return [];
  }
}
