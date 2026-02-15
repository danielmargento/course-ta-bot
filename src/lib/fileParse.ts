import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import JSZip from "jszip";

/**
 * Extract text content from an uploaded file buffer.
 */
export async function extractText(
  buffer: Buffer,
  fileType: string
): Promise<string> {
  switch (fileType) {
    case "pdf":
      return extractPdf(buffer);
    case "docx":
      return extractDocx(buffer);
    case "pptx":
      return extractPptx(buffer);
    case "txt":
    case "md":
      return buffer.toString("utf-8");
    default:
      return buffer.toString("utf-8");
  }
}

async function extractPdf(buffer: Buffer): Promise<string> {
  const result = await pdfParse(buffer);
  return result.text;
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

async function extractPptx(buffer: Buffer): Promise<string> {
  // PPTX files are ZIP archives containing XML slide files
  const zip = await JSZip.loadAsync(buffer);
  const slideEntries = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] ?? "0");
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] ?? "0");
      return numA - numB;
    });

  const texts: string[] = [];
  for (const name of slideEntries) {
    const content = await zip.files[name].async("text");
    // Extract text from <a:t> tags
    const matches = content.match(/<a:t>([\s\S]*?)<\/a:t>/g);
    if (matches) {
      const slideText = matches
        .map((m) => m.replace(/<\/?a:t>/g, ""))
        .join(" ");
      texts.push(slideText);
    }
  }

  return texts.join("\n\n");
}

export function getFileType(filename: string): string | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  const supported = ["pdf", "docx", "pptx", "txt", "md"];
  return supported.includes(ext) ? ext : null;
}
