import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SERVER_URL } from "../constants/api";
import { auth } from "../Firebaseconfig";
// Custom hook for fetching nearby users
export const useNearbyUsers = (
  location,
  distance,
  ageMin,
  ageMax,
  enabled = false
) => {
  return useQuery({
    queryKey: ["nearbyUsers", { location, distance, ageMin, ageMax }],
    queryFn: async () => {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`${SERVER_URL}/nearby-users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          location,
          distance,
          ageMin,
          ageMax,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch nearby users");
      }

      return response.json();
    },
    enabled,
    staleTime: 0,
    cacheTime: 0, // 10 minutes
    keepPreviousData: false,
    refetchInterval: enabled ? 60 * 60 * 1000 : false, // Refetch every hour when enabled
  });
};
