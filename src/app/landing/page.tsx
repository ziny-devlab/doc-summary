import { Header, SafariHeader, Title } from "@/components";
import Link from "next/link";

export default function Landing() {
  return (
    <>
      <Header />

      <main className="min-h-[calc(100vh-58px)] bg-gradient-to-br from-neutral-100 via-white to-neutral-200 flex flex-col items-center py-12 px-3">
        <Title />

        <Link
          href="/"
          className="px-8 py-3 rounded-xl border border-neutral-300 bg-white text-neutral-700 font-semibold shadow hover:bg-neutral-100 transition text-lg my-5"
        >
          요약 바로가기
        </Link>

        <section className="w-full max-w-3xl mx-auto my-12 p-6 bg-white/80 rounded-2xl shadow border border-neutral-200 flex flex-col items-center">
          <h2 className="text-xl sm:text-2xl font-semibold text-neutral-700 mb-4">
            예시 화면
          </h2>
          <div className="w-full flex flex-col sm:flex-row gap-6 justify-center items-stretch">
            {/* 예시 코드 입력 */}
            <div className="flex-1 bg-neutral-100 rounded-xl p-4 shadow-sm border border-neutral-200">
              <div className="text-xs text-neutral-400 mb-2">입력 URL</div>
              <div className="w-full">
                <div className="w-full p-2 border border-neutral-400 rounded bg-neutral-50 text-neutral-800 font-mono text-xs select-none cursor-default">
                  https://ziny-devlab.vercel.app/
                </div>
              </div>
            </div>
            {/* 예시 결과 */}
            <div className="flex-1 bg-neutral-100 rounded-xl p-4 shadow-sm border border-neutral-200">
              <div className="text-xs text-neutral-400 mb-2">
                자동 요약 결과
              </div>
              <pre className="whitespace-pre-wrap font-mono text-xs text-neutral-700">
                {`예시:
- 주요 개념 및 핵심 내용만 간결하게 정리
- 긴 문서를 빠르게 파악 가능
- 복사 버튼으로 결과를 손쉽게 저장
`}
              </pre>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
