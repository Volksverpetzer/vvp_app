/**
 * Waits for the EAS build of the given platform and git commit to finish,
 * then exposes its versionCode/buildNumber as a GitHub Actions output.
 *
 * Usage: node scripts/wait-for-eas-build.mjs --platform android|ios --commit <sha>
 *
 * Outputs (via $GITHUB_OUTPUT, also printed to stdout):
 *   build-version — appBuildVersion of the finished build (Android versionCode / iOS buildNumber)
 */
import { execSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

const POLL_INTERVAL_MS = 2 * 60 * 1000;
const TIMEOUT_MS = 120 * 60 * 1000;

const arg = (name) => {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
};

const platform = arg("platform");
const commit = arg("commit");

if (!["android", "ios"].includes(platform) || !commit) {
  console.error(
    "Usage: node scripts/wait-for-eas-build.mjs --platform android|ios --commit <sha>",
  );
  process.exit(1);
}

const listBuilds = () =>
  JSON.parse(
    execSync(
      `eas build:list --platform ${platform} --limit 50 --json --non-interactive`,
      { encoding: "utf8" },
    ),
  );

const deadline = Date.now() + TIMEOUT_MS;

for (;;) {
  const build = listBuilds().find((b) => b.gitCommitHash === commit);

  if (build?.status === "FINISHED") {
    console.log(
      `✓ ${platform} build ${build.id} finished (build version ${build.appBuildVersion})`,
    );
    if (process.env.GITHUB_OUTPUT) {
      appendFileSync(
        process.env.GITHUB_OUTPUT,
        `build-version=${build.appBuildVersion}\n`,
      );
    }
    process.exit(0);
  }

  if (["ERRORED", "CANCELED"].includes(build?.status)) {
    console.error(`✗ ${platform} build ${build.id} ended as ${build.status}`);
    process.exit(1);
  }

  if (Date.now() > deadline) {
    console.error(
      `✗ Timed out waiting for the ${platform} build of commit ${commit}`,
    );
    process.exit(1);
  }

  console.log(
    build
      ? `… ${platform} build is ${build.status}, polling again in 2 min`
      : `… no ${platform} build for commit ${commit} yet, polling again in 2 min`,
  );
  await sleep(POLL_INTERVAL_MS);
}
