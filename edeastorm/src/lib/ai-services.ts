/**
 * AI Services using Vercel AI SDK with Google Gemini
 * Provides AI-powered features for ideation and collaboration
 */

import { google } from '@ai-sdk/google';
import { generateText, streamText, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

// Initialize Gemini model
const getModel = () => {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not configured');
  }
  return google('gemini-2.5-flash');
};

/**
 * Tool: Fetch canvas items from Supabase
 */
export const getCanvasItemsTool = tool({
  description: 'Fetch all canvas items (notes, images) from a board',
  inputSchema: z.object({
    boardId: z.string().describe('The UUID of the board'),
  }),
  execute: async ({ boardId }) => {    
    const { data, error } = await supabase
      .from('canvas_items')
      .select('*')
      .eq('board_id', boardId)
      .order('created_at', { ascending: true });
    
    if (error) throw new Error(`Failed to fetch canvas items: ${error.message}`);
    
    return {
      items: data || [],
      count: data?.length || 0,
    };
  },
}) as any;

/**
 * Tool: Fetch board details including problem statement
 */
export const getBoardDetailsTool = tool({
  description: 'Fetch board details including title, problem statement, and description',
  inputSchema: z.object({
    boardId: z.string().describe('The UUID of the board'),
  }),
  execute: async ({ boardId }) => {    
    const { data, error } = await supabase
      .from('boards')
      .select('id, title, problem_statement, description, settings')
      .eq('id', boardId)
      .single();
    
    if (error) throw new Error(`Failed to fetch board details: ${error.message}`);
    
    return data;
  },
}) as any;

/**
 * Tool: Fetch board images
 */
export const getBoardImagesTool = tool({
  description: 'Fetch images associated with the board',
  inputSchema: z.object({
    boardId: z.string().describe('The UUID of the board'),
  }),
  execute: async ({ boardId }) => {    
    const { data, error } = await supabase
      .from('board_images')
      .select('*')
      .eq('board_id', boardId)
      .order('created_at', { ascending: false });
    
    if (error) {
      // Board images might not exist yet
      return { images: [], count: 0 };
    }
    
    return {
      images: data || [],
      count: data?.length || 0,
    };
  },
}) as any;

/**
 * Tool: Save AI insight to database
 */
export const saveAIInsightTool = tool({
  description: 'Save an AI-generated insight to the database',
  inputSchema: z.object({
    boardId: z.string().describe('The UUID of the board'),
    insightType: z.enum(['cluster', 'summary', 'enhancement', 'sentiment_analysis', 'action_items']),
    title: z.string().optional(),
    content: z.string(),
    metadata: z.record(z.string(), z.any()).optional(),
    createdBy: z.string().optional(),
  }),
  execute: async ({ boardId, insightType, title, content, metadata, createdBy }) => {    
    const { data, error } = await supabase
      .from('ai_insights')
      .insert({
        board_id: boardId,
        insight_type: insightType,
        title,
        content,
        metadata: metadata || {},
        created_by: createdBy || null,
      } as any)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to save insight: ${error.message}`);
    
    return data;
  },
}) as any;

/**
 * Agent tools collection
 */
export const agentTools = {
  getCanvasItems: getCanvasItemsTool,
  getBoardDetails: getBoardDetailsTool,
  getBoardImages: getBoardImagesTool,
  saveInsight: saveAIInsightTool,
};

/**
 * Smart Idea Clustering
 * Groups similar ideas and creates category labels
 */
export async function clusterIdeas(boardId: string, userId?: string) {
  const model = getModel();
  const startTime = Date.now();
  
  try {
    // Log the operation
    const logId = await logAIOperation(boardId, userId, 'cluster_ideas', { boardId });
    
    // Use agent mode with tools
    const result = await streamText({
      model,
      tools: agentTools,
      system: `You are an AI assistant specialized in organizing and clustering ideas from brainstorming sessions.
Your task is to:
1. Fetch all canvas items from the board
2. Analyze the content of sticky notes
3. Group similar ideas into meaningful clusters
4. Create descriptive labels for each cluster (e.g., "Problems", "Solutions", "Ideas", "Action Items", "Risks", etc.)
5. Return a structured JSON response with clusters

Be smart about categorization. Look for:
- Common themes and topics
- Problem statements vs solutions
- Questions vs answers
- Action items vs discussion points
- Related concepts

Format your response as a JSON object with this structure:
{
  "clusters": [
    {
      "label": "Cluster name",
      "description": "What this cluster represents",
      "itemIds": ["uuid1", "uuid2"],
      "confidence": 0.85
    }
  ],
  "summary": "Overall summary of the clustering"
}`,
      prompt: `Analyze and cluster the ideas on board ${boardId}. Group similar sticky notes together and create meaningful category labels.`,
      stopWhen: stepCountIs(5),
    });
    
    let fullText = '';
    for await (const chunk of result.textStream) {
      fullText += chunk;
    }
    
    if (!fullText.trim()) {
      throw new Error('Empty response from AI model');
    }
    
    // Strip markdown code fences if present
    let cleanText = fullText.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const usage = await result.usage;
    const processingTime = Date.now() - startTime;
    
    // Parse and validate JSON
    let parsedClusters;
    try {
      parsedClusters = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', cleanText.substring(0, 200));
      throw new Error(`Invalid JSON from AI model: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
    }
    
    // Update log with results
    await updateAIOperationLog(logId, {
      output_data: { text: fullText, usage },
      tokens_used: usage.totalTokens,
      processing_time_ms: processingTime,
      status: 'completed',
    });
    
    return {
      clusters: parsedClusters,
      usage,
    };
  } catch (error) {
    console.error('Clustering error:', error);
    throw error;
  }
}

