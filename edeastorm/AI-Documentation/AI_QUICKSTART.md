# AI Features - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Get Your Gemini API Key (2 minutes)

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **"Get API Key"** or **"Create API Key"**
4. Copy the generated key

### Step 2: Configure Your Environment (1 minute)

Add to your `.env.local`:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your-api-key-here
```

### Step 3: Run Database Migration (1 minute)

```bash
# Using Supabase CLI
cd edeastorm
supabase db push

# Or manually (if you have direct database access)
psql -h your-db-host -U postgres -d your-db -f supabase/migrations/008_ai_insights.sql
```

### Step 4: Restart Your Dev Server (1 minute)

```bash
npm run dev
```

### Step 5: Test It Out! 🎉

1. Open any board in Edeastorm
2. Click the **sparkle icon** (✨) in the left toolbar
3. Try **Smart Clustering** to organize your notes
4. Watch the AI magic happen!

## 📊 What Each Feature Does

### 🎯 Smart Clustering
**Perfect for:** Messy brainstorms with lots of sticky notes
- Groups similar ideas automatically
- Creates category labels (Problems, Solutions, Ideas, etc.)
- Shows confidence scores

**Try it when:**
- You have 10+ sticky notes
- Ideas seem scattered
- You need to organize before a presentation

---

### 💡 Idea Enhancement  
**Perfect for:** Getting unstuck or improving specific ideas
- Generates 3-5 enhancement suggestions
- Provides variations and improvements
- Explains why each suggestion is valuable

**Try it when:**
- An idea needs more depth
- You're stuck on one concept
- You need alternative approaches

---

### 📄 Session Summary
**Perfect for:** End of brainstorming or meeting notes
- Extracts key insights and themes
- Identifies action items with priorities
- Suggests next steps

**Try it when:**
- Wrapping up a session
- Creating meeting notes
- Sharing outcomes with team

---

### 📊 Engagement Analysis
**Perfect for:** Understanding team dynamics
- Analyzes sentiment and engagement
- Tracks idea momentum
- Provides improvement tips

**Try it when:**
- Session felt off
- Want to improve facilitation
- Measuring team participation

## 💰 Cost Expectations

Gemini 2.5 Flash is extremely affordable:

- **Per Analysis:** $0.001 - $0.0035 (less than a penny!)
- **Per Active User/Month:** $0.50 - $2.00
- **100 Users/Month:** ~$50 - $200

Example: Running all 4 AI features on a board with 50 notes costs about **$0.01**.

## 🛠️ Troubleshooting

### "AI service not configured"
→ Check your `.env.local` has `GOOGLE_GENERATIVE_AI_API_KEY`

### "Failed to fetch canvas items"
→ Run the database migration (`008_ai_insights.sql`)

### AI results seem generic
→ Add a detailed **problem statement** to your board for better context

### Slow performance
→ Normal for first run! Subsequent requests are faster. Large boards (100+ notes) may take 30-60 seconds.

## 🎯 Pro Tips

1. **Set Problem Statements:** Give AI context about what you're trying to solve
2. **Run Clustering First:** Organize before enhancing or summarizing
3. **Iterate:** Run features multiple times as your board evolves
4. **Review & Refine:** AI suggestions are starting points, not final answers
5. **Export Results:** Copy summaries for documentation

## 📚 Full Documentation

For detailed information, see [AI_FEATURES.md](./AI_FEATURES.md)

## 🤝 Need Help?

1. Check the troubleshooting section above
2. Read the full documentation
3. Review the [startup strategy](./startup-strategy.md) for product context
4. Open a GitHub issue

## 🎨 What's Next?

Future enhancements we're considering:
- Real-time AI suggestions as you type
- Custom AI prompts per board
- Export to PDF/Notion
- Multi-language support
- Voice-to-note with AI transcription

Enjoy your AI-powered ideation! ✨
