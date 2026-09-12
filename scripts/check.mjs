import { readdir, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
const files = [];
async function visit(dir) {
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    if ([".git", "dist", "node_modules"].includes(ent.name)) continue;
    const path = `${dir}/${ent.name}`;
    if (ent.isDirectory()) await visit(path);
    else files.push(path);
  }
}
await visit(".");
for (const file of files) {
  if (/\.(m?js)$/.test(file)) execFileSync(process.execPath, ["--check", file]);
  if (/\.(json)$/.test(file)) JSON.parse(await readFile(file, "utf8"));
  if (/\.(js|mjs|json|html|md|csv|yml)$/.test(file)) {
    const text = await readFile(file, "utf8");
    if (
      /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text) ||
      /AIza[0-9A-Za-z_-]{35}/.test(text)
    )
      throw new Error(`Credential-like content: ${file}`);
  }
  if (/Prefect Ballot|\.DS_Store$|\.(pem|key)$/.test(file))
    throw new Error(`Private asset: ${file}`);
}
console.log(
  `Checked ${files.length} files: JavaScript syntax, JSON and publication hygiene.`,
);
