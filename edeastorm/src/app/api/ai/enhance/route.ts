/**
 * API Route: Enhance Idea
 * POST /api/ai/enhance
 * 
 * Generates enhancement suggestions for a specific idea
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { enhanceIdea } from '@/lib/ai-services';
import { supabaseAdmin } from '@/lib/supabase';

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

    // Verify user has access to the board (SECURITY FIX)
    // RPC function not in generated types yet, using any
    const { data: boardAccess, error: accessError } = await (supabaseAdmin() as any)
      .rpc('check_board_access', {
        p_board_id: boardId,
        p_user_id: session.user.id
      });

    if (accessError) {
      console.error('Board access check error:', accessError);
      return NextResponse.json(
        { error: 'Failed to verify board access' },
        { status: 500 }
      );
    }

    const access = boardAccess?.[0];
    if (!access?.has_access || !['editor', 'admin'].includes(access.access_role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Editor or admin access required.' },
        { status: 403 }
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
