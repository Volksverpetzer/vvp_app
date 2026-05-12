const licenseChecker = require("license-checker-rseidelsohn");
const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const OUTPUT = "src/screens/Settings/components/licenses/data.tsx";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const directDeps = new Set(Object.keys(pkg.dependencies ?? {}));

function buildLicenseUrl(repository, licenseFile) {
  if (!repository || !licenseFile) return undefined;
  const match = repository.match(/^https?:\/\/github\.com\/([^/]+\/[^/.]+)/);
  if (!match) return undefined;
  return `https://github.com/${match[1]}/raw/HEAD/${path.basename(licenseFile)}`;
}

licenseChecker.init({ start: ".", production: true }, (err, packages) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  const filtered = {};
  for (const [key, { licenses, repository, licenseFile }] of Object.entries(
    packages,
  )) {
    const lastAt = key.lastIndexOf("@");
    const name = key.slice(0, lastAt);
    if (!directDeps.has(name)) continue;

    const entry = { licenses, repository };
    const licenseUrl = buildLicenseUrl(repository, licenseFile);
    if (licenseUrl) entry.licenseUrl = licenseUrl;
    filtered[key] = entry;
  }

  fs.writeFileSync(
    OUTPUT,
    `export default ${JSON.stringify(filtered, null, 2)};\n`,
  );
  execSync(`pnpm exec prettier --write ${OUTPUT}`, { stdio: "inherit" });
  console.log(
    `License data written to ${OUTPUT} (${Object.keys(filtered).length} packages)`,
  );
});
