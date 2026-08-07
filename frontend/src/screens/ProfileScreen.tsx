import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  StatusBar,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { Settings, ChevronRight, FileText, Gift, History, Bookmark, LogOut, Camera } from "lucide-react-native";
import { SERIF, SANS } from "../styles/theme";
import { MainStackParamList } from "../navigation/navigation";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { profilePictureService } from "../services/profile-picture.service";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const STAT_CARD_WIDTH = (SCREEN_WIDTH - 56) / 3;

interface Ministry {
  label: string;
  imageId: string;
  role: string;
}

interface QuickLink {
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  action: () => void;
}

type ProfileNavigationProp = NativeStackNavigationProp<
  MainStackParamList
>;

interface UserStats {
  sermons: number;
  notes: number;
  prayers: number;
}

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileNavigationProp>();
  const { user, logout, updateUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    sermons: 0,
    notes: 0,
    prayers: 0,
  });

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      
      // Fetch all three stats in parallel
      const [notesRes, prayersRes] = await Promise.all([
        fetch(`${API_URL}/api/sermon-notes`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/prayers`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const notesData = await notesRes.json();
      const prayersData = await prayersRes.json();

      setStats({
        sermons: 48, // Keep sermon count static for now (or fetch from sermons endpoint)
        notes: notesData?.data?.length || 0,
        prayers: prayersData?.data?.length || 0,
      });
    } catch (err) {
      console.warn("[profile] Failed to fetch stats:", err);
      // Keep default values on error
    }
  };

  const formatTitleCase = (value: string) =>
    value
      .toLowerCase()
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  const profileName = user?.name ?? "Member";
  const getAvatarUri = () => {
    if (user?.avatarUrl) {
      return profilePictureService.getFullUrl(user.avatarUrl);
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user?.name ?? "User"
    )}&background=1B3A7A&color=fff&size=200`;
  };

  const handleAvatarPress = async () => {
    try {
      setIsUploading(true);
      const avatarUrl = await profilePictureService.pickAndUpload();
      if (avatarUrl) {
        // Update the user context with new avatar
        updateUser?.({ ...user!, avatarUrl });
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile picture');
    } finally {
      setIsUploading(false);
    }
  };
  const roleText = user?.role ? formatTitleCase(user.role) : "Member";
  const memberSince = user?.createdAt
    ? `Member since ${new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })}`
    : "Member";

  const handleLogout = async () => {
    await logout();
  };

  const ministries: Ministry[] = user?.ministry
    ? [
        {
          label: user.ministry,
          imageId: "1529156069898-49953e39b3ac",
          role: "Active member",
        },
      ]
    : [];

  const quickLinks: QuickLink[] = [
    { label: "Sermon Notes", icon: FileText, action: () => navigation.navigate("SermonNotes") },
    { label: "Give an Offering", icon: Gift, action: () => navigation.navigate("Giving") },
    { label: "Giving History", icon: History, action: () => navigation.navigate("GivingHistory") },
    { label: "Bookmarked Scriptures", icon: Bookmark, action: () => navigation.navigate("BookmarkedScriptures") },
    { label: "Account Settings", icon: Settings, action: () => navigation.navigate("AccountSettings") },
    { label: "Sign Out", icon: LogOut, action: handleLogout },
  ];

  return (
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
            <Text style={styles.headerTitle}>My Profile</Text>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => {}}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Account settings"
            >
              <Settings size={15} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Profile Info */}
          <View style={styles.profileInfo}>
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={handleAvatarPress}
              disabled={isUploading}
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: getAvatarUri() }}
                style={styles.avatar}
                accessibilityLabel="Profile picture"
              />
              <View style={styles.avatarOverlay}>
                <Camera size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>{profileName}</Text>
              <Text style={styles.memberSince}>{memberSince}</Text>
              <View style={styles.roleContainer}>
                <View style={styles.roleDot} />
                <Text style={styles.roleText}>{roleText}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.content}>
          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            {[
              { label: "Sermons", value: stats.sermons.toString() },
              { label: "Notes", value: stats.notes.toString() },
              { label: "Prayers", value: stats.prayers.toString() },
            ].map(({ label, value }) => (
              <TouchableOpacity
                key={label}
                style={styles.statCard}
                onPress={() => {
                  if (label === "Notes") navigation.navigate("SermonNotes");
                  // Add navigation for other stats if needed
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Ministries Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>My Ministries</Text>
            {ministries.length > 0 ? (
              ministries.map((ministry, index) => (
                <TouchableOpacity
                  key={ministry.label}
                  style={[
                    styles.ministryItem,
                    index > 0 && styles.ministryItemBorder,
                  ]}
                  onPress={() => {}}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`${ministry.label}, ${ministry.role}`}
                >
                  <View style={styles.ministryImageContainer}>
                    <Image
                      source={{ uri: getAvatarUri() }}
                      style={styles.ministryImage}
                    />
                  </View>
                  <View style={styles.ministryInfo}>
                    <Text style={styles.ministryName}>{ministry.label}</Text>
                    <Text style={styles.ministryRole}>{ministry.role}</Text>
                  </View>
                  <ChevronRight size={13} color="#B0A89A" />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyMinistryContainer}>
                <Text style={styles.emptyMinistryText}>
                  No ministry assigned yet.
                </Text>
                <Text style={styles.emptyMinistrySubtext}>
                  Join a ministry or update your profile to connect.
                </Text>
              </View>
            )}
          </View>

          {/* Quick Links Section */}
          <View style={styles.sectionCard}>
            {quickLinks.map(({ label, icon: Icon, action }, index) => (
              <TouchableOpacity
                key={label}
                style={[
                  styles.quickLinkItem,
                  index > 0 && styles.quickLinkItemBorder,
                ]}
                onPress={action}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={label}
              >
                <View style={styles.quickLinkIcon}>
                  <Icon size={15} color="#1B3A7A" />
                </View>
                <Text style={styles.quickLinkText}>{label}</Text>
                <ChevronRight size={13} color="#B0A89A" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Bottom Spacer */}
          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#F7F5F0",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 95,
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
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#FFFFFF",
    fontFamily: SERIF,
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 2.5,
    borderColor: "#E8C77A",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 17,
    fontFamily: SANS,
  },
  memberSince: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    marginTop: 2,
    fontFamily: SANS,
  },
  roleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E8C77A",
  },
  roleText: {
    color: "#E8C77A",
    fontSize: 10,
    fontWeight: "500",
    fontFamily: SANS,
  },
  // Content Styles
  content: {
    paddingHorizontal: 16,
    marginTop: -20,
    gap: 16,
  },
  // Stats Styles
  statsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1B3A7A",
    fontFamily: SANS,
  },
  statLabel: {
    fontSize: 9,
    color: "#7B7464",
    marginTop: 2,
    fontFamily: SANS,
  },
  // Section Card Styles
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#0D1B3E",
    marginBottom: 12,
    fontFamily: SERIF,
  },
  // Ministry Styles
  ministryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  ministryItemBorder: {
    borderTopWidth: 1,
    borderTopColor: "#F0EDE6",
  },
  ministryImageContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#EDF0F8",
  },
  ministryImage: {
    width: "100%",
    height: "100%",
  },
  ministryInfo: {
    flex: 1,
  },
  ministryName: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0D1B3E",
    fontFamily: SANS,
  },
  ministryRole: {
    fontSize: 9,
    color: "#7B7464",
    marginTop: 1,
    fontFamily: SANS,
  },
  emptyMinistryContainer: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "#F4F5F7",
    borderWidth: 1,
    borderColor: "#E2E4E8",
  },
  emptyMinistryText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E1E1E",
    fontFamily: SERIF,
    marginBottom: 6,
  },
  emptyMinistrySubtext: {
    fontSize: 12,
    color: "#7B7F8E",
    fontFamily: SANS,
  },
  // Quick Link Styles
  quickLinkItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    gap: 12,
  },
  quickLinkItemBorder: {
    borderTopWidth: 1,
    borderTopColor: "#F0EDE6",
  },
  quickLinkIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDF0F8",
  },
  quickLinkText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#0D1B3E",
    textAlign: "left",
    fontFamily: SANS,
  },
  bottomSpacer: {
    height: 16,
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1B3A7A',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});