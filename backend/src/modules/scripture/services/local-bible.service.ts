import fs from "fs";
import path from "path";

interface BibleBook {
  abbrev: string;
  name: string;
  chapters: string[][];
}

interface ScriptureVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  reference: string;
}

// Map version key to its JSON filename
const VERSION_FILES: Record<string, string> = {
  kjv:  "kjv.json",
  nkjv: "nkjv.json",
  web:  "web.json",
};

class LocalBibleService {
  private bibleData:  Map<string, BibleBook[]>            = new Map();
  private bookMaps:   Map<string, Map<string, BibleBook>> = new Map();
  private loaded:     Set<string>                         = new Set();

  // ── Normalizer for different Bible JSON formats ─────────────────────────
  
  /**
   * Normalize various Bible JSON formats into the standard BibleBook interface
   */
  private normalizeBooks(books: any[]): BibleBook[] {
    return books.map((book) => {
      // Already correct format (KJV/NKJV): chapters is array of arrays of strings
      if (Array.isArray(book.chapters) && book.chapters.length > 0 && typeof book.chapters[0]?.[0] === 'string') {
        return book as BibleBook;
      }

      // WEB format: { book, bookId, englishName, testament, chapters: [{ chapter, verses: [{number, text}] }] }
      if (Array.isArray(book.chapters) && book.chapters[0]?.verses) {
        const normalizedChapters: string[][] = book.chapters.map((ch: any) =>
          ch.verses
            .sort((a: any, b: any) => a.number - b.number)
            .map((v: any) => v.text as string)
        );

        return {
          name:     book.englishName ?? book.name ?? book.book ?? "",
          abbrev:   book.book?.toLowerCase() ?? book.abbrev?.toLowerCase() ?? book.abbreviation?.toLowerCase() ?? "",
          chapters: normalizedChapters,
        } as BibleBook;
      }

      // Fallback: return as-is (might fail validation later)
      console.warn(`[Scripture] Unknown book format for: ${book.englishName || book.name || book.book || 'unknown'}`);
      return book as BibleBook;
    });
  }

  // ── Initialization ──────────────────────────────────────────────────────

