const licenseChecker = require("license-checker-rseidelsohn");
const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const OUTPUT = "src/screens/Settings/components/licenses/data.tsx";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const directDepKeys = new Set(
  Object.entries(pkg.dependencies ?? {}).map(
    ([name, ver]) => `${name}@${ver.replace(/^[\^~>=<]+/, "")}`,
  ),
);

function normalizeRepoUrl(url) {
  if (!url) return url;
  return url.replace(/^git\+/, "").replace(/\.git$/, "");
}

function buildLicenseUrl(repository, licenseFile) {
  if (!repository || !licenseFile) return undefined;
  const basename = path.basename(licenseFile);
  if (!/^(LICENSE|LICENCE|COPYING)/i.test(basename)) return undefined;
  const normalized = normalizeRepoUrl(repository);
  const match = normalized.match(/^https?:\/\/github\.com\/([^/]+\/[^/]+)/);
  if (!match) return undefined;
  return `https://github.com/${match[1]}/raw/HEAD/${basename}`;
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
    if (!directDepKeys.has(key)) continue;

    const entry = { licenses, repository: normalizeRepoUrl(repository) };
    const licenseUrl = buildLicenseUrl(repository, licenseFile);
    if (licenseUrl) entry.licenseUrl = licenseUrl;
    filtered[key] = entry;
  }

  const sorted = Object.fromEntries(
    Object.entries(filtered).sort(([a], [b]) => a.localeCompare(b)),
  );

  fs.writeFileSync(
    OUTPUT,
    `export default ${JSON.stringify(sorted, null, 2)};\n`,
  );
  execSync(`pnpm exec prettier --write ${OUTPUT}`, { stdio: "inherit" });
  console.log(
    `License data written to ${OUTPUT} (${Object.keys(filtered).length} packages)`,
  );
});
