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
    API.getInstaPost(id)
      .then((_post: InstaPostProperties) => {
        ContentStore.setStoredInstaPost(id, _post);
        setPost(_post);
        setLoading(false);
      })
      .catch((error) => console.error(error));
  }, [id]);

  if (isLoading) {
    return <UiSpinner />;
  }

  return <InstaPost inView={true} {...post} />;
};

export default LoadInstaPost;
