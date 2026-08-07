import React, { useContext, useRef, useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  RootStackParamList,
  MainTabParamList,
  MainStackParamList,
} from "../navigation/navigation";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Animated,
  StyleSheet,
  Dimensions,
  StatusBar,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Bell,
  Play,
  Gift,
  Heart,
  PenLine,
  Calendar,
  Clock,
  Bookmark,
} from "lucide-react-native";
import { SERIF, SANS } from "../styles/theme";
import { useAuth } from "../context/AuthContext";
import { SocketContext } from "../context/SocketContext";
import { useLiveService } from "../hooks/useLiveService";
import { sermonService } from "../services/sermon.service";
import { eventService } from "../services/event.service";
import { getDailyScripture } from '../utils/daily-scripture';
import { profilePictureService } from "../services/profile-picture.service";
import { ministryService } from "../services/ministry.service";

const EVENT_CARD_WIDTH = 148;
const MINISTRY_AVATAR_SIZE = 56;
const LIVE_BANNER_HEIGHT = 180;

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  type: string;
  accent: string;
  acceptRegistration?: boolean;
  registrationTitle?: string | null;
  registrationDescription?: string | null;
  registrationFields?: Array<{
    key: string;
    label: string;
    type: "text" | "email" | "tel" | "textarea" | "number";
    required: boolean;
    placeholder?: string;
  }>;
}

interface Sermon {
  id: string;
  title: string;
  description?: string;
  status: string;
  scriptureList?: string[];
  createdAt: string;
}

interface MinistryAvatar {
  label: string;
  img: string;
}

interface QuickAction {
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  color: string;
  bg: string;
  action: () => void;
}

type HomeNavigationProp = NativeStackNavigationProp<
  RootStackParamList &
    MainTabParamList &
    MainStackParamList
