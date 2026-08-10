import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";

import AnimatedSuccess from "#/components/animations/AnimatedSuccess";

describe("AnimatedSuccess", () => {
  it("renders nothing when not animated", async () => {
    const { toJSON } = await render(<AnimatedSuccess animated={false} />);
    expect(toJSON()).toBeNull();
  });

  it("shows the default title and subtitle once animated", async () => {
    const { getByText } = await render(<AnimatedSuccess animated />);
    expect(getByText("Danke")).toBeTruthy();
    expect(
      getByText("Du hast einen wichtigen Beitrag geleistet!"),
    ).toBeTruthy();
  });

  it("shows a custom title and subtitle when given", async () => {
    const { getByText } = await render(
      <AnimatedSuccess
        animated
        title="Gemeldet"
        subtitle="Wir prüfen deinen Hinweis."
      />,
    );
    expect(getByText("Gemeldet")).toBeTruthy();
    expect(getByText("Wir prüfen deinen Hinweis.")).toBeTruthy();
  });
});
