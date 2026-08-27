import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { parse } from "yaml";

export type ApplicationMap = {
  generatedAt: string;
  routes: string[];
  components: string[];
  apiModules: string[];
  dependencies: string[];
  environmentExpectations: string[];
  protectedBoundaries: string[];
};

type Contract = { architecture?: { protected_boundaries?: string[]; environment_expectations?: string[] } };

async function walk(directory: string, root: string): Promise<string[]> {
  const entries = await readdir(directory);
  const files: string[] = [];
  for (const entry of entries) {
    if (["node_modules", "dist", ".git", "playwright-report", "test-results"].includes(entry)) continue;
    const fullPath = join(directory, entry);
    const metadata = await stat(fullPath);
    if (metadata.isDirectory()) files.push(...(await walk(fullPath, root)));
    else files.push(relative(root, fullPath));
  }
  return files;
}

export async function discoverApplicationMap(root = process.cwd()): Promise<ApplicationMap> {
  const [files, packageSource, contractSource] = await Promise.all([
    walk(root, root),
    readFile(join(root, "package.json"), "utf8"),
    readFile(join(root, "autonomous/application-contract.yaml"), "utf8"),
  ]);
  const packageJson = JSON.parse(packageSource) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
  const contract = parse(contractSource) as Contract;
  return {
    generatedAt: new Date().toISOString(),
    routes: files.filter(file => file === "client/src/App.tsx" || file.startsWith("client/src/pages/")),
    components: files.filter(file => file.startsWith("client/src/components/") && file.endsWith(".tsx")),
    apiModules: files.filter(file => file.startsWith("server/") && file.endsWith(".ts")),
    dependencies: Object.keys({ ...packageJson.dependencies, ...packageJson.devDependencies }).sort(),
    environmentExpectations: contract.architecture?.environment_expectations ?? [],
    protectedBoundaries: contract.architecture?.protected_boundaries ?? [],
  };
}
