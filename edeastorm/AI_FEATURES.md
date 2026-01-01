# AI Features Documentation

## Overview

Edeastorm now includes powerful AI capabilities powered by Google's Gemini 2.5 Flash model through Vercel's AI SDK. These features help teams analyze, organize, and extract insights from their ideation sessions.

## Features

### 1. **Smart Idea Clustering** 🎯
Automatically groups similar ideas and creates meaningful category labels.

**What it does:**
- Analyzes all sticky notes on the canvas
- Identifies common themes and patterns
- Groups related ideas together
- Creates descriptive labels (e.g., "Problems", "Solutions", "Ideas", "Action Items", "Risks")
- Provides confidence scores for each cluster

**Use cases:**
- Organizing chaotic brainstorming sessions
- Identifying problem areas vs solutions
- Grouping action items for follow-up
- Finding common themes across discussions

### 2. **Idea Enhancement** 💡
Suggests improvements, variations, and expansions on existing ideas.

**What it does:**
- Analyzes individual ideas in context of the board's problem statement
- Generates 3-5 specific enhancement suggestions
- Provides variations, improvements, and expansions
- Explains the reasoning behind each suggestion

**Use cases:**
- Breaking through creative blocks
- Expanding on promising concepts
- Finding alternative approaches
- Improving feasibility of ideas

### 3. **Session Summarization** 📄
Generates comprehensive summaries with key insights and action items.

**What it does:**
- Analyzes the entire brainstorming session
- Extracts key insights and themes
- Identifies actionable items with priority levels
- Provides recommended next steps
- Assesses participant engagement

**Use cases:**
- Creating meeting notes
- Sharing outcomes with stakeholders
- Tracking decisions made
- Planning follow-up actions

### 4. **Engagement Analysis** 📊
Tracks team dynamics, idea momentum, and collaboration quality.

**What it does:**
- Analyzes sentiment and tone of contributions
- Measures team engagement levels
- Tracks idea momentum (building vs stagnant)
- Identifies collaboration strengths
- Provides improvement recommendations

**Use cases:**
- Understanding team dynamics
- Measuring session effectiveness
- Identifying facilitation opportunities
- Improving future sessions

## Setup

### 1. Get a Google AI API Key

1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Get API Key" or "Create API Key"
4. Copy the generated API key

### 2. Configure Environment Variables

Add to your `.env.local` file:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key-here
```

### 3. Run Database Migration

Apply the AI features migration:

```bash
# If using Supabase CLI
supabase db push

# Or manually run the migration
psql -h your-db-host -U postgres -d your-db -f supabase/migrations/008_ai_insights.sql
```

This creates:
- `ai_insights` - Stores AI-generated insights
- `ai_processing_logs` - Tracks API usage and performance
- `ai_feedback` - Collects user feedback on AI outputs
- Helper views for analytics

## Usage

### Accessing AI Features

1. Open any board in Edeastorm
2. Look for the **AI Insights** button in the toolbar (sparkle icon with purple gradient)
3. Click to open the AI Insights modal

### Running AI Analysis

1. **Choose a Feature**: Click on any of the four AI feature cards
2. **Wait for Processing**: The AI will analyze your board (typically 5-30 seconds)
3. **Review Results**: Results appear below the feature cards
4. **Run Multiple**: You can run multiple features to get comprehensive insights

### Understanding Results

#### Clustering Results
- Shows grouped ideas with labels
- Displays number of items per cluster
- Includes confidence scores
- Provides overall summary

#### Enhancement Results
- Lists 3-5 enhancement suggestions
- Tags suggestions by type (variation/improvement/expansion)
- Explains reasoning for each suggestion
- Ready to implement on canvas

#### Summary Results
- Overview of the session
- Key insights extracted
- Action items with priority levels
- Themes identified
- Next steps recommended

#### Sentiment Results
- Overall engagement score (0-100%)
- Sentiment classification (positive/neutral/negative)
- Engagement level (high/medium/low)
- Momentum indicator (increasing/stable/decreasing)
- Detailed analysis with strengths and recommendations

## Technical Details

### Architecture

```
User Interface (AIInsightsModal.tsx)
         ↓
