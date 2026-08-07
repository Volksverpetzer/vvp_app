import { act, render } from "@testing-library/react-native";

import EdgelessWebview from "#/screens/Home/components/EdgelessWebview";

jest.mock("#/constants/Config", () => ({
  __esModule: true,
  default: { wpUrl: "https://volksverpetzer.de", feeds: { wp: [] } },
}));

jest.mock("#/components/bars/NavBar", () => jest.fn(() => null));

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// The real expo-linking needs an expo-constants named export
// (ExecutionEnvironment) the project's global Jest mock doesn't provide, so
// every test touching Linking.parse in this codebase mocks it directly —
// this mirrors IframeRenderer.test.tsx's approach. parsePath (the actual
// logic under test here) stays real; only its underlying primitive is
// mocked, using the real URL API so path parsing is faithful.
jest.mock("expo-linking", () => ({
  __esModule: true,
  parse: (url: string) => {
    try {
      const parsed = new URL(url);
      return { hostname: parsed.hostname, path: parsed.pathname };
    } catch {
      return {};
    }
  },
}));

// Keep the real parsePath (that's what's under test), but stub onLinkPress
// so native routing/analytics side effects don't run in this test.
jest.mock("#/helpers/Linking", () => {
  const actual = jest.requireActual("#/helpers/Linking");
  return {
    ...(actual as object),
    onLinkPress: jest.fn(),
  };
});

let mockLastWebViewProps: any = null;
jest.mock("react-native-webview", () => {
  const MockWebViewComponent = (props: any) => {
    mockLastWebViewProps = props;
    const ReactRuntime = jest.requireActual("react");
    return ReactRuntime.createElement("View", { testID: "mock-webview" });
  };
  return {
    __esModule: true,
    default: MockWebViewComponent,
    WebView: MockWebViewComponent,
  };
});

const fireHttpError = async (url: string, statusCode: number) => {
  await act(async () => {
    mockLastWebViewProps.onHttpError({ nativeEvent: { url, statusCode } });
    await Promise.resolve();
  });
};

describe("EdgelessWebview cookies", () => {
  beforeEach(() => {
    mockLastWebViewProps = null;
  });

  it("does not send a synthetic Cookie header or inject consent cookies", async () => {
    // Regression: EdgelessWebview used to send a Cookie header (and inject
    // matching document.cookie values) claiming the visitor had already
    // consented to Complianz's cookie categories. That "consent already
    // granted on the very first request" state is a scenario Complianz's
    // own banner-restoration code doesn't handle correctly on some pages,
    // crashing and reloading indefinitely (see EdgelessWebview.tsx history).
    // No synthetic cookie state at all sidesteps that entirely.
    await render(
      <EdgelessWebview uri="https://volksverpetzer.de/impressum-volksverpetzer/" />,
    );

    expect(mockLastWebViewProps.source).toEqual({
      uri: "https://volksverpetzer.de/impressum-volksverpetzer/",
    });
  });
});

