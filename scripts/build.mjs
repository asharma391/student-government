import { cp, mkdir, rm, access } from "node:fs/promises";
await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await cp("public", "dist", { recursive: true });
await cp("src", "dist/src", { recursive: true });
if (process.argv.includes("--staging")) {
  await access("config/runtime.local.js");
  await cp("config/runtime.local.js", "dist/runtime-config.js");
}
console.log(
  "Built static app in dist/ (" +
    (process.argv.includes("--staging") ? "staging" : "demo") +
    ").",
);
