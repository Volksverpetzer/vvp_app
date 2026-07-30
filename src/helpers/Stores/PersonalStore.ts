import BaseStore from "#/helpers/Storage";

// Serializes dismissAnnouncement's read-modify-write: callers fire-and-forget
// it, so two quick dismissals could otherwise both read the same stored list
// and the later write would drop the earlier id.
let pendingDismissal: Promise<void> = Promise.resolve();

const PersonalStore = {
  keys: {
    onboardingDone: "onboarded",
    scrollPosition: "scrollPosition",
    audioPosition: "audioPosition",
    longPressTip: "longPressTip",
    lastSeenChangelog: "lastSeenChangelog",
    dismissedAnnouncements: "dismissedAnnouncements",
  },

  /**
   * Constructs the key for scroll position storage for a given slug.
   * @param {string} slug - The slug for which to create the key.
   * @returns {string} The storage key.
   */
  getScrollKey(slug: string): string {
    return `${this.keys.scrollPosition}_${slug}`;
  },

  /**
   * Constructs the key for audio position storage for a given resume key
   * (e.g. a podcast episode's audio URL).
   */
  getAudioKey(resumeKey: string): string {
    return `${this.keys.audioPosition}_${resumeKey}`;
  },

  /**
   * Checks if the onboarding process is done.
   * @returns {Promise<boolean>} True if onboarding is done, false otherwise.
   */
  async isOnboardingDone(): Promise<boolean> {
    try {
      const value = await BaseStore.getItem(this.keys.onboardingDone);
      return value === "true";
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      return false;
    }
  },

  /**
   * Sets the onboarding status (default: to true).
   * @param {boolean} [value=true] - The onboarding status to set.
   */
  async setOnboardingDone(value: boolean = true): Promise<void> {
    try {
      await BaseStore.setItem(this.keys.onboardingDone, JSON.stringify(value));
    } catch (error) {
      console.error("Error setting onboarding status:", error);
    }
  },

  async getLastSeenChangelogVersionCode(): Promise<number> {
    try {
      const value = await BaseStore.getItem(this.keys.lastSeenChangelog);
      return BaseStore.parseJSON<number>(value, 0);
    } catch (error) {
      console.error(
        "Error retrieving last seen changelog version code:",
        error,
      );
      return 0;
    }
  },

  async setLastSeenChangelogVersionCode(versionCode: number): Promise<void> {
    try {
      await BaseStore.setItem(
        this.keys.lastSeenChangelog,
        JSON.stringify(versionCode),
      );
    } catch (error) {
      console.error("Error saving last seen changelog version code:", error);
    }
  },

  /**
   * Retrieves the ids of permanently dismissed in-feed announcement cards.
   * @returns {Promise<string[]>} The dismissed announcement ids.
   */
  async getDismissedAnnouncements(): Promise<string[]> {
    try {
      const value = await BaseStore.getItem(this.keys.dismissedAnnouncements);
      return BaseStore.parseJSON<string[]>(value, []);
    } catch (error) {
      console.error("Error retrieving dismissed announcements:", error);
      return [];
    }
  },

  /**
   * Marks an in-feed announcement card as permanently dismissed.
   * @param {string} id - The id of the announcement to dismiss.
   */
  dismissAnnouncement(id: string): Promise<void> {
    pendingDismissal = pendingDismissal.then(async () => {
      try {
        const dismissed = await this.getDismissedAnnouncements();
        if (dismissed.includes(id)) return;
        await BaseStore.setItem(
          this.keys.dismissedAnnouncements,
          JSON.stringify([...dismissed, id]),
        );
      } catch (error) {
        console.error("Error dismissing announcement:", error);
      }
    });
    return pendingDismissal;
  },

  /**
   * Stores the scroll position for a specific slug.
   * @param {number} position - The scroll position to store.
   * @param {string} slug - The slug associated with the scroll position.
   */
  async setScrollPosition(position: number, slug: string): Promise<void> {
    try {
      const key = this.getScrollKey(slug);
      await BaseStore.setItem(key, JSON.stringify(position));
    } catch (error) {
      console.error("Error setting scroll position:", error);
    }
  },

  /**
   * Retrieves the scroll position for a specific slug.
   * @param {string} slug - The slug associated with the scroll position.
   * @returns {Promise<number>} The stored scroll position.
   */
  async getScrollPosition(slug: string): Promise<number> {
    try {
      const key = this.getScrollKey(slug);
      const jsonValue = await BaseStore.getItem(key);
      return BaseStore.parseJSON<number>(jsonValue, 0);
    } catch (error) {
      console.error("Error retrieving scroll position:", error);
      return 0;
    }
  },

  /**
   * Stores the playback position (in seconds) for a resumable audio.
   * @param {string} resumeKey - Identifies the audio, e.g. its URL.
   * @param {number} position - The playback position in seconds.
   */
  async setAudioPosition(resumeKey: string, position: number): Promise<void> {
    try {
      await BaseStore.setItem(
        this.getAudioKey(resumeKey),
        JSON.stringify(position),
      );
    } catch (error) {
      console.error("Error setting audio position:", error);
    }
  },

  /**
   * Retrieves the stored playback position (in seconds) for a resumable audio.
   * @param {string} resumeKey - Identifies the audio, e.g. its URL.
   * @returns {Promise<number>} The stored position, 0 if none.
   */
  async getAudioPosition(resumeKey: string): Promise<number> {
    try {
      const jsonValue = await BaseStore.getItem(this.getAudioKey(resumeKey));
      return BaseStore.parseJSON<number>(jsonValue, 0);
    } catch (error) {
      console.error("Error retrieving audio position:", error);
      return 0;
    }
  },

  /**
   * Clears the stored playback position, e.g. once the audio finished.
   * @param {string} resumeKey - Identifies the audio, e.g. its URL.
   */
  async clearAudioPosition(resumeKey: string): Promise<void> {
    try {
      await BaseStore.removeItem(this.getAudioKey(resumeKey));
    } catch (error) {
      console.error("Error clearing audio position:", error);
    }
  },
};

export default PersonalStore;
