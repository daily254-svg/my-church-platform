import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, BookOpen, Bookmark } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/navigation';
import { scriptureService, ScriptureResult } from '../../services/scripture.service';

type BibleChapterScreenNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'BibleChapter'
>;

interface BibleChapterRouteProp {
  book: string;
  chapter: number;
  version?: string;
}

// Updated versions - only local versions and AMP/NENO from API
const VERSIONS = [
  { label: 'KJV',  value: 'kjv',  source: 'local' },
  { label: 'NKJV', value: 'nkjv', source: 'local' },
  { label: 'WEB',  value: 'web',  source: 'local' },
  { label: 'AMP',  value: 'amp',  source: 'api-bible' },
  { label: 'NENO', value: 'neno', source: 'api-bible' },
];

const VerseItem = React.memo(({ verse, index }: { verse: ScriptureResult; index: number }) => {
  if (!verse || !verse.text) return null;

  const isEvenVerse = index % 2 === 0;

  return (
    <View style={[styles.verseItem, isEvenVerse && styles.verseItemEven]}>
      <View style={styles.verseNumberContainer}>
        <Text style={styles.verseNumber}>{verse.verse || index + 1}</Text>
      </View>
      <View style={styles.verseTextContainer}>
        <Text style={styles.verseText}>{verse.text}</Text>
      </View>
    </View>
  );
});

