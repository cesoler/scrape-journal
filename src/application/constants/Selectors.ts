export const JOURNAL_SELECTORS = {
  mainPage: {
    columnSelector: (columnType: string) => `#column-${columnType}`,
    contentColumnSelector: '.column-content',
    individualSelector: (columnType: string) => `.wrapper.theme-${columnType}`,
    featuredSelector: '.first',
    postSelector: '.post',
    postLinkSelector: '.post__link',
    postTitleSelector: '.post__title'
  }
};