import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Search as SearchIcon } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/navigation';
import { scriptureService, ScriptureResult } from '../../services/scripture.service';

type BibleSearchScreenNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'BibleSearch'
>;

interface BibleSearchRouteProp {
  query: string;
}

export default function BibleSearchScreen() {
  const navigation = useNavigation<BibleSearchScreenNavigationProp>();
  const route = useRoute();
  const initialQuery = (route.params as BibleSearchRouteProp)?.query || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState<ScriptureResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState('kjv');
  const [availableVersions, setAvailableVersions] = useState<{ id: string; abbreviation: string; available: boolean }[]>([]);

  useEffect(() => {
    scriptureService.getAvailableVersions()
      .then((versions) => setAvailableVersions(versions.filter(v => v.available)))
      .catch(() => {});
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    try {
      setLoading(true);
      setSearched(true);
      const searchResults = await scriptureService.searchScriptures(searchQuery, selectedVersion);
      setResults(searchResults);
    } catch (error) {
      console.error('Error searching:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedVersion]);

  const handleResultPress = (result: ScriptureResult) => {
    // Parse the reference to get book and chapter if available
    const referenceMatch = result.reference?.match(/^(.+?)\s+(\d+):?(\d+)?/);
    if (referenceMatch) {
      const [, book, chapter] = referenceMatch;
      navigation.navigate('BibleChapter', { book, chapter: parseInt(chapter) });
    }
  };

  const ResultItem = ({ result }: { result: ScriptureResult }) => (
    <TouchableOpacity style={styles.resultItem} onPress={() => handleResultPress(result)}>
      <View>
        <Text style={styles.resultReference}>{result.reference}</Text>
        {result.version && (
          <Text style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
            {result.version}
          </Text>
        )}
        <Text style={styles.resultText} numberOfLines={2}>
          {result.text}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#1e40af" />
        </TouchableOpacity>
        <Text style={styles.title}>Search Bible</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <SearchIcon size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search scriptures..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          placeholderTextColor="#999"
          autoFocus
        />
        {loading && <ActivityIndicator color="#1e40af" />}
      </View>

      {/* Search Button */}
      <TouchableOpacity
        style={styles.searchButton}
        onPress={handleSearch}
        disabled={loading || !searchQuery.trim()}
      >
        <Text style={styles.searchButtonText}>Search</Text>
      </TouchableOpacity>

      {/* Version Selector */}
      {availableVersions.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ paddingHorizontal: 16, marginBottom: 8 }}
          contentContainerStyle={{ gap: 8, paddingVertical: 6 }}
        >
          {availableVersions.map((v) => (
            <TouchableOpacity
              key={v.id}
              onPress={() => setSelectedVersion(v.id)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: selectedVersion === v.id ? '#1e40af' : '#f3f4f6',
              }}
            >
              <Text style={{
                fontSize: 13,
                fontWeight: '600',
                color: selectedVersion === v.id ? '#fff' : '#374151',
              }}>
                {v.abbreviation}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Results */}
      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {loading && !results.length ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#1e40af" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : searched && results.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No results found</Text>
            <Text style={styles.emptySubtext}>Try a different search term</Text>
          </View>
        ) : results.length > 0 ? (
          <View>
            <Text style={styles.resultCount}>{results.length} result(s) found</Text>
            {results.map((result, index) => (
              <ResultItem key={index} result={result} />
            ))}
          </View>
        ) : (
          <View style={styles.centerContainer}>
            <Text style={styles.placeholderText}>Enter a search term to find scriptures</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e40af',
    flex: 1,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 16,
    color: '#000',
  },
  searchButton: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 10,
    backgroundColor: '#1e40af',
    borderRadius: 6,
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  resultCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginVertical: 12,
  },
  resultItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#1e40af',
  },
  resultReference: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  resultText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
});