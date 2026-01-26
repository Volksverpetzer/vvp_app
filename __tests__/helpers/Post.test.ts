import { describe, expect, it } from "@jest/globals";

import Post from "#/helpers/Post";
import { FaveableType } from "#/types";

describe("Post", () => {
  // Mock component for testing
  const MockComponent = () => null;

  it("should create a post with required properties", () => {
    // Setup
    const datetime = "2023-01-01T12:00:00Z";
    const id = "post-123";
    const data = { title: "Test Post" };

    // Execute
    const post = new Post(datetime, id, MockComponent, data);

    // Assert
    expect(post.datetime).toBe(datetime);
    expect(post.id).toBe(id);
    expect(post.component).toBe(MockComponent);
    expect(post.data).toEqual(data);
    expect(post.inView).toBe(false); // Default value
    expect(post.priority).toBe(1); // Default value
    expect(post.hideShareCount).toBe(false); // Default value
    expect(post.shareable).toBeUndefined();
    expect(post.contentFavIdentifier).toBeUndefined();
    expect(post.contentType).toBeUndefined();
  });

  it("should create a post with all optional properties", () => {
    // Setup
    const datetime = "2023-01-01T12:00:00Z";
    const id = "post-123";
    const data = { title: "Test Post" };
    const shareable = [
      { url: "https://example.com/facebook", title: "Facebook Share" },
      { url: "https://example.com/twitter", title: "Twitter Share" },
    ];
    const priority = 5;
    const hideShareCount = true;
    const contentFavIdentifier = "fav-123";
    const contentType = "article" as FaveableType;

    // Execute
    const post = new Post(
      datetime,
      id,
      MockComponent,
      data,
      shareable,
      priority,
      hideShareCount,
      contentFavIdentifier,
      contentType,
    );

    // Assert
    expect(post.datetime).toBe(datetime);
    expect(post.id).toBe(id);
    expect(post.component).toBe(MockComponent);
    expect(post.data).toEqual(data);
    expect(post.shareable).toEqual(shareable);
    expect(post.priority).toBe(priority);
    expect(post.hideShareCount).toBe(hideShareCount);
    expect(post.contentFavIdentifier).toBe(contentFavIdentifier);
    expect(post.contentType).toBe(contentType);
    expect(post.inView).toBe(false); // Default value that can't be set through constructor
  });

  it("should handle undefined optional parameters", () => {
    // Setup
    const datetime = "2023-01-01T12:00:00Z";
    const id = "post-123";
    const data = { title: "Test Post" };

    // Execute
    const post = new Post(
      datetime,
      id,
      MockComponent,
      data,
      undefined, // shareable
      undefined, // priority
      undefined, // hideShareCount
      undefined, // contentFavIdentifier
      undefined, // contentType
    );

    // Assert
    expect(post.shareable).toBeUndefined();
    expect(post.priority).toBe(1); // Default value
    expect(post.hideShareCount).toBe(false); // Default value
    expect(post.contentFavIdentifier).toBeUndefined();
    expect(post.contentType).toBeUndefined();
  });

  it("should handle different data types", () => {
    // Test with string data
    const postWithStringData = new Post(
      "2023-01-01",
      "id1",
      MockComponent,
      "string data",
    );
    expect(postWithStringData.data).toBe("string data");

    // Test with array data
    const arrayData = [1, 2, 3];
    const postWithArrayData = new Post(
      "2023-01-01",
      "id2",
      MockComponent,
      arrayData,
    );
    expect(postWithArrayData.data).toEqual(arrayData);

    // Test with object data
    const objectData = { complex: { nested: { value: true } } };
    const postWithObjectData = new Post(
      "2023-01-01",
      "id3",
      MockComponent,
      objectData,
    );
    expect(postWithObjectData.data).toEqual(objectData);
  });
});
