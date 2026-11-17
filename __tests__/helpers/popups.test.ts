import { beforeEach, describe, expect, it } from "@jest/globals";

import { popupStore, popups } from "#/helpers/popups";

// Settles the store between tests so a leftover popup can't leak over
const reset = () => {
  popupStore.answer(null);
  popupStore.closed();
};

describe("popups", () => {
  beforeEach(reset);

  it("shows a confirm request and resolves true once it has closed", async () => {
    const answer = popups.confirm({
      title: "Sicher?",
      message: "Text",
      confirmLabel: "Ja",
    });
    expect(popupStore.getState()).toEqual({
      request: {
        kind: "confirm",
        title: "Sicher?",
        message: "Text",
        confirmLabel: "Ja",
      },
      visible: true,
    });

    popupStore.answer(true);
    // Still closing: keeps the request so the content can animate out
    expect(popupStore.getState().visible).toBe(false);
    expect(popupStore.getState().request?.kind).toBe("confirm");

    popupStore.closed();
    await expect(answer).resolves.toBe(true);
  });

  it("does not resolve before the popup has closed", async () => {
    let settled = false;
    popups
      .choose({ title: "Teilen", options: ["A", "B"] })
      .then(() => (settled = true));
    popupStore.answer(1);
    await Promise.resolve();
    expect(settled).toBe(false);
  });

  it("resolves a choose request with the picked index", async () => {
    const answer = popups.choose({ title: "Teilen", options: ["A", "B"] });
    popupStore.answer(1);
    popupStore.closed();
    await expect(answer).resolves.toBe(1);
  });

  it("cancels the open popup when a new one is requested", async () => {
    const first = popups.confirm({
      title: "Eins",
      message: "",
      confirmLabel: "OK",
    });
    const second = popups.choose({ title: "Zwei", options: ["A"] });

    await expect(first).resolves.toBe(false);
    expect(popupStore.getState().request?.title).toBe("Zwei");

    popupStore.answer(null);
    popupStore.closed();
    await expect(second).resolves.toBeNull();
  });

  it("ignores a second answer while the popup is closing", async () => {
    const answer = popups.confirm({
      title: "Sicher?",
      message: "",
      confirmLabel: "Ja",
    });
    popupStore.answer(false);
    popupStore.answer(true);
    popupStore.closed();
    await expect(answer).resolves.toBe(false);
  });

  it("notifies subscribers of changes", () => {
    let calls = 0;
    const unsubscribe = popupStore.subscribe(() => calls++);
    popups.choose({ title: "Teilen", options: ["A"] });
    popupStore.answer(0);
    unsubscribe();
    popupStore.closed();
    expect(calls).toBe(2);
  });
});
