#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const packageJsonPath = path.join(root, "package.json");
const licenseJsonPath = path.join(
  root,
  "src/screens/Settings/components/licenses/licenseData.json",
);
const licenseDataPath = path.join(
  root,
  "src/screens/Settings/components/licenses/data.tsx",
);

const version = process.argv[2];
const baseRef = process.env.RELEASE_BASE_REF || "origin/main";

if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error("Usage: node scripts/prepare-final-release.mjs <x.y.z>");
  process.exit(1);
}

const run = (command, args, options = {}) =>
  execFileSync(command, args, {
    cwd: root,
    encoding: "utf8",
    stdio: options.stdio || "pipe",
    ...options,
  });

const readJson = (filePath) => JSON.parse(readFileSync(filePath, "utf8"));

const readPackageFromGit = (ref) => {
  try {
    return JSON.parse(run("git", ["show", `${ref}:package.json`]));
  } catch {
    return null;
  }
};

const getBerlinDateStamp = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${values.year}${values.month}${values.day}`;
};

const getNextVersionCode = () => {
  const dateStamp = getBerlinDateStamp();
  const basePackageJson = readPackageFromGit(baseRef);
  const baseVersionCode = Number(basePackageJson?.versionCode);
  const currentSequence =
    Number.isInteger(baseVersionCode) &&
    String(baseVersionCode).startsWith(dateStamp)
      ? Number(String(baseVersionCode).slice(8))
      : 0;

  return Number(`${dateStamp}${String(currentSequence + 1).padStart(2, "0")}`);
};

const updatePackageJson = () => {
  const packageJson = readJson(packageJsonPath);
  packageJson.version = version;
  packageJson.versionCode = getNextVersionCode();
  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
  return packageJson.versionCode;
};

const generateLicenseData = () => {
  if (existsSync(licenseJsonPath)) rmSync(licenseJsonPath);

  run(
    "npm-license-crawler",
    [
      "--json",
      licenseJsonPath,
      "--onlyDirectDependencies",
      "--onlyProdDependencies",
    ],
    { stdio: "inherit" },
  );

  const licenseJson = readFileSync(licenseJsonPath, "utf8");
  writeFileSync(licenseDataPath, `export default ${licenseJson};\n`);
  rmSync(licenseJsonPath);
  run("pnpm", ["exec", "prettier", "--write", licenseDataPath], {
    stdio: "inherit",
  });
};

const versionCode = updatePackageJson();
generateLicenseData();

console.log(
  `Prepared final release v${version} with versionCode ${versionCode}.`,
);
