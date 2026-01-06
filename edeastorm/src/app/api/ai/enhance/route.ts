/**
 * API Route: Enhance Idea
 * POST /api/ai/enhance
 * 
 * Generates enhancement suggestions for a specific idea
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { enhanceIdea } from '@/lib/ai-services';

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
    const { boardId, itemId, content } = body;

    if (!boardId || !itemId || !content) {
      return NextResponse.json(
        { error: 'Board ID, item ID, and content are required' },
        { status: 400 }
      );
    }

    const result = await enhanceIdea(boardId, itemId, content, session.user.id);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Enhance API error:', error);
    return NextResponse.json(
      { error: 'Failed to enhance idea', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
