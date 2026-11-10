import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";
import Modal from "react-native-modal";

// The other popup tests mock react-native-modal away. Render the real one so
// a React Native upgrade that removes an API it calls (like InteractionManager
// in RN 0.88, see patches/react-native-modal@*.patch) fails here instead of
// crashing every bottom sheet in the app.
describe("react-native-modal compatibility", () => {
  it("opens without calling removed React Native APIs", async () => {
    const { getByText } = await render(
      <Modal isVisible>
        <Text>sheet content</Text>
      </Modal>,
    );
    expect(getByText("sheet content")).toBeTruthy();
  });
});
