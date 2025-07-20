import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const token = localStorage.getItem("auth_token");
  
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user", token],
    queryFn: async () => {
      const response = await fetch("/api/auth/user", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }
      return response.json();
    },
    retry: false,
    enabled: !!token,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
