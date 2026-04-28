import { describe, it, expect } from "vitest";
import { groupByDate } from "../date";

describe("groupByDate", () => {
  it("should group items by date", () => {
    const items = [
      { id: "1", createdAt: "2026-04-27T10:00:00Z", text: "A" },
      { id: "2", createdAt: "2026-04-27T11:00:00Z", text: "B" },
      { id: "3", createdAt: "2026-04-26T10:00:00Z", text: "C" },
    ];

    const groups = groupByDate(items);

    expect(groups).toHaveLength(2);
    expect(groups[0].date.toDateString()).toBe(new Date("2026-04-27").toDateString());
    expect(groups[0].items).toHaveLength(2);
    expect(groups[1].date.toDateString()).toBe(new Date("2026-04-26").toDateString());
    expect(groups[1].items).toHaveLength(1);
  });

  it("should return empty array for empty input", () => {
    expect(groupByDate([])).toEqual([]);
  });
});
