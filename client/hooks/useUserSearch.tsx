import { useState, useCallback } from "react";
import { apiRequest } from "@/lib/query-client";

export interface SearchableUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  rating: number;
  verified: boolean;
}

export function useUserSearch() {
  const [searchResults, setSearchResults] = useState<SearchableUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const searchUsers = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim() || searchTerm.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await apiRequest(
        "GET",
        `/api/users/search?q=${encodeURIComponent(searchTerm)}`
      );
      const results = await response.json();
      setSearchResults(results);
    } catch (err) {
      console.error("Error searching users:", err);
      setSearchError("Failed to search users. Please try again.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setSearchError(null);
  }, []);

  return {
    searchResults,
    isSearching,
    searchError,
    searchUsers,
    clearSearch,
  };
}
