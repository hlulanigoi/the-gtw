import { useState, useCallback } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export interface SearchableUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  rating: number;
  verified: boolean;
  savedLocationName?: string;
  savedLocationAddress?: string;
  savedLocationLat?: number;
  savedLocationLng?: number;
}

export function useUserSearch() {
  const { user } = useAuth();
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
      const usersRef = collection(db, "users");
      const searchLower = searchTerm.toLowerCase().trim();
      
      const allUsers: SearchableUser[] = [];
      
      const snapshot = await getDocs(usersRef);
      
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const userName = (data.name || "").toLowerCase();
        const userEmail = (data.email || "").toLowerCase();
        
        if (doc.id !== user?.uid && 
            (userName.includes(searchLower) || userEmail.includes(searchLower))) {
          allUsers.push({
            id: doc.id,
            name: data.name || "Unknown",
            email: data.email || "",
            phone: data.phone,
            rating: data.rating || 5.0,
            verified: data.verified || false,
            savedLocationName: data.savedLocationName,
            savedLocationAddress: data.savedLocationAddress,
            savedLocationLat: data.savedLocationLat,
            savedLocationLng: data.savedLocationLng,
          });
        }
      });

      const sortedUsers = allUsers.sort((a, b) => {
        const aNameMatch = a.name.toLowerCase().startsWith(searchLower);
        const bNameMatch = b.name.toLowerCase().startsWith(searchLower);
        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;
        return a.name.localeCompare(b.name);
      }).slice(0, 10);

      setSearchResults(sortedUsers);
    } catch (err) {
      console.error("Error searching users:", err);
      setSearchError("Failed to search users. Please try again.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [user?.uid]);

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
