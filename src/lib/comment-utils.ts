export interface TreeNode {
    id: string;
    parent_id: string | null;
    created_at: string;
    like_count?: number;
    replies?: TreeNode[];
    [key: string]: any;
}

export function buildCommentTree<T extends TreeNode>(items: T[]): (T & { replies: T[] })[] {
    const map: Record<string, T & { replies: T[] }> = {};
    const roots: (T & { replies: T[] })[] = [];
    
    items.forEach(c => {
      map[c.id] = { ...c, replies: [] };
    });
    
    const findRootId = (commentId: string): string | null => {
      let current = map[commentId];
      const visited = new Set<string>();
      while (current && current.parent_id) {
        if (visited.has(current.id)) return null;
        visited.add(current.id);
        current = map[current.parent_id];
      }
      return current ? current.id : null;
    };
    
    const rootRepliesMap: Record<string, (T & { replies: T[] })[]> = {};
    
    items.forEach(c => {
      if (!c.parent_id) {
        roots.push(map[c.id]);
      } else {
        const rootId = findRootId(c.id);
        if (rootId && map[rootId]) {
          if (!rootRepliesMap[rootId]) rootRepliesMap[rootId] = [];
          rootRepliesMap[rootId].unshift(map[c.id]);
        }
      }
    });
    
    roots.forEach(root => {
      if (rootRepliesMap[root.id]) {
        root.replies = rootRepliesMap[root.id].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }
    });
    
    if (roots.length > 1) {
      let topLikedIndex = -1;
      let maxLikes = 0;
      roots.forEach((root, idx) => {
        const likes = root.like_count || 0;
        if (likes > maxLikes) {
          maxLikes = likes;
          topLikedIndex = idx;
        }
      });
      if (topLikedIndex !== -1 && maxLikes > 0) {
        const topLiked = roots.splice(topLikedIndex, 1)[0];
        roots.unshift(topLiked);
      }
    }
    
    return roots;
}
