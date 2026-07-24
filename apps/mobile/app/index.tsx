import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
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

        <Text style={styles.title}>
          Understand the news.{"\n"}Know what is credible.
        </Text>

        <Text style={styles.description}>
          Track breaking stories, social reactions and credibility signals from
          multiple sources.
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>SYSTEM STATUS</Text>
          <Text style={styles.verified}>● VERIFIED</Text>
        </View>

        <Text style={styles.cardTitle}>TrueFact mobile is ready</Text>

        <Text style={styles.cardDescription}>
          The mobile foundation is running successfully. Live news will appear
          here after the API connection is added.
        </Text>

        <View style={styles.scoreRow}>
          <Text style={styles.scoreLabel}>Credibility engine</Text>
          <Text style={styles.score}>Online</Text>
        </View>
      </View>

      <Text style={styles.footer}>
        AI-assisted credibility analysis • Always verify important information
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07111F",
    paddingHorizontal: 22,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 14,
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
    gap: 7,
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
  },
  liveText: {
    color: "#D9FFF5",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  hero: {
    marginTop: 56,
  },
  eyebrow: {
    color: "#38BDF8",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  title: {
    color: "#F8FAFC",
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 42,
    marginTop: 14,
  },
  description: {
    color: "#9AABC0",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 18,
  },
  card: {
    backgroundColor: "#0E1D30",
    borderColor: "#1D3855",
    borderWidth: 1,
    borderRadius: 22,
    padding: 20,
    marginTop: 42,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardLabel: {
    color: "#7F91A8",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  verified: {
    color: "#20E3B2",
    fontSize: 11,
    fontWeight: "800",
  },
  cardTitle: {
    color: "#F8FAFC",
    fontSize: 21,
    fontWeight: "800",
    marginTop: 20,
  },
  cardDescription: {
    color: "#9AABC0",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopColor: "#1D3855",
    borderTopWidth: 1,
    marginTop: 20,
    paddingTop: 16,
  },
  scoreLabel: {
    color: "#7F91A8",
    fontSize: 13,
  },
  score: {
    color: "#20E3B2",
    fontSize: 13,
    fontWeight: "800",
  },
  footer: {
    color: "#52657C",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: "auto",
    paddingBottom: 18,
  },
});

