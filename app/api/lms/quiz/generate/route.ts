import { NextRequest, NextResponse } from 'next/server';
import { requireLmsContentAdmin } from '@/app/api/lms/_helpers';
import geminiService from '@/app/_services/geminiService';

/**
 * AI quiz generator (Gemini) for LMS course lessons.
 * POST { topic, lessonTitle?, courseTitle?, questionCount?, difficulty?, language?, extraContext?, replace? }
 */
export async function POST(request: NextRequest) {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY tanımlı değil — sunucu ortam değişkenlerini kontrol edin.' },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const topic = String(body.topic || body.prompt || '').trim();
    if (!topic) {
      return NextResponse.json(
        { error: 'Konu / prompt gerekli (topic)' },
        { status: 400 }
      );
    }

    const questionCount = Number(body.questionCount) || 5;
    const difficulty =
      body.difficulty === 'easy' || body.difficulty === 'hard' ? body.difficulty : 'medium';
    const language = body.language === 'en' ? 'en' : 'tr';

    const result = await geminiService.generateQuizQuestions({
      topic,
      lessonTitle: body.lessonTitle ? String(body.lessonTitle) : undefined,
      courseTitle: body.courseTitle ? String(body.courseTitle) : undefined,
      questionCount,
      difficulty,
      language,
      extraContext: body.extraContext ? String(body.extraContext) : undefined,
    });

    return NextResponse.json({
      success: true,
      quiz: result,
      model: geminiService.getActiveModelName(),
    });
  } catch (error) {
    console.error('[lms/quiz/generate]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Quiz üretilemedi',
      },
      { status: 500 }
    );
  }
}
