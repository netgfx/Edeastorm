/**
 * API Route: Cluster Ideas
 * POST /api/ai/cluster
 * 
 * Groups similar ideas on a board using AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { clusterIdeas } from '@/lib/ai-services';

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate API key
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

    // TODO: Verify user has access to the board

    // Perform clustering
    const result = await clusterIdeas(boardId, session.user.id);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Cluster API error:', error);
    return NextResponse.json(
      { error: 'Failed to cluster ideas', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
