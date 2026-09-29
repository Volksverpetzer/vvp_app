import { handleContainerElements } from "#/screens/Home/components/article/ElementHandlers";

// Mock domutils functions
jest.mock("domutils", () => ({
  removeElement: jest.fn(),
  replaceElement: jest.fn(),
  append: jest.fn(),
}));

describe("ElementHandlers", () => {
  describe("handleContainerElements", () => {
    it("should preserve WordPress block images", () => {
      const mockElement = {
        tagName: "figure",
        attribs: {
          class: "wp-block-image size-full",
        },
        children: [
          {
            tagName: "img",
            attribs: {
              src: "https://example.com/image.jpg",
            },
          },
        ],
      } as any;

      const result = handleContainerElements(mockElement);

      // Should return false (not handled/removed) to preserve the WordPress block
      expect(result).toBe(false);
    });

    it("should preserve figures with captions", () => {
      const mockElement = {
        tagName: "figure",
        attribs: {},
        children: [
          {
            type: "tag",
            tagName: "img",
            attribs: {
              src: "https://example.com/image.jpg",
            },
          },
          {
            type: "tag",
            tagName: "figcaption",
          },
        ],
      } as any;

      const result = handleContainerElements(mockElement);

      // Should return false (not handled/removed) to preserve figures with captions
      expect(result).toBe(false);
    });

    it("should preserve WordPress block divs", () => {
      const mockElement = {
        tagName: "div",
        attribs: {
          class: "wp-block-embed__wrapper",
        },
        children: [],
      } as any;

      const result = handleContainerElements(mockElement);

      // Should return false (not handled/removed) to preserve WordPress blocks
      expect(result).toBe(false);
    });

    it("should preserve Mimikama's own note/pill divs so DivRenderer can style them", () => {
      for (const className of ["mkk-pillar-link", "mkk-about", "mkk-label"]) {
        const mockElement = {
          tagName: "div",
          attribs: { class: className },
          // A single text child would otherwise qualify for unwrapping
          // (<=2 children, no other recognized class) — these must survive
          // as real divs regardless of child count.
          children: [{ type: "text", data: "some text" }],
        } as any;

        const result = handleContainerElements(mockElement);

        expect(result).toBe(false);
      }
    });
  });
});
