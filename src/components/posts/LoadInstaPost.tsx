import { useEffect, useState } from "react";

import UiSpinner from "#/components/animations/UiSpinner";
import ContentStore from "#/helpers/Stores/ContentStore";
import API from "#/helpers/network/ServerAPI";

import InstaPost, { InstaPostProperties } from "./InstaPost";

type LoadProperties = {
  id: string;
  inView?: boolean;
};

/**
 * This component takes an Instagram post ID as a property, fetches the post data from the API,
 * and renders the InstaPost component with the fetched data. While the data is being fetched,
 * it displays an animated loading indicator.
 */
const LoadInstaPost = (properties: LoadProperties) => {
  const [post, setPost] = useState<InstaPostProperties>();
  const [isLoading, setLoading] = useState(true);
  const { id } = properties;

  useEffect(() => {
    const controller = new AbortController();

    API.getInstaPost(id, controller.signal)
      .then((_post: InstaPostProperties) => {
        if (controller.signal.aborted) return;
        ContentStore.setStoredInstaPost(id, _post);
        setPost(_post);
        setLoading(false);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error(error);
      });

    return () => {
      controller.abort();
    };
  }, [id]);

  if (isLoading) {
    return <UiSpinner size={"large"} />;
  }

  return <InstaPost inView={true} {...post} />;
};

export default LoadInstaPost;
