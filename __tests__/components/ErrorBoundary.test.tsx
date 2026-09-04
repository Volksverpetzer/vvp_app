import { fireEvent, render } from "@testing-library/react-native";
import { Text } from "react-native";

import ErrorBoundary from "#/components/ErrorBoundary";

jest.mock("#/components/ui/UiErrorCard", () => {
  const { Text: MockText } = jest.requireActual("react-native");
  return function MockErrorCard({ text }: { text?: string }) {
    return <MockText>{`error:${text}`}</MockText>;
  };
});

const Bomb = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) throw new Error("boom");
  return <Text>ok</Text>;
};

describe("ErrorBoundary", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders children when there is no error", async () => {
    const { getByText } = await render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(getByText("ok")).toBeTruthy();
  });

  it("renders fallback UI when a child throws during render", async () => {
    const { getByText } = await render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(
      getByText("error:Etwas ist schiefgelaufen. Bitte versuche es erneut."),
    ).toBeTruthy();
  });

  it("resets and re-renders children after pressing the retry button", async () => {
    const { getByText, rerender } = await render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );

    // Fix the underlying condition, then retry — the boundary should
    // re-attempt rendering children instead of staying stuck on the fallback.
    rerender(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );
    await fireEvent.press(getByText("Erneut versuchen"));

    expect(getByText("ok")).toBeTruthy();
  });
});
