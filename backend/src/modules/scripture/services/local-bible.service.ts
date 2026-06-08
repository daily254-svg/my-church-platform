import fs from "fs";
import path from "path";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface BibleBook {
  abbrev: string;
  name: string;
  /** chapters[i][j] = verse text (0-indexed) */
  chapters: string[][];
}

export interface ScriptureVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  reference: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Canonical book list — used to derive abbreviations + ordering for both
// Format A (array) and Format C (object-keyed) Bibles
// ─────────────────────────────────────────────────────────────────────────────

const BOOK_ABBREVS: Record<string, string> = {
  Genesis: "gen", Exodus: "exo", Leviticus: "lev", Numbers: "num",
  Deuteronomy: "deu", Joshua: "jos", Judges: "jdg", Ruth: "rut",
  "1 Samuel": "1sa", "2 Samuel": "2sa", "1 Kings": "1ki", "2 Kings": "2ki",
  "1 Chronicles": "1ch", "2 Chronicles": "2ch", Ezra: "ezr", Nehemiah: "neh",
  Esther: "est", Job: "job", Psalms: "psa", Proverbs: "pro",
  Ecclesiastes: "ecc", "Song of Solomon": "sng", Isaiah: "isa",
  Jeremiah: "jer", Lamentations: "lam", Ezekiel: "ezk", Daniel: "dan",
  Hosea: "hos", Joel: "jol", Amos: "amo", Obadiah: "oba", Jonah: "jon",
  Micah: "mic", Nahum: "nam", Habakkuk: "hab", Zephaniah: "zep",
  Haggai: "hag", Zechariah: "zec", Malachi: "mal",
  Matthew: "mat", Mark: "mrk", Luke: "luk", John: "jhn", Acts: "act",
  Romans: "rom", "1 Corinthians": "1co", "2 Corinthians": "2co",
  Galatians: "gal", Ephesians: "eph", Philippians: "php", Colossians: "col",
  "1 Thessalonians": "1th", "2 Thessalonians": "2th",
  "1 Timothy": "1ti", "2 Timothy": "2ti", Titus: "tit", Philemon: "phm",
  Hebrews: "heb", James: "jas", "1 Peter": "1pe", "2 Peter": "2pe",
  "1 John": "1jn", "2 John": "2jn", "3 John": "3jn", Jude: "jud",
  Revelation: "rev",
};

// ─────────────────────────────────────────────────────────────────────────────
// Version → filename map
// Add future versions here — service will skip gracefully if file is absent
// ─────────────────────────────────────────────────────────────────────────────

const VERSION_FILES: Record<string, string> = {
  kjv:      "kjv.json",
  nkjv:     "NKJV_bible.json",
  amp:      "AMP_bible.json",
  niv:      "NIV_bible.json",
  esv:      "ESV_bible.json",
  nlt:      "NLT_bible.json",
  nasb1995: "NASB1995_bible.json",
  csb:      "CSB_bible.json",
};

// ─────────────────────────────────────────────────────────────────────────────
// Normalizers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format A — KJV-style: top-level array of books
 * Each book: { abbrev, name, chapters: string[][] }
 */
function normalizeFormatA(raw: any[]): BibleBook[] {
  return raw
    .filter((b) => b && typeof b === "object" && Array.isArray(b.chapters))
    .map((b) => ({
      name: String(b.name ?? ""),
      abbrev: String(b.abbrev ?? "").toLowerCase(),
      chapters: (b.chapters as any[][]).map((ch) =>
        Array.isArray(ch)
          ? ch.map((v) => (typeof v === "string" ? v.replace(/[{}]/g, "").trim() : ""))
          : []
      ),
    }));
}

/**
 * Format B — WEB-style: { books: [ { englishName, book, chapters: [{ verses: [{number,text}] }] } ] }
 */
function normalizeFormatB(books: any[]): BibleBook[] {
  return books
    .filter((b) => b && typeof b === "object")
    .map((b) => {
      const normalizedChapters: string[][] = (b.chapters ?? []).map((ch: any) =>
        (ch.verses ?? [])
          .sort((a: any, z: any) => a.number - z.number)
          .map((v: any) => String(v.text ?? "").replace(/[{}]/g, "").trim())
      );
      const name: string = b.englishName ?? b.name ?? b.book ?? "";
      const abbrev: string = (
        b.book ?? b.abbrev ?? b.abbreviation ?? BOOK_ABBREVS[name] ?? name.slice(0, 3)
      ).toLowerCase();
      return { name, abbrev, chapters: normalizedChapters };
    });
}

