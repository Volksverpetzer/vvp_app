import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";

import ToastShareSheet from "#/components/popups/ToastShareSheet";

describe("ToastShareSheet", () => {
  const makeItems = () => [
    { title: "Link kopieren", onPress: jest.fn() },
    { title: "In App teilen", onPress: jest.fn() },
  ];

  it("renders a row per item plus the cancel button", async () => {
    const { getByText } = await render(
      <ToastShareSheet items={makeItems()} onCancel={jest.fn()} />,
    );
    expect(getByText("Link kopieren")).toBeTruthy();
    expect(getByText("In App teilen")).toBeTruthy();
    expect(getByText("Abbrechen")).toBeTruthy();
  });

  it("calls only the pressed item's handler", async () => {
    const items = makeItems();
    const { getByText } = await render(
      <ToastShareSheet items={items} onCancel={jest.fn()} />,
    );
    await fireEvent.press(getByText("Link kopieren"));
    expect(items[0].onPress).toHaveBeenCalledTimes(1);
    expect(items[1].onPress).not.toHaveBeenCalled();
  });

  it("calls onCancel from the cancel button, not an item handler", async () => {
    const items = makeItems();
    const onCancel = jest.fn();
    const { getByText } = await render(
      <ToastShareSheet items={items} onCancel={onCancel} />,
    );
    await fireEvent.press(getByText("Abbrechen"));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(items[0].onPress).not.toHaveBeenCalled();
    expect(items[1].onPress).not.toHaveBeenCalled();
  });

  it("still renders the cancel button with an empty item list", async () => {
    const onCancel = jest.fn();
    const { getByText } = await render(
      <ToastShareSheet items={[]} onCancel={onCancel} />,
    );
    await fireEvent.press(getByText("Abbrechen"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  // Keys are derived from title + index, so duplicate titles must not collide.
  it("renders duplicate titles as separate, independently pressable rows", async () => {
    const onFirst = jest.fn();
    const onSecond = jest.fn();
    const { getAllByText } = await render(
      <ToastShareSheet
        items={[
          { title: "Doppelt", onPress: onFirst },
          { title: "Doppelt", onPress: onSecond },
        ]}
        onCancel={jest.fn()}
      />,
    );
    const rows = getAllByText("Doppelt");
    expect(rows).toHaveLength(2);
    await fireEvent.press(rows[1]);
    expect(onSecond).toHaveBeenCalledTimes(1);
    expect(onFirst).not.toHaveBeenCalled();
  });
});