/**
 * Idea Enhancement
 * Suggest improvements or variations on existing ideas
 */
export async function enhanceIdea(
  boardId: string,
  itemId: string,
  itemContent: string,
  userId?: string
) {
  const model = getModel();
  const startTime = Date.now();
  
  try {
    const logId = await logAIOperation(boardId, userId, 'enhance_idea', { boardId, itemId });
    
    const result = await generateText({
      model,
      tools: {
        getBoardDetails: getBoardDetailsTool,
        getCanvasItems: getCanvasItemsTool,
      },
      system: `You are a creative ideation assistant. Your task is to enhance and expand upon ideas.
When given an idea, you should:
1. Understand the board's problem statement for context
2. Analyze the existing idea
3. Suggest 3-5 specific improvements, variations, or expansions
4. Be creative but practical
5. Consider different angles: feasibility, innovation, user impact, cost-effectiveness

Return a JSON array of enhancements:
[
  {
    "title": "Short title for the enhancement",
    "description": "Detailed description of the enhancement",
    "type": "variation|improvement|expansion",
    "reasoning": "Why this enhancement is valuable"
  }
]`,
      prompt: `Enhance this idea: "${itemContent}"\n\nBoard ID: ${boardId}\nItem ID: ${itemId}\n\nProvide creative improvements and variations.`,
    });
    
    const processingTime = Date.now() - startTime;
    
    await updateAIOperationLog(logId, {
      output_data: { text: result.text, usage: result.usage },
      tokens_used: result.usage.totalTokens,
      processing_time_ms: processingTime,
      status: 'completed',
    });
    
    return {
      enhancements: JSON.parse(result.text),
      usage: result.usage,
    };
  } catch (error) {
    console.error('Enhancement error:', error);
    throw error;
  }
}

/**
 * Meeting Summarization
 * Generate action items and key insights from brainstorming sessions
 */
