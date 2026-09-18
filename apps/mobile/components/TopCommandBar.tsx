import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { COLORS } from "@/constants/theme";

interface TopCommandBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh?: () => void;
}

export function TopCommandBar({
  searchQuery,
  onSearchChange,
  onRefresh,
}: TopCommandBarProps) {
  const [showSearchInput, setShowSearchInput] = useState(false);

  return (
    <View style={styles.container}>
      {!showSearchInput ? (
        <View style={styles.row}>
          {/* Logo & Subtitle */}
          <View style={styles.brandGroup}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>TF</Text>
            </View>
            <View>
              <View style={styles.titleRow}>
                <Text style={styles.logoText}>TRUEFACT</Text>
                <View style={styles.aiTag}>
                  <Text style={styles.aiTagText}>AI</Text>
                </View>
              </View>
              <Text style={styles.subtitle}>Intelligence Workspace</Text>
            </View>
          </View>

          {/* Right Action Icons */}
          <View style={styles.actionGroup}>
            {/* Live Indicator */}
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>

            {/* Search Toggle Button */}
            <Pressable
              style={styles.iconButton}
              onPress={() => setShowSearchInput(true)}
              hitSlop={8}
            >
              <Text style={styles.searchIconText}>🔍</Text>
            </Pressable>

            {/* Refresh Button */}
            {onRefresh && (
              <Pressable
                style={styles.iconButton}
                onPress={onRefresh}
                hitSlop={8}
              >
                <Text style={styles.refreshIconText}>🔄</Text>
              </Pressable>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <Text style={styles.searchInnerIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search verified news & sources..."
              placeholderTextColor={COLORS.textDim}
              value={searchQuery}
              onChangeText={onSearchChange}
              autoFocus
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => onSearchChange("")}
                style={styles.clearBtn}
                hitSlop={8}
              >
                <Text style={styles.clearBtnText}>✕</Text>
              </Pressable>
            )}
          </View>

          <Pressable
            style={styles.cancelBtn}
            onPress={() => {
              onSearchChange("");
              setShowSearchInput(false);
            }}
            hitSlop={8}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgHeader,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
  },
  brandGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.bgRaised,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  logoBadgeText: {
    color: COLORS.accentCyan,
    fontWeight: "800",
    fontSize: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logoText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  aiTag: {
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.25)",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 0.5,
  },
  aiTagText: {
    color: COLORS.accentCyan,
    fontSize: 9,
    fontWeight: "800",
  },
  subtitle: {
    color: COLORS.textDim,
    fontSize: 10,
    fontWeight: "600",
  },
  actionGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(45, 212, 191, 0.1)",
    borderColor: "rgba(45, 212, 191, 0.25)",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 4,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.credTeal,
  },
  liveText: {
    color: COLORS.credTeal,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.bgPanel,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  searchIconText: {
    fontSize: 13,
  },
  refreshIconText: {
    fontSize: 13,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 44,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgPanel,
    borderWidth: 1,
    borderColor: COLORS.accentCyan,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
  },
  searchInnerIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "500",
    padding: 0,
  },
  clearBtn: {
    padding: 4,
  },
  clearBtnText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "bold",
  },
  cancelBtn: {
    paddingHorizontal: 8,
    height: 38,
    justifyContent: "center",
  },
  cancelBtnText: {
    color: COLORS.accentCyan,
    fontSize: 13,
    fontWeight: "600",
  },
});
