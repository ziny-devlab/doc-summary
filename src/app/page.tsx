"use client";

import { Title, Header } from "@/components";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [url, setUrl] = useState("");
  const [keywordsText, setKeywordsText] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const parseKeywords = (input: string) => {
    return input
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSummary("");

    try {
      const keywords = parseKeywords(keywordsText);
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          keywords: keywords.length > 0 ? keywords : undefined,
        }),
      });

      const data = await res.json();

      if (Array.isArray(data?.results) && data.results.length > 0) {
        const merged = data.results
          .map((r: any) => {
            const keyword = String(r?.keyword || "").trim();
            const s = String(r?.summary || "요약 실패").trim();
            const excerpts = Array.isArray(r?.excerpts)
              ? r.excerpts.map((x: any) => String(x))
              : [];

            const missingPoints = Array.isArray(r?.missing_points)
              ? r.missing_points.map((x: any) => String(x))
              : [];

            const suggestedSources = Array.isArray(r?.suggested_sources)
              ? r.suggested_sources
                  .map((x: any) => ({
                    title: String(x?.title || ""),
                    url: String(x?.url || ""),
                  }))
                  .filter((x: any) => x.title && x.url)
              : [];

            const excerptText =
              excerpts.length > 0
                ? excerpts.map((x: string) => `> ${x}`).join("\n\n")
                : "_발췌 없음_";

            const missingText =
              missingPoints.length > 0
                ? missingPoints.map((x: string) => `- ${x}`).join("\n")
                : "_없음_";

            const sourcesText =
              suggestedSources.length > 0
                ? suggestedSources
                    .map((x: any) => `- [${x.title}](${x.url})`)
                    .join("\n")
                : "_추천 없음_";

            return `## 키워드: ${
              keyword || "(없음)"
            }\n\n${s}\n\n### 💡 관련 원문 발췌\n\n${excerptText}\n\n### ⚠️ 원문에서 확인 불가한 부분\n\n${missingText}\n\n### 📚 추가로 참고할 자료\n\n${sourcesText}`;
          })
          .join("\n\n---\n\n");

        setSummary(merged);
      } else {
        setSummary(data.summary || "요약 실패");
      }
    } catch (err) {
      console.error(err);
      setSummary("요약 중 오류 발생");
    }

    setLoading(false);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen flex flex-col items-center py-12 sm:py-20 px-4 sm:px-6">
        <Title />

        <div className="w-full max-w-2xl mb-16">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="relative group">
              <input
                type="url"
                required
                value={url}
                placeholder="https://..."
                onChange={(e) => setUrl(e.target.value)}
                className="w-full p-4 pl-5 text-lg border-2 border-neutral-200 rounded-2xl bg-white text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-neutral-800 transition-colors shadow-sm group-hover:border-neutral-300"
              />
            </div>

            <div className="relative">
              <textarea
                value={keywordsText}
                placeholder="중점적으로 요약할 키워드나 질문이 있다면 입력해주세요 (선택)"
                onChange={(e) => setKeywordsText(e.target.value)}
                className="w-full p-4 pl-5 border-2 border-neutral-200 rounded-2xl bg-white text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-neutral-800 transition-colors shadow-sm min-h-[80px] resize-y text-base"
              />
            </div>

            <div className="flex justify-end mt-2">
              <button
                className="px-8 py-3 rounded-full bg-neutral-900 text-white font-semibold text-lg hover:bg-neutral-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform active:scale-95"
                disabled={loading}
              >
                {loading ? "분석 중..." : "요약하기 →"}
              </button>
            </div>
          </form>
        </div>

        {(loading || summary) && (
          <article className="w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
                <p className="text-neutral-500 font-medium">
                  문서를 분석하고 있습니다...
                </p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute right-0 top-0 translate-y-[-100%] pb-2">
                  <button
                    onClick={handleCopy}
                    className="text-sm text-neutral-500 hover:text-neutral-900 transition flex items-center gap-1 font-medium"
                  >
                    {copied ? "복사완료 ✓" : "전체 복사"}
                  </button>
                </div>

                <div className="prose prose-neutral prose-lg max-w-none bg-transparent">
                  <ReactMarkdown
                    components={{
                      h2: ({ node, ...props }) => (
                        <h2
                          className="text-2xl font-bold mt-12 mb-6 text-neutral-900 border-b border-neutral-200 pb-2"
                          {...props}
                        />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3
                          className="text-xl font-semibold mt-8 mb-4 text-neutral-800"
                          {...props}
                        />
                      ),
                      blockquote: ({ node, ...props }) => (
                        <blockquote
                          className="border-l-4 border-neutral-300 pl-4 py-1 my-4 bg-neutral-50 text-neutral-600 italic rounded-r-lg"
                          {...props}
                        />
                      ),
                      a: ({ node, ...props }) => (
                        <a
                          className="text-blue-600 hover:underline decoration-blue-300 underline-offset-2"
                          {...props}
                        />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong
                          className="font-bold text-neutral-900 bg-yellow-50 px-1 rounded"
                          {...props}
                        />
                      ),
                    }}
                  >
                    {summary}
                  </ReactMarkdown>
                </div>

                <div className="mt-16 pt-8 border-t border-neutral-200 text-center">
                  <button
                    onClick={() => {
                      setUrl("");
                      setKeywordsText("");
                      setSummary("");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="text-neutral-400 hover:text-neutral-600 text-sm font-medium transition"
                  >
                    다른 문서 요약하기
                  </button>
                </div>
              </div>
            )}
          </article>
        )}
      </main>
    </>
  );
}
