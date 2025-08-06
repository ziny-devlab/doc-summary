'use client';

import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSummary('');

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await res.json();
      setSummary(data.summary || '요약 실패');
    } catch (err) {
      console.error(err);
      setSummary('요약 중 오류 발생');
    }

    setLoading(false);
  };

  return (
    <main className='max-w-7xl mx-auto p-4'>
      <h1 className='text-2xl font-bold mb-4'>📄 기술문서 요약기</h1>
      <form onSubmit={handleSubmit} className='mb-4'>
        <input
          type="url"
          required
          value={url}
          placeholder="요약할 URL을 입력하세요"
          onChange={(e) => setUrl(e.target.value)}
          className='w-full p-2 border border-gray-300 rounded'
        />
        <button
          type="submit"
          className='mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
        >
          {loading ? '요약 중...' : '요약하기'}
        </button>
      </form>

      {summary && (
        <div className='mt-4 p-4 bg-gray-100 rounded'>
          <div className='flex justify-between items-center mb-2'>
            <h2 className='text-lg font-bold text-gray-800'>✅ 요약 결과</h2>
            <button
              onClick={handleCopy}
              className='px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700 flex items-center gap-1'
              title='복사하기'
            >
              {copied ? '복사 완료!' : '📋'}
            </button>
          </div>
          <p className='text-gray-600 whitespace-pre-line'>{summary}</p>
        </div>
      )}
    </main>
  );
}