>;
export default function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();
  const { user, token } = useAuth();
  const { isLive, currentService, scripture, connectedCount } = useLiveService();
  const socketContext = useContext(SocketContext);
  const announcements = socketContext?.announcements ?? [];
  const [events, setEvents] = useState<Event[]>([]);

  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [sermonsLoading, setSermonsLoading] = useState(true);
  const dailyScripture = getDailyScripture();
  const [myMinistries, setMyMinistries] = useState<{ id: string; name: string }[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [registrationForm, setRegistrationForm] = useState<Record<string, string>>({});
  const [submittingRegistration, setSubmittingRegistration] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState<string | null>(null);

  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!token) return;
    ministryService.getMyGroups(token)
    .then((data) => {
      setMyMinistries(data.map((item: any) => item.group));
    })
    .catch(() => {});
  }, [token]);

  // Fetch sermons from backend
  useEffect(() => {
    const fetchSermons = async () => {
      try {
        setSermonsLoading(true);
        const data = await sermonService.getAll();
        setSermons(data);
      } catch (err) {
        console.warn("[home] Failed to fetch sermons:", err);
      } finally {
        setSermonsLoading(false);
      }
    };
    fetchSermons();
  }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning," : hour < 18 ? "Good afternoon," : "Good evening,";
  const userDisplayName = user?.name?.split(" ")[0] ?? "Member";

  const handleLive = () => navigation.navigate("LiveService");
  const handleNotes = () => navigation.navigate("SermonNotes");
  const handlePrayer = () => navigation.navigate("Prayer");
  const handleMinistries = () => navigation.navigate("Ministries");
  const handleGive = () => navigation.navigate("Giving");
  const handleNotifications = () => {};
  const handleProfile = () => navigation.navigate("Profile");
  const handleSeeAllEvents = () => {};
  const handleSeeAllSermons = () => {};
  const handleEventPress = (event: Event) => {
    if (event.acceptRegistration) {
      setSelectedEvent(event);
      setRegistrationForm({});
      setRegistrationMessage(null);
      return;
    }
  };
  const handleSermonPress = (sermon: Sermon) => {};
  const handleAnnouncementPress = (announcement: any) => {};

  // Banner shrink animation
  const bannerHeight = scrollY.interpolate({
    inputRange: [0, LIVE_BANNER_HEIGHT],
    outputRange: [LIVE_BANNER_HEIGHT, 0],
    extrapolate: "clamp",
  });

  const bannerOpacity = scrollY.interpolate({
    inputRange: [0, LIVE_BANNER_HEIGHT * 0.6, LIVE_BANNER_HEIGHT],
    outputRange: [1, 0.3, 0],
    extrapolate: "clamp",
  });

  const bannerScale = scrollY.interpolate({
    inputRange: [0, LIVE_BANNER_HEIGHT],
    outputRange: [1, 0.8],
    extrapolate: "clamp",
  });

  const bannerTranslateY = scrollY.interpolate({
    inputRange: [0, LIVE_BANNER_HEIGHT],
    outputRange: [0, -50],
    extrapolate: "clamp",
  });

  // Floating button animation
  const floatingOpacity = scrollY.interpolate({
    inputRange: [LIVE_BANNER_HEIGHT * 0.4, LIVE_BANNER_HEIGHT * 0.8],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const floatingScale = scrollY.interpolate({
    inputRange: [LIVE_BANNER_HEIGHT * 0.4, LIVE_BANNER_HEIGHT * 0.8],
    outputRange: [0.3, 1],
    extrapolate: "clamp",
  });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await eventService.getAll();
        setEvents(data);
      } catch (err) {
        console.warn("[home] Failed to fetch events:", err);
        // Keep empty array on failure
      }
    };

    // Initial fetch
    fetchEvents();

    // Poll every 5 seconds
    const interval = setInterval(fetchEvents, 5000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, []);

  const ministryAvatars: MinistryAvatar[] = [
    { label: "Youth", img: "1529156069898-49953e39b3ac" },
    { label: "Worship", img: "1511367461989-f85a21fda167" },
    { label: "Media", img: "1574717024653-61fd2cf4d44d" },
    { label: "Men", img: "1507003211169-0a1dd7228f2d" },
    { label: "Women", img: "1494790108377-be9c29b29330" },
  ];

  const quickActions: QuickAction[] = [
    { label: "Notes", icon: PenLine, color: "#1B3A7A", bg: "#EDF0F8", action: handleNotes },
    { label: "Prayer", icon: Heart, color: "#C4933A", bg: "#FDF6E8", action: handlePrayer },
    { label: "Give", icon: Gift, color: "#2D7A6A", bg: "#E8F5F2", action: handleGive },
    { label: "Watch", icon: Play, color: "#6B3A7A", bg: "#F2EAF8", action: handleLive },
  ];

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return formatDate(dateString);
  };

  const getMinistryAbbrev = (name: string): string => {
    if (!name) return '?';
    return name
      .split(' ')
      .filter(w => w.length > 0)
      .map(w => w[0].toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const handleRegistrationSubmit = async () => {
    if (!selectedEvent) return;

    const missingRequired = (selectedEvent.registrationFields ?? []).filter((field) => field.required && !registrationForm[field.key]?.trim());
    if (missingRequired.length > 0) {
      setRegistrationMessage("Please fill in the required fields.");
      return;
    }

    try {
      setSubmittingRegistration(true);
      setRegistrationMessage(null);
      await eventService.register(selectedEvent.id, registrationForm);
      setRegistrationMessage("You’re registered! Thank you.");
      setRegistrationForm({});
      setSelectedEvent(null);
    } catch (err) {
      setRegistrationMessage(err instanceof Error ? err.message : "Unable to register right now.");
    } finally {
      setSubmittingRegistration(false);
    }
  };

  return (
    
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <StatusBar barStyle="dark-content" backgroundColor="#F7F5F0" />
        {/* Sticky Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.userName}>{userDisplayName} 👋</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={handleNotifications}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Notifications"
              >
                <Bell size={17} color="#0D1B3E" />
                {announcements.length > 0 && (
                  <View style={styles.notificationBadge} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.profileButton}
                onPress={handleProfile}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Profile"
              >
                <Image
                  source={{
                    uri: user?.avatarUrl
                      ? profilePictureService.getFullUrl(user.avatarUrl)
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? "User")}&background=1B3A7A&color=fff&size=80`,
                  }}
                  style={styles.profileImage}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* Live Banner */}
          {isLive && (
            <Animated.View
              style={[
                styles.liveBanner,
                {
                  height: bannerHeight,
                  opacity: bannerOpacity,
                  transform: [
                    { scale: bannerScale },
                    { translateY: bannerTranslateY },
                  ],
                },
              ]}
            >
            <TouchableOpacity
              onPress={handleLive}
              activeOpacity={0.9}
              style={styles.liveBannerTouchable}
              accessibilityRole="button"
              accessibilityLabel={`Join live service, ${currentService?.title ?? "Live Service"}`}
            >
              <View style={styles.liveBannerDecor} />
              <View style={styles.liveBannerContent}>
                <View style={styles.liveBannerHeader}>
                  <View style={styles.liveIndicator}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE NOW</Text>
                  </View>
                  <Text style={styles.liveSubtext}>{currentService?.title ?? "Sunday Morning"}</Text>
                </View>
                <Text style={styles.liveTitle}>
                  {currentService?.title ?? "Live Service"}
                </Text>
                <Text style={styles.livePastor}>
                  {currentService?.startedBy ?? ""}
                </Text>
                <View style={styles.liveFooter}>
                  <View style={styles.viewerCount}>
                    <View style={styles.viewerDot} />
                    <Text style={styles.viewerText}>{connectedCount} watching</Text>
                  </View>
                  <View style={styles.joinButton}>
                    <Play size={11} fill="#FFFFFF" color="#FFFFFF" />
                    <Text style={styles.joinText}>Join Service</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
          )}

          {/* Daily Scripture */}
          <View style={styles.scriptureCard}>
            <Text style={styles.scriptureLabel}>Today's Scripture</Text>
            <Text style={styles.scriptureText}>
                {dailyScripture.text}
            </Text>
            <View style={styles.scriptureFooter}>
              <Text style={styles.scriptureReference}>
                — {dailyScripture.reference}
              </Text>
              <TouchableOpacity
                style={styles.bookmarkButton}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Bookmark scripture"
              >
                <Bookmark size={13} color="#7A5C1E" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            {quickActions.map(({ label, icon: Icon, color, bg, action }) => (
              <TouchableOpacity
                key={label}
                style={[styles.quickActionButton, { backgroundColor: bg }]}
                onPress={action}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={label}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: `${color}18` }]}>
                  <Icon size={17} color={color} />
                </View>
                <Text style={styles.quickActionLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Upcoming Events */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
              <TouchableOpacity onPress={handleSeeAllEvents} activeOpacity={0.7}>
                <Text style={styles.seeAllLink}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.eventsScroll}
            >
              {events.map((event, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.eventCard}
                  onPress={() => handleEventPress(event)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`${event.title}, ${event.date} at ${event.time}`}
                >
                  <View style={styles.eventTypeRow}>
                    <View style={[styles.eventTypeDot, { backgroundColor: event.accent }]} />
                    <Text style={[styles.eventType, { color: event.accent }]}>
                      {event.type}
                    </Text>
                  </View>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <View style={styles.eventDetail}>
                    <Calendar size={9} color="#7B7464" />
                    <Text style={styles.eventDetailText}>{event.date}</Text>
                  </View>
                  <View style={styles.eventDetail}>
                    <Clock size={9} color="#7B7464" />
                    <Text style={styles.eventDetailText}>{event.time}</Text>
                  </View>
                  {event.acceptRegistration && (
                    <View style={styles.registrationBadge}>
                      <Text style={styles.registrationBadgeText}>Register</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Announcements — from socket */}
          {announcements.length > 0 && (
            <View style={styles.announcementsCard}>
              <View style={styles.announcementsHeader}>
                <View style={styles.announcementAccent} />
                <Text style={styles.sectionTitle}>Announcements</Text>
              </View>
              {announcements.map((announcement, index) => (
                <TouchableOpacity
                  key={announcement.id || index}
                  style={[
                    styles.announcementItem,
                    index > 0 && styles.announcementItemBorder,
                  ]}
                  onPress={() => handleAnnouncementPress(announcement)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={announcement.title}
                >
                  <View style={styles.announcementIcon}>
                    <Bell size={13} color="#1B3A7A" />
                  </View>
                  <View style={styles.announcementTextContainer}>
                    <Text style={styles.announcementText} numberOfLines={1}>
                      {announcement.title}
                    </Text>
                    {announcement.body && (
                      <Text style={styles.announcementBody} numberOfLines={2}>
                        {announcement.body}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.announcementTime}>
                    {announcement.postedAt ? formatTime(announcement.postedAt) : ""}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Recent Sermons — from backend */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Sermons</Text>
              <TouchableOpacity onPress={handleSeeAllSermons} activeOpacity={0.7}>
                <Text style={styles.seeAllLink}>See all</Text>
              </TouchableOpacity>
            </View>
            {sermonsLoading ? (
              <View style={styles.sermonCard}>
                <Text style={styles.sermonLoadingText}>Loading sermons...</Text>
              </View>
            ) : sermons.length === 0 ? (
              <View style={styles.sermonCard}>
                <Text style={styles.sermonLoadingText}>No sermons available</Text>
              </View>
            ) : (
              sermons.slice(0, 4).map((sermon) => (
                <TouchableOpacity
                  key={sermon.id}
                  style={styles.sermonCard}
                  onPress={() => handleSermonPress(sermon)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`${sermon.title}`}
                >
                  <View style={styles.sermonImageContainer}>
                    <View style={styles.sermonImagePlaceholder}>
                      <Text style={styles.sermonImageInitial}>
                        {sermon.title.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.sermonPlayOverlay}>
                      <View style={styles.sermonPlayButton}>
                        <Play size={10} fill="#FFFFFF" color="#FFFFFF" />
                      </View>
                    </View>
                  </View>
                  <View style={styles.sermonInfo}>
                    <Text style={styles.sermonTitle} numberOfLines={1}>
                      {sermon.title}
                    </Text>
                    {sermon.description && (
                      <Text style={styles.sermonPastor} numberOfLines={1}>
                        {sermon.description}
                      </Text>
                    )}
                    <View style={styles.sermonMeta}>
                      <Text style={styles.sermonMetaText}>
                        {sermon.status.charAt(0) + sermon.status.slice(1).toLowerCase()}
                      </Text>
                      <Text style={styles.sermonMetaDot}>•</Text>
                      <Text style={styles.sermonMetaText}>
                        {formatDate(sermon.createdAt)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.sermonPlayCircle}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Play ${sermon.title}`}
                  >
                    <Play size={11} fill="#FFFFFF" color="#FFFFFF" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Ministry Shortcuts */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Ministries</Text>
              <TouchableOpacity onPress={handleMinistries} activeOpacity={0.7}>
                <Text style={styles.seeAllLink}>All</Text>
              </TouchableOpacity>
            </View>
            {myMinistries.length === 0 ? (
              <Text style={styles.noMinistriesText}>No ministries joined yet</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.ministriesScroll}
              >
                {myMinistries.map((ministry) => (
                  <TouchableOpacity
                    key={ministry.id}
                    style={styles.ministryItem}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={ministry.name}
                  >
                    <View style={styles.ministryAvatarContainer}>
                      <Text style={styles.ministryAbbrev}>
                        {getMinistryAbbrev(ministry.name)}
                      </Text>
                    </View>
                    <Text style={styles.ministryLabel} numberOfLines={1}>
                      {ministry.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Floating Live Button */}
        <Animated.View
          style={[
            styles.floatingButton,
            {
              opacity: floatingOpacity,
              transform: [
                { scale: floatingScale },
              ],
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleLive}
            activeOpacity={0.8}
            style={styles.floatingButtonInner}
            accessibilityRole="button"
            accessibilityLabel="Join live service"
          >
            <View style={styles.floatingLiveDot} />
            <Play size={22} fill="#FFFFFF" color="#FFFFFF" style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </Animated.View>
        <Modal visible={!!selectedEvent} transparent animationType="slide" onRequestClose={() => setSelectedEvent(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>{selectedEvent?.registrationTitle || selectedEvent?.title || "Register"}</Text>
                  {selectedEvent?.registrationDescription ? (
                    <Text style={styles.modalDescription}>{selectedEvent.registrationDescription}</Text>
                  ) : null}
                </View>
                <TouchableOpacity onPress={() => setSelectedEvent(null)}>
                  <Text style={styles.modalClose}>Close</Text>
                </TouchableOpacity>
              </View>

              {selectedEvent?.registrationFields?.map((field) => (
                <View key={field.key} style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{field.label}{field.required ? " *" : ""}</Text>
                  {field.type === "textarea" ? (
                    <TextInput
                      multiline
                      value={registrationForm[field.key] ?? ""}
                      onChangeText={(text) => setRegistrationForm((prev) => ({ ...prev, [field.key]: text }))}
                      placeholder={field.placeholder}
                      placeholderTextColor="#8C8579"
                      style={[styles.textArea, styles.input]}
                    />
                  ) : (
                    <TextInput
                      value={registrationForm[field.key] ?? ""}
                      onChangeText={(text) => setRegistrationForm((prev) => ({ ...prev, [field.key]: text }))}
                      placeholder={field.placeholder}
                      placeholderTextColor="#8C8579"
                      keyboardType={field.type === "email" ? "email-address" : field.type === "number" ? "numeric" : field.type === "tel" ? "phone-pad" : "default"}
                      style={styles.input}
                    />
                  )}
                </View>
              ))}

              {registrationMessage ? (
                <Text style={styles.registrationMessage}>{registrationMessage}</Text>
              ) : null}

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleRegistrationSubmit}
                disabled={submittingRegistration}
                activeOpacity={0.8}
              >
                <Text style={styles.submitButtonText}>{submittingRegistration ? "Submitting..." : "Register"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  // Header Styles
  header: {
    backgroundColor: "#F7F5F0",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(13,27,62,0.06)",
    zIndex: 10,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 10,
    color: "#7B7464",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontFamily: SANS,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0D1B3E",
    fontFamily: SERIF,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0EDE6",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(196,147,58,0.4)",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 95,
  },
  // Live Banner Styles
  liveBanner: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#07102A",
    position: "relative",
  },
  liveBannerTouchable: {
    flex: 1,
  },
  liveBannerDecor: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#FFFFFF",
    opacity: 0.1,
    transform: [{ translateX: 40 }, { translateY: -48 }],
  },
  liveBannerContent: {
    padding: 20,
  },
  liveBannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF4444",
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  liveText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
    fontFamily: SANS,
  },
  liveSubtext: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    fontFamily: SANS,
  },
  liveTitle: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 4,
    fontFamily: SERIF,
  },
  livePastor: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginBottom: 16,
    fontFamily: SANS,
  },
  liveFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewerCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  viewerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E8C77A",
  },
  viewerText: {
    color: "#E8C77A",
    fontSize: 11,
    fontWeight: "500",
    fontFamily: SANS,
  },
  joinButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  joinText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: SANS,
  },
  // Floating Live Button
  floatingButton: {
    position: "absolute",
    bottom: 100,
    right: 20,
    zIndex: 100,
  },
  floatingButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    position: "absolute",
    top: 10,
    right: 10,
  },
  // Scripture Card Styles
  scriptureCard: {
    borderRadius: 24,
    backgroundColor: "#D4A849",
    padding: 20,
  },
  scriptureLabel: {
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 2.5,
    textTransform: "uppercase",
    color: "rgba(122,92,30,0.7)",
    marginBottom: 12,
    fontFamily: SANS,
  },
  scriptureText: {
    color: "#2D1E00",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
    fontFamily: SERIF,
    fontStyle: "italic",
  },
  scriptureFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scriptureReference: {
    color: "#7A5C1E",
    fontSize: 11,
    fontWeight: "bold",
    fontFamily: SANS,
  },
  bookmarkButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  // Quick Actions Styles
  quickActions: {
    flexDirection: "row",
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 16,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#0D1B3E",
    fontFamily: SANS,
  },
  // Section Styles
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0D1B3E",
    fontFamily: SERIF,
  },
  seeAllLink: {
    fontSize: 11,
    color: "#C4933A",
    fontWeight: "bold",
    fontFamily: SANS,
  },
  // Events Styles
  eventsScroll: {
    gap: 12,
    marginBottom: 6,
  },
  eventCard: {
    width: EVENT_CARD_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  eventTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  eventTypeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  eventType: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontFamily: SANS,
  },
  eventTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0D1B3E",
    marginBottom: 8,
    lineHeight: 16,
    fontFamily: SANS,
  },
  eventDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  eventDetailText: {
    fontSize: 9,
    color: "#7B7464",
    fontFamily: SANS,
  },
  registrationBadge: {
    marginTop: 8,
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#EDF0F8",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  registrationBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#1B3A7A",
    fontFamily: SANS,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(5, 8, 15, 0.7)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0D1B3E",
    fontFamily: SANS,
    marginBottom: 4,
  },
  modalDescription: {
    fontSize: 12,
    color: "#7B7464",
    fontFamily: SANS,
    lineHeight: 18,
  },
  modalClose: {
    fontSize: 12,
    color: "#C4933A",
    fontWeight: "600",
    fontFamily: SANS,
  },
  inputGroup: {
    marginTop: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0D1B3E",
    fontFamily: SANS,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E7E0D4",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FAF7F1",
    color: "#0D1B3E",
    fontFamily: SANS,
    fontSize: 13,
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  registrationMessage: {
    marginTop: 10,
    fontSize: 12,
    color: "#2D7A6A",
    fontFamily: SANS,
  },
  submitButton: {
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: "#1B3A7A",
    paddingVertical: 12,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: SANS,
  },
  // Announcements Styles
  announcementsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  announcementsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  announcementAccent: {
    width: 4,
    height: 24,
    borderRadius: 2,
    backgroundColor: "#C4933A",
  },
  announcementItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12,
  },
  announcementItemBorder: {
    borderTopWidth: 1,
    borderTopColor: "#F0EDE6",
  },
  announcementIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDF0F8",
    marginTop: 2,
  },
  announcementTextContainer: {
    flex: 1,
  },
  announcementText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0D1B3E",
    fontFamily: SANS,
  },
  announcementBody: {
    fontSize: 10,
    color: "#7B7464",
    fontFamily: SANS,
    marginTop: 2,
    lineHeight: 15,
  },
  announcementTime: {
    fontSize: 9,
    color: "#B0A89A",
    fontFamily: SANS,
    marginTop: 2,
  },
  // Sermons Styles
  sermonCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sermonImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#1B3A7A",
    position: "relative",
  },
  sermonImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1B3A7A",
  },
  sermonImageInitial: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    fontFamily: SERIF,
  },
  sermonPlayOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  sermonPlayButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  sermonInfo: {
    flex: 1,
  },
  sermonTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0D1B3E",
    fontFamily: SANS,
  },
  sermonPastor: {
    fontSize: 10,
    color: "#7B7464",
    marginTop: 2,
    fontFamily: SANS,
  },
  sermonMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  sermonMetaText: {
    fontSize: 9,
    color: "#B0A89A",
    fontFamily: SANS,
  },
  sermonMetaDot: {
    fontSize: 9,
    color: "#B0A89A",
  },
  sermonPlayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1B3A7A",
  },
  sermonLoadingText: {
    fontSize: 12,
    color: "#B0A89A",
    fontFamily: SANS,
    textAlign: "center",
    flex: 1,
  },
  // Ministries Styles
  ministriesScroll: {
    gap: 16,
  },
  ministryItem: {
    alignItems: "center",
    gap: 8,
  },
  ministryAvatarContainer: {
    width: MINISTRY_AVATAR_SIZE,
    height: MINISTRY_AVATAR_SIZE,
    borderRadius: 16,
    backgroundColor: "#EDF0F8",
    borderWidth: 2,
    borderColor: "rgba(27,58,122,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  ministryAbbrev: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1B3A7A",
    fontFamily: SANS,
  },
  noMinistriesText: {
    fontSize: 12,
    color: "#B0A89A",
    fontFamily: SANS,
    textAlign: "center",
    paddingVertical: 12,
  },
  ministryLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: "#0D1B3E",
    fontFamily: SANS,
  },
  bottomSpacer: {
    height: 16,
  },
});