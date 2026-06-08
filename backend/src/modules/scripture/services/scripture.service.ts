import { localBibleService, ScriptureVerse } from "./local-bible.service";

export interface ScriptureResult {
  reference: string;
  text: string;
  book?: string;
  chapter?: number;
  verse?: number;
  version: string;
  source: "local";
}

// All versions served from local JSON files
const LOCAL_VERSIONS = new Set(["kjv", "nkjv", "amp", "niv", "esv", "nlt", "nasb1995", "csb"]);

class ScriptureService {
  private defaultVersion: string = "kjv";

  // ── Helpers ───────────────────────────────────────────────────────────────

  private normalize(version: string): string {
    return version.toLowerCase();
  }

  private resolveVersion(version?: string): string {
    return version ? this.normalize(version) : this.defaultVersion;
  }

  private toResult(v: ScriptureVerse, version: string): ScriptureResult {
    return {
      reference: v.reference,
      text:      v.text,
      book:      v.book,
      chapter:   v.chapter,
      verse:     v.verse,
      version:   version.toUpperCase(),
      source:    "local",
    };
  }

  /** Returns true if the query looks like a Bible reference ("John 3:16", "Rom 8 1") */
  private looksLikeReference(query: string): boolean {
    return /^[\w\s]+\s+\d+[\s:]\d+/.test(query.trim());
  }

  // ── Public API ────────────────────────────────────────────────────────────

  getAvailableVersions(): string[] {
    return localBibleService.getLoadedVersions();
  }

  getDefaultVersion(): string {
    return this.defaultVersion;
  }

  setDefaultVersion(version: string): boolean {
    const v = this.normalize(version);
    if (!LOCAL_VERSIONS.has(v)) return false;
    this.defaultVersion = v;
    return true;
  }

  async getScripture(reference: string, version?: string): Promise<ScriptureResult[]> {
    const v = this.resolveVersion(version);

    if (!localBibleService.isLoaded(v)) {
      console.warn(`[Scripture] Version not loaded: ${v}`);
      return [];
    }

    const results = localBibleService.getScripture(reference, v);
    if (!results || results.length === 0) return [];

    return results.map((r) => this.toResult(r, v));
  }

  async searchScriptures(
    query:   string,
    limit:   number = 20,
    version?: string
  ): Promise<ScriptureResult[]> {
    const v = this.resolveVersion(version);

    if (!localBibleService.isLoaded(v)) {
      console.warn(`[Scripture] Version not loaded: ${v}`);
      return [];
    }

    // Route reference-like queries to getScripture for exact lookup
    if (this.looksLikeReference(query)) {
      const normalized = query.trim().replace(/^([\w\s]+?)\s+(\d+)\s+(\d+)$/, "$1 $2:$3");
      const refResults = await this.getScripture(normalized, v);
      if (refResults.length > 0) return refResults;
      // Fall through to keyword search if reference lookup fails
    }

    const results = localBibleService.searchScriptures(query, limit, v);
    return results.map((r) => this.toResult(r, v));
  }

  async compareVersions(reference: string): Promise<{
    reference: string;
    versions: { version: string; text: string; source: "local" }[];
  } | null> {
    const loaded = localBibleService.getLoadedVersions();
    if (loaded.length === 0) return null;

    const versions = loaded
      .map((v) => {
        const result = localBibleService.getScripture(reference, v);
        return {
          version: v.toUpperCase(),
          text:    result?.[0]?.text ?? null,
          source:  "local" as const,
        };
      })
      .filter((v): v is { version: string; text: string; source: "local" } => v.text !== null);

    return versions.length > 0 ? { reference, versions } : null;
  }

  getBooks(version?: string): { name: string; abbrev: string; chapters: number }[] {
    return localBibleService.getBooks(this.resolveVersion(version));
  }

  getBook(bookName: string, version?: string): { name: string; abbrev: string; chapters: number } | null {
    return localBibleService.getBook(bookName, this.resolveVersion(version));
  }

  getChapterVerseCount(bookName: string, chapter: number, version?: string): number | null {
    return localBibleService.getChapterVerseCount(bookName, chapter, this.resolveVersion(version));
  }

  async initialize(): Promise<void> {
    await localBibleService.initializeAll();
    const loaded = this.getAvailableVersions();
    console.log(`[Scripture] Service ready — versions: ${loaded.join(", ") || "none"}`);
  }
}

export const scriptureService = new ScriptureService();