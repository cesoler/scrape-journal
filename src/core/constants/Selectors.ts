import { AvailableColumnCategory } from "../models/JournalModel";

export interface JournalSelector {
  mainPage: {
    columnSelector: string;
    contentColumnSelector: string;
    individualSelector: string;
    featuredSelector: string;
    postSelector: string;
    postLinkSelector: string;
    postTitleSelector: string;
  };
}

export const getSelectorsForBrowser = (category: AvailableColumnCategory): JournalSelector => {
  return {
    mainPage: {
      columnSelector: `#column-${category}`,
      contentColumnSelector: '.column-content',
      individualSelector: `.wrapper.theme-${category}`,
      featuredSelector: '.first',
      postSelector: '.post',
      postLinkSelector: '.post__link',
      postTitleSelector: '.post__title'
    }
  };
};

