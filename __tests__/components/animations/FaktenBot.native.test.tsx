import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";

import FaktenBot from "#/components/animations/FaktenBot.native";

let mockExecutionEnvironment: string | undefined;
let mockRiveFile: object | undefined;
const mockRiveViewRef = {
  setNumberInputValue: jest.fn(),
  triggerInput: jest.fn(),
  setBooleanInputValue: jest.fn(),
};

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    get executionEnvironment() {
      return mockExecutionEnvironment;
    },
  },
}));

jest.mock("@rive-app/react-native", () => {
  const { createElement } = require("react");
  return {
    __esModule: true,
    useRiveFile: () => ({ riveFile: mockRiveFile }),
    useRive: () => ({
      riveViewRef: mockRiveViewRef,
      setHybridRef: jest.fn(),
    }),
    RiveView: (props: any) =>
      createElement("RiveView", { testID: "rive-view", ...props }),
  };
});

describe("FaktenBot (native)", () => {
  beforeEach(() => {
    mockExecutionEnvironment = "bare";
    mockRiveFile = { id: "faktenbot5" };
    mockRiveViewRef.setNumberInputValue.mockClear();
    mockRiveViewRef.triggerInput.mockClear();
    mockRiveViewRef.setBooleanInputValue.mockClear();
  });

  it("renders nothing in Expo Go", async () => {
    mockExecutionEnvironment = "storeClient";
    const { queryByTestId } = await render(<FaktenBot />);
    expect(queryByTestId("rive-view")).toBeNull();
  });

  it("renders nothing while the rive file has not loaded", async () => {
    mockRiveFile = undefined;
    const { queryByTestId } = await render(<FaktenBot />);
    expect(queryByTestId("rive-view")).toBeNull();
  });

  it("renders the RiveView once the rive file is loaded", async () => {
    const { getByTestId } = await render(<FaktenBot />);
    expect(getByTestId("rive-view")).toBeTruthy();
  });

  it("forwards a reaction to the state machine", async () => {
    await render(<FaktenBot reaction={10} />);
    expect(mockRiveViewRef.setNumberInputValue).toHaveBeenCalledWith(
      "Reaktion",
      10,
    );
    expect(mockRiveViewRef.triggerInput).toHaveBeenCalledWith("ResultIn");
  });

  it("does not touch the state machine when reaction is undefined", async () => {
    await render(<FaktenBot />);
    expect(mockRiveViewRef.setNumberInputValue).not.toHaveBeenCalled();
    expect(mockRiveViewRef.triggerInput).not.toHaveBeenCalled();
  });

  it("forwards the search flag to the state machine", async () => {
    await render(<FaktenBot search />);
    expect(mockRiveViewRef.setBooleanInputValue).toHaveBeenCalledWith(
      "Suche",
      true,
    );
  });
});
