import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SERVER_URL } from "../constants/api";
import { auth } from "../Firebaseconfig";
const fetchChats = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const idToken = await user.getIdToken();
  const userId = user.uid;

  const response = await fetch(`${SERVER_URL}/chat-list/${userId}/chats`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch chat data");
  }

  return response.json(); // returns the chat data
};

const useFetchChats = () => {
  return useQuery({
    queryKey: ["chats"],
    queryFn: fetchChats,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // optional: 1 minute
    cacheTime: 0,
    retry: 3, // optional: retry once on error
  });
};

export default useFetchChats;
