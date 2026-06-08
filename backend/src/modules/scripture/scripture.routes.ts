import { Router, Request, Response } from "express";
import { scriptureService } from "./services/scripture.service";
import {
  validate,
  scriptureSearchSchema,
  scriptureReferenceSchema,
  scriptureCompareSchema,
  scriptureVerseCountSchema,
  scriptureBooksSchema,
} from "./validators/scripture.validators";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /scripture/versions
// List all supported versions and their load status
// ─────────────────────────────────────────────────────────────────────────────

router.get("/versions", (_req: Request, res: Response) => {
  const loaded = new Set(scriptureService.getAvailableVersions());

  const ALL: { id: string; abbreviation: string; name: string }[] = [
    { id: "kjv",      abbreviation: "KJV",      name: "King James Version"               },
    { id: "nkjv",     abbreviation: "NKJV",     name: "New King James Version"           },
    { id: "amp",      abbreviation: "AMP",      name: "Amplified Bible"                  },
    { id: "niv",      abbreviation: "NIV",      name: "New International Version"        },
    { id: "esv",      abbreviation: "ESV",      name: "English Standard Version"         },
    { id: "nlt",      abbreviation: "NLT",      name: "New Living Translation"           },
    { id: "nasb1995", abbreviation: "NASB1995", name: "New American Standard Bible 1995" },
    { id: "csb",      abbreviation: "CSB",      name: "Christian Standard Bible"         },
  ];

  const versions = ALL.map((v) => ({ ...v, available: loaded.has(v.id) }));

  return res.json({
    success: true,
    count:   versions.filter((v) => v.available).length,
    versions,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /scripture/search?query=love&version=kjv&limit=20
// ─────────────────────────────────────────────────────────────────────────────

router.get("/search", async (req: Request, res: Response) => {
  try {
    const { query, version, limit } = validate(scriptureSearchSchema, req.query);

    const results = await scriptureService.searchScriptures(query, limit, version);

    return res.json({
      success: true,
      query,
      version: version.toUpperCase(),
      count:   results.length,
      results,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Search failed";
    return res.status(400).json({ success: false, error: msg });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /scripture/get?reference=John+3:16&version=kjv
// ─────────────────────────────────────────────────────────────────────────────

router.get("/get", async (req: Request, res: Response) => {
  try {
    const { reference, version } = validate(scriptureReferenceSchema, req.query);

    const results = await scriptureService.getScripture(reference, version);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        error:   `Scripture not found: "${reference}" in ${version.toUpperCase()}`,
      });
    }

    return res.json({
      success:   true,
      reference,
      version:   version.toUpperCase(),
      count:     results.length,
      results,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Lookup failed";
    return res.status(400).json({ success: false, error: msg });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /scripture/compare?reference=John+3:16
// Compare a verse across all loaded versions
// ─────────────────────────────────────────────────────────────────────────────

router.get("/compare", async (req: Request, res: Response) => {
  try {
    const { reference } = validate(scriptureCompareSchema, req.query);

    const comparison = await scriptureService.compareVersions(reference);

    if (!comparison) {
      return res.status(404).json({
        success: false,
        error:   `Scripture not found in any loaded version: "${reference}"`,
      });
    }

    return res.json({
      success: true,
      count:   comparison.versions.length,
      ...comparison,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Comparison failed";
    return res.status(500).json({ success: false, error: msg });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /scripture/books?version=kjv
// List all books for a version
// ─────────────────────────────────────────────────────────────────────────────

router.get("/books", (req: Request, res: Response) => {
  try {
    const { version } = validate(scriptureBooksSchema, req.query);
    const books = scriptureService.getBooks(version);

    return res.json({
      success: true,
      version: version.toUpperCase(),
      count:   books.length,
      books,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch books";
    return res.status(500).json({ success: false, error: msg });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /scripture/books/:bookName?version=kjv
// Get a specific book's metadata
// ─────────────────────────────────────────────────────────────────────────────

router.get("/books/:bookName", (req: Request, res: Response) => {
  try {
    const { bookName } = req.params;
    const { version }  = validate(scriptureBooksSchema, req.query);
    const book         = scriptureService.getBook(bookName, version);

    if (!book) {
      return res.status(404).json({
        success: false,
        error:   `Book not found: "${bookName}" in ${version.toUpperCase()}`,
      });
    }

    return res.json({
      success: true,
      version: version.toUpperCase(),
      book,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch book";
    return res.status(500).json({ success: false, error: msg });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /scripture/verse-count?book=John&chapter=3&version=kjv
// ─────────────────────────────────────────────────────────────────────────────

router.get("/verse-count", (req: Request, res: Response) => {
  try {
    const { book, chapter, version } = validate(scriptureVerseCountSchema, req.query);

    const count = scriptureService.getChapterVerseCount(book, chapter, version);

    if (count === null) {
      return res.status(404).json({
        success: false,
        error:   `Chapter not found: ${book} ${chapter} in ${version.toUpperCase()}`,
      });
    }

    return res.json({
      success:    true,
      book,
      chapter,
      version:    version.toUpperCase(),
      verseCount: count,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to get verse count";
    return res.status(500).json({ success: false, error: msg });
  }
});

export default router;