API Routes (/api/ai/*)
         ↓
AI Services (ai-services.ts)
         ↓
Vercel AI SDK + Gemini 2.5 Flash
         ↓
Supabase (data + storage)
```

### Agent Mode with Tools

The AI uses "agent mode" which allows it to:
1. Query the database for board details and canvas items
2. Access board images and metadata
3. Make informed decisions based on actual data
4. Store insights back to the database

Available tools:
- `getCanvasItems` - Fetches all notes and content
- `getBoardDetails` - Gets board context and problem statement
- `getBoardImages` - Retrieves associated images
- `saveInsight` - Stores AI-generated insights

### API Endpoints

- `POST /api/ai/cluster` - Cluster ideas
- `POST /api/ai/enhance` - Enhance an idea
- `POST /api/ai/summarize` - Summarize session
- `POST /api/ai/sentiment` - Analyze sentiment

All endpoints require authentication and return:
```json
{
  "success": true,
  "data": {
    "result": "...",
    "usage": {
      "totalTokens": 1234,
      "promptTokens": 890,
      "completionTokens": 344
    }
  }
}
```

### Database Schema

#### ai_insights
Stores all AI-generated insights:
- `id` - UUID primary key
- `board_id` - Reference to board
- `insight_type` - Type of insight (cluster/summary/enhancement/sentiment_analysis)
- `title` - Optional title
- `content` - Main insight content (JSON)
- `metadata` - Additional structured data
- `status` - active/archived/applied
- `created_by` - User who triggered the insight
- `created_at` / `updated_at` - Timestamps

#### ai_processing_logs
Tracks all AI operations for monitoring and billing:
- `id` - UUID primary key
- `board_id` - Reference to board
- `user_id` - User who triggered
- `operation_type` - Type of operation
- `input_data` - Request parameters
- `output_data` - Response data
- `tokens_used` - API usage
- `processing_time_ms` - Performance metric
- `status` - pending/processing/completed/failed
- `error_message` - If failed
- `created_at` - Timestamp

#### ai_feedback
Collects user feedback:
- `id` - UUID primary key
- `insight_id` - Reference to insight
- `user_id` - User providing feedback
- `rating` - 1-5 stars
- `feedback_type` - helpful/not_helpful/inaccurate/excellent
- `comment` - Optional text feedback
- `created_at` - Timestamp

### Performance Considerations

- **Token Usage**: Gemini 2.5 Flash is optimized for cost-effectiveness
- **Rate Limits**: Implement rate limiting per user/board
- **Caching**: Consider caching results for frequently accessed boards
- **Timeouts**: Set appropriate timeouts for long-running operations
- **Error Handling**: Graceful degradation if API is unavailable

### Cost Estimation

Gemini 2.5 Flash pricing (as of Dec 2025):
- Input: $0.075 per 1M tokens
- Output: $0.30 per 1M tokens

Typical usage per operation:
- Clustering: ~2,000-5,000 tokens (~$0.001-0.002)
- Enhancement: ~1,500-3,000 tokens (~$0.0007-0.0015)
- Summarization: ~3,000-7,000 tokens (~$0.0015-0.0035)
- Sentiment: ~2,000-4,000 tokens (~$0.001-0.002)

Average cost per active user per month: $0.50-2.00

## Best Practices

### For Users

1. **Provide Context**: Use the problem statement feature to give AI context
2. **Run Clustering Early**: Organize ideas before they get overwhelming
3. **Iterate**: Run AI features multiple times as your session evolves
4. **Review Results**: AI is a tool, not a replacement for human judgment
5. **Export Insights**: Save AI summaries for documentation

### For Developers

1. **Monitor Usage**: Track token consumption and costs
2. **Set Limits**: Implement per-user/per-board rate limits
3. **Error Handling**: Provide clear error messages to users
4. **Logging**: Use the processing logs for debugging
5. **Feedback Loop**: Collect and analyze user feedback
6. **Testing**: Test with various board sizes and content types

## Troubleshooting

### AI Features Not Working

**Check:**
1. Is `GOOGLE_GENERATIVE_AI_API_KEY` set in `.env.local`?
2. Is the API key valid? (Test in Google AI Studio)
3. Check browser console for errors
4. Check server logs for API errors
5. Verify database migration was applied

### Slow Performance

**Solutions:**
1. Reduce canvas item count if possible
2. Check network connectivity
3. Verify Gemini API status
4. Check database query performance
5. Consider implementing result caching

### Inaccurate Results

**Improvements:**
1. Add more detailed problem statements
2. Use clearer note content
3. Run clustering before enhancement/summarization
4. Provide feedback through the UI
5. Try running the analysis again

### Database Errors

**Check:**
1. Migration was applied successfully
2. RLS policies allow access
3. User has proper permissions
4. Connection to Supabase is stable

## Future Enhancements

Potential improvements:
- [ ] Real-time collaborative AI suggestions
- [ ] Custom AI prompts per board
- [ ] Export AI insights to PDF/Notion
- [ ] AI-powered search across boards
- [ ] Automatic tagging of ideas
- [ ] Integration with project management tools
- [ ] Voice-to-note with AI summarization
- [ ] Trend analysis across multiple sessions
- [ ] AI meeting facilitator
- [ ] Multi-language support

## Support

For issues or questions:
1. Check this documentation
2. Review the startup-strategy.md for product context
3. Check GitHub issues
4. Contact support team

## License

AI features are part of Edeastorm and follow the same license.
