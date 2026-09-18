import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";
import { COLORS } from "@/constants/theme";

export function SkeletonCard() {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 750 }),
        withTiming(0.4, { duration: 750 }),
      ),
      -1,
      true,
    );
  }, [opacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Animated.View style={[styles.sourceBar, pulseStyle]} />
        <Animated.View style={[styles.scoreBadge, pulseStyle]} />
      </View>

      <View style={styles.middleRow}>
        <Animated.View style={[styles.thumbnail, pulseStyle]} />
        <View style={styles.headlineBlock}>
          <Animated.View style={[styles.lineLarge, pulseStyle]} />
          <Animated.View style={[styles.lineMedium, pulseStyle]} />
        </View>
      </View>

      <Animated.View style={[styles.lineSmall, pulseStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgPanel,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sourceBar: {
    width: 90,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.bgRaised,
  },
  scoreBadge: {
    width: 60,
    height: 18,
    borderRadius: 10,
    backgroundColor: COLORS.bgRaised,
  },
  middleRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  thumbnail: {
    width: 80,
    height: 64,
    borderRadius: 10,
    backgroundColor: COLORS.bgRaised,
  },
  headlineBlock: {
    flex: 1,
    gap: 8,
  },
  lineLarge: {
    height: 14,
    borderRadius: 6,
    backgroundColor: COLORS.bgRaised,
    width: "100%",
  },
  lineMedium: {
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.bgRaised,
    width: "70%",
  },
  lineSmall: {
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.bgRaised,
    width: "90%",
  },
});
