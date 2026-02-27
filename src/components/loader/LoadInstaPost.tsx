import { useCallback } from "react";

import Loader from "#/components/loader/Loader";
import InstaPost, { InstaPostProperties } from "#/components/posts/InstaPost";
import ContentStore from "#/helpers/Stores/ContentStore";
import API from "#/helpers/network/ServerAPI";

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
  const { id } = properties;

  const loadInstaPost = useCallback(
    (postId: string) => API.getInstaPost(postId),
    [],
  );

  const handleLoaded = useCallback(
    (post: InstaPostProperties) => {
      ContentStore.setStoredInstaPost(id, post);
    },
    [id],
  );

  const renderPost = useCallback(
    (post: InstaPostProperties) => <InstaPost inView={true} {...post} />,
    [],
  );

  return (
    <Loader
      keyValue={id}
      load={loadInstaPost}
      onLoaded={handleLoaded}
      render={renderPost}
      loadingText={"Lade Instagram Beitrag..."}
    />
  );
};

export default LoadInstaPost;
