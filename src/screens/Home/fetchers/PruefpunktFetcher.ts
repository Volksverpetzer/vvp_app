import PruefpunktAPI from "#/helpers/network/PruefpunktAPI";

import { WordPressFetcher } from "./WordPressFetcher";

export const PruefpunktFetcher = {
  feedFetcher: async ({ page = 1 }) => {
    try {
      const data = await PruefpunktAPI.getPosts(page);
      return data.map((article, index) => {
        const post = WordPressFetcher.mapArticleToPost(article, index);
        post.data.article.sourceName = "Prüfpunkt";
        return post;
      });
    } catch (error) {
      console.error("Pruefpunkt Error:", error);
      return [];
    }
  },

  searchFetcher: async ({ param: parameter = "" }) => {
    try {
      const data = await PruefpunktAPI.searchPosts(parameter);
      return data.map((article, index) => {
        const post = WordPressFetcher.mapArticleToPost(article, index);
        post.data.article.sourceName = "Prüfpunkt";
        return post;
      });
    } catch (error) {
      console.error("Pruefpunkt Error:", error);
      return [];
    }
  },
};
