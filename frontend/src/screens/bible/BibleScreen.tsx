import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, BookOpen, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/navigation';

type BibleScreenNavigationProp = NativeStackNavigationProp<MainStackParamList>;

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 3; // 3 columns with 16px padding on each side and 8px gaps

export default function BibleScreen() {
  const navigation = useNavigation<BibleScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Bible books organized by testament
  const books = {
    old: [
      'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
      'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
      '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
      'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
      'Ecclesiastes', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel',
      'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah',
      'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah',
      'Haggai', 'Zechariah', 'Malachi',
    ],
    new: [
      'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans',
      '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
      'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
      '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews',
      'James', '1 Peter', '2 Peter', '1 John', '2 John',
      '3 John', 'Jude', 'Revelation',
    ],
  };

  const handleBookSelect = (book: string) => {
    navigation.navigate('BibleBooks', { selectedBook: book });
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      navigation.navigate('BibleSearch', { query: searchQuery });
      setIsSearching(false);
    }
  };

  const BookCard = ({ book, index }: { book: string; index: number }) => (
    <TouchableOpacity
      style={[
        styles.bookCard,
        { backgroundColor: getBookColor(index) }
      ]}
      onPress={() => handleBookSelect(book)}
      activeOpacity={0.7}
    >
      <View style={styles.bookIconContainer}>
        <BookOpen size={18} color="#fff" />
      </View>
      <Text style={styles.bookCardText} numberOfLines={2}>
        {book}
      </Text>
    </TouchableOpacity>
  );

  // Generate different colors for variety
  const getBookColor = (index: number) => {
    const colors = [
      '#1e40af', '#047857', '#b91c1c', '#7c3aed', 
      '#0e7490', '#b45309', '#6d28d9', '#166534',
    ];
    return colors[index % colors.length];
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Holy Bible</Text>
        </View>
        <View style={styles.headerDecoration}>
          <View style={styles.cross} />
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search scriptures..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            placeholderTextColor="#9ca3af"
            returnKeyType="search"
          />
          {isSearching ? (
            <ActivityIndicator color="#1e40af" />
          ) : (
            searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleSearch}>
                <ChevronRight size={20} color="#1e40af" />
              </TouchableOpacity>
            )
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.booksContainer} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Old Testament */}
        <View style={styles.testamentSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <BookOpen size={16} color="#fff" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Old Testament</Text>
              <Text style={styles.sectionCount}>39 Books</Text>
            </View>
          </View>
          <View style={styles.booksGrid}>
            {books.old.map((book, index) => (
              <BookCard key={book} book={book} index={index} />
            ))}
          </View>
        </View>

        {/* New Testament */}
        <View style={styles.testamentSection}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#047857' }]}>
              <BookOpen size={16} color="#fff" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>New Testament</Text>
              <Text style={styles.sectionCount}>27 Books</Text>
            </View>
          </View>
          <View style={styles.booksGrid}>
            {books.new.map((book, index) => (
              <BookCard key={book} book={book} index={index + 39} />
            ))}
          </View>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  headerDecoration: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cross: {
    width: 24,
    height: 24,
    backgroundColor: '#1e40af',
    borderRadius: 4,
    transform: [{ rotate: '45deg' }],
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  booksContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  testamentSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  sectionCount: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  booksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  bookCard: {
    width: (Dimensions.get('window').width - 48) / 3,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookCardText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 18,
  },
});