import { createRequire } from "node:module";
import { createServer } from "node:http";

const require = createRequire(import.meta.url);
const { vercelApiHandler } = require("../dist/serverless/control-plane.cjs");
const server = createServer(vercelApiHandler);

await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();
const input = encodeURIComponent(JSON.stringify({ 0: { json: null, meta: { values: ["undefined"] } } }));

try {
  const response = await fetch(`http://127.0.0.1:${port}/api/trpc/controlPlane.snapshot?batch=1&input=${input}`);
  const body = await response.text();
  if (!response.ok || !body.includes("Atlas Control Plane")) {
    throw new Error(`Vercel API bundle returned ${response.status}: ${body.slice(0, 300)}`);
  }
  console.log("Vercel API bundle returned the control-plane snapshot successfully.");
} finally {
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}
