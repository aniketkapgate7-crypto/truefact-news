import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { NewsCategory } from "@/types/news";

const CATEGORIES: (NewsCategory | "All")[] = [
  "All",
  "Breaking",
  "Politics",
  "World",
  "Business",
  "Tech",
  "Science",
  "Sports",
  "Entertainment",
  "Lifestyle",
];

const CATEGORY_EMOJI: Partial<Record<NewsCategory | "All", string>> = {
  All: "🌐",
  Breaking: "🔴",
  Politics: "🏛️",
  World: "🌍",
  Business: "📈",
  Tech: "💻",
  Science: "🔬",
  Sports: "⚽",
  Entertainment: "🎬",
  Lifestyle: "✨",
};

type Props = {
  selected: NewsCategory | "All";
  onSelect: (category: NewsCategory | "All") => void;
};

export function CategoryFilterBar({ selected, onSelect }: Props) {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {CATEGORIES.map((cat) => {
          const isActive = selected === cat;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => onSelect(cat)}
              style={[styles.pill, isActive && styles.pillActive]}
              activeOpacity={0.7}
            >
              <Text style={styles.emoji}>{CATEGORY_EMOJI[cat]}</Text>
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 20,
    marginBottom: 4,
  },
  scroll: {
    gap: 8,
    paddingRight: 4,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#0E1D30",
    borderColor: "#1D3855",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  pillActive: {
    backgroundColor: "#38BDF8",
    borderColor: "#38BDF8",
  },
  emoji: {
    fontSize: 13,
  },
  label: {
    color: "#7F91A8",
    fontSize: 13,
    fontWeight: "700",
  },
  labelActive: {
    color: "#07111F",
  },
});
