import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Modal,
  FlatList,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeOut, SlideInUp } from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useUserSearch, SearchableUser } from "@/hooks/useUserSearch";

interface ReceiverSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectReceiver: (receiver: SearchableUser) => void;
  selectedReceiver?: SearchableUser | null;
}

function UserResultCard({
  user,
  onPress,
  isSelected,
  theme,
}: {
  user: SearchableUser;
  onPress: () => void;
  isSelected: boolean;
  theme: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.userCard,
        {
          backgroundColor: isSelected ? `${Colors.primary}15` : theme.backgroundDefault,
          borderColor: isSelected ? Colors.primary : theme.border,
        },
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: Colors.primary }]}>
        <ThemedText type="h4" style={{ color: "#FFFFFF" }}>
          {user.name.charAt(0).toUpperCase()}
        </ThemedText>
      </View>
      <View style={styles.userInfo}>
        <View style={styles.nameRow}>
          <ThemedText type="body" style={{ fontWeight: "600" }}>
            {user.name}
          </ThemedText>
          {user.verified ? (
            <View style={styles.verifiedBadge}>
              <Feather name="check-circle" size={14} color={Colors.success} />
            </View>
          ) : null}
        </View>
        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
          {user.email}
        </ThemedText>
        {user.phone ? (
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {user.phone}
          </ThemedText>
        ) : null}
        <View style={styles.ratingRow}>
          <Feather name="star" size={12} color={Colors.warning} />
          <ThemedText type="caption" style={{ marginLeft: 4 }}>
            {user.rating.toFixed(1)}
          </ThemedText>
          {user.savedLocationName ? (
            <View style={styles.locationBadge}>
              <Feather name="map-pin" size={10} color={Colors.success} />
              <ThemedText type="caption" style={{ marginLeft: 2, color: Colors.success, fontSize: 10 }}>
                Location saved
              </ThemedText>
            </View>
          ) : null}
        </View>
      </View>
      {isSelected ? (
        <View style={[styles.selectedIcon, { backgroundColor: Colors.primary }]}>
          <Feather name="check" size={16} color="#FFFFFF" />
        </View>
      ) : (
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      )}
    </Pressable>
  );
}