export default function BibleChapterScreen() {
  const navigation = useNavigation<BibleChapterScreenNavigationProp>();
  const route = useRoute();

  const { book, chapter, version: routeVersion } = (route.params as BibleChapterRouteProp) || {};

  const [verses, setVerses] = useState<ScriptureResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalChapters, setTotalChapters] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  // ✅ Initialize with route version if available, otherwise default to 'kjv'
  const [selectedVersion, setSelectedVersion] = useState(routeVersion || 'kjv');
  const [error, setError] = useState<string | null>(null);
  const [availableVersions, setAvailableVersions] = useState<{ id: string; abbreviation: string; name: string; source: string }[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const scrollViewRef = useRef<ScrollView>(null);
  const versionScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadAvailableVersions();
  }, []);

 // ✅ Update selectedVersion when route params change
  useEffect(() => {
    if (routeVersion && routeVersion !== selectedVersion) {
      setSelectedVersion(routeVersion);
    }
  }, [routeVersion]);

  useEffect(() => {
    if (book && chapter) {
      loadChapterContent(book, chapter);
      getTotalChapters(book);
      animateContent();
    }
  }, [book, chapter, selectedVersion]);

  const loadAvailableVersions = async () => {
    try {
      const versions = await scriptureService.getAvailableVersions();
      if (versions && versions.length > 0) {
        setAvailableVersions(versions);
      }
    } catch (error) {
      console.error('Failed to load versions:', error);
    }
  };

  const animateContent = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const loadChapterContent = async (book: string, chapter: number) => {
    if (!book || !chapter) return;

    try {
      setLoading(true);
      setError(null);
      
      const results = await scriptureService.getChapterContent(book, chapter, selectedVersion);
      
      if (results.length > 0) {
        setVerses(results);
        setError(null);
      } else {
        setVerses([]);
        const versionName = VERSIONS.find(v => v.value === selectedVersion)?.label || selectedVersion.toUpperCase();
        setError(`No verses found for ${versionName}. This version may not have this book available.`);
      }
    } catch (error) {
      setError('Failed to load scripture. Please try again.');
      setVerses([]);
    } finally {
      setLoading(false);
    }
  };

  const getTotalChapters = async (book: string) => {
    if (!book) return;
    try {
      const chapters = await scriptureService.getBookChapters(book, selectedVersion);
      setTotalChapters(chapters.length);
    } catch (error) {
      // Silently fail for total chapters
      console.error('Failed to get total chapters:', error);
    }
  };

  const handlePreviousChapter = () => {
    if (chapter > 1) {
      // ✅ Fixed: Pass selectedVersion in navigation params
      navigation.replace('BibleChapter', {
        book,
        chapter: chapter - 1,
        version: selectedVersion,
      } as any);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleNextChapter = () => {
    if (chapter < totalChapters) {
      // ✅ Fixed: Pass selectedVersion in navigation params
      navigation.replace('BibleChapter', {
        book,
        chapter: chapter + 1,
        version: selectedVersion,
      } as any);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const goBack = () => {
    navigation.goBack();
  };

  const handleVersionChange = (version: string) => {
    setSelectedVersion(version);
  };

  // Get current version info
  const currentVersion = VERSIONS.find(v => v.value === selectedVersion);
  const versionLabel = currentVersion?.label || selectedVersion.toUpperCase();
  const versionSource = currentVersion?.source || 'local';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.headerButton}>
          <ChevronLeft size={24} color="#1e40af" />
        </TouchableOpacity>

        <View style={styles.headerTitle}>
          <View style={styles.headerTitleRow}>
            <BookOpen size={16} color="#1e40af" />
            <Text style={styles.bookName}>{book}</Text>
          </View>
          <View style={styles.headerSubtitleRow}>
            <Text style={styles.chapterNumber}>
              Chapter {chapter} • {versionLabel}
            </Text>
            <View style={[
              styles.sourceBadge, 
              versionSource === 'local' ? styles.sourceBadgeLocal : styles.sourceBadgeApi
            ]}>
              <Text style={styles.sourceBadgeText}>
                {versionSource === 'local' ? 'OFFLINE' : 'ONLINE'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={toggleBookmark} style={styles.headerButton}>
            <Bookmark
              size={20}
              color={isBookmarked ? '#1e40af' : '#9ca3af'}
              fill={isBookmarked ? '#1e40af' : 'none'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Version Tabs */}
      <View style={styles.versionTabsContainer}>
        <ScrollView
          ref={versionScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.versionTabsContent}
        >
          {VERSIONS.map((v) => {
            const isActive = selectedVersion === v.value;
            return (
              <TouchableOpacity
                key={v.value}
                style={styles.versionTab}
                onPress={() => handleVersionChange(v.value)}
                activeOpacity={0.7}
              >
                <View style={styles.versionTabContent}>
                  <Text style={[styles.versionTabText, isActive && styles.versionTabTextActive]}>
                    {v.label}
                  </Text>
                  <View style={[
                    styles.versionSourceDot,
                    { backgroundColor: v.source === 'local' ? '#10b981' : '#f59e0b' }
                  ]} />
                </View>
                {isActive && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Chapter Navigation */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, chapter === 1 && styles.navButtonDisabled]}
          onPress={handlePreviousChapter}
          disabled={chapter === 1}
        >
          <ChevronLeft size={18} color={chapter === 1 ? '#d1d5db' : '#1e40af'} />
          <Text style={[styles.navButtonText, chapter === 1 && styles.navButtonTextDisabled]}>
            Previous
          </Text>
        </TouchableOpacity>

        <View style={styles.chapterIndicator}>
          <View style={styles.chapterDot} />
          <Text style={styles.chapterCount}>
            Chapter {chapter} of {totalChapters || '...'}
          </Text>
          <View style={styles.chapterDot} />
        </View>

        <TouchableOpacity
          style={[styles.navButton, chapter === totalChapters && styles.navButtonDisabled]}
          onPress={handleNextChapter}
          disabled={chapter === totalChapters}
        >
          <Text style={[styles.navButtonText, chapter === totalChapters && styles.navButtonTextDisabled]}>
            Next
          </Text>
          <ChevronRight size={18} color={chapter === totalChapters ? '#d1d5db' : '#1e40af'} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <BookOpen size={48} color="#1e40af" />
            <ActivityIndicator size="large" color="#1e40af" style={styles.loader} />
            <Text style={styles.loadingText}>Loading Scriptures...</Text>
            <Text style={styles.loadingSubtext}>
              {book} {chapter} • {versionLabel}
            </Text>
          </View>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <BookOpen size={64} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadChapterContent(book, chapter)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.retryButton, styles.switchVersionButton]}
            onPress={() => handleVersionChange('kjv')}
          >
            <Text style={styles.retryButtonText}>Switch to KJV</Text>
          </TouchableOpacity>
        </View>
      ) : verses.length > 0 ? (
        <ScrollView
          ref={scrollViewRef}
          style={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.chapterHeader}>
              <View style={styles.chapterHeaderLine} />
              <Text style={styles.chapterHeaderText}>
                {book} {chapter} • {versionLabel}
              </Text>
              <View style={styles.chapterHeaderLine} />
            </View>

            <View style={styles.versesContainer}>
              {verses.map((verse, index) => (
                <VerseItem key={`${verse.verse || index}-${index}`} verse={verse} index={index} />
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <BookOpen size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>No content available</Text>
          <Text style={styles.emptySubtext}>Please try another version or chapter</Text>
          <TouchableOpacity
            style={[styles.retryButton, styles.switchVersionButton]}
            onPress={() => handleVersionChange('kjv')}
          >
            <Text style={styles.retryButtonText}>Switch to KJV</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  headerTitle: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  bookName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  chapterNumber: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  sourceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sourceBadgeLocal: {
    backgroundColor: '#d1fae5',
  },
  sourceBadgeApi: {
    backgroundColor: '#fef3c7',
  },
  sourceBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#374151',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  versionTabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  versionTabsContent: {
    paddingHorizontal: 4,
  },
  versionTab: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  versionTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  versionTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  versionTabTextActive: {
    color: '#1e40af',
    fontWeight: '700',
  },
  versionSourceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    height: 3,
    backgroundColor: '#1e40af',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    gap: 6,
    flex: 1,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  navButtonDisabled: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  navButtonTextDisabled: {
    color: '#d1d5db',
  },
  chapterIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  chapterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#cbd5e1',
  },
  chapterCount: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loader: {
    marginTop: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  loadingSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#64748b',
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
    gap: 12,
  },
  chapterHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  chapterHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 1,
  },
  versesContainer: {
    gap: 2,
  },
  verseItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 12,
  },
  verseItemEven: {
    backgroundColor: '#f8fafc',
  },
  verseNumberContainer: {
    width: 32,
    alignItems: 'center',
    paddingTop: 2,
  },
  verseNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e40af',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  verseTextContainer: {
    flex: 1,
  },
  verseText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#374151',
    letterSpacing: 0.3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginTop: 16,
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#1e40af',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  switchVersionButton: {
    backgroundColor: '#10b981',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});