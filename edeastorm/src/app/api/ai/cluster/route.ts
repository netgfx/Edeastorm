/**
 * API Route: Cluster Ideas
 * POST /api/ai/cluster
 * 
 * Groups similar ideas on a board using AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { clusterIdeas } from '@/lib/ai-services';
import { supabaseAdmin } from '@/lib/supabase';

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

    // Check if user has access and required permissions (editor or admin)
    const access = boardAccess?.[0];
    if (!access?.has_access || !['editor', 'admin'].includes(access.access_role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Editor or admin access required.' },
        { status: 403 }
      );
    }

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
