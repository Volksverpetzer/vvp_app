export interface ShareIntentFallback {
  hasShareIntent: boolean;
  shareIntent?: { type?: string; webUrl?: string; text?: string } | null;
  error?: string | null;
}

export const useOptionalShareIntent = (): ShareIntentFallback => {
  return { hasShareIntent: false, shareIntent: undefined, error: null };
};

export default useOptionalShareIntent;
