import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export function useDevAuth() {
  const [devUserId, setDevUserId] = useState<string | null>(
    localStorage.getItem("devUserId")
  );
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: devUserId ? [`/api/dev/user/${devUserId}`] : ["/api/auth/user"],
    retry: false,
    enabled: !!devUserId || import.meta.env.DEV,
  });

  const switchToUser = async (userId: string) => {
    localStorage.setItem("devUserId", userId);
    setDevUserId(userId);
    // Invalidate all queries to refetch with new user context
    queryClient.invalidateQueries();
  };

  const clearDevUser = () => {
    localStorage.removeItem("devUserId");
    setDevUserId(null);
    queryClient.invalidateQueries();
  };

  useEffect(() => {
    if (devUserId) {
      localStorage.setItem("devUserId", devUserId);
    }
  }, [devUserId]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    switchToUser,
    clearDevUser,
    currentUserId: devUserId,
    isDevMode: import.meta.env.DEV && !!devUserId,
  };
}