export async function summarizeSession(boardId: string, userId?: string) {
  const model = getModel();
  const startTime = Date.now();
  
  try {
    const logId = await logAIOperation(boardId, userId, 'summarize_session', { boardId });
    
    const result = await streamText({
      model,
      tools: agentTools,
      system: `You are an expert meeting facilitator and summarizer.
Your task is to:
1. Fetch board details and all canvas items
2. Analyze the brainstorming session content
3. Extract key insights, themes, and decisions
4. Identify actionable items
5. Provide a comprehensive summary

Return a JSON object:
{
  "summary": "Overall session summary",
  "keyInsights": [
    {
      "title": "Insight title",
      "description": "Detailed insight"
    }
  ],
  "actionItems": [
    {
      "title": "Action item",
      "description": "What needs to be done",
      "priority": "high|medium|low",
      "relatedItemIds": ["uuid1"]
    }
  ],
  "themes": ["theme1", "theme2"],
  "participantEngagement": "Summary of how active the session was",
  "nextSteps": "Recommended next steps"
}`,
      prompt: `Summarize the brainstorming session on board ${boardId}. Extract key insights, action items, and provide recommendations.`,
      stopWhen: stepCountIs(5),
    });
    
    let fullText = '';
    for await (const chunk of result.textStream) {
      fullText += chunk;
    }
    
    if (!fullText.trim()) {
      throw new Error('Empty response from AI model');
    }
    
    // Strip markdown code fences if present
    let cleanText = fullText.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const usage = await result.usage;
    const processingTime = Date.now() - startTime;
    
    // Parse and validate JSON
    let parsedSummary;
    try {
      parsedSummary = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', cleanText.substring(0, 200));
      throw new Error(`Invalid JSON from AI model: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
    }
    
    await updateAIOperationLog(logId, {
      output_data: { text: fullText, usage },
      tokens_used: usage.totalTokens,
      processing_time_ms: processingTime,
      status: 'completed',
    });
    
    return {
      summary: parsedSummary,
      usage,
    };
  } catch (error) {
    console.error('Summarization error:', error);
    throw error;
  }
}

/**
 * Sentiment Analysis
 * Track team engagement and idea momentum
 */
export async function analyzeSentiment(boardId: string, userId?: string) {
  const model = getModel();
  const startTime = Date.now();
  
  try {
    const logId = await logAIOperation(boardId, userId, 'analyze_sentiment', { boardId });
    
    const result = await streamText({
      model,
      tools: agentTools,
      system: `You are a team dynamics and sentiment analysis expert.
Your task is to:
1. Fetch all canvas items and board activity
2. Analyze the tone, energy, and engagement patterns
3. Assess idea momentum (are ideas building on each other?)
4. Evaluate collaboration quality

Return a JSON object:
{
  "overallScore": 0.75,
  "sentiment": "positive|neutral|negative",
  "engagement": "high|medium|low",
  "momentum": "increasing|stable|decreasing",
  "analysis": "Detailed analysis of team dynamics",
  "strengths": ["strength1", "strength2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "participantStats": {
    "active": 5,
    "passive": 2,
    "ideaDensity": "high"
  }
}`,
      prompt: `Analyze the sentiment and engagement on board ${boardId}. Assess team dynamics and idea momentum.`,
      stopWhen: stepCountIs(5),
    });
    
    let fullText = '';
    for await (const chunk of result.textStream) {
      fullText += chunk;
    }
    
    if (!fullText.trim()) {
      throw new Error('Empty response from AI model');
    }
    
    // Strip markdown code fences if present
    let cleanText = fullText.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const usage = await result.usage;
    const processingTime = Date.now() - startTime;
    
    // Parse and validate JSON
    let parsedSentiment;
    try {
      parsedSentiment = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', cleanText.substring(0, 200));
      throw new Error(`Invalid JSON from AI model: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
    }
    
    await updateAIOperationLog(logId, {
      output_data: { text: fullText, usage },
      tokens_used: usage.totalTokens,
      processing_time_ms: processingTime,
      status: 'completed',
    });
    
    return {
      sentiment: parsedSentiment,
      usage,
    };
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    throw error;
  }
}

/**
 * Helper: Log AI operation
 */
async function logAIOperation(
  boardId: string,
  userId: string | undefined,
  operationType: string,
  inputData: any
) {  
  const { data, error } = await supabase
    .from('ai_processing_logs')
    .insert({
      board_id: boardId,
      user_id: userId || null,
      operation_type: operationType,
      input_data: inputData,
      status: 'processing',
    } as any)
    .select('id')
    .single();
  
  if (error) {
    console.error('Failed to log AI operation:', error);
    return null;
  }
  
  return (data as any)?.id || null;
}

/**
 * Helper: Update AI operation log
 */
async function updateAIOperationLog(logId: string | null, updates: any) {
  if (!logId) return;
  
  await supabase
    .from('ai_processing_logs')
    .update(updates as any)
    .eq('id', logId);
}
