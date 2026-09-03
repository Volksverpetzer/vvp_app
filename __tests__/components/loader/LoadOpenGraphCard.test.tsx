import { fireEvent, render } from "@testing-library/react-native";
import React from "react";

import LoadOpenGraphCard from "#/components/loader/LoadOpenGraphCard";
import { fetchOpenGraphPreview } from "#/helpers/utils/openGraph";
import type { HttpsUrl } from "#/types";

jest.mock("#/helpers/utils/openGraph", () => ({
  fetchOpenGraphPreview: jest.fn(),
}));

const mockFetchOpenGraphPreview = fetchOpenGraphPreview as jest.Mock;

const URL = "https://www.volksverpetzer.de/project/foo/" as HttpsUrl;

describe("LoadOpenGraphCard", () => {
  beforeEach(() => {
    mockFetchOpenGraphPreview.mockReset();
  });

  it("shows the fetched preview once it resolves", async () => {
    mockFetchOpenGraphPreview.mockResolvedValue({
      title: "A real title",
      description: "A real description",
    });

    const { findByText } = await render(
      <LoadOpenGraphCard
        url={URL}
        fallbackTitle="Fallback"
        onPress={jest.fn()}
      />,
    );

    expect(await findByText("A real title")).toBeTruthy();
  });

  it("falls back to fallbackTitle and clears the spinner instead of hanging forever when the fetch rejects", async () => {
    mockFetchOpenGraphPreview.mockRejectedValue(new Error("boom"));
    const onPress = jest.fn();

    const { findByText } = await render(
      <LoadOpenGraphCard
        url={URL}
        fallbackTitle="Fallback"
        onPress={onPress}
      />,
    );

    // Before the fix, isLoading never flipped to false on rejection, so
    // this would time out waiting for a spinner-only tree forever.
    const title = await findByText("Fallback");
    fireEvent.press(title);

    expect(onPress).toHaveBeenCalled();
  });

  it("falls back to fallbackTitle when the resolved preview has no title", async () => {
    mockFetchOpenGraphPreview.mockResolvedValue(null);

    const { findByText } = await render(
      <LoadOpenGraphCard
        url={URL}
        fallbackTitle="Fallback"
        onPress={jest.fn()}
      />,
    );

    expect(await findByText("Fallback")).toBeTruthy();
  });
});
