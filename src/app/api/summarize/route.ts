// app/api/summarize/route.ts
import { NextRequest, NextResponse } from "next/server";
import { JSDOM } from "jsdom";

const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;
const KEYWORD_PROMPT_TEMPLATE = process.env.SUMMARIZE_KEYWORD_PROMPT_TEMPLATE;
const GENERAL_PROMPT_TEMPLATE = process.env.SUMMARIZE_GENERAL_PROMPT_TEMPLATE;

function buildSuggestedSources(keyword: string, originalUrl: string) {
  const q = encodeURIComponent(keyword);
  const sources: Array<{ title: string; url: string }> = [];

  try {
    const origin = new URL(originalUrl).origin;
    sources.push({
      title: "현재 사이트에서 더 찾기",
      url: `${origin}/?q=${q}`,
    });
  } catch {
    // ignore
  }

  sources.push(
    {
      title: "MDN 검색",
      url: `https://developer.mozilla.org/en-US/search?q=${q}`,
    },
    {
      title: "RFC Editor 검색",
      url: `https://www.rfc-editor.org/search/?q=${q}`,
    },
    {
      title: "GitHub 검색",
      url: `https://github.com/search?q=${q}`,
    },
    {
      title: "Stack Overflow 검색",
      url: `https://stackoverflow.com/search?q=${q}`,
    }
  );

  return sources;
}

function normalizeWhitespace(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

function splitIntoSentences(text: string) {
  const normalized = normalizeWhitespace(text);
  if (!normalized) return [];
  const parts = normalized.split(/(?<=[.!?])\s+/);
  return parts.map((s) => s.trim()).filter(Boolean);
}

function keywordToTokens(keyword: string) {
  return keyword
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3);
}

function selectExcerptsForKeyword(sentences: string[], keyword: string) {
  const kw = keyword.trim();
  if (!kw) return [] as string[];

  const kwLower = kw.toLowerCase();
  const tokens = keywordToTokens(kwLower);

  const directMatches: number[] = [];
  const scored: Array<{ idx: number; score: number }> = [];

  for (let i = 0; i < sentences.length; i++) {
    const sLower = sentences[i].toLowerCase();
    if (sLower.includes(kwLower)) {
      directMatches.push(i);
      continue;
    }

    if (tokens.length > 0) {
      let score = 0;
      for (const t of tokens) {
        if (sLower.includes(t)) score++;
      }
      if (score > 0) scored.push({ idx: i, score });
    }
  }

  const selected = new Set<number>();
  const addWithContext = (idx: number) => {
    for (
      let j = Math.max(0, idx - 1);
      j <= Math.min(sentences.length - 1, idx + 1);
      j++
    ) {
      selected.add(j);
    }
  };

  for (const idx of directMatches.slice(0, 6)) addWithContext(idx);
  if (selected.size < 18) {
    scored.sort((a, b) => b.score - a.score);
    for (const item of scored.slice(0, 6)) addWithContext(item.idx);
  }

  const ordered = Array.from(selected).sort((a, b) => a - b);
  const excerpts: string[] = [];
  let totalChars = 0;
  for (const i of ordered) {
    const s = sentences[i];
    if (!s) continue;
    if (totalChars + s.length > 2400) break;
    excerpts.push(s);
    totalChars += s.length;
  }
  return excerpts;
}

export async function POST(req: NextRequest) {
  const { url, keywords } = await req.json();

  if (!url) {
    return NextResponse.json({ error: "Missing URL" }, { status: 400 });
  }

  try {
    // 1. 페이지 크롤링
    const res = await fetch(url);
    const html = await res.text();

    // 2. 본문 추출
    const dom = new JSDOM(html);
    const bodyText = dom.window.document.body.textContent || "";
    const sentences = splitIntoSentences(bodyText);

    const keywordList: string[] = Array.isArray(keywords)
      ? keywords
          .map((k: unknown) => String(k))
          .map((k) => k.trim())
          .filter(Boolean)
      : [];

    const hasKeywords = keywordList.length > 0;

    const content = normalizeWhitespace(bodyText).slice(0, 6000);
    const perKeyword = hasKeywords
      ? keywordList.map((k) => ({
          keyword: k,
          excerpts: selectExcerptsForKeyword(sentences, k),
          suggested_sources: buildSuggestedSources(k, url),
        }))
      : [];

    // 3. Claude API에 요청할 프롬프트 작성
    if (hasKeywords && !KEYWORD_PROMPT_TEMPLATE) {
      return NextResponse.json(
        { error: "Missing SUMMARIZE_KEYWORD_PROMPT_TEMPLATE" },
        { status: 500 }
      );
    }

    if (!hasKeywords && !GENERAL_PROMPT_TEMPLATE) {
      return NextResponse.json(
        { error: "Missing SUMMARIZE_GENERAL_PROMPT_TEMPLATE" },
        { status: 500 }
      );
    }

    const prompt = hasKeywords
      ? KEYWORD_PROMPT_TEMPLATE!.replace(
          "{{items_json}}",
          JSON.stringify({ items: perKeyword }, null, 2)
        )
      : GENERAL_PROMPT_TEMPLATE!.replace("{{content}}", content);

    // 4. Claude 요약 요청
    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": CLAUDE_API_KEY || "",
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: hasKeywords ? 900 : 512,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await aiRes.json();
    const text = data.content?.[0]?.text || "";

    if (!hasKeywords) {
      const summary = text || "요약 실패";
      return NextResponse.json({ summary });
    }

    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }

    const items = Array.isArray(parsed?.items) ? parsed.items : [];
    const results = perKeyword.map((item) => {
      const found = items.find(
        (x: any) => String(x?.keyword).trim() === item.keyword
      );

      const missing_points = Array.isArray(found?.missing_points)
        ? found.missing_points.map((v: any) => String(v))
        : [];

      return {
        keyword: item.keyword,
        summary: String(found?.summary || "요약 실패"),
        excerpts: item.excerpts,
        excerpts_used: Array.isArray(found?.excerpts_used)
          ? found.excerpts_used.map((v: any) => String(v))
          : [],
        missing_points,
        suggested_sources: Array.isArray((item as any).suggested_sources)
          ? (item as any).suggested_sources
          : buildSuggestedSources(item.keyword, url),
      };
    });

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("[summarize] Error:", error.message);
    return NextResponse.json({ error: "요약 중 오류 발생" }, { status: 500 });
  }
}