function SelectedReceiverProfile({
  receiver,
  onConfirm,
  onBack,
  theme,
}: {
  receiver: SearchableUser;
  onConfirm: () => void;
  onBack: () => void;
  theme: any;
}) {
  return (
    <Animated.View 
      entering={SlideInUp.duration(300)} 
      style={styles.profileContainer}
    >
      <Pressable onPress={onBack} style={styles.backButton}>
        <Feather name="arrow-left" size={20} color={theme.text} />
        <ThemedText type="body" style={{ marginLeft: Spacing.sm }}>
          Back to search
        </ThemedText>
      </Pressable>

      <View style={[styles.profileCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
        <View style={[styles.profileAvatar, { backgroundColor: Colors.primary }]}>
          <ThemedText type="h1" style={{ color: "#FFFFFF" }}>
            {receiver.name.charAt(0).toUpperCase()}
          </ThemedText>
        </View>

        <ThemedText type="h2" style={{ marginTop: Spacing.lg, textAlign: "center" }}>
          {receiver.name}
        </ThemedText>

        {receiver.verified ? (
          <View style={styles.verifiedRow}>
            <Feather name="check-circle" size={16} color={Colors.success} />
            <ThemedText type="caption" style={{ color: Colors.success, marginLeft: Spacing.xs }}>
              Verified User
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.profileDetails}>
          <View style={styles.profileDetailRow}>
            <Feather name="mail" size={18} color={theme.textSecondary} />
            <ThemedText type="body" style={{ marginLeft: Spacing.md }}>
              {receiver.email}
            </ThemedText>
          </View>

          {receiver.phone ? (
            <View style={styles.profileDetailRow}>
              <Feather name="phone" size={18} color={theme.textSecondary} />
              <ThemedText type="body" style={{ marginLeft: Spacing.md }}>
                {receiver.phone}
              </ThemedText>
            </View>
          ) : null}

          <View style={styles.profileDetailRow}>
            <Feather name="star" size={18} color={Colors.warning} />
            <ThemedText type="body" style={{ marginLeft: Spacing.md }}>
              {receiver.rating.toFixed(1)} Rating
            </ThemedText>
          </View>

          {receiver.savedLocationName ? (
            <View style={[styles.profileDetailRow, styles.locationSavedRow]}>
              <Feather name="map-pin" size={18} color={Colors.success} />
              <View style={{ marginLeft: Spacing.md, flex: 1 }}>
                <ThemedText type="body" style={{ color: Colors.success, fontWeight: "600" }}>
                  Delivery Location Saved
                </ThemedText>
                <ThemedText type="caption" numberOfLines={2} style={{ color: theme.textSecondary, marginTop: 2 }}>
                  {receiver.savedLocationName}
                </ThemedText>
              </View>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.confirmSection}>
        <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center", marginBottom: Spacing.md }}>
          Confirm this is the correct receiver for your parcel
        </ThemedText>
        <Button onPress={onConfirm}>
          Confirm Receiver
        </Button>
      </View>
    </Animated.View>
  );
}

export function ReceiverSearchModal({
  visible,
  onClose,
  onSelectReceiver,
  selectedReceiver,
}: ReceiverSearchModalProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { searchResults, isSearching, searchError, searchUsers, clearSearch } = useUserSearch();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [previewReceiver, setPreviewReceiver] = useState<SearchableUser | null>(null);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!visible) {
      setSearchQuery("");
      setPreviewReceiver(null);
      clearSearch();
    }
  }, [visible, clearSearch]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    
    const timeout = setTimeout(() => {
      searchUsers(text);
    }, 300);
    
    setDebounceTimeout(timeout);
  }, [searchUsers, debounceTimeout]);

  const handleSelectUser = (user: SearchableUser) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setPreviewReceiver(user);
  };

  const handleConfirmReceiver = () => {
    if (previewReceiver) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onSelectReceiver(previewReceiver);
      onClose();
    }
  };

  const handleBackToSearch = () => {
    setPreviewReceiver(null);
  };

  const renderEmptyState = () => {
    if (isSearching) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <ThemedText type="body" style={{ marginTop: Spacing.md, color: theme.textSecondary }}>
            Searching users...
          </ThemedText>
        </View>
      );
    }

    if (searchError) {
      return (
        <View style={styles.emptyState}>
          <Feather name="alert-circle" size={48} color={Colors.error} />
          <ThemedText type="body" style={{ marginTop: Spacing.md, color: Colors.error }}>
            {searchError}
          </ThemedText>
        </View>
      );
    }

    if (searchQuery.length > 0 && searchQuery.length < 2) {
      return (
        <View style={styles.emptyState}>
          <Feather name="search" size={48} color={theme.textSecondary} />
          <ThemedText type="body" style={{ marginTop: Spacing.md, color: theme.textSecondary }}>
            Type at least 2 characters to search
          </ThemedText>
        </View>
      );
    }

    if (searchQuery.length >= 2 && searchResults.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Feather name="user-x" size={48} color={theme.textSecondary} />
          <ThemedText type="body" style={{ marginTop: Spacing.md, color: theme.textSecondary }}>
            No users found
          </ThemedText>
          <ThemedText type="caption" style={{ marginTop: Spacing.sm, color: theme.textSecondary, textAlign: "center" }}>
            Try a different name or email address
          </ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Feather name="users" size={48} color={theme.textSecondary} />
        <ThemedText type="body" style={{ marginTop: Spacing.md, color: theme.textSecondary }}>
          Search for a receiver
        </ThemedText>
        <ThemedText type="caption" style={{ marginTop: Spacing.sm, color: theme.textSecondary, textAlign: "center" }}>
          Enter their name or email to find them
        </ThemedText>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm, borderBottomColor: theme.border }]}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color={theme.text} />
          </Pressable>
          <ThemedText type="h3">Find Receiver</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        {previewReceiver ? (
          <SelectedReceiverProfile
            receiver={previewReceiver}
            onConfirm={handleConfirmReceiver}
            onBack={handleBackToSearch}
            theme={theme}
          />
        ) : (
          <>
            <View style={[styles.searchContainer, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
              <Feather name="search" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search by name or email..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={handleSearchChange}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 ? (
                <Pressable onPress={() => handleSearchChange("")}>
                  <Feather name="x-circle" size={20} color={theme.textSecondary} />
                </Pressable>
              ) : null}
            </View>

            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <UserResultCard
                  user={item}
                  onPress={() => handleSelectUser(item)}
                  isSelected={selectedReceiver?.id === item.id}
                  theme={theme}
                />
              )}
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: insets.bottom + Spacing.xl },
              ]}
              ListEmptyComponent={renderEmptyState}
              keyboardShouldPersistTaps="handled"
            />
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  verifiedBadge: {
    marginLeft: Spacing.xs,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  selectedIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl * 2,
  },
  profileContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  profileCard: {
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginTop: Spacing.lg,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  profileDetails: {
    width: "100%",
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  profileDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  confirmSection: {
    marginTop: "auto",
    paddingTop: Spacing.xl,
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    backgroundColor: `${Colors.success}15`,
    borderRadius: BorderRadius.sm,
  },
  locationSavedRow: {
    backgroundColor: `${Colors.success}10`,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
});
