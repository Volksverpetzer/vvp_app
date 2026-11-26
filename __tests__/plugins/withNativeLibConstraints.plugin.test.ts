import withNativeLibConstraints from "#plugins/withNativeLibConstraints.plugin";
import { beforeEach, describe, expect, it } from "@jest/globals";

let capturedCallback: ((mod: any) => any) | undefined;

jest.mock("expo/config-plugins", () => ({
  withAppBuildGradle: jest.fn((config: any, callback: (mod: any) => any) => {
    capturedCallback = callback;
    return config;
  }),
}));

const makeGradleMod = (contents: string) => ({ modResults: { contents } });

const BASE_GRADLE = `apply plugin: "com.android.application"

android {
    compileSdkVersion 36
}

dependencies {
    implementation("com.facebook.react:react-android")
}`;

const apply = (contents: string): string => {
  withNativeLibConstraints({});
  return capturedCallback!(makeGradleMod(contents)).modResults.contents;
};

const countMatches = (contents: string, pattern: RegExp) =>
  (contents.match(pattern) ?? []).length;

describe("withNativeLibConstraints plugin", () => {
  beforeEach(() => {
    capturedCallback = undefined;
    jest.clearAllMocks();
  });

  it("registers a withAppBuildGradle modifier", () => {
    withNativeLibConstraints({});
    expect(capturedCallback).toBeDefined();
  });

  it("appends a dependency constraints block on first application", () => {
    const contents = apply(BASE_GRADLE);

    expect(contents).toContain("// @generated begin withNativeLibConstraints");
    expect(contents).toContain("// @generated end withNativeLibConstraints");
    expect(contents).toMatch(/dependencies \{\s*constraints \{/);
    expect(contents).toContain(
      'implementation("androidx.graphics:graphics-path:1.1.0")',
    );
    for (const module of [
      "datastore",
      "datastore-core",
      "datastore-core-okio",
      "datastore-preferences",
      "datastore-preferences-core",
      "datastore-preferences-android",
    ]) {
      expect(contents).toContain(
        `implementation("androidx.datastore:${module}:1.3.0")`,
      );
    }
    // Block is appended after the existing contents
    expect(
      contents.indexOf("// @generated begin withNativeLibConstraints"),
    ).toBeGreaterThan(contents.indexOf("react-android"));
  });

  it("produces balanced braces in the generated block", () => {
    const contents = apply(BASE_GRADLE);
    const block = contents.slice(
      contents.indexOf("// @generated begin withNativeLibConstraints"),
    );
    expect(countMatches(block, /\{/g)).toBe(countMatches(block, /\}/g));
  });

  it("does not duplicate the block when re-applied", () => {
    const once = apply(BASE_GRADLE);
    const twice = apply(once);

    expect(twice).toBe(once);
    expect(
      countMatches(twice, /@generated begin withNativeLibConstraints/g),
    ).toBe(1);
    expect(countMatches(twice, /graphics-path:1\.1\.0/g)).toBe(1);
  });

  it("replaces an outdated generated block", () => {
    const stale = `${BASE_GRADLE}

// @generated begin withNativeLibConstraints
dependencies {
    constraints {
        implementation("androidx.graphics:graphics-path:1.0.9")
    }
}
// @generated end withNativeLibConstraints
`;
    const contents = apply(stale);

    expect(contents).not.toContain("graphics-path:1.0.9");
    expect(contents).toContain("graphics-path:1.1.0");
    expect(
      countMatches(contents, /@generated begin withNativeLibConstraints/g),
    ).toBe(1);
  });

  it("preserves the surrounding Gradle contents", () => {
    const withTrailer = `${apply(BASE_GRADLE)}\napply from: "trailer.gradle"\n`;
    const contents = apply(withTrailer);

    expect(contents).toContain(BASE_GRADLE);
    expect(contents).toContain('apply from: "trailer.gradle"');
    expect(
      countMatches(contents, /@generated begin withNativeLibConstraints/g),
    ).toBe(1);
  });

  it("returns the same mod object it received", () => {
    withNativeLibConstraints({});
    const mod = makeGradleMod(BASE_GRADLE);
    expect(capturedCallback!(mod)).toBe(mod);
  });
});
