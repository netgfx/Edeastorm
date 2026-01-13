/**
 * API Route: Summarize Session
 * POST /api/ai/summarize
 * 
 * Generates a comprehensive summary of the brainstorming session
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { summarizeSession } from '@/lib/ai-services';
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
    const { boardId } = body;

    if (!boardId) {
      return NextResponse.json(
        { error: 'Board ID is required' },
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
