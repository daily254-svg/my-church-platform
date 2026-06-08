import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Dimensions} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Bookmark,
  Heart,
  Share2,
  PenLine,
  Headphones,
  Video,
  MessageCircle,
} from "lucide-react-native";
import { SERIF, SANS } from "../styles/theme";
import { useLiveService } from "../hooks/useLiveService";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList } from "../navigation/navigation";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface QuickAction {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  onPress?: () => void;
}

export default function LiveServiceScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { isLive, currentService, scripture, connectedCount } = useLiveService()
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);

  const handleNotes = () => navigation.navigate("SermonNotes", { 
    serviceId: currentService?.serviceId,
    serviceTitle: currentService?.title 
  });
  const handleAudio = () => {};
  const handleVideo = () => {};
  const handleChat = () => {};
  const handleShare = () => {};

  const scriptureActions: QuickAction[] = [
    {
      icon: Bookmark,
      label: "Save",
      onPress: () => setIsBookmarked(!isBookmarked),
    },
    {
      icon: Heart,
      label: "Highlight",
      onPress: () => setIsHighlighted(!isHighlighted),
    },
    { icon: Share2, label: "Share", onPress: handleShare },
  ];

  const bottomControls: QuickAction[] = [
    { icon: Headphones, label: "Audio", onPress: handleAudio },
    { icon: Video, label: "Video", onPress: handleVideo },
    { icon: MessageCircle, label: "Chat", onPress: handleChat },
    { icon: Share2, label: "Share", onPress: handleShare },
  ];

  return (
    
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <StatusBar barStyle="light-content" backgroundColor="#080F22" />
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header Row */}
          <View style={styles.header}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            <Text style={styles.serviceInfo}>
              {currentService?.title ?? "Sunday Morning Service"}
            </Text>
            <View style={styles.viewerCount}>
              <View style={styles.viewerDot} />
              <Text style={styles.viewerText}>{connectedCount}</Text>
            </View>
          </View>

          {/* Sermon Info */}
          <View style={styles.sermonInfo}>
            <Text style={styles.sermonTitle}>
              {currentService?.title ?? "Sunday Morning Service"}
            </Text>
            <Text style={styles.sermonPastor}>
              {currentService?.startedBy ?? ""}
            </Text>
          </View>

          {/* Scripture Card */}
          <View style={styles.scriptureCard}>
            <View style={styles.scriptureHeader}>
              <View style={styles.scriptureReference}>
                <Text style={styles.scriptureReferenceText}>
                  {scripture?.reference ?? "John 14:15–17"}
                </Text>
              </View>
              <Text style={styles.scriptureVersion}>
                {scripture?.version ? `${scripture.version} · Synchronized` : 'Synchronized'}
              </Text>
            </View>

            <ScrollView
              style={styles.scriptureScroll}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.scriptureText}>
                {scripture?.text ?? `"If you love me, keep my commands. And I will ask the Father, and he will give you another advocate to help you and be with you forever — the Spirit of truth. The world cannot accept him, because it neither sees him nor knows him. But you know him, for he lives with you and will be in you."`}
              </Text>
            </ScrollView>

            {/* Scripture Actions */}
            <View style={styles.scriptureActions}>
              {scriptureActions.map(({ icon: Icon, label, onPress }) => {
                const isActive =
                  (label === "Save" && isBookmarked) ||
                  (label === "Highlight" && isHighlighted);

                return (
                  <TouchableOpacity
                    key={label}
                    style={[
                      styles.scriptureActionButton,
                      isActive && styles.scriptureActionActive,
                    ]}
                    onPress={onPress}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                  >
                    <Icon
                      size={13}
                      color={isActive ? "#0D1B3E" : "#E8C77A"}
                    />
                    <Text
                      style={[
                        styles.scriptureActionText,
                        isActive && styles.scriptureActionTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Quick Note Input */}
          <TouchableOpacity
            style={styles.noteInput}
            onPress={handleNotes}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Add a sermon note"
          >
            <PenLine size={15} color="rgba(255,255,255,0.3)" />
            <Text style={styles.noteInputText}>Add a sermon note...</Text>
            <View style={styles.noteButton}>
              <Text style={styles.noteButtonText}>Notes</Text>
            </View>
          </TouchableOpacity>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            {bottomControls.map(({ icon: Icon, label, onPress }) => (
              <TouchableOpacity
                key={label}
                style={styles.bottomControlButton}
                onPress={onPress}
                activeOpacity={0.6}
                accessibilityRole="button"
                accessibilityLabel={label}
              >
                <Icon size={19} color="rgba(255,255,255,0.35)" />
                <Text style={styles.bottomControlText}>{label}</Text>
              </TouchableOpacity>
            ))}
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
    backgroundColor: "#080F22",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 95,
  },
  // Header Styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239,68,68,0.2)",
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F87171",
  },
  liveText: {
    color: "#F87171",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
    fontFamily: SANS,
  },
  serviceInfo: {
    flex: 1,
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontFamily: SANS,
  },
  viewerCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
  // Sermon Info Styles
  sermonInfo: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sermonTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    lineHeight: 28,
    marginBottom: 4,
    fontFamily: SERIF,
  },
  sermonPastor: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontFamily: SANS,
  },
  // Scripture Card Styles
  scriptureCard: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 24,
    backgroundColor: "#162B60",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    padding: 20,
    minHeight: SCREEN_HEIGHT * 0.35,
  },
  scriptureHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  scriptureReference: {
    backgroundColor: "#C4933A",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  scriptureReferenceText: {
    color: "#0D1B3E",
    fontSize: 11,
    fontWeight: "bold",
    fontFamily: SANS,
  },
  scriptureVersion: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 10,
    fontFamily: SANS,
  },
  scriptureScroll: {
    flex: 1,
  },
  scriptureText: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 24,
    fontFamily: SERIF,
  },
  // Scripture Actions Styles
  scriptureActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
  },
  scriptureActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  scriptureActionActive: {
    backgroundColor: "#E8C77A",
  },
  scriptureActionText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "500",
    fontFamily: SANS,
  },
  scriptureActionTextActive: {
    color: "#0D1B3E",
  },
  // Note Input Styles
  noteInput: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 12,
  },
  noteInputText: {
    flex: 1,
    color: "rgba(255,255,255,0.25)",
    fontSize: 14,
    fontFamily: SANS,
  },
  noteButton: {
    backgroundColor: "#C4933A",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  noteButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
    fontFamily: SANS,
  },
  // Bottom Controls Styles
  bottomControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 12,
  },
  bottomControlButton: {
    alignItems: "center",
    gap: 4,
  },
  bottomControlText: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 9,
    fontFamily: SANS,
  },
});