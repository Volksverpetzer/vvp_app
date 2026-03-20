import type { Post as PostType } from "#/types";

type P<T> = PostType<T>;

/**
 * Post Class for ordering of different types of Post Components
 */
export default class Post<T> implements P<T> {
  public constructor(
    public datetime: P<T>["datetime"],
    public id: P<T>["id"],
    public component: P<T>["component"],
    public data: P<T>["data"],
    public shareable: P<T>["shareable"] = undefined,
    public priority: P<T>["priority"] = 1,
    public contentFavIdentifier?: P<T>["contentFavIdentifier"],
    public contentType?: P<T>["contentType"],
    public inView: P<T>["inView"] = false,
  ) {}
}
