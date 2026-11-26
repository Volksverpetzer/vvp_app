import withOptionalScreenFeatures from "#plugins/withOptionalScreenFeatures.plugin";
import { beforeEach, describe, expect, it } from "@jest/globals";

let capturedCallback: ((mod: any) => any) | undefined;

jest.mock("expo/config-plugins", () => ({
  withAndroidManifest: jest.fn((config: any, callback: (mod: any) => any) => {
    capturedCallback = callback;
    return config;
  }),
}));

const PORTRAIT = "android.hardware.screen.portrait";
const LANDSCAPE = "android.hardware.screen.landscape";

const makeManifestMod = (manifest: Record<string, any> = {}) => ({
  modResults: { manifest: { $: {}, ...manifest } },
});

const run = (manifest?: Record<string, any>) => {
  withOptionalScreenFeatures({});
  return capturedCallback!(makeManifestMod(manifest));
};

const featuresNamed = (result: any, name: string) =>
  result.modResults.manifest["uses-feature"].filter(
    (f: any) => f.$["android:name"] === name,
  );

describe("withOptionalScreenFeatures plugin", () => {
  beforeEach(() => {
    capturedCallback = undefined;
    jest.clearAllMocks();
  });

  it("registers a withAndroidManifest modifier", () => {
    withOptionalScreenFeatures({});
    expect(capturedCallback).toBeDefined();
  });

  it("adds both screen features as optional when the manifest has none", () => {
    const result = run();

    expect(result.modResults.manifest["uses-feature"]).toEqual([
      { $: { "android:name": PORTRAIT, "android:required": "false" } },
      { $: { "android:name": LANDSCAPE, "android:required": "false" } },
    ]);
  });

  it("rewrites an existing required screen feature instead of duplicating it", () => {
    const result = run({
      "uses-feature": [
        { $: { "android:name": PORTRAIT, "android:required": "true" } },
      ],
    });

    const portrait = featuresNamed(result, PORTRAIT);
    expect(portrait).toHaveLength(1);
    expect(portrait[0].$["android:required"]).toBe("false");
    expect(featuresNamed(result, LANDSCAPE)).toHaveLength(1);
  });

  it("marks an existing screen feature without android:required as optional", () => {
    const result = run({
      "uses-feature": [{ $: { "android:name": LANDSCAPE } }],
    });

    const landscape = featuresNamed(result, LANDSCAPE);
    expect(landscape).toHaveLength(1);
    expect(landscape[0].$["android:required"]).toBe("false");
  });

  it("leaves unrelated features untouched", () => {
    const camera = {
      $: {
        "android:name": "android.hardware.camera",
        "android:required": "true",
      },
    };
    const result = run({ "uses-feature": [camera] });

    expect(featuresNamed(result, "android.hardware.camera")).toEqual([camera]);
    expect(result.modResults.manifest["uses-feature"]).toHaveLength(3);
  });

  it("is idempotent when applied twice", () => {
    withOptionalScreenFeatures({});
    const mod = makeManifestMod();
    capturedCallback!(mod);
    capturedCallback!(mod);

    expect(mod.modResults.manifest["uses-feature"]).toHaveLength(2);
  });

  it("returns the same mod object it received", () => {
    withOptionalScreenFeatures({});
    const mod = makeManifestMod();
    expect(capturedCallback!(mod)).toBe(mod);
  });
});
