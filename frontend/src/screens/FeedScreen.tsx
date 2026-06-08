import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bell, Heart, MessageCircle, Share2, Plus, X, ArrowUp } from "lucide-react-native";
import { SERIF, SANS } from "../styles/theme";
import { useAuth } from "../context/AuthContext";
import { feedService } from "../services/feed.service";

interface FeedPost {
  id: string;
  type: string;
  title: string;
  body: string;
  imageUrl?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  user: { name: string; role: string };
}

interface FeedComment {
  id: string;
  text: string;
  createdAt: string;
  user: { name: string };
}

interface TypeStyle {
  color: string;
  bg: string;
  label: string;
}

export default function FeedScreen() {
  const { token } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [showTestimonyModal, setShowTestimonyModal] = useState(false);
  const [testimonyTitle, setTestimonyTitle] = useState("");
  const [testimonyBody, setTestimonyBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Comments state
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [addingComment, setAddingComment] = useState(false);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState<Date>(new Date());
  const detectedPostIds = useRef<Set<string>>(new Set());

  const typeStyle: Record<string, TypeStyle> = {
    ANNOUNCEMENT: { color: "#1B3A7A", bg: "#EDF0F8", label: "Announcement" },
    DEVOTIONAL: { color: "#C4933A", bg: "#FDF6E8", label: "Devotional" },
    SERMON: { color: "#6B3A7A", bg: "#F2EAF8", label: "Sermon" },
    TESTIMONY: { color: "#2D7A6A", bg: "#E8F5F2", label: "Testimony" },
  };

  const fetchPosts = async () => {
    try {
      const data = await feedService.getAll(token!);
      setPosts(data);
      setLikedPosts(
        new Set(data.filter((p) => p.isLiked).map((p) => p.id))
      );
    } catch (err) {
      console.warn("[feed] Failed to fetch posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    
    const interval = setInterval(async () => {
      try {
        const data = await feedService.getAll(token!);
        const currentIds = new Set(posts.map(p => p.id));
        const newPosts = data.filter(p => !currentIds.has(p.id) && !detectedPostIds.current.has(p.id));
        
        if (newPosts.length > 0) {
          // Add to detected set so we don't count them again
          newPosts.forEach(p => detectedPostIds.current.add(p.id));
          setNewPostsCount(prev => prev + newPosts.length);
        }
      } catch (err) {
        // Silent polling failure
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [posts.length]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const toggleLike = async (postId: string) => {
    try {
      const result = await feedService.like(postId, token!);
      
      // Update likedPosts Set
      setLikedPosts((prev) => {
        const next = new Set(prev);
        if (result.liked) {
          next.add(postId);
        } else {
          next.delete(postId);
        }
        return next;
      });

      // Optimistically update likesCount in posts
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, likesCount: result.likesCount }
            : post
        )
      );
    } catch (err) {
      console.warn("[feed] Failed to toggle like:", err);
    }
  };

  const handleSubmitTestimony = async () => {
    if (!testimonyTitle.trim() || !testimonyBody.trim()) return;
    setSubmitting(true);
    try {
      await feedService.create(
        { type: "TESTIMONY", title: testimonyTitle, body: testimonyBody },
        token!
      );
      setTestimonyTitle("");
      setTestimonyBody("");
      setShowTestimonyModal(false);
      await fetchPosts();
    } catch (err) {
      console.warn("Post failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const openComments = async (postId: string) => {
    setActivePostId(postId);
    setCommentsLoading(true);
    try {
      const data = await feedService.getComments(postId, token!);
      setComments(data);
    } catch (err) {
      console.warn("[feed] Failed to fetch comments:", err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !activePostId) return;
    setAddingComment(true);
    try {
      const newComment = await feedService.addComment(
        activePostId,
        commentText,
        token!
      );
      setComments((prev) => [...prev, newComment]);
      setCommentText("");
      
      // Update commentsCount on the post
      setPosts((prev) =>
        prev.map((post) =>
          post.id === activePostId
            ? { ...post, commentsCount: post.commentsCount + 1 }
            : post
        )
      );
    } catch (err) {
      console.warn("[feed] Failed to add comment:", err);
    } finally {
      setAddingComment(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1B3A7A" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* Sticky Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Church Feed</Text>
          <Text style={styles.headerSubtitle}>
            Stay updated with your community
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.testimonyButton}
            onPress={() => setShowTestimonyModal(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Share Testimony"
          >
            <Plus size={14} color="#C4933A" />
            <Text style={styles.testimonyButtonText}>Testimony</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.notificationButton}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Bell size={15} color="#0D1B3E" />
          </TouchableOpacity>
        </View>
      </View>

      {newPostsCount > 0 && (
        <TouchableOpacity
          style={styles.newPostsBanner}
          onPress={async () => {
            await fetchPosts();
            setNewPostsCount(0);
            detectedPostIds.current.clear();
            setLastFetchTime(new Date());
          }}
          activeOpacity={0.7}
        >
          <ArrowUp size={14} color="#FFFFFF" />
          <Text style={styles.newPostsText}>
            {newPostsCount} new post{newPostsCount > 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
      )}

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={async () => {
              setLoading(true);
              await fetchPosts();
              setNewPostsCount(0);
              detectedPostIds.current.clear();
              setLoading(false);
            }}
            tintColor="#1B3A7A"
          />
        }
      >
        <View style={styles.feedContainer}>
          {posts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No posts yet</Text>
            </View>
          ) : (
            posts.map((post) => {
              const style = typeStyle[post.type] || typeStyle.ANNOUNCEMENT;
              const isLiked = likedPosts.has(post.id);

              return (
                <View key={post.id} style={styles.feedCard}>
                  {/* Image Header */}
                  {post.imageUrl && (
                    <View style={styles.imageHeader}>
                      <Image
                        source={{ uri: post.imageUrl }}
                        style={styles.feedImage}
                        resizeMode="cover"
                      />
                      <View style={styles.imageOverlay}>
                        <Text style={styles.imageLabel}>
                          {style.label}
                        </Text>
                        <Text style={styles.imageTitle} numberOfLines={1}>
                          {post.title}
                        </Text>
                      </View>
                    </View>
                  )}
                  {/* Card Content */}
                  <View style={styles.cardContent}>
                    {/* User Info and Time */}
                    <View style={styles.userRow}>
                      <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>
                          {(post.user.name || "U").charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.userInfo}>
                        <View style={styles.userNameRow}>
                          <Text style={styles.userName}>{post.user.name}</Text>
                          {(post.user.role === 'ADMIN' || post.user.role === 'PASTOR' || post.user.role === 'SECRETARY' || post.user.role === 'MEDIA') && (
                            <View style={[
                              styles.roleBadge,
                              post.user.role === 'PASTOR' && styles.rolePastor,
                              post.user.role === 'ADMIN' && styles.roleAdmin,
                              post.user.role === 'SECRETARY' && styles.roleSecretary,
                              post.user.role === 'MEDIA' && styles.roleMedia,
                            ]}>
                              <Text style={styles.roleBadgeText}>
                                {post.user.role === 'ADMIN' ? 'Admin' : 
                                 post.user.role === 'PASTOR' ? 'Pastor' : 
                                 post.user.role === 'SECRETARY' ? 'Secretary' : 'Media'}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.timeText}>
                          {formatTime(post.createdAt)}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.typeBadge,
                          { backgroundColor: style.bg },
                        ]}
                      >
                        <Text
                          style={[styles.typeText, { color: style.color }]}
                        >
                          {style.label}
                        </Text>
                      </View>
                    </View>

                    {/* Title */}
                    {!post.imageUrl && (
                      <Text style={styles.itemTitle}>{post.title}</Text>
                    )}

                    {/* Body Text */}
                    <Text style={styles.itemBody}>{post.body}</Text>

                    {/* Action Buttons */}
                    <View style={styles.actionRow}>
                      {/* Like Button */}
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => toggleLike(post.id)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={isLiked ? "Unlike" : "Like"}
                      >
                        <Heart
                          size={14}
                          fill={isLiked ? "#C4933A" : "none"}
                          color={isLiked ? "#C4933A" : "#7B7464"}
                        />
                        <Text style={styles.actionText}>
                          {post.likesCount}
                        </Text>
                      </TouchableOpacity>

                      {/* Comment Button */}
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => openComments(post.id)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Comment"
                      >
                        <MessageCircle size={14} color="#7B7464" />
                        <Text style={styles.actionText}>
                          {post.commentsCount > 0 ? post.commentsCount : "Comment"}
                        </Text>
                      </TouchableOpacity>

                      {/* Share Button */}
                      <TouchableOpacity
                        style={[styles.actionButton, styles.shareButton]}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Share"
                      >
                        <Share2 size={14} color="#7B7464" />
                        <Text style={styles.actionText}>Share</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Testimony Modal */}
      <Modal
        visible={showTestimonyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTestimonyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Your Testimony</Text>
              <TouchableOpacity
                onPress={() => setShowTestimonyModal(false)}
                activeOpacity={0.7}
              >
                <X size={20} color="#0D1B3E" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              value={testimonyTitle}
              onChangeText={setTestimonyTitle}
              placeholder="Title"
              placeholderTextColor="#C0B8B0"
            />
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              value={testimonyBody}
              onChangeText={setTestimonyBody}
              placeholder="Share what God has done..."
              placeholderTextColor="#C0B8B0"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowTestimonyModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSubmitButton,
                  submitting && styles.modalSubmitButtonDisabled,
                ]}
                onPress={handleSubmitTestimony}
                disabled={submitting}
                activeOpacity={0.7}
              >
                <Text style={styles.modalSubmitText}>
                  {submitting ? "Posting..." : "Post Testimony"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Comments Modal */}
      <Modal
        visible={activePostId !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActivePostId(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.commentsModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity
                onPress={() => setActivePostId(null)}
                activeOpacity={0.7}
              >
                <X size={20} color="#0D1B3E" />
              </TouchableOpacity>
            </View>

            {commentsLoading ? (
              <ActivityIndicator
                size="small"
                color="#1B3A7A"
                style={styles.commentsLoader}
              />
            ) : comments.length === 0 ? (
              <Text style={styles.noCommentsText}>No comments yet</Text>
            ) : (
              <ScrollView style={styles.commentsList}>
                {comments.map((comment) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <View style={styles.commentAvatar}>
                      <Text style={styles.commentAvatarText}>
                        {(comment.user.name || "U").charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.commentContent}>
                      <Text style={styles.commentUserName}>
                        {comment.user.name}
                      </Text>
                      <Text style={styles.commentText}>{comment.text}</Text>
                      <Text style={styles.commentTime}>
                        {formatTime(comment.createdAt)}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Add a comment..."
                placeholderTextColor="#C0B8B0"
              />
              <TouchableOpacity
                style={[
                  styles.commentSendButton,
                  addingComment && styles.commentSendButtonDisabled,
                ]}
                onPress={handleAddComment}
                disabled={addingComment || !commentText.trim()}
                activeOpacity={0.7}
              >
                {addingComment ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.commentSendText}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // Header Styles
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F7F5F0",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(13,27,62,0.06)",
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#0D1B3E",
    fontFamily: SERIF,
  },
  headerSubtitle: {
    fontSize: 10,
    color: "#7B7464",
    marginTop: 2,
    fontFamily: SANS,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  testimonyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#C4933A",
    backgroundColor: "#FDF6E8",
  },
  testimonyButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#C4933A",
    fontFamily: SANS,
  },
  notificationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0EDE6",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 95,
  },
  feedContainer: {
    padding: 16,
    gap: 16,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    color: "#B0A89A",
    fontFamily: SANS,
  },
  // Feed Card Styles
  feedCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardContent: {
    padding: 16,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EDF0F8",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1B3A7A",
    fontFamily: SANS,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  userName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0D1B3E",
    fontFamily: SANS,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: "#1B3A7A",
  },
  rolePastor: {
    backgroundColor: "#C4933A",
  },
  roleAdmin: {
    backgroundColor: "#1B3A7A",
  },
  roleSecretary: {
    backgroundColor: "#6B3A7A",
  },
  roleMedia: {
    backgroundColor: "#2D7A6A",
  },
  roleBadgeText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    fontFamily: SANS,
  },
  timeText: {
    fontSize: 9,
    color: "#B0A89A",
    fontFamily: SANS,
  },
  typeBadge: {
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  typeText: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontFamily: SANS,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#0D1B3E",
    marginBottom: 4,
    fontFamily: SANS,
  },
  itemBody: {
    fontSize: 11,
    color: "#7B7464",
    lineHeight: 18,
    marginBottom: 12,
    fontFamily: SANS,
  },
  // Action Row Styles
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  shareButton: {
    marginLeft: "auto",
  },
  actionText: {
    fontSize: 11,
    color: "#7B7464",
    fontFamily: SANS,
  },
  // Image Header Styles
  imageHeader: {
    height: 130,
    overflow: "hidden",
    backgroundColor: "#0D1B3E",
    position: "relative",
  },
  feedImage: {
    width: "100%",
    height: "100%",
    opacity: 0.4,
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  imageLabel: {
    color: "#E8C77A",
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
    fontFamily: SANS,
  },
  imageTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
    fontFamily: SERIF,
  },
  newPostsBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#1B3A7A",
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
  },
  newPostsText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: SANS,
  },
  bottomSpacer: {
    height: 16,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#0D1B3E",
    fontFamily: SERIF,
  },
  modalInput: {
    backgroundColor: "#F7F5F0",
    borderRadius: 16,
    padding: 14,
    fontSize: 14,
    color: "#0D1B3E",
    fontFamily: SANS,
    marginBottom: 12,
  },
  modalTextArea: {
    minHeight: 120,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#F0EDE6",
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7B7464",
    fontFamily: SANS,
  },
  modalSubmitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#C4933A",
    alignItems: "center",
  },
  modalSubmitButtonDisabled: {
    opacity: 0.6,
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: SANS,
  },
  // Comments Modal Styles
  commentsModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "80%",
    flex: 1,
  },
  commentsLoader: {
    marginVertical: 20,
  },
  noCommentsText: {
    fontSize: 13,
    color: "#B0A89A",
    textAlign: "center",
    marginVertical: 20,
    fontFamily: SANS,
  },
  commentsList: {
    flex: 1,
  },
  commentItem: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EDF0F8",
    alignItems: "center",
    justifyContent: "center",
  },
  commentAvatarText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1B3A7A",
    fontFamily: SANS,
  },
  commentContent: {
    flex: 1,
  },
  commentUserName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0D1B3E",
    fontFamily: SANS,
  },
  commentText: {
    fontSize: 12,
    color: "#4A4A4A",
    lineHeight: 18,
    marginTop: 2,
    fontFamily: SANS,
  },
  commentTime: {
    fontSize: 9,
    color: "#B0A89A",
    marginTop: 4,
    fontFamily: SANS,
  },
  commentInputRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#F7F5F0",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: "#0D1B3E",
    fontFamily: SANS,
  },
  commentSendButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "#1B3A7A",
    alignItems: "center",
    justifyContent: "center",
  },
  commentSendButtonDisabled: {
    opacity: 0.5,
  },
  commentSendText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: SANS,
  },
});