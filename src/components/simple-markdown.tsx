"use client";

import React from "react";
import { Check, Square } from "lucide-react";

// A tiny, dependency-free, XSS-safe markdown renderer.
// Supports: # / ## headings, - bullets, - [ ] / - [x] checklists,
// **bold**, *italic*, `code`, [text](url) links and bare URLs.

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Split on links first: [label](url)
  const linkRe = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s]+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;

  const pushFormatted = (chunk: string) => {
    // Bold
    const parts = chunk.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
    for (const p of parts) {
      if (!p) continue;
      if (p.startsWith("**") && p.endsWith("**"))
        nodes.push(<strong key={`${keyPrefix}-b-${i++}`}>{p.slice(2, -2)}</strong>);
      else if (p.startsWith("*") && p.endsWith("*"))
        nodes.push(<em key={`${keyPrefix}-i-${i++}`}>{p.slice(1, -1)}</em>);
      else if (p.startsWith("`") && p.endsWith("`"))
        nodes.push(
          <code key={`${keyPrefix}-c-${i++}`} className="rounded bg-muted px-1 py-0.5 text-[0.85em]">
            {p.slice(1, -1)}
          </code>
        );
      else nodes.push(<React.Fragment key={`${keyPrefix}-t-${i++}`}>{p}</React.Fragment>);
    }
  };

  while ((m = linkRe.exec(text)) !== null) {
    if (m.index > last) pushFormatted(text.slice(last, m.index));
    const href = m[2] || m[3];
    const label = m[1] || m[3];
    nodes.push(
      <a
        key={`${keyPrefix}-l-${i++}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2 hover:opacity-80"
      >
        {label}
      </a>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) pushFormatted(text.slice(last));
  return nodes;
}

export function SimpleMarkdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const out: React.ReactNode[] = [];
  let listBuffer: React.ReactNode[] = [];

  const flushList = (key: string) => {
    if (listBuffer.length) {
      out.push(
        <ul key={key} className="my-2 space-y-1">
          {listBuffer}
        </ul>
      );
      listBuffer = [];
    }
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushList(`ul-${idx}`);
      return;
    }
    const checkbox = line.match(/^\s*-\s\[( |x|X)\]\s(.*)$/);
    const bullet = line.match(/^\s*[-*]\s(.*)$/);
    const h1 = line.match(/^#\s(.*)$/);
    const h2 = line.match(/^##\s(.*)$/);

    if (checkbox) {
      const checked = checkbox[1].toLowerCase() === "x";
      listBuffer.push(
        <li key={`cb-${idx}`} className="flex items-start gap-2 text-sm">
          {checked ? (
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
          ) : (
            <Square className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className={checked ? "text-muted-foreground line-through" : ""}>
            {renderInline(checkbox[2], `cb-${idx}`)}
          </span>
        </li>
      );
      return;
    }
    if (bullet) {
      listBuffer.push(
        <li key={`li-${idx}`} className="flex items-start gap-2 text-sm">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span>{renderInline(bullet[1], `li-${idx}`)}</span>
        </li>
      );
      return;
    }
    flushList(`ul-${idx}`);
    if (h2) out.push(<h4 key={idx} className="mt-3 font-semibold">{renderInline(h2[1], `h2-${idx}`)}</h4>);
    else if (h1) out.push(<h3 key={idx} className="mt-3 text-lg font-semibold">{renderInline(h1[1], `h1-${idx}`)}</h3>);
    else out.push(<p key={idx} className="text-sm leading-relaxed">{renderInline(line, `p-${idx}`)}</p>);
  });
  flushList("ul-final");

  return <div className="space-y-1">{out}</div>;
}
