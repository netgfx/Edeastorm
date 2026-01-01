-- AI Insights Migration
-- Migration: 008_ai_insights.sql
-- Description: Creates tables for AI-generated insights, clusters, and summaries

--------------------------------------------
-- ENSURE UPDATED_AT FUNCTION EXISTS
--------------------------------------------
-- Create the function if it doesn't exist (it should from 001_create_tables.sql)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------
-- 1. AI_INSIGHTS TABLE
--------------------------------------------
-- Stores AI-generated insights across different types
CREATE TABLE IF NOT EXISTS public.ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL CHECK (insight_type IN (
        'cluster', 
        'summary', 
        'enhancement', 
        'sentiment_analysis',
        'action_items'
    )),
    title VARCHAR(500),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    -- Metadata structure for cluster:
    -- {
    --   "clusterLabel": "Problems",
    --   "itemIds": ["uuid1", "uuid2", "uuid3"],
    --   "groupPosition": { "x": 100, "y": 200 },
    --   "confidence": 0.85
    -- }
    -- Metadata structure for summary:
    -- {
    --   "itemCount": 42,
    --   "timeRange": { "start": "2025-01-01", "end": "2025-01-02" },
    --   "categories": ["problems", "ideas", "solutions"]
    -- }
    -- Metadata structure for enhancement:
    -- {
    --   "originalItemId": "uuid",
    --   "suggestionType": "variation|improvement|expansion",
    --   "applied": false
    -- }
    -- Metadata structure for sentiment_analysis:
    -- {
    --   "overallScore": 0.75,
    --   "engagement": "high",
    --   "momentum": "increasing",
    --   "participantStats": { "active": 5, "passive": 2 }
    -- }
    -- Metadata structure for action_items:
    -- {
    --   "priority": "high|medium|low",
    --   "assignable": true,
    --   "deadline": "2025-01-15",
    --   "relatedItemIds": ["uuid1", "uuid2"]
    -- }
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'applied')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_ai_insights_board ON public.ai_insights(board_id);
CREATE INDEX idx_ai_insights_type ON public.ai_insights(insight_type);
CREATE INDEX idx_ai_insights_status ON public.ai_insights(status);
CREATE INDEX idx_ai_insights_created_at ON public.ai_insights(created_at);

--------------------------------------------
-- 2. AI_PROCESSING_LOGS TABLE
--------------------------------------------
-- Tracks AI processing requests and usage
CREATE TABLE IF NOT EXISTS public.ai_processing_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    operation_type VARCHAR(100) NOT NULL,
    input_data JSONB,
    output_data JSONB,
    tokens_used INTEGER,
    processing_time_ms INTEGER,
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_ai_processing_logs_board ON public.ai_processing_logs(board_id);
CREATE INDEX idx_ai_processing_logs_user ON public.ai_processing_logs(user_id);
CREATE INDEX idx_ai_processing_logs_status ON public.ai_processing_logs(status);
CREATE INDEX idx_ai_processing_logs_created_at ON public.ai_processing_logs(created_at);

--------------------------------------------
-- 3. AI_FEEDBACK TABLE
--------------------------------------------
-- User feedback on AI-generated insights
CREATE TABLE IF NOT EXISTS public.ai_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    insight_id UUID NOT NULL REFERENCES public.ai_insights(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_type VARCHAR(50) CHECK (feedback_type IN ('helpful', 'not_helpful', 'inaccurate', 'excellent')),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_ai_feedback_insight ON public.ai_feedback(insight_id);
CREATE INDEX idx_ai_feedback_user ON public.ai_feedback(user_id);

--------------------------------------------
-- UPDATED_AT TRIGGER FOR AI_INSIGHTS
--------------------------------------------
DROP TRIGGER IF EXISTS set_updated_at ON public.ai_insights;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.ai_insights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

--------------------------------------------
-- HELPER VIEWS
--------------------------------------------

-- View: Recent AI insights per board
CREATE OR REPLACE VIEW public.recent_ai_insights AS
SELECT 
    ai.id,
    ai.board_id,
    ai.insight_type,
    ai.title,
    ai.content,
    ai.metadata,
    ai.status,
    ai.created_by,
    ai.created_at,
    p.full_name as creator_name,
    p.avatar_url as creator_avatar,
    COUNT(af.id) as feedback_count,
    AVG(af.rating) as avg_rating
FROM public.ai_insights ai
LEFT JOIN public.profiles p ON ai.created_by = p.id
LEFT JOIN public.ai_feedback af ON ai.id = af.insight_id
WHERE ai.status = 'active'
GROUP BY ai.id, ai.board_id, ai.insight_type, ai.title, ai.content, 
         ai.metadata, ai.status, ai.created_by, ai.created_at,
         p.full_name, p.avatar_url
ORDER BY ai.created_at DESC;

-- View: AI usage statistics per board
CREATE OR REPLACE VIEW public.ai_usage_stats AS
SELECT 
    board_id,
    COUNT(*) as total_operations,
    SUM(tokens_used) as total_tokens,
    AVG(processing_time_ms) as avg_processing_time,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_operations,
    MAX(created_at) as last_operation
FROM public.ai_processing_logs
GROUP BY board_id;