  async initialize(version: string = "kjv"): Promise<void> {
    if (this.loaded.has(version)) return;

    const fileName = VERSION_FILES[version];
    if (!fileName) {
      console.warn(`[Scripture] No local file registered for version: ${version}`);
      return;
    }

    const biblePath = path.join(__dirname, "../../../..", fileName);

    if (!fs.existsSync(biblePath)) {
      console.warn(`[Scripture] File not found for version ${version}: ${biblePath}`);
      return;
    }

    try {
      let data = fs.readFileSync(biblePath, "utf-8");

      // Strip BOM if present
      if (data.charCodeAt(0) === 0xFEFF) data = data.slice(1);
      data = data.trimStart();

      // Validate JSON structure before parsing
      if (!data.startsWith("[") && !data.startsWith("{")) {
        throw new Error(`Invalid format for ${version}. Starts with: ${data.substring(0, 50)}`);
      }

      const raw = JSON.parse(data);

      // Support both top-level formats:
      // Format A (array):  [ { abbrev, name, chapters }, ... ]
      // Format B (object): { version, name, books: [ { ... }, ... ] }
      let parsed: BibleBook[];
      
      if (Array.isArray(raw)) {
        // Format A: Direct array of books (e.g., KJV format)
        parsed = raw;
        console.log(`[Scripture] Detected Format A (array) for ${version}`);
      } else if (raw && typeof raw === 'object' && raw.books && Array.isArray(raw.books)) {
        // Format B: Object with books array (e.g., WEB format)
        parsed = raw.books;
        console.log(`[Scripture] Detected Format B (object) for ${version}`);
        
        // Log version metadata if available
        if (raw.version) {
          console.log(`[Scripture] Version info: ${raw.version}${raw.name ? ` - ${raw.name}` : ''}`);
        }
      } else {
        throw new Error(`Unrecognized format for ${version}. Expected array or object with 'books' array`);
      }

      // Normalize all books to standard BibleBook format
      const normalized = this.normalizeBooks(parsed);
      
      // Validate normalized data
      if (!Array.isArray(normalized)) {
        throw new Error(`Bible data for ${version} is not an array after normalization`);
      }

      if (normalized.length === 0) {
        throw new Error(`Bible data for ${version} is empty`);
      }

      // Create book lookup map
      const bookMap = new Map<string, BibleBook>();
      let validBookCount = 0;
      
      normalized.forEach((book, index) => {
        // Validate book structure
        if (!book.name || !book.abbrev || !Array.isArray(book.chapters)) {
          console.warn(`[Scripture] Skipping invalid book at index ${index} in ${version}:`, {
            hasName: !!book.name,
            hasAbbrev: !!book.abbrev,
            hasChapters: Array.isArray(book.chapters),
          });
          return;
        }
        
        bookMap.set(book.name.toLowerCase(), book);
        bookMap.set(book.abbrev.toLowerCase(), book);
        validBookCount++;
      });

      if (validBookCount === 0) {
        throw new Error(`No valid books found in ${version} data`);
      }

      // Store the normalized data
      this.bibleData.set(version, normalized);
      this.bookMaps.set(version, bookMap);
      this.loaded.add(version);

      console.log(`[Scripture] Loaded ${version.toUpperCase()}: ${validBookCount} valid books (${normalized.length} total entries)`);
      
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error(`[Scripture] JSON parse error for ${version}:`, error.message);
      } else {
        console.error(`[Scripture] Failed to load ${version}:`, error);
      }
      // Don't throw - allow other versions to load
    }
  }

  async initializeAll(): Promise<void> {
    const versions = Object.keys(VERSION_FILES);
    console.log(`[Scripture] Initializing ${versions.length} versions: ${versions.join(", ")}`);
    
    const results = await Promise.allSettled(
      versions.map((v) => this.initialize(v))
    );
    
    // Log results
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`[Scripture] Failed to initialize ${versions[index]}:`, result.reason);
      }
    });
    
    const loadedCount = this.loaded.size;
    console.log(`[Scripture] Successfully loaded ${loadedCount}/${versions.length} versions`);
  }

  isLoaded(version: string = "kjv"): boolean {
    return this.loaded.has(version);
  }

  getLoadedVersions(): string[] {
    return Array.from(this.loaded);
  }

  // ── Internal helpers ────────────────────────────────────────────────────

  private parseReference(reference: string): {
    bookName: string;
    chapters: number[];
    verses: { [key: number]: number[] };
  } | null {
    const trimmed = reference.trim();

    // Whole-chapter: "John 3"
    const chapterOnly = trimmed.match(/^([\w\s]+?)\s+(\d+)$/);
    if (chapterOnly) {
      const [, bookName, chapter] = chapterOnly;
      const chapterNum = parseInt(chapter, 10);
      if (chapterNum < 1) return null;
      return {
        bookName: bookName.trim(),
        chapters: [chapterNum],
        verses: { [chapterNum]: Array.from({ length: 200 }, (_, i) => i + 1) },
      };
    }

    // Normalize "Genesis 1 2" → "Genesis 1:2"
    const normalized = trimmed
      .replace(/^([\w\s]+?)\s+(\d+)\s+(\d+)$/, "$1 $2:$3")
      .trim();

    const match = normalized.match(
      /^([\w\s]+?)\s+(\d+):(\d+)(?:-(?:(\d+):)?(\d+))?$/
    );
    if (!match) return null;

    const [, bookName, chapter, verse, endChapter, endVerse] = match;
    const startChapter   = parseInt(chapter, 10);
    const startVerse     = parseInt(verse, 10);
    const endChapterNum  = endChapter ? parseInt(endChapter, 10) : startChapter;
    const endVerseNum    = endVerse   ? parseInt(endVerse, 10)   : startVerse;

    if (startChapter < 1 || startVerse < 1 || endChapterNum < startChapter) return null;

    const chapters: number[] = [];
    const verses: { [key: number]: number[] } = {};

    for (let c = startChapter; c <= endChapterNum; c++) {
      chapters.push(c);
      const vStart = c === startChapter ? startVerse : 1;
      const vEnd   = c === endChapterNum ? endVerseNum : 999;
      verses[c] = [];
      for (let v = vStart; v <= vEnd; v++) verses[c].push(v);
    }

    return { bookName: bookName.trim(), chapters, verses };
  }

  private findBook(bookName: string, version: string = "kjv"): BibleBook | null {
    const bookMap = this.bookMaps.get(version);
    if (!bookMap) return null;

    const normalized = bookName.toLowerCase();

    // Direct match
    if (bookMap.has(normalized)) return bookMap.get(normalized)!;

    // Prefix match (e.g., "Rom" matches "Romans")
    for (const [, book] of bookMap) {
      if (
        book.name.toLowerCase().startsWith(normalized) ||
        book.abbrev.toLowerCase().startsWith(normalized)
      ) {
        return book;
      }
    }

    return null;
  }

  // ── Public API ──────────────────────────────────────────────────────────

  getScripture(reference: string, version: string = "kjv"): ScriptureVerse[] | null {
    if (!this.loaded.has(version)) {
      console.warn(`[Scripture] Version not loaded: ${version}`);
      return null;
    }

    const parsed = this.parseReference(reference);
    if (!parsed) return null;

    const book = this.findBook(parsed.bookName, version);
    if (!book) return null;

    const results: ScriptureVerse[] = [];

    parsed.chapters.forEach((chapterNum) => {
      const chapterIdx = chapterNum - 1;
      if (!book.chapters[chapterIdx]) return;

      parsed.verses[chapterNum].forEach((verseNum) => {
        const text = book.chapters[chapterIdx][verseNum - 1];
        if (text) {
          results.push({
            book:      book.name,
            chapter:   chapterNum,
            verse:     verseNum,
            text:      text.replace(/[{}]/g, ""),
            reference: `${book.name} ${chapterNum}:${verseNum}`,
          });
        }
      });
    });

    return results.length > 0 ? results : null;
  }

  searchScriptures(query: string, limit: number = 20, version: string = "kjv"): ScriptureVerse[] {
    if (!this.loaded.has(version)) return [];

    const data       = this.bibleData.get(version)!;
    const normalized = query.toLowerCase().trim();
    const keywords   = normalized.split(/\s+/).filter((k) => k.length > 2);
    if (keywords.length === 0) return [];

    // Book-name search → return first chapter
    const matchedBook = this.findBook(normalized, version);
    if (matchedBook) {
      const results: ScriptureVerse[] = [];
      const firstChapter = matchedBook.chapters[0] ?? [];
      for (let i = 0; i < firstChapter.length && results.length < limit; i++) {
        const text = firstChapter[i];
        if (text) {
          results.push({
            book: matchedBook.name, chapter: 1, verse: i + 1,
            text: text.replace(/[{}]/g, ""),
            reference: `${matchedBook.name} 1:${i + 1}`,
          });
        }
      }
      return results;
    }

    // Full-text keyword search
    const results: ScriptureVerse[] = [];

    outer: for (const book of data) {
      for (let ci = 0; ci < book.chapters.length; ci++) {
        for (let vi = 0; vi < book.chapters[ci].length; vi++) {
          const verse = book.chapters[ci][vi];
          if (keywords.some((kw) => verse.toLowerCase().includes(kw))) {
            results.push({
              book: book.name, chapter: ci + 1, verse: vi + 1,
              text: verse.replace(/[{}]/g, ""),
              reference: `${book.name} ${ci + 1}:${vi + 1}`,
            });
            if (results.length >= limit) break outer;
          }
        }
      }
    }

    return results;
  }

  getBooks(version: string = "kjv"): { name: string; abbrev: string; chapters: number }[] {
    if (!this.loaded.has(version)) return [];
    return (this.bibleData.get(version) ?? []).map((book) => ({
      name:     book.name,
      abbrev:   book.abbrev,
      chapters: book.chapters.length,
    }));
  }

  getBook(bookName: string, version: string = "kjv"): { name: string; abbrev: string; chapters: number } | null {
    if (!this.loaded.has(version)) return null;
    const book = this.findBook(bookName, version);
    if (!book) return null;
    return { name: book.name, abbrev: book.abbrev, chapters: book.chapters.length };
  }

  getChapterVerseCount(bookName: string, chapter: number, version: string = "kjv"): number | null {
    if (!this.loaded.has(version)) return null;
    const book = this.findBook(bookName, version);
    if (!book) return null;
    return book.chapters[chapter - 1]?.length ?? null;
  }

  /**
   * Get version metadata if available
   */
  getVersionInfo(version: string = "kjv"): { version: string; name?: string; bookCount: number } | null {
    if (!this.loaded.has(version)) return null;
    const data = this.bibleData.get(version);
    if (!data) return null;
    
    return {
      version: version,
      bookCount: data.length,
    };
  }

  reset(): void {
    this.bibleData.clear();
    this.bookMaps.clear();
    this.loaded.clear();
    console.log("[Scripture] All Bible data cleared");
  }
}

export const localBibleService = new LocalBibleService();