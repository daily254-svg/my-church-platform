import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../constants";

export interface ScriptureResult {
  reference: string;
  text: string;
  book?: string;
  chapter?: number;
  verse?: number;
  version?: string;
  source: "local" | "api-bible";
}

export interface BibleBooks {
  [key: string]: {
    chapters: number;
    verses?: { [key: number]: string[] };
  };
}

const TOKEN_KEY = "auth_token";

class ScriptureService {
  /**
   * Get available Bible versions from the server
   */
  async getAvailableVersions(): Promise<{ id: string; abbreviation: string; name: string; source: string }[]> {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const response = await fetch(`${API_URL}/scripture/versions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await response.json();
      return data.versions || [];
    } catch (error) {
      // Fallback to local versions if request fails
      return [
        { id: 'kjv',  abbreviation: 'KJV',  name: 'King James Version',      source: 'local' },
        { id: 'nkjv', abbreviation: 'NKJV', name: 'New King James Version',   source: 'local' },
        { id: 'web',  abbreviation: 'WEB',  name: 'World English Bible',      source: 'local' },
      ];
    }
  }

  /**
   * Get a scripture by reference (e.g., "John 3:16")
   */
  async getScripture(reference: string, version: string = 'kjv'): Promise<ScriptureResult[]> {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const url = new URL(`${API_URL}/scripture/get`);
      url.searchParams.append('reference', reference);
      url.searchParams.append('version', version);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
      }
      
      return data.results || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Search for scriptures by keyword
   */
  async searchScriptures(query: string, version: string = 'kjv', limit: number = 20): Promise<ScriptureResult[]> {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const url = new URL(`${API_URL}/scripture/search`);
      url.searchParams.append('query', query);
      url.searchParams.append('version', version);
      url.searchParams.append('limit', limit.toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Compare a scripture across all available local versions
   */
  async compareVersions(reference: string): Promise<{
    reference: string;
    versions: { version: string; text: string; source: string }[];
  } | null> {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const url = new URL(`${API_URL}/scripture/compare`);
      url.searchParams.append('reference', reference);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json();
      return data.success ? data : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get all books of the Bible
   */
  async getBibleBooks(version: string = 'kjv'): Promise<string[]> {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const url = new URL(`${API_URL}/scripture/books`);
      url.searchParams.append('version', version);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json();
      
      if (data.books && data.books.length > 0) {
        return data.books.map((book: any) => book.name);
      }
    } catch (error) {
    }
    
    // Fallback: Standard books of the King James Version Bible in order
    return [
      'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
      'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
      '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
      'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
      'Ecclesiastes', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel',
      'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah',
      'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah',
      'Haggai', 'Zechariah', 'Malachi', 'Matthew', 'Mark',
      'Luke', 'John', 'Acts', 'Romans', '1 Corinthians',
      '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians',
      '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus',
      'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter',
      '1 John', '2 John', '3 John', 'Jude', 'Revelation',
    ];
  }

  /**
   * Get chapters for a specific book
   */
  async getBookChapters(book: string, version: string = 'kjv'): Promise<number[]> {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const url = new URL(`${API_URL}/scripture/books/${encodeURIComponent(book)}`);
      url.searchParams.append('version', version);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json();
      
      if (data.book && data.book.chapters) {
        return Array.from({ length: data.book.chapters }, (_, i) => i + 1);
      }
    } catch (error) {
    }
    
    // Fallback: Chapter counts for each book of the KJV Bible
    const chapterCounts: { [key: string]: number } = {
      'Genesis': 50, 'Exodus': 40, 'Leviticus': 27, 'Numbers': 36, 'Deuteronomy': 34,
      'Joshua': 24, 'Judges': 21, 'Ruth': 4, '1 Samuel': 31, '2 Samuel': 24,
      '1 Kings': 22, '2 Kings': 25, '1 Chronicles': 29, '2 Chronicles': 36, 'Ezra': 10,
      'Nehemiah': 13, 'Esther': 10, 'Job': 42, 'Psalms': 150, 'Proverbs': 31,
      'Ecclesiastes': 12, 'Isaiah': 66, 'Jeremiah': 52, 'Lamentations': 5, 'Ezekiel': 48,
      'Daniel': 12, 'Hosea': 14, 'Joel': 3, 'Amos': 9, 'Obadiah': 1,
      'Jonah': 4, 'Micah': 7, 'Nahum': 3, 'Habakkuk': 3, 'Zephaniah': 3,
      'Haggai': 2, 'Zechariah': 14, 'Malachi': 4, 'Matthew': 28, 'Mark': 16,
      'Luke': 24, 'John': 21, 'Acts': 28, 'Romans': 16, '1 Corinthians': 16,
      '2 Corinthians': 13, 'Galatians': 6, 'Ephesians': 6, 'Philippians': 4, 'Colossians': 4,
      '1 Thessalonians': 5, '2 Thessalonians': 3, '1 Timothy': 6, '2 Timothy': 4, 'Titus': 3,
      'Philemon': 1, 'Hebrews': 13, 'James': 5, '1 Peter': 5, '2 Peter': 3,
      '1 John': 5, '2 John': 1, '3 John': 1, 'Jude': 1, 'Revelation': 22,
    };

    const chapters = chapterCounts[book] || 0;
    return Array.from({ length: chapters }, (_, i) => i + 1);
  }

  /**
   * Get chapter content by reference (e.g., "John 3")
   */
  async getChapterContent(book: string, chapter: number, version: string = 'kjv'): Promise<ScriptureResult[]> {
    const reference = `${book} ${chapter}`;
    return this.getScripture(reference, version);
  }
}

export const scriptureService = new ScriptureService();