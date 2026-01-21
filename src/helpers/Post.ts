import { FC } from "react";

import { FaveableType } from "../types";
import { ShareableType } from "./Sharing";

/**
 * Post Class for ordering of different types of Post Components
 */
export default class Post<T> {
  datetime: string;
  component: FC;
  id: string;
  shareable?: ShareableType[];
  contentFavIdentifier?: string;
  contentType?: FaveableType;
  priority?: number;
  inView = false;
  hideShareCount?: boolean;
  data: T;
  public constructor(
    datetime: string,
    id: string,
    component: FC,
    data: T,
    shareable?: ShareableType[],
    priority?: number,
    hideShareCount?: boolean,
    contentFavIdentifier?: string,
    contentType?: FaveableType,
  ) {
    this.contentFavIdentifier = contentFavIdentifier;
    this.contentType = contentType;
    this.datetime = datetime;
    this.id = id;
    this.component = component;
    this.data = data;
    this.shareable = shareable ?? undefined;
    this.priority = priority ?? 1;
    this.hideShareCount = hideShareCount ?? false;
  }
}
