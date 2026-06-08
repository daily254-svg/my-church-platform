import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { SERIF, SANS } from "../styles/theme";
import { useAuth } from "../context/AuthContext";
import { givingService } from "../services/giving.service";

interface GivingRecord {
  id: string;
  category: string;
  amount: number;
  reference?: string;
  note?: string;
  service: string;
  status: string;
  createdAt: string;
}

const categoryMapping: Record<string, string> = {
  TITHE: "Tithe",
  OFFERING: "Offering",
  THANKSGIVING: "Thanksgiving",
  BUILDING_FUND: "Building Fund",
  MISSION_SUPPORT: "Mission Support",
  SPECIAL_SEED: "Special Seed",
};

const categoryIcon: Record<string, string> = {
  Tithe: "🌾",
  Offering: "🙏",
  Thanksgiving: "✨",
  "Building Fund": "🏛️",
  "Mission Support": "🌍",
  "Special Seed": "🌱",
};

export default function GivingHistoryScreen() {
  const navigation = useNavigation();
  const { token } = useAuth();
  const [records, setRecords] = useState<GivingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const result = await givingService.getMyHistory(token!);
        setRecords(result);
        const sum = result.reduce((sum: number, r: GivingRecord) => sum + r.amount, 0);
        setTotal(sum);
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [token]);

  if (loading) {
    return (
        <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
          <View style={[styles.flex, styles.centerContent]}>
            <ActivityIndicator size="large" color="#E8C77A" />
          </View>
        </SafeAreaView>
    );
  }

  const formatAmount = (amount: number): string => {
    return `Ksh ${amount.toLocaleString()}`;
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <StatusBar barStyle="light-content" backgroundColor="#07102A" />
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <ArrowLeft size={16} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Giving History</Text>
            </View>

            {/* Total Summary */}
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total Given</Text>
              <Text style={styles.totalAmount}>{formatAmount(total)}</Text>
              <Text style={styles.transactionCount}>
                {records.length} transactions
              </Text>
            </View>
          </View>

          {/* Records Section */}
          <View style={styles.recordsContainer}>
            <View style={styles.recordsCard}>
              {records.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No giving records yet</Text>
                </View>
              ) : (
                records.map((record, index) => {
                  const displayCategory = categoryMapping[record.category] || record.category;
                  const formattedDate = new Date(record.createdAt).toLocaleDateString(
                    "en-US",
                    { month: "long", day: "numeric", year: "numeric" }
                  );

                  return (
                    <TouchableOpacity
                      key={record.id}
                      style={[
                        styles.recordItem,
                        index > 0 && styles.recordItemBorder,
                      ]}
                      onPress={() => {}}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`${displayCategory}, ${formatAmount(record.amount)}, ${formattedDate}`}
                    >
                      {/* Category Icon */}
                      <View style={styles.categoryIconContainer}>
                        <Text style={styles.categoryIconText}>
                          {categoryIcon[displayCategory] ?? "💛"}
                        </Text>
                      </View>

                      {/* Record Details */}
                      <View style={styles.recordDetails}>
                        <View style={styles.recordHeader}>
                          <Text
                            style={styles.recordCategory}
                            numberOfLines={1}
                          >
                            {displayCategory}
                          </Text>
                          <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>
                              {record.status === "CONFIRMED" ? "Confirmed" : record.status}
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={styles.recordInfo}
                          numberOfLines={1}
                        >
                          {record.reference || "—"} · {record.service}
                        </Text>
                        <Text style={styles.recordDate}>{formattedDate}</Text>
                      </View>

                      {/* Amount */}
                      <Text style={styles.recordAmount}>
                        {formatAmount(record.amount)}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            <Text style={styles.footerText}>
              Showing last {records.length} transactions
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F5F0",
  },
  scrollContent: {
    flexGrow: 1,
  },
  // Header Styles
  header: {
    backgroundColor: "#07102A",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#FFFFFF",
    fontFamily: SERIF,
  },
  totalSection: {
    alignItems: "center",
  },
  totalLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 4,
    fontFamily: SANS,
  },
  totalAmount: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#FFFFFF",
    lineHeight: 48,
    fontFamily: SANS,
  },
  transactionCount: {
    color: "#E8C77A",
    fontSize: 11,
    marginTop: 8,
    fontFamily: SANS,
  },
  // Records Container Styles
  recordsContainer: {
    paddingHorizontal: 16,
    marginTop: -20,
  },
  recordsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#B0A89A",
    fontFamily: SANS,
  },
  // Record Item Styles
  recordItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  recordItemBorder: {
    borderTopWidth: 1,
    borderTopColor: "#F0EDE6",
  },
  categoryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F5F0",
    flexShrink: 0,
  },
  categoryIconText: {
    fontSize: 20,
  },
  recordDetails: {
    flex: 1,
    minWidth: 0,
  },
  recordHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  recordCategory: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0D1B3E",
    fontFamily: SANS,
    flexShrink: 1,
  },
  statusBadge: {
    backgroundColor: "#E8F5EE",
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#2D8A4E",
    fontFamily: SANS,
  },
  recordInfo: {
    fontSize: 10,
    color: "#7B7464",
    fontFamily: SANS,
  },
  recordDate: {
    fontSize: 9,
    color: "#B0A89A",
    marginTop: 2,
    fontFamily: SANS,
  },
  recordAmount: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1B3A7A",
    flexShrink: 0,
    fontFamily: SANS,
  },
  // Footer Styles
  footerText: {
    textAlign: "center",
    fontSize: 10,
    color: "#B0A89A",
    marginTop: 16,
    marginBottom: 16,
    fontFamily: SANS,
  },
});