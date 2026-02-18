import { PDFParse } from "pdf-parse";
import { ParsedChunk } from "./types";

const MAX_CHUNK_CHARS = 3200;
const OVERLAP_CHARS = 100;

/**
 * Strip characters that are invalid in JSON/PostgreSQL text columns:
 * lone surrogates, null bytes, and other problematic Unicode.
 */
function sanitizeText(text: string): string {
  // Remove lone surrogates (invalid in JSON / PostgreSQL)
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\x00]/g, "").replace(/[\uD800-\uDFFF]/g, "");
}

/**
 * Extract text content from an uploaded file buffer.
 * Delegates to extractChunks() and joins for backward compatibility.
 */
export async function extractText(
  buffer: Buffer,
  fileType: string
): Promise<string> {
  const chunks = await extractChunks(buffer, fileType);
  return chunks.map((c) => c.content).join("\n\n");
}

/**
 * Extract structured chunks with source labels from a file buffer.
 */
export async function extractChunks(
  buffer: Buffer,
  fileType: string
): Promise<ParsedChunk[]> {
  switch (fileType) {
    case "pdf":
      return extractPdfChunks(buffer);
    case "tex":
      return extractTexChunks(buffer.toString("utf-8"));
    case "txt":
    case "md":
      return extractTextChunks(buffer.toString("utf-8"));
    default:
      return extractTextChunks(buffer.toString("utf-8"));
  }
}

async function extractPdfChunks(buffer: Buffer): Promise<ParsedChunk[]> {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  const fullText = sanitizeText(result.text);

  // Split on form-feed characters (page boundaries)
  const pages = fullText.split("\f").filter((p) => p.trim());
  const chunks: ParsedChunk[] = [];

  for (let i = 0; i < pages.length; i++) {
    const pageText = pages[i].trim();
    if (!pageText) continue;

    const pageNum = i + 1;
    if (pageText.length > MAX_CHUNK_CHARS) {
      // Sub-chunk large pages with overlap
      const subChunks = splitWithOverlap(pageText, MAX_CHUNK_CHARS, OVERLAP_CHARS);
      for (let j = 0; j < subChunks.length; j++) {
        chunks.push({
          content: subChunks[j],
          source_label: subChunks.length > 1 ? `Page ${pageNum} (part ${j + 1})` : `Page ${pageNum}`,
          metadata: { page_number: pageNum, sub_part: j + 1 },
        });
      }
    } else {
      chunks.push({
        content: pageText,
        source_label: `Page ${pageNum}`,
        metadata: { page_number: pageNum },
      });
    }
  }

  // Fallback: if no form-feeds found, treat as single chunk
  if (chunks.length === 0 && fullText.trim()) {
    const subChunks = splitWithOverlap(fullText.trim(), MAX_CHUNK_CHARS, OVERLAP_CHARS);
    for (let i = 0; i < subChunks.length; i++) {
      chunks.push({
        content: subChunks[i],
        source_label: `Part ${i + 1}`,
        metadata: { part: i + 1 },
      });
    }
  }

  return chunks;
}

function extractTexChunks(text: string): ParsedChunk[] {
  text = sanitizeText(text);

  // Split on LaTeX sectioning commands
  const sectionRegex = /\\(?:chapter|section|subsection|subsubsection)\{([^}]*)\}/g;
  const sections: { heading: string; content: string }[] = [];
  let lastIndex = 0;
  let lastHeading = "";
  let match;

  while ((match = sectionRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const content = text.slice(lastIndex, match.index).trim();
      if (content) {
        sections.push({ heading: lastHeading, content });
      }
    }
    lastHeading = match[1];
    lastIndex = match.index + match[0].length;
  }

  // Remaining content after last heading
  if (lastIndex < text.length) {
    const content = text.slice(lastIndex).trim();
    if (content) {
      sections.push({ heading: lastHeading, content });
    }
  }

  // Fallback: if no sectioning commands found, use paragraph-based chunking
  if (sections.length === 0 || (sections.length === 1 && !sections[0].heading)) {
    return extractTextChunks(text);
  }

  const chunks: ParsedChunk[] = [];
  for (let i = 0; i < sections.length; i++) {
    const { heading, content } = sections[i];
    const label = heading ? `Section: ${heading}` : `Part ${i + 1}`;

    if (content.length > MAX_CHUNK_CHARS) {
      const subChunks = splitWithOverlap(content, MAX_CHUNK_CHARS, OVERLAP_CHARS);
      for (let j = 0; j < subChunks.length; j++) {
        chunks.push({
          content: subChunks[j],
          source_label: subChunks.length > 1 ? `${label} (part ${j + 1})` : label,
          metadata: { section: heading || null, sub_part: j + 1 },
        });
      }
    } else {
      chunks.push({
        content,
        source_label: label,
        metadata: { section: heading || null },
      });
    }
  }

  return chunks;
}

function extractTextChunks(text: string): ParsedChunk[] {
  text = sanitizeText(text);
  // Split on double-newline paragraph boundaries
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim());
  const chunks: ParsedChunk[] = [];
  let currentChunk = "";
  let partNum = 1;

  for (const para of paragraphs) {
    if (currentChunk.length + para.length + 2 > MAX_CHUNK_CHARS && currentChunk) {
      chunks.push({
        content: currentChunk.trim(),
        source_label: `Part ${partNum}`,
        metadata: { part: partNum },
      });
      // Overlap: keep tail of previous chunk
      const overlap = currentChunk.slice(-OVERLAP_CHARS);
      currentChunk = overlap + "\n\n" + para;
      partNum++;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + para;
    }
  }

  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      source_label: `Part ${partNum}`,
      metadata: { part: partNum },
    });
  }

  return chunks;
}

function splitWithOverlap(text: string, maxChars: number, overlap: number): string[] {
  const parts: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + maxChars, text.length);
    parts.push(text.slice(start, end));
    if (end >= text.length) break;
    start = end - overlap;
  }
  return parts;
}

export function getFileType(filename: string): string | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  const supported = ["pdf", "txt", "md", "tex"];
  return supported.includes(ext) ? ext : null;
}
