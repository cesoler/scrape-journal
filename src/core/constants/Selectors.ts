import { AvailableColumnCategory } from "../models/JournalModel";

export interface JournalSelector {
  mainPage: {
    columnSelector: string;
    contentColumnSelector: string;
    articlesSelector: string;
    featuredSelector: string;
    postSelector: string;
    postLinkSelector: string;
    postTitleSelector: string;
  };
  articlePage: {
    subtitleSelector: string;
    createdAtSelector: string;
  };
};

export const getSelectorsForBrowser = (category: AvailableColumnCategory): JournalSelector => {
  return {
    mainPage: {
      columnSelector: `#column-${category}`,
      contentColumnSelector: '.column-content',
      articlesSelector: `.wrapper.theme-${category}`,
      featuredSelector: '.first',
      postSelector: '.post',
      postLinkSelector: '.post__link',
      postTitleSelector: '.post__title'
    },
    articlePage: {
      subtitleSelector: '.content-head__subtitle',
      createdAtSelector: '.content-publication-data__updated'
    }
  };
};
