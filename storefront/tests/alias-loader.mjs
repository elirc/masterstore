import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const target = path.join(root, "src", specifier.slice(2));
    return { url: pathToFileURL(target.endsWith(".ts") ? target : `${target}.ts`).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
