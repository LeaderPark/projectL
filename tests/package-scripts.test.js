const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("package.json exposes runtime verification commands", () => {
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

  assert.equal(pkg.scripts["test:runtime"], "node --test tests/*.test.js");
  assert.equal(pkg.scripts.verify, "powershell -ExecutionPolicy Bypass -File .\\scripts\\verify.ps1");
  assert.equal(pkg.scripts.bootstrap, "powershell -ExecutionPolicy Bypass -File .\\scripts\\bootstrap.ps1");
});
