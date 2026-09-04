// Ephemeral, in-memory signal that a URL currently on its way to the search
// screen came from the OS share sheet (handle-share.tsx), as opposed to a
// deep link or the user typing/pasting into the search field. A query param
// would be spoofable by any deep link to /search — this module-level flag is
// only ever set by handle-share.tsx and is consumed (read once, then
// cleared) by the search screen.
let pendingShareUrl: string | null = null;

export const markShareIntentUrl = (url: string): void => {
  pendingShareUrl = url;
};

export const consumeShareIntentUrl = (url: string): boolean => {
  const matched = pendingShareUrl !== null && pendingShareUrl === url;
  pendingShareUrl = null;
  return matched;
};
