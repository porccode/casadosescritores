// Barrel export para content-viewer
export { default } from './ContentViewer';
export { default as ContentViewer } from './ContentViewer';
export { default as ContentHeader } from './ContentHeader';
export { default as ContentFooter } from './ContentFooter';
export { default as RelatedContent } from './RelatedContent';

// Types
export type {
  Author,
  ChapterNavigation,
  RelatedItem,
  ContentType,
  ContentViewerProps,
  ContentHeaderProps,
  ContentFooterProps,
  ContentNavigationProps,
  RelatedContentProps,
} from './types';
