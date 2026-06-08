import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../constants";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ScriptureResult {
  reference: string;
  text: string;
  book?: string;
  chapter?: number;
  verse?: number;
  version: string;
  source: "local";
}

export interface BibleVersionMeta {
  id: string;
  abbreviation: string;
  name: string;
  available: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const TOKEN_KEY = "auth_token";

async function authHeaders(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

class ScriptureService {
  /**
   * Get all Bible versions and their availability from the backend.
   * Call .filter(v => v.available) to get only loaded versions.
   */
  async getAvailableVersions(): Promise<BibleVersionMeta[]> {
    try {
      const headers = await authHeaders();
      const response = await fetch(`${API_URL}/scripture/versions`, {
        method: "GET",
        headers,
      });
      const data = await response.json();
      return (data.versions as BibleVersionMeta[]) || [];
    } catch (error) {
      console.error("[ScriptureService] getAvailableVersions failed:", error);
      return [];
    }
  }

  /**
   * Get a scripture by reference e.g. "John 3:16" or "Romans 8"
   */
  async getScripture(
    reference: string,
    version: string = "kjv"
  ): Promise<ScriptureResult[]> {
    try {
      const headers = await authHeaders();
      const url = new URL(`${API_URL}/scripture/get`);
      url.searchParams.append("reference", reference);
      url.searchParams.append("version", version);

      const response = await fetch(url.toString(), { method: "GET", headers });
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error("[ScriptureService] getScripture failed:", error);
      return [];
    }
  }

  /**
   * Search scriptures by keyword or reference
   */
  async searchScriptures(
    query: string,
    version: string = "kjv",
    limit: number = 20
  ): Promise<ScriptureResult[]> {
    try {
      const headers = await authHeaders();
      const url = new URL(`${API_URL}/scripture/search`);
      url.searchParams.append("query", query);
      url.searchParams.append("version", version);
      url.searchParams.append("limit", limit.toString());

      const response = await fetch(url.toString(), { method: "GET", headers });
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error("[ScriptureService] searchScriptures failed:", error);
      return [];
    }
  }

  /**
   * Compare a reference across all loaded versions
   */
  async compareVersions(reference: string): Promise<{
    reference: string;
    versions: { version: string; text: string }[];
  } | null> {
    try {
      const headers = await authHeaders();
      const url = new URL(`${API_URL}/scripture/compare`);
      url.searchParams.append("reference", reference);

      const response = await fetch(url.toString(), { method: "GET", headers });
      const data = await response.json();
      return data.success ? { reference: data.reference, versions: data.versions } : null;
    } catch (error) {
      console.error("[ScriptureService] compareVersions failed:", error);
      return null;
    }
  }

  /**
   * Get all book names for a version
   */
  async getBibleBooks(version: string = "kjv"): Promise<string[]> {
    try {
      const headers = await authHeaders();
      const url = new URL(`${API_URL}/scripture/books`);
      url.searchParams.append("version", version);

      const response = await fetch(url.toString(), { method: "GET", headers });
      const data = await response.json();

      if (data.books && data.books.length > 0) {
        return data.books.map((book: { name: string }) => book.name);
      }
      return [];
    } catch (error) {
      console.error("[ScriptureService] getBibleBooks failed:", error);
      return [];
    }
  }

  /**
   * Get chapter numbers for a specific book e.g. [1, 2, 3 ... 21]
   */
  async getBookChapters(
    book: string,
    version: string = "kjv"
  ): Promise<number[]> {
    try {
      const headers = await authHeaders();
      const url = new URL(
        `${API_URL}/scripture/books/${encodeURIComponent(book)}`
      );
      url.searchParams.append("version", version);

      const response = await fetch(url.toString(), { method: "GET", headers });
      const data = await response.json();

      if (data.book?.chapters) {
        return Array.from({ length: data.book.chapters }, (_, i) => i + 1);
      }
      return [];
    } catch (error) {
      console.error("[ScriptureService] getBookChapters failed:", error);
      return [];
    }
  }

  /**
   * Get all verses for a chapter e.g. getChapterContent("John", 3, "nkjv")
   */
  async getChapterContent(
    book: string,
    chapter: number,
    version: string = "kjv"
  ): Promise<ScriptureResult[]> {
    return this.getScripture(`${book} ${chapter}`, version);
  }
}

export const scriptureService = new ScriptureService();