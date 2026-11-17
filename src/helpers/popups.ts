/**
 * Imperative API for the app's interactive popups, rendered by `PopupHost`
 * (mounted once in the root layout) with `UiModal`:
 *
 * - `popups.confirm` — a dialog that asks before doing something
 * - `popups.choose` — a bottom sheet with a list of options
 *
 * Toasts (`#/helpers/toast`) are only for short messages that need no
 * answer. Each call returns a promise that resolves once the popup has fully
 * closed, so the caller can safely present something native next (e.g. the
 * system share sheet). Opening a new popup while one is showing cancels the
 * old one.
 */

export interface ConfirmOptions {
  title: string;
  message: string;
  /** Label of the confirm button, e.g. "Zurücksetzen". */
  confirmLabel: string;
  /** Defaults to "Abbrechen". */
  cancelLabel?: string;
}

export interface ChooseOptions {
  title: string;
  /** Labels of the options, in display order. */
  options: string[];
}

export type PopupRequest =
  ({ kind: "confirm" } & ConfirmOptions) | ({ kind: "choose" } & ChooseOptions);

export interface PopupState {
  request: PopupRequest | null;
  /**
   * Increases with every popup; the host passes it back to `closed`, so a
   * late close report from a replaced popup can't settle the current one.
   */
  id: number;
  /** False while the popup animates out; the request stays for that. */
  visible: boolean;
}

type Answer = boolean | number | null;

let state: PopupState = { request: null, id: 0, visible: false };
// The answer given by the user, delivered once the popup has closed
let pendingAnswer: Answer = null;
let pendingResolve: ((answer: Answer) => void) | null = null;
const listeners = new Set<() => void>();

const setState = (next: PopupState) => {
  state = next;
  for (const listener of listeners) listener();
};

const cancelValue = (request: PopupRequest | null): Answer =>
  request?.kind === "confirm" ? false : null;

const open = (request: PopupRequest): Promise<Answer> => {
  // A popup that is still open (or closing) gives up its answer right away
  pendingResolve?.(cancelValue(state.request));
  return new Promise((resolve) => {
    pendingResolve = resolve;
    pendingAnswer = cancelValue(request);
    setState({ request, id: state.id + 1, visible: true });
  });
};

export const popupStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getState: () => state,
  /** Records the user's answer and starts closing the popup. */
  answer(value: Answer) {
    if (!state.visible) return;
    pendingAnswer = value;
    setState({ ...state, visible: false });
  },
  /** Called by the host once the popup with this id is fully gone. */
  closed(id: number) {
    if (id !== state.id) return;
    const resolve = pendingResolve;
    pendingResolve = null;
    resolve?.(pendingAnswer);
  },
};

export const popups = {
  /** Resolves to true if the user confirmed, false otherwise. */
  confirm: (options: ConfirmOptions) =>
    open({ kind: "confirm", ...options }) as Promise<boolean>,
  /** Resolves to the chosen option's index, or null if dismissed. */
  choose: (options: ChooseOptions) =>
    open({ kind: "choose", ...options }) as Promise<number | null>,
};
