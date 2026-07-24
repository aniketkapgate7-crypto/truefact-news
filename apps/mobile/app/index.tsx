import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { NewsCard } from "@/components/NewsCard";
import { NEWS_STORIES } from "@/data/news";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={NEWS_STORIES}
        keyExtractor={(story) => story.id}
        renderItem={({ item }) => <NewsCard story={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View>
                <Text style={styles.logo}>TRUEFACT</Text>
                <Text style={styles.subtitle}>News you can verify</Text>
              </View>

              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>

            <View style={styles.hero}>
              <Text style={styles.eyebrow}>REAL-TIME INTELLIGENCE</Text>

              <Text style={styles.title}>Stories ranked by credibility</Text>

              <Text style={styles.description}>
                Follow breaking news, social engagement and credibility signals
                from multiple platforms.
              </Text>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Latest stories</Text>

              <Text style={styles.updateCount}>
                {NEWS_STORIES.length} updates
              </Text>
            </View>
          </>
        }
        ListFooterComponent={
          <Text style={styles.footer}>
            AI-assisted analysis • Verify important information independently
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07111F",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    color: "#F8FAFC",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 2,
  },
  subtitle: {
    color: "#7F91A8",
    fontSize: 12,
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#102238",
    borderColor: "#1F3D5C",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#20E3B2",
    marginRight: 7,
  },
  liveText: {
    color: "#D9FFF5",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  hero: {
    marginTop: 40,
  },
  eyebrow: {
    color: "#38BDF8",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  title: {
    color: "#F8FAFC",
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 39,
    marginTop: 12,
  },
  description: {
    color: "#9AABC0",
    fontSize: 15,
    lineHeight: 23,
    marginTop: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 34,
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#F8FAFC",
    fontSize: 19,
    fontWeight: "800",
  },
  updateCount: {
    color: "#38BDF8",
    fontSize: 12,
    fontWeight: "700",
  },
  footer: {
    color: "#52657C",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    paddingTop: 10,
    paddingBottom: 12,
  },
});
