
export const pollUpdate = async (postId, queryKey, queryClient, newVoterList) => {
    const previousData = queryClient.getQueryData(queryKey);
    try {
        queryClient.setQueryData(queryKey, (oldData) => {
            if (!oldData) return oldData;
        
            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                posts: page.posts.map((post) => {
                  if (post.id !== postId) return post;
        
        
                  return {
                    ...post,
                    voterList: newVoterList,
          
                  };
                }),
              })),
            };
          });
  
  
    } catch (error) {
      alert("Failed to Add vote.");
      queryClient.setQueryData(queryKey, previousData);
    }
  };
  

  