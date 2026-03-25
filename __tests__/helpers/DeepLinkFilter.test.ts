import { describe, expect, it } from "@jest/globals";

import { shouldExcludeFromDeepLink } from "#/helpers/DeepLinkFilter";

describe("DeepLinkFilter", () => {
  describe("shouldExcludeFromDeepLink", () => {
    it("should exclude paths under /wp-content/uploads/", () => {
      expect(
        shouldExcludeFromDeepLink("/wp-content/uploads/2024/11/file.pdf"),
      ).toBe(true);
      expect(
        shouldExcludeFromDeepLink("wp-content/uploads/2024/11/file.pdf"),
      ).toBe(true);
      expect(shouldExcludeFromDeepLink("/wp-admin/tools.php")).toBe(true);
      expect(shouldExcludeFromDeepLink("/wp-content/uploads/image.jpg")).toBe(
        true,
      );
      expect(
        shouldExcludeFromDeepLink("/wp-content/uploads/folder/document.pdf"),
      ).toBe(true);
    });

    it("should not exclude regular article paths", () => {
      expect(shouldExcludeFromDeepLink("/politik/article-title")).toBe(false);
      expect(shouldExcludeFromDeepLink("/aktuelles/news")).toBe(false);
      expect(shouldExcludeFromDeepLink("/category/slug")).toBe(false);
    });

    it("should not exclude paths with similar but different patterns", () => {
      expect(shouldExcludeFromDeepLink("/wp-content/other/file.pdf")).toBe(
        false,
      );
      expect(shouldExcludeFromDeepLink("/uploads/file.pdf")).toBe(false);
      expect(shouldExcludeFromDeepLink("/content/uploads/file.pdf")).toBe(
        false,
      );
    });

    it("should not exclude paths that contain but do not start with the pattern", () => {
      // This tests the fix for false positives
      expect(
        shouldExcludeFromDeepLink(
          "/article/discussing-wp-content/uploads/security",
        ),
      ).toBe(false);
      expect(
        shouldExcludeFromDeepLink("/politik/about-wp-content/uploads/policy"),
      ).toBe(false);
    });

    it("should handle null and undefined paths", () => {
      expect(shouldExcludeFromDeepLink(null)).toBe(false);
      expect(shouldExcludeFromDeepLink(undefined)).toBe(false);
    });

    it("should handle empty strings", () => {
      expect(shouldExcludeFromDeepLink("")).toBe(false);
    });
  });
});
