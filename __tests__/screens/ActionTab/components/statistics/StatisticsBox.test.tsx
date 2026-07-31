import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";

import { radii } from "#/constants/BorderRadius";
import StatisticsBox from "#/screens/ActionTab/components/statistics/StatisticsBox";
import type { StatisticsType } from "#/types";

const statistic: StatisticsType = { streak: 7, lastDate: 0, count: 42 };

const descriptionMap = {
  articlesRead: "Artikel gelesen",
  quizzes: "Quizze gespielt",
};

const flatten = (style: unknown): Record<string, unknown> => {
  const parts = Array.isArray(style) ? style.flat(Infinity) : [style];
  return Object.assign({}, ...parts.filter(Boolean));
};

describe("StatisticsBox", () => {
  it("shows the value selected by valueKey", async () => {
    const { getByText } = await render(
      <StatisticsBox
        statisticsKey="articlesRead"
        statistic={statistic}
        valueKey="count"
        descriptionMap={descriptionMap}
      />,
    );
    expect(getByText("42")).toBeTruthy();
  });

  it("switches to the streak value when asked for it", async () => {
    const { getByText, queryByText } = await render(
      <StatisticsBox
        statisticsKey="articlesRead"
        statistic={statistic}
        valueKey="streak"
        descriptionMap={descriptionMap}
      />,
    );
    expect(getByText("7")).toBeTruthy();
    expect(queryByText("42")).toBeNull();
  });

  it("looks the label up by statisticsKey", async () => {
    const { getByText } = await render(
      <StatisticsBox
        statisticsKey="quizzes"
        statistic={statistic}
        valueKey="count"
        descriptionMap={descriptionMap}
      />,
    );
    expect(getByText("Quizze gespielt")).toBeTruthy();
  });

  it("renders nothing for a key the description map does not know", async () => {
    const { queryByText } = await render(
      <StatisticsBox
        statisticsKey="unknown"
        statistic={statistic}
        valueKey="count"
        descriptionMap={descriptionMap}
      />,
    );
    expect(queryByText("Artikel gelesen")).toBeNull();
    expect(queryByText("Quizze gespielt")).toBeNull();
  });

  it("applies the card radius and merges a caller style", async () => {
    const { toJSON } = await render(
      <StatisticsBox
        statisticsKey="articlesRead"
        statistic={statistic}
        valueKey="count"
        descriptionMap={descriptionMap}
        style={{ marginTop: 8 }}
      />,
    );
    const style = flatten((toJSON() as any).props.style);
    expect(style.borderRadius).toBe(radii.md);
    expect(style.marginTop).toBe(8);
  });
});
