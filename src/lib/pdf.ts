import { jsPDF } from "jspdf";
import { Message } from "./types";

export function exportMessagesToPdf(messages: Message[], title: string): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  doc.setFontSize(16);
  doc.text(title, margin, y);
  y += 12;

  doc.setFontSize(10);

  for (const msg of messages) {
    const label = msg.role === "user" ? "Student" : "TA";
    const lines = doc.splitTextToSize(`[${label}] ${msg.content}`, maxWidth);

    if (y + lines.length * 6 > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = 20;
    }

    doc.text(lines, margin, y);
    y += lines.length * 6 + 4;
  }

  return doc;
}