describe("EdgelessWebview 404 slash retry", () => {
  beforeEach(() => {
    mockLastWebViewProps = null;
  });

  it("retries once with the trailing slash removed when the slashed URL 404s", async () => {
    // Regression: a Redirection-plugin shortlink like /ltw-lsa 301s
    // correctly without a trailing slash but 404s when one is appended.
    await render(<EdgelessWebview uri="https://volksverpetzer.de/ltw-lsa/" />);

    expect(mockLastWebViewProps.source.uri).toBe(
      "https://volksverpetzer.de/ltw-lsa/",
    );

    await fireHttpError("https://volksverpetzer.de/ltw-lsa/", 404);

    expect(mockLastWebViewProps.source.uri).toBe(
      "https://volksverpetzer.de/ltw-lsa",
    );
  });

  it("retries once with a trailing slash added when the slashless URL 404s", async () => {
    // Regression: a normal WordPress page like /stellenausschreibung-redaktion
    // hard-404s without a trailing slash (no redirect) but 200s with one.
    await render(
      <EdgelessWebview uri="https://volksverpetzer.de/stellenausschreibung-redaktion" />,
    );

    await fireHttpError(
      "https://volksverpetzer.de/stellenausschreibung-redaktion",
      404,
    );

    expect(mockLastWebViewProps.source.uri).toBe(
      "https://volksverpetzer.de/stellenausschreibung-redaktion/",
    );
  });

  it("does not retry a second time if the toggled URL also 404s", async () => {
    await render(<EdgelessWebview uri="https://volksverpetzer.de/ltw-lsa/" />);

    await fireHttpError("https://volksverpetzer.de/ltw-lsa/", 404);
    expect(mockLastWebViewProps.source.uri).toBe(
      "https://volksverpetzer.de/ltw-lsa",
    );

    await fireHttpError("https://volksverpetzer.de/ltw-lsa", 404);

    // Still the toggled (slashless) form — no further retry/toggle.
    expect(mockLastWebViewProps.source.uri).toBe(
      "https://volksverpetzer.de/ltw-lsa",
    );
  });

  it("ignores a 404 for an unrelated sub-resource on a different path", async () => {
    await render(<EdgelessWebview uri="https://volksverpetzer.de/ltw-lsa/" />);

    await fireHttpError(
      "https://volksverpetzer.de/wp-content/uploads/missing.jpg",
      404,
    );

    expect(mockLastWebViewProps.source.uri).toBe(
      "https://volksverpetzer.de/ltw-lsa/",
    );
  });

  it("ignores non-404 HTTP errors", async () => {
    await render(<EdgelessWebview uri="https://volksverpetzer.de/ltw-lsa/" />);

    await fireHttpError("https://volksverpetzer.de/ltw-lsa/", 500);

    expect(mockLastWebViewProps.source.uri).toBe(
      "https://volksverpetzer.de/ltw-lsa/",
    );
  });

  it("resets retry state when the uri prop changes to a new page", async () => {
    const { rerender } = await render(
      <EdgelessWebview uri="https://volksverpetzer.de/ltw-lsa/" />,
    );

    await fireHttpError("https://volksverpetzer.de/ltw-lsa/", 404);
    expect(mockLastWebViewProps.source.uri).toBe(
      "https://volksverpetzer.de/ltw-lsa",
    );

    await act(async () => {
      rerender(
        <EdgelessWebview uri="https://volksverpetzer.de/another-shortlink/" />,
      );
      await Promise.resolve();
    });
    expect(mockLastWebViewProps.source.uri).toBe(
      "https://volksverpetzer.de/another-shortlink/",
    );

    await fireHttpError("https://volksverpetzer.de/another-shortlink/", 404);
    expect(mockLastWebViewProps.source.uri).toBe(
      "https://volksverpetzer.de/another-shortlink",
    );
  });

  it("toggles the slash on the pathname only, preserving a URL fragment", async () => {
    // Regression: anchored deep links (e.g. /project/10fakten/#quellen, built
    // in [category]/[slug].tsx) must not have "/" appended after the
    // fragment — that would produce an invalid "#quellen/" URL that never
    // matches the intended path.
    const uri = "https://volksverpetzer.de/project/10fakten/#quellen";
    await render(<EdgelessWebview uri={uri} />);

    await fireHttpError(uri, 404);

    expect(mockLastWebViewProps.source.uri).toBe(
      "https://volksverpetzer.de/project/10fakten#quellen",
    );
  });

  it("toggles the slash on the pathname only, preserving a query string", async () => {
    const uri = "https://volksverpetzer.de/ltw-lsa?utm_source=app_share";
    await render(<EdgelessWebview uri={uri} />);

    await fireHttpError(uri, 404);

    expect(mockLastWebViewProps.source.uri).toBe(
      "https://volksverpetzer.de/ltw-lsa/?utm_source=app_share",
    );
  });
});