/**
 * Format C — NKJV-style: top-level keyed object
 * { "Genesis": { "1": { "1": "text", "2": "text" }, "2": { ... } }, ... }
 */
function normalizeFormatC(raw: Record<string, any>): BibleBook[] {
  return Object.entries(raw).map(([bookName, chaptersObj]) => {
    const chapters: string[][] = Object.keys(chaptersObj)
      .map(Number)
      .sort((a, b) => a - b)
      .map((chNum) => {
        const versesObj: Record<string, string> = chaptersObj[String(chNum)] ?? {};
        return Object.keys(versesObj)
          .map(Number)
          .sort((a, b) => a - b)
          .map((vNum) =>
            String(versesObj[String(vNum)] ?? "")
              .replace(/[{}]/g, "")
              .trim()
          );
      });

    const abbrev = (BOOK_ABBREVS[bookName] ?? bookName.slice(0, 3)).toLowerCase();

    return { name: bookName, abbrev, chapters };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

class LocalBibleService {
  private bibleData: Map<string, BibleBook[]> = new Map();
  private bookMaps:  Map<string, Map<string, BibleBook>> = new Map();
  private loaded:    Set<string> = new Set();

  // ── Initialization ────────────────────────────────────────────────────────

  async initialize(version: string): Promise<void> {
    if (this.loaded.has(version)) return;

    const fileName = VERSION_FILES[version];
    if (!fileName) {
      console.warn(`[Scripture] No file registered for version: ${version}`);
      return;
    }

    // Root of the project (four levels up from src/modules/scripture/services/)
    const biblePath = path.join(__dirname, "../../../..", fileName);

    if (!fs.existsSync(biblePath)) {
      console.warn(`[Scripture] File not found for ${version}: ${biblePath}`);
      return;
    }

    try {
      let data = fs.readFileSync(biblePath, "utf-8");
      if (data.charCodeAt(0) === 0xfeff) data = data.slice(1); // strip BOM
      data = data.trimStart();

      const raw = JSON.parse(data);
      let books: BibleBook[];

      if (Array.isArray(raw)) {
        // Format A or B (array root)
        const first = raw[0];
        if (first?.chapters?.[0]?.verses !== undefined) {
          // Format B — WEB
          books = normalizeFormatB(raw);
          console.log(`[Scripture] ${version.toUpperCase()}: Format B (WEB-style array)`);
        } else {
          // Format A — KJV
          books = normalizeFormatA(raw);
          console.log(`[Scripture] ${version.toUpperCase()}: Format A (KJV-style array)`);
        }
      } else if (raw && typeof raw === "object") {
        if (raw.books && Array.isArray(raw.books)) {
          // Format B wrapped in object
          books = normalizeFormatB(raw.books);
          console.log(`[Scripture] ${version.toUpperCase()}: Format B (wrapped object)`);
        } else {
          // Format C — NKJV / ESV / NLT / NASB / CSB
          books = normalizeFormatC(raw as Record<string, any>);
          console.log(`[Scripture] ${version.toUpperCase()}: Format C (keyed object)`);
        }
      } else {
        throw new Error(`Unrecognized JSON structure for ${version}`);
      }

      // Validate
      if (books.length === 0) throw new Error(`No books parsed for ${version}`);

      // Build lookup map
      const bookMap = new Map<string, BibleBook>();
      let valid = 0;
      for (const book of books) {
        if (!book.name || !book.abbrev || !Array.isArray(book.chapters)) continue;
        bookMap.set(book.name.toLowerCase(), book);
        bookMap.set(book.abbrev.toLowerCase(), book);
        valid++;
      }

      if (valid === 0) throw new Error(`No valid books after normalization for ${version}`);

      this.bibleData.set(version, books);
      this.bookMaps.set(version, bookMap);
      this.loaded.add(version);

      console.log(`[Scripture] Loaded ${version.toUpperCase()}: ${valid} books`);
    } catch (err) {
      console.error(`[Scripture] Failed to load ${version}:`, err);
      // Don't throw — let other versions continue loading
    }
  }

  async initializeAll(): Promise<void> {
    const versions = Object.keys(VERSION_FILES);
    await Promise.allSettled(versions.map((v) => this.initialize(v)));
    console.log(
      `[Scripture] Ready — loaded: ${Array.from(this.loaded).join(", ") || "none"}`
    );
  }

  isLoaded(version: string): boolean {
    return this.loaded.has(version);
  }

  getLoadedVersions(): string[] {
    return Array.from(this.loaded);
  }

  // ── Reference parser ──────────────────────────────────────────────────────

  private parseReference(reference: string): {
    bookName: string;
    chapters: number[];
    verses: Record<number, number[]>;
  } | null {
    const trimmed = reference.trim();

    // Whole chapter: "John 3"
    const chapterOnly = trimmed.match(/^([\w\s]+?)\s+(\d+)$/);
    if (chapterOnly) {
      const chapterNum = parseInt(chapterOnly[2], 10);
      if (chapterNum < 1) return null;
      return {
        bookName: chapterOnly[1].trim(),
        chapters: [chapterNum],
        verses: { [chapterNum]: Array.from({ length: 200 }, (_, i) => i + 1) },
      };
    }

    // Normalise "Genesis 1 2" → "Genesis 1:2"
    const norm = trimmed.replace(/^([\w\s]+?)\s+(\d+)\s+(\d+)$/, "$1 $2:$3").trim();

    // "Book Ch:V" or "Book Ch:V-V" or "Book Ch:V-Ch:V"
    const match = norm.match(/^([\w\s]+?)\s+(\d+):(\d+)(?:-(?:(\d+):)?(\d+))?$/);
    if (!match) return null;

    const [, bookName, ch, v, endCh, endV] = match;
    const startChapter = parseInt(ch, 10);
    const startVerse   = parseInt(v, 10);
    const endChapter   = endCh ? parseInt(endCh, 10) : startChapter;
    const endVerse     = endV  ? parseInt(endV, 10)  : startVerse;

    if (startChapter < 1 || startVerse < 1 || endChapter < startChapter) return null;

    const chapters: number[] = [];
    const verses: Record<number, number[]> = {};
    for (let c = startChapter; c <= endChapter; c++) {
      chapters.push(c);
      const vStart = c === startChapter ? startVerse : 1;
      const vEnd   = c === endChapter   ? endVerse   : 999;
      verses[c] = Array.from({ length: vEnd - vStart + 1 }, (_, i) => vStart + i);
    }

    return { bookName: bookName.trim(), chapters, verses };
  }

  // ── Book finder ───────────────────────────────────────────────────────────

  private findBook(bookName: string, version: string): BibleBook | null {
    const bookMap = this.bookMaps.get(version);
    if (!bookMap) return null;

    const normalized = bookName.toLowerCase().trim();

    // Exact match (name or abbrev)
    if (bookMap.has(normalized)) return bookMap.get(normalized)!;

    // Prefix match
    for (const book of bookMap.values()) {
      if (
        book.name.toLowerCase().startsWith(normalized) ||
        book.abbrev.toLowerCase().startsWith(normalized)
      ) {
        return book;
      }
    }

    return null;
  }

  // ── Public API ────────────────────────────────────────────────────────────

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

    for (const chapterNum of parsed.chapters) {
      const chapter = book.chapters[chapterNum - 1];
      if (!chapter) continue;
      for (const verseNum of parsed.verses[chapterNum]) {
        const text = chapter[verseNum - 1];
        if (text) {
          results.push({
            book:      book.name,
            chapter:   chapterNum,
            verse:     verseNum,
            text,
            reference: `${book.name} ${chapterNum}:${verseNum}`,
          });
        }
      }
    }

    return results.length > 0 ? results : null;
  }

  searchScriptures(query: string, limit: number = 20, version: string = "kjv"): ScriptureVerse[] {
    if (!this.loaded.has(version)) return [];

    const data     = this.bibleData.get(version)!;
    const keywords = query
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter((k) => k.length > 2);

    if (keywords.length === 0) return [];

    // Book-name query → return first chapter
    const matchedBook = this.findBook(query.trim(), version);
    if (matchedBook) {
      const results: ScriptureVerse[] = [];
      for (let i = 0; i < (matchedBook.chapters[0]?.length ?? 0) && results.length < limit; i++) {
        const text = matchedBook.chapters[0][i];
        if (text) {
          results.push({
            book: matchedBook.name, chapter: 1, verse: i + 1, text,
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
          const text = book.chapters[ci][vi];
          if (text && keywords.some((kw) => text.toLowerCase().includes(kw))) {
            results.push({
              book: book.name, chapter: ci + 1, verse: vi + 1, text,
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
    return (this.bibleData.get(version) ?? []).map((b) => ({
      name:     b.name,
      abbrev:   b.abbrev,
      chapters: b.chapters.length,
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

  reset(): void {
    this.bibleData.clear();
    this.bookMaps.clear();
    this.loaded.clear();
    console.log("[Scripture] All Bible data cleared");
  }
}

export const localBibleService = new LocalBibleService();