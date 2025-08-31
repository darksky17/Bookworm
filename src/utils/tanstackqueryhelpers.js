import {auth, db} from "../Firebaseconfig";


export function updateCacheOnLike({
    queryClient,
    queryKey,
    postId,
  }) {
    queryClient.setQueryData(queryKey, (oldData) => {
      if (!oldData) return oldData;
  
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          posts: page.posts.map((post) => {
            if (post.id !== postId) return post;
  
            const hasLiked = post.likedBy.includes(auth.currentUser.uid);
            const hasDisliked = post.dislikedBy.includes(auth.currentUser.uid);
  
            return {
              ...post,
              Likes: hasLiked ? Math.max(0,post.Likes - 1) : post.Likes + 1,
              Dislikes: hasDisliked ? Math.max(0,post.Dislikes - 1) : post.Dislikes,
              dislikedBy: hasDisliked
                ? post.dislikedBy.filter((id) => id !== auth.currentUser.uid)
                : post.dislikedBy,
              likedBy: hasLiked
                ? post.likedBy.filter((id) => id !== auth.currentUser.uid)
                : [...post.likedBy, auth.currentUser.uid],
            };
          }),
        })),
      };
    });
  };

  export function updateCacheOnDislike({
    queryClient,
    queryKey,
    postId,
  }) {
    queryClient.setQueryData(queryKey, (oldData) => {
      if (!oldData) return oldData;
  
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          posts: page.posts.map((post) => {
            if (post.id !== postId) return post;
  
            const hasLiked = post.likedBy.includes(auth.currentUser.uid);
            const hasDisliked = post.dislikedBy.includes(auth.currentUser.uid);
  
            return {
              ...post,
              Likes: hasLiked ? Math.max(0,post.Likes - 1) : post.Likes,
              Dislikes: hasDisliked ? Math.max(0,post.Dislikes - 1) : post.Dislikes + 1,
              dislikedBy: hasDisliked
                ? post.dislikedBy.filter((id) => id !== auth.currentUser.uid)
                : [...post.dislikedBy, auth.currentUser.uid],
              likedBy: hasLiked
                ? post.likedBy.filter((id) => id !== auth.currentUser.uid)
                : post.likedBy
            };
          }),
        })),
      };
    });
  };