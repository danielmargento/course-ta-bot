import { marked } from "marked";
import katex from "katex";
import { Message } from "./types";

/** Replace LaTeX delimiters with KaTeX-rendered HTML, then convert markdown to HTML */
function renderContent(content: string): string {
  // Display math: $$...$$ and \[...\]
  let html = content.replace(/\$\$([\s\S]*?)\$\$/g, (_m, inner) =>
    katex.renderToString(inner.trim(), { displayMode: true, throwOnError: false })
  );
  html = html.replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner) =>
    katex.renderToString(inner.trim(), { displayMode: true, throwOnError: false })
  );

  // Inline math: \(...\) and $...$
  html = html.replace(/\\\(([\s\S]*?)\\\)/g, (_m, inner) =>
    katex.renderToString(inner.trim(), { displayMode: false, throwOnError: false })
  );
  html = html.replace(/(?<!\$)\$(?!\$)((?:[^$\\]|\\.)+?)\$(?!\$)/g, (_m, inner) =>
    katex.renderToString(inner.trim(), { displayMode: false, throwOnError: false })
  );

  return marked.parse(html, { async: false }) as string;
}

export interface PdfGroup {
  groupName: string;
  messages: Message[];
}

/**
 * Opens a print-ready window with rendered markdown + KaTeX math.
 * The browser's native print handles CSS/KaTeX perfectly — no html2canvas needed.
 */
export function printMessages(groups: PdfGroup[], title: string): void {
  let body = "";

  for (const group of groups) {
    body += `<h2>${group.groupName}</h2>`;
    for (const msg of group.messages) {
      const label = msg.role === "user" ? "Student" : "TA";
      const cls = msg.role === "user" ? "label-student" : "label-ta";
      body += `
        <div class="message">
          <span class="label ${cls}">${label}</span>
          <div class="content">${renderContent(msg.content)}</div>
        </div>`;
    }
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.28/dist/katex.min.css">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 700px; margin: 0 auto; padding: 24px; color: #1f2937; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    h2 { font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-top: 28px; }
    hr { border: none; border-top: 2px solid #e5e7eb; margin-bottom: 16px; }
    .message { margin-bottom: 16px; }
    .label { font-weight: 600; font-size: 11px; display: inline-block; margin-bottom: 2px; }
    .label-student { color: #2563eb; }
    .label-ta { color: #059669; }
    .content { font-size: 13px; line-height: 1.7; }
    .content p { margin: 4px 0; }
    .content pre { background: #f3f4f6; padding: 8px 12px; border-radius: 6px; overflow-x: auto; font-size: 12px; }
    .content code { background: #f3f4f6; padding: 1px 4px; border-radius: 3px; font-size: 12px; }
    .content pre code { background: none; padding: 0; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <hr>
  ${body}
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
