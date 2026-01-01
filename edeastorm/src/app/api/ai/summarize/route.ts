/**
 * API Route: Summarize Session
 * POST /api/ai/summarize
 * 
 * Generates a comprehensive summary of the brainstorming session
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { summarizeSession } from '@/lib/ai-services';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { boardId } = body;

    if (!boardId) {
      return NextResponse.json(
        { error: 'Board ID is required' },
        { status: 400 }
      );
    }

    const result = await summarizeSession(boardId, session.user.id);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Summarize API error:', error);
    console.error('Error details:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to summarize session', details: errorMessage },
      { status: 500 }
    );
  }
}
