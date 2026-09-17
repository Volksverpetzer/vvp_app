import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";

// require (not import) with an explicit extension: the platform-suffix
// resolver used for imports would otherwise pick FaktenBot.native.tsx.
const FaktenBot = require("#/components/animations/FaktenBot.tsx").default;

describe("FaktenBot (web fallback)", () => {
  it("renders nothing", async () => {
    const { toJSON } = await render(<FaktenBot reaction={5} search />);
    expect(toJSON()).toBeNull();
  });
});
