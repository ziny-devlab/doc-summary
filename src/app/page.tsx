"use client";

import { Title, Header, SafariHeader } from "@/components";
import { useState } from "react";

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
                ? excerpts.map((x: string) => `- ${x}`).join("\n")
                : "- (발췌 없음)";

            const missingText =
              missingPoints.length > 0
                ? missingPoints.map((x: string) => `- ${x}`).join("\n")
                : "- (없음)";

            const sourcesText =
              suggestedSources.length > 0
                ? suggestedSources
                    .map((x: any) => `- ${x.title}: ${x.url}`)
                    .join("\n")
                : "- (추천 없음)";

            return `## 키워드\n${
              keyword || "(없음)"
            }\n\n### 상세 요약\n${s}\n\n### 관련 원문 발췌\n${excerptText}\n\n### 원문에서 확인 불가한 부분\n${missingText}\n\n### 추가로 참고할 자료\n${sourcesText}`;
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
      <main className="min-h-[calc(100vh-58px)] bg-gradient-to-br from-neutral-100 via-white to-neutral-200 flex flex-col items-center py-6 sm:py-8 px-3 overflow-hidden">
        <Title />

        <form onSubmit={handleSubmit} className="mb-6 w-full max-w-xl">
          <input
            type="url"
            required
            value={url}
            placeholder="요약할 URL을 입력하세요"
            onChange={(e) => setUrl(e.target.value)}
            className="w-full p-3 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 hover:bg-neutral-100 transition"
          />

          <textarea
            value={keywordsText}
            placeholder="키워드(문장)를 한 줄에 하나씩 입력하세요 (선택)\n예: rate limit은 어떻게 동작하나요?\n예: 인증/토큰 갱신 절차"
            onChange={(e) => setKeywordsText(e.target.value)}
            className="w-full p-3 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 hover:bg-neutral-100 transition mt-3 min-h-24"
          />
          <button
            className="px-5 py-2 my-3 w-full rounded-xl border border-neutral-300 bg-white text-neutral-700 font-medium shadow-sm hover:bg-neutral-100 transition disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg"
            disabled={loading}
          >
            {loading ? "요약 중..." : "요약하기"}
          </button>
        </form>

        <div className="w-full max-w-xl mx-auto rounded-2xl shadow bg-white border border-neutral-200 overflow-hidden mb-8">
          <SafariHeader title="요약 결과" />
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center">
                <p className="text-neutral-500 text-sm">요약 중...</p>
              </div>
            ) : summary ? (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                    <span className="text-xl">✅</span> 요약 결과
                  </h2>
                  <button
                    onClick={handleCopy}
                    className={`px-3 py-1 text-sm border rounded hover:bg-neutral-200 active:bg-neutral-300 text-neutral-700 border-neutral-400 flex items-center gap-1 transition ${
                      copied ? "bg-neutral-200" : "bg-white"
                    }`}
                    title="복사하기"
                  >
                    {copied ? "복사 완료!" : "📋"}
                  </button>
                </div>
                <pre className="text-neutral-700 whitespace-pre-wrap text-base leading-relaxed font-sans">
                  {summary}
                </pre>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-neutral-400">
                <p className="text-base text-center">
                  아직 요약 결과가 없습니다.
                  <br />
                  URL을 입력하고 &quot;요약하기&quot; 버튼을 눌러주세요.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
