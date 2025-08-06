// app/api/summarize/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';

const CLAUDE_API_KEY = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url) {
    return NextResponse.json({ error: 'Missing URL' }, { status: 400 });
  }

  try {
    // 1. 페이지 크롤링
    const res = await fetch(url);
    const html = await res.text();

    // 2. 본문 추출
    const dom = new JSDOM(html);
    const bodyText = dom.window.document.body.textContent || '';
    const content = bodyText.replace(/\s+/g, ' ').slice(0, 3000); // Claude 요약 한계 고려

    // 3. Claude API에 요청할 프롬프트 작성
    const prompt = `다음은 웹 페이지의 본문 내용입니다. 핵심만 요약해줘:\n\n\`\`\`\n${content}\n\`\`\``;

    // 4. Claude 요약 요청
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY || '',
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }]
      }),
    });

    const data = await aiRes.json();
    const summary = data.content?.[0]?.text || '요약 실패';

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error('[summarize] Error:', error.message);
    return NextResponse.json({ error: '요약 중 오류 발생' }, { status: 500 });
  }
}