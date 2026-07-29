/**
 * Decodes a URL fragment (anchor id) once, so percent-encoded fragments
 * (e.g. `#%C3%A4` or WordPress ids with a trailing `%20`) match the raw
 * `id` attributes in the rendered HTML. Decoding twice would corrupt ids that
 * legitimately contain `%`, so callers must pass the fragment as it appears
 * in the URL. Returns the input unchanged when it is not valid
 * percent-encoding.
 * @param fragment - The fragment without the leading `#`
 * @returns The decoded fragment
 */
export const decodeAnchor = (fragment: string): string => {
  try {
    return decodeURIComponent(fragment);
  } catch {
    return fragment;
  }
};
