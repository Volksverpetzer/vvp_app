import withSplitAbi from "#plugins/withSplitAbi.plugin";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";

let capturedCallback: ((mod: any) => any) | undefined;

jest.mock("expo/config-plugins", () => ({
  withAppBuildGradle: jest.fn((config: any, callback: (mod: any) => any) => {
    capturedCallback = callback;
    return config;
  }),
}));

const makeGradleMod = (contents: string) => ({ modResults: { contents } });

const ANDROID_BLOCK = `android {
    compileSdkVersion 33
    defaultConfig {}
}`;

describe("withSplitAbi plugin", () => {
  beforeEach(() => {
    capturedCallback = undefined;
    jest.clearAllMocks();
  });

  it("registers a withAppBuildGradle modifier", () => {
    withSplitAbi({});
    expect(capturedCallback).toBeDefined();
  });

  it("injects splits block inside android {}", () => {
    withSplitAbi({});
    const result = capturedCallback!(makeGradleMod(ANDROID_BLOCK));
    const contents: string = result.modResults.contents;

    expect(contents).toContain("splits {");
    expect(contents).toContain("abi {");
    expect(contents).toContain("reset()");
    expect(contents).toContain("enable true");
    expect(contents).toContain("universalApk false");
    expect(contents).toContain('"armeabi-v7a", "arm64-v8a"');
    // splits block must appear inside android {}
    expect(contents.indexOf("splits {")).toBeGreaterThan(
      contents.indexOf("android {"),
    );
  });

  it("removes an existing splits block before inserting a new one", () => {
    const gradleWithSplits = `android {
    splits {
        abi {
            enable false
            universalApk true
        }
    }
    compileSdkVersion 33
}`;
    withSplitAbi({});
    const result = capturedCallback!(makeGradleMod(gradleWithSplits));
    const contents: string = result.modResults.contents;

    const splitMatches = contents.match(/splits\s*\{/g) ?? [];
    expect(splitMatches).toHaveLength(1);
    expect(contents).toContain("universalApk false");
    expect(contents).not.toContain("universalApk true");
  });

  it("leaves gradle without an android block unchanged except for the injection point", () => {
    withSplitAbi({});
    const result = capturedCallback!(makeGradleMod("// no android block here"));
    // replace() finds nothing — content is unchanged
    expect(result.modResults.contents).toBe("// no android block here");
  });

  it("returns the same mod object it received", () => {
    withSplitAbi({});
    const mod = makeGradleMod(ANDROID_BLOCK);
    const result = capturedCallback!(mod);
    expect(result).toBe(mod);
  });
});
