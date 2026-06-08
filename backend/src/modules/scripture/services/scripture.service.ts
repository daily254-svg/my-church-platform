import { localBibleService } from "./local-bible.service";
import { apiBibleService } from "./api-bible.service";

export interface ScriptureResult {
  reference: string;
  text: string;
  book?: string;
  chapter?: number;
  verse?: number;
  version?: string;
  source: "local" | "api-bible";
}

// Versions served from local JSON files
const LOCAL_VERSIONS = new Set(["kjv", "nkjv", "web"]);

class ScriptureService {
  private currentVersion: string = "kjv";

  /**
   * Set the default Bible version for queries
   */
  setDefaultVersion(version: string): boolean {
    const lowerVersion = version.toLowerCase();
    if (LOCAL_VERSIONS.has(lowerVersion)) {
      this.currentVersion = lowerVersion;
      return true;
    }
    return false;
  }

  /**
   * Get the current default Bible version
   */
  getDefaultVersion(): string {
    return this.currentVersion;
  }

  /**
   * Get available Bible versions
   */
  getAvailableVersions(): string[] {
    return localBibleService.getLoadedVersions();
  }

  /**
   * Normalize version string
   */
  private normalizeVersion(version: string): string {
    return version.toLowerCase();
  }

  private looksLikeReference(query: string): boolean {
    return /^[\w\s]+\s+\d+[\s:]\d+/.test(query.trim());
  }

  async getScripture(
    reference: string,
    preferredSource: "local" | "api-bible" | "any" = "any",
    version?: string
  ): Promise<ScriptureResult[]> {
    const useVersion = version ? this.normalizeVersion(version) : this.currentVersion;
    const useLocal = LOCAL_VERSIONS.has(useVersion);

    // Local path
    if (useLocal && preferredSource !== "api-bible") {
      const localResult = localBibleService.getScripture(reference, useVersion);
      if (localResult && localResult.length > 0) {
        return localResult.map((v) => ({
          reference: v.reference,
          text: v.text,
          book: v.book,
          chapter: v.chapter,
          verse: v.verse,
          version: useVersion.toUpperCase(),
          source: "local" as const,
        }));
      }
    }

    // api.bible path
    if (!useLocal || preferredSource === "api-bible" || preferredSource === "any") {
      try {
        const result = await apiBibleService.getScripture(reference);
        if (result) {
          return [{
            reference: result.reference,
            text: result.text,
            version: "API",
            source: "api-bible",
          }];
        }
      } catch (error) {
        console.error("[Scripture] api.bible lookup failed:", error);
      }
    }

    return [];
  }

  async searchScriptures(
    query: string,
    preferredSource: "local" | "api-bible" | "any" = "any",
    limit: number = 20,
    version?: string
  ): Promise<ScriptureResult[]> {
    const useVersion = version ? this.normalizeVersion(version) : this.currentVersion;
    const useLocal = LOCAL_VERSIONS.has(useVersion);

    console.log(`[DEBUG] searchScriptures called: query="${query}", source="${preferredSource}", version="${useVersion}"`);

    // Reference detection
    if (this.looksLikeReference(query)) {
      console.log(`[Scripture] Query looks like a reference, routing to getScripture`);
      const normalized = query.trim().replace(/^([\w\s]+?)\s+(\d+)\s+(\d+)$/, "$1 $2:$3");
      const refResults = await this.getScripture(normalized, preferredSource, useVersion);
      if (refResults.length > 0) return refResults;
      console.log(`[Scripture] Reference lookup failed, falling back to keyword search`);
    }

    // Local path
    if (useLocal && (preferredSource === "local" || preferredSource === "any")) {
      const localResults = localBibleService.searchScriptures(query, limit, useVersion);
      console.log(`[Scripture] Local results count: ${localResults.length}`);
      
      if (localResults.length > 0 || preferredSource === "local") {
        return localResults.map((v) => ({
          reference: v.reference,
          text: v.text,
          book: v.book,
          chapter: v.chapter,
          verse: v.verse,
          version: useVersion.toUpperCase(),
          source: "local" as const,
        }));
      }
    }

    // api.bible path
    if (!useLocal || preferredSource === "api-bible" || preferredSource === "any") {
      console.log("[Scripture] Trying api.bible...");
      try {
        const result = await apiBibleService.searchScriptures(query, limit);
        if (result && result.passages.length > 0) {
          return result.passages.slice(0, limit).map((p) => ({
            reference: p.reference,
            text: p.text,
            version: "API",
            source: "api-bible" as const,
          }));
        }
      } catch (error) {
        console.error("[Scripture] api.bible search failed:", error);
      }

      // api-bible was explicitly chosen but failed — fall back to local gracefully
      if (preferredSource === "api-bible") {
        const fallback = localBibleService.searchScriptures(query, limit, useVersion);
        return fallback.map((v) => ({
          reference: v.reference,
          text: v.text,
          book: v.book,
          chapter: v.chapter,
          verse: v.verse,
          version: useVersion.toUpperCase(),
          source: "local" as const,
        }));
      }
    }

    console.log("[Scripture] No results found, returning empty array");
    return [];
  }

  /**
   * Compare a scripture reference across all available local versions
   */
  async compareVersions(reference: string): Promise<{
    reference: string;
    versions: { version: string; text: string; source: "local" | "api-bible" }[];
  } | null> {
    const loadedVersions = localBibleService.getLoadedVersions();
    
    if (loadedVersions.length === 0) return null;

    const versions = loadedVersions
      .map(version => {
        const result = localBibleService.getScripture(reference, version);
        return {
          version: version.toUpperCase(),
          text: result && result.length > 0 ? result[0].text : null,
          source: "local" as const,
        };
      })
      .filter(v => v.text !== null)
      .map(v => ({
        version: v.version,
        text: v.text!,
        source: v.source,
      }));

    return versions.length > 0 ? { reference, versions } : null;
  }

  getBooks(version?: string): { name: string; abbrev: string; chapters: number }[] {
    const useVersion = version ? this.normalizeVersion(version) : this.currentVersion;
    return localBibleService.getBooks(useVersion);
  }

  getBook(bookName: string, version?: string): { name: string; abbrev: string; chapters: number } | null {
    const useVersion = version ? this.normalizeVersion(version) : this.currentVersion;
    return localBibleService.getBook(bookName, useVersion);
  }

  getChapterVerseCount(bookName: string, chapter: number, version?: string): number | null {
    const useVersion = version ? this.normalizeVersion(version) : this.currentVersion;
    return localBibleService.getChapterVerseCount(bookName, chapter, useVersion);
  }

  async initialize(): Promise<void> {
    try {
      // Load all available versions
      await localBibleService.initializeAll();
      const versions = this.getAvailableVersions();
      console.log(`[Scripture] Initialized with versions: ${versions.join(", ")}`);
    } catch (error) {
      console.error("[Scripture] Failed to initialize service:", error);
      throw error;
    }
  }
}

export const scriptureService = new ScriptureService();