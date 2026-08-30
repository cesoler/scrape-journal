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
    articleTitleSelector: string;
    articleTitleFallbackSelector: string;
    subtitleSelector: string;
    createdAtSelector: string;
    canonicalSelector: string;
    publishedAtSelector: string;
    modifiedAtSelector: string;
    imageSelector: string;
    sectionSelector: string;
    authorSelector: string;
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
      articleTitleSelector: 'h1.content-head__title, h1',
      articleTitleFallbackSelector: 'meta[property="og:title"]',
      subtitleSelector: '.content-head__subtitle',
      createdAtSelector: '.content-publication-data__updated',
      canonicalSelector: 'link[rel="canonical"]',
      // Not meta[itemprop]: oglobo and the magazines carry the timestamp on
      // <time itemprop="datePublished" datetime="...">, which meta never matches.
      publishedAtSelector: '[itemprop="datePublished"]',
      modifiedAtSelector: '[itemprop="dateModified"]',
      imageSelector: 'meta[property="og:image"]',
      sectionSelector: 'meta[property="article:section"]',
      // Restricted to Person: g1 repeats the same name as an Organization.
      authorSelector: '[itemprop="author"][itemtype="https://schema.org/Person"]'
    }
  };
};
