"use client";

import React, { memo, useEffect } from "react";
import EditorViewer from '@/components/tiptap/EditorViewer';

interface StoryContentProps {
  content?: string | null;
  onBlocksReady?: () => void;
}

/**
 * StoryContent Component
 * Wrapper around EditorViewer to display Tiptap content.
 * After render, assigns data-block-id to each paragraph/heading
 * so the inline comment system can identify individual blocks.
 * Memoized to prevent unnecessary re-renders.
 */
const StoryContentComponent = ({
  content,
  onBlocksReady,
}: StoryContentProps): React.ReactElement | null => {
  useEffect(() => {
    if (!content) return;

    // Allow Tiptap to finish rendering before querying DOM
    const timer = setTimeout(() => {
      const root = document.getElementById('story-content-root');
      if (!root) return;

      // Target block-level elements that make sense for paragraph comments
      const blocks = root.querySelectorAll('p, h1, h2, h3, h4, h5, h6, blockquote');
      let index = 0;
      blocks.forEach((block) => {
        const text = block.textContent?.trim();
        // Skip empty blocks
        if (!text) return;
        block.setAttribute('data-block-id', `block-${index}`);
        index++;
      });

      onBlocksReady?.();
    }, 300);

    return () => clearTimeout(timer);
  }, [content, onBlocksReady]);

  if (!content) return null;

  return (
    <div id="story-content-root" className="p-0 m-0">
      <EditorViewer content={content} />
    </div>
  );
};

const StoryContent = memo(StoryContentComponent);
export default StoryContent;
