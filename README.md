# D-GEN - Personalized AI Learning Platform

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Enabled-green.svg)](https://supabase.com/)
[![Lovable AI](https://img.shields.io/badge/Lovable%20AI-Integrated-purple.svg)](https://lovable.dev/)

**D-GEN** is an AI-powered personalized learning platform that helps students master History and Geography through adaptive teaching personas, interactive quizzes, and social gamification. Built with React, TypeScript, and powered by Lovable Cloud (Supabase) and Google Gemini AI.

🌐 **Live Demo**: [https://lovable.dev/projects/123cafcd-6788-4395-a313-2ae16590396b](https://lovable.dev/projects/123cafcd-6788-4395-a313-2ae16590396b)

---

## 📋 Table of Contents

- [Core Features](#-core-features)
- [Tech Stack](#-tech-stack)
- [Technical Feasibility](#-technical-feasibility)
- [Business Needs Met](#-business-needs-met)
- [Getting Started](#-getting-started)
- [Database Schema](#-database-schema)
- [Edge Functions](#-edge-functions)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)

---

## ✨ Core Features

### 🎓 Learning Experience

#### **AI Teaching Personas**
- **Gen-Z Persona**: Casual, relatable teaching style with modern slang and emojis
- **Personal Persona**: Adaptive, empathetic approach based on user's age and location
- **Classic Persona**: Formal, traditional academic teaching style
- **Feedback Loop**: User feedback improves persona adaptation over time

#### **Subject-Focused Learning**
- Specialized in **History** and **Geography**
- Context-aware AI responses based on conversation history
- Multi-turn conversations with memory retention
- Real-time streaming chat interface

#### **Content Integration**
- **Textbook Upload**: Upload PDFs to enhance AI responses with personal study materials
- **Textbook Chunking**: Efficient retrieval and context integration
- **Markdown Support**: Rich formatting for educational content
- **Image Generation**: Geography-specific visuals (diagrams for chapters, realistic photos for subtopics)

### 📊 Assessment & Progress

#### **AI-Generated Quizzes**
- Contextual quiz generation based on conversation topics
- Multiple-choice questions with instant feedback
- Review mode to revisit past quizzes
- Score tracking and performance analytics

#### **Progress Tracking**
- Subject-specific progress monitoring
- Activity charts showing engagement over time
- Quiz score trend analysis
- Topic coverage tracking
- Points-based achievement system

### 👥 Social & Gamification

#### **Friend System**
- Send and accept friend requests via email lookup
- View friends' learning activity
- Track friends' progress and achievements

#### **Leaderboard**
- **Overall Leaderboard**: Top performers by total points
- **Content Leaderboard**: Most active learners by message count
- **Activity Leaderboard**: Recent learning streaks
- Competitive learning environment

### 🔐 User Management

#### **Authentication**
- Email/password authentication
- Auto-confirm email signups (development-friendly)
- Secure session management with Supabase Auth
- Protected routes and API endpoints

#### **Profile Management**
- Customizable user profiles (name, age, location)
- Persona personalization based on demographics
- Conversation history management
- Account deletion with cascade cleanup

#### **Billing & Plans**
- **Basic Plan** (Free):
  - Limited features
  - Basic support
  - 5 searches per day
  
- **Pro Plan** (Premium):
  - Unlimited AI prompts
  - Advanced features (AR/VR, 3D models)
  - Priority support
  - Advanced analytics

### 📈 Analytics & Insights

- **Activity Charts**: 7-day engagement visualization
- **Subject Distribution**: Time allocation across subjects
- **Quiz Performance**: Score trends and improvement tracking
- **Progress Dashboard**: Comprehensive overview of learning journey

---

## 🛠 Tech Stack

### **Frontend**

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.3.1 | UI library |
| TypeScript | 5.x | Type safety |
| Vite | Latest | Build tool & dev server |
| Tailwind CSS | 3.x | Utility-first styling |
| shadcn/ui | Latest | Component library (Radix UI) |
| React Router DOM | 6.30.1 | Client-side routing |
| TanStack Query | 5.83.0 | Data fetching & caching |
| React Hook Form | 7.61.1 | Form management |
| Zod | 3.25.76 | Schema validation |
| Recharts | 2.15.4 | Data visualization |
| React Markdown | 10.1.0 | Markdown rendering |
| Lucide React | 0.462.0 | Icon library |

### **Backend (Lovable Cloud / Supabase)**

| Service | Technology | Purpose |
|---------|-----------|---------|
| Database | PostgreSQL 15+ | Relational data storage |
| Authentication | Supabase Auth | User management & sessions |
| Storage | Supabase Storage | File uploads (textbooks) |
| API | Supabase Client | Database queries & real-time |
| Edge Functions | Deno Runtime | Serverless backend logic |
| Security | Row-Level Security (RLS) | Fine-grained access control |

### **AI Integration**

| Component | Technology | Purpose |
|-----------|-----------|---------|
| AI Gateway | Lovable AI | API key management & routing |
| Chat Model | Google Gemini 2.5 Flash | Text generation & conversations |
| Image Model | Gemini 2.5 Flash Image Preview | Geography visual generation |
| Quiz Generation | Google Gemini 2.5 Flash | Contextual quiz creation |

---

## 🔍 Technical Feasibility

### **Strengths**

✅ **Modern, Scalable Architecture**
- Serverless edge functions auto-scale with traffic
- PostgreSQL handles millions of records efficiently
- React 18 with concurrent features for smooth UX
- TypeScript ensures type safety and reduces runtime errors

✅ **Secure by Design**
- Row-Level Security (RLS) on all database tables
- API keys never exposed to client
- Edge functions run in isolated Deno environments
- Authentication tokens stored securely in localStorage

✅ **AI-Powered Without Complexity**
- Lovable AI Gateway abstracts provider management
- No user API keys required
- Automatic fallback and retry logic
- Streaming responses for real-time feedback

✅ **Developer Experience**
- Hot module replacement with Vite
- Component library with shadcn/ui
- Automated database migrations
- Type-safe database queries

### **Architecture Decisions**

#### **Edge Functions for AI Communication**
```
Client → Supabase Edge Function → Lovable AI Gateway → Google Gemini
```
- **Why**: Keeps API keys secure, enables server-side logic
- **Trade-off**: Slight latency increase vs. direct API calls
- **Benefit**: Centralized error handling, rate limiting, logging

#### **Service Role Key Usage**
- Used only in edge functions for admin-level operations
- Never exposed to client-side code
- Enables cross-user data aggregation (leaderboards)

#### **Textbook Chunking Strategy**
- Split textbooks into manageable chunks
- Store metadata separately from content
- Enable efficient context retrieval for AI
- **Current Limitation**: Placeholder-based (PDF parsing library too large for edge functions)

#### **Persona Feedback Loop**
```sql
conversation_feedback → persona adaptation → improved responses
```
- Feedback stored per conversation
- Influences future persona behavior
- Enables continuous improvement

#### **Geography Image Generation Logic**
```typescript
if (isChapter) generate_diagram()
else generate_realistic_photo()
```
- Chapters get conceptual diagrams
- Subtopics get realistic photographs
- Reduces image generation costs

### **Scalability Considerations**

| Component | Current Limit | Scaling Strategy |
|-----------|--------------|------------------|
| Database | ~500GB free tier | Upgrade to Pro plan, connection pooling |
| Storage | 1GB free tier | Upgrade plan, implement CDN |
| Edge Functions | 500K invocations/month | Optimize calls, batch operations |
| AI Requests | Usage-based pricing | Rate limiting, caching responses |

### **Current Limitations & Roadmap**

⚠️ **Known Limitations**:
1. **PDF Parsing**: Placeholder implementation (requires heavy libraries like pdf-parse)
2. **Friend Search**: Email-only lookup (could add username search)
3. **Payment Processing**: Billing page is UI-only (needs Stripe integration)
4. **Textbook Context**: Limited chunk retrieval (could implement vector search)
5. **Offline Mode**: Requires internet connection
6. **Mobile App**: Web-only (could wrap with Capacitor/React Native)

🚀 **Future Enhancements**:
- Vector embeddings for semantic textbook search
- Real-time multiplayer study sessions
- Spaced repetition algorithm for quizzes
- Voice-to-text for accessibility
- Integration with school LMS platforms
- Parent/teacher dashboard

---

## 💼 Business Needs Met

### **1. Personalized Learning**
**Need**: Students learn differently and need adaptive content delivery.

**Solution**:
- 3 distinct teaching personas (Gen-Z, Personal, Classic)
- Age and location-based personalization
- Conversation history informs responses
- User feedback improves future interactions

**Impact**: Higher engagement, better retention, improved outcomes

---

### **2. Student Engagement**
**Need**: Traditional learning is passive and boring for digital natives.

**Solution**:
- Gamification with points and leaderboards
- Social features (friends, competition)
- Visual learning with AI-generated images
- Interactive quizzes with instant feedback

**Impact**: Increased time-on-platform, reduced dropout rates

---

### **3. Assessment & Mastery**
**Need**: Students need frequent, low-stakes practice to master subjects.

**Solution**:
- AI-generated quizzes based on conversation topics
- Immediate feedback with explanations
- Score tracking and trend analysis
- Review mode for missed questions

**Impact**: Better exam preparation, knowledge retention

---

### **4. Content Integration**
**Need**: Students want to study from their actual textbooks, not generic content.

**Solution**:
- Textbook upload functionality
- Chunking and context integration
- AI responses grounded in uploaded materials
- Subject-specific organization

**Impact**: Relevant, exam-focused learning

---

### **5. Progress Tracking**
**Need**: Students and educators need visibility into learning progress.

**Solution**:
- Activity charts (7-day engagement)
- Subject distribution analysis
- Quiz performance trends
- Topic coverage tracking

**Impact**: Data-driven learning decisions, early intervention

---

### **6. Accessibility & Adoption**
**Need**: Low barrier to entry, freemium model for market penetration.

**Solution**:
- Free Basic plan with core features
- Email/password auth (no social login required)
- Web-based (no installation needed)
- Clear upgrade path to Pro

**Impact**: Rapid user acquisition, conversion funnel

---

### **Target Market Value**

#### **Primary Users**
- **High school students** (14-18 years) studying History/Geography
- **College students** needing supplemental tutoring
- **Self-learners** preparing for competitive exams
- **Gen-Z learners** seeking relatable educational content

#### **Secondary Users**
- **Teachers** looking for student engagement tools
- **Parents** wanting progress visibility
- **Educational institutions** needing scalable tutoring

#### **Market Differentiators**
1. **Persona-based teaching** vs. generic AI tutors
2. **Social gamification** vs. solo learning platforms
3. **Textbook integration** vs. generic content libraries
4. **Real-time feedback** vs. delayed grading

#### **Revenue Model**
```
Free Basic Plan → Conversion Triggers → Pro Plan ($X/month)

Conversion Triggers:
- Unlimited AI prompts
- Advanced features (AR/VR, 3D models)
- Priority support
- Advanced analytics
```

**Projected Metrics**:
- Target: 10% free-to-paid conversion rate
- Average session: 20+ minutes
- Retention: 60%+ monthly active users

---

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ and npm
- Git

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/d-gen.git
   cd d-gen
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   The `.env` file is auto-generated by Lovable Cloud with these variables:
   ```env
   VITE_SUPABASE_URL=https://junbphbroxdqsnniodmr.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   VITE_SUPABASE_PROJECT_ID=junbphbroxdqsnniodmr
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   ```
   http://localhost:5173
   ```

### **First-Time Setup**

1. **Create an account**: Navigate to `/signup` and register
2. **Choose a subject**: Select History or Geography from the dashboard
3. **Start chatting**: Engage with AI in your preferred persona
4. **Upload textbooks** (optional): Upload PDFs for personalized context
5. **Take quizzes**: Generate quizzes from your conversations
6. **Add friends**: Connect with peers via email

---

## 🗄 Database Schema

### **Tables Overview**

| Table | Purpose | RLS Enabled |
|-------|---------|-------------|
| `profiles` | User information (name, age, location) | ✅ |
| `subjects` | Learning subjects (History, Geography) | ✅ (Public read) |
| `conversations` | Chat sessions per subject | ✅ |
| `messages` | Chat messages with AI responses | ✅ |
| `textbooks` | Uploaded textbook metadata | ✅ |
| `textbook_chunks` | Textbook content chunks | ✅ |
| `quizzes` | Quiz metadata and scores | ✅ |
| `quiz_questions` | Individual quiz questions | ✅ |
| `conversation_feedback` | Persona feedback from users | ✅ |
| `friendships` | Accepted friend connections | ✅ |
| `friend_requests` | Pending friend invitations | ✅ |
| `user_activity` | Activity log for points & leaderboard | ✅ |
| `user_progress` | Subject-specific progress tracking | ✅ |

### **Key Relationships**

```
profiles (1) ─── (N) conversations
conversations (1) ─── (N) messages
conversations (1) ─── (N) quizzes
quizzes (1) ─── (N) quiz_questions
textbooks (1) ─── (N) textbook_chunks
profiles (N) ─── (N) friendships
```

### **Database Functions**

- `handle_new_user()`: Auto-creates profile on signup
- `update_updated_at_column()`: Timestamp trigger
- `update_user_progress_from_activity()`: Tracks topics and messages

### **Row-Level Security (RLS)**

All tables enforce RLS policies:
- Users can only view/edit their own data
- Friends can view each other's activity
- Public read access for `subjects` table

---

## ⚡ Edge Functions

### **`/chat`** (AI Conversation)
**Input**:
```json
{
  "message": "Explain the French Revolution",
  "conversationId": "uuid",
  "persona": "classic",
  "feedback": "more_detailed"
}
```

**Output**:
```json
{
  "response": "The French Revolution (1789-1799) was...",
  "generatedImages": []
}
```

**AI Model**: Google Gemini 2.5 Flash

---

### **`/generate-quiz`** (Quiz Creation)
**Input**:
```json
{
  "conversationId": "uuid",
  "difficulty": "medium"
}
```

**Output**:
```json
{
  "quizId": "uuid",
  "questions": [
    {
      "question": "What year did the French Revolution begin?",
      "options": ["1789", "1776", "1799", "1804"],
      "correctAnswer": "1789"
    }
  ]
}
```

**AI Model**: Google Gemini 2.5 Flash

---

### **`/process-textbook`** (Textbook Upload)
**Input**:
```json
{
  "userId": "uuid",
  "subjectId": "uuid",
  "title": "World History Textbook",
  "fileUrl": "https://storage.supabase.co/...",
  "fileName": "history.pdf"
}
```

**Output**:
```json
{
  "textbookId": "uuid",
  "chunksCreated": 15
}
```

**Note**: Currently uses placeholder text (PDF parsing not implemented)

---

### **`/delete-account`** (Account Deletion)
**Input**: None (uses authenticated user)

**Output**:
```json
{
  "message": "Account deleted successfully"
}
```

**Cascade Deletes**: Profiles, conversations, messages, quizzes, textbooks, friendships, activity

---

## 📁 Project Structure

```
d-gen/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── ActivityChart.tsx
│   │   ├── AppSidebar.tsx
│   │   ├── ConversationSelector.tsx
│   │   ├── FeedbackDialog.tsx
│   │   ├── FriendsManager.tsx
│   │   ├── Leaderboard.tsx
│   │   ├── QuizDialog.tsx
│   │   ├── QuizResults.tsx
│   │   ├── SubjectDistributionChart.tsx
│   │   ├── SubjectProgress.tsx
│   │   ├── TextbookSelector.tsx
│   │   ├── TextbooksList.tsx
│   │   └── UploadTextbookDialog.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   │   └── useChat.ts
│   ├── integrations/       # Third-party integrations
│   │   └── supabase/
│   │       ├── client.ts   # Auto-generated
│   │       └── types.ts    # Auto-generated
│   ├── pages/              # Route components
│   │   ├── Billing.tsx
│   │   ├── Chat.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Landing.tsx
│   │   ├── Login.tsx
│   │   ├── NotFound.tsx
│   │   ├── Profile.tsx
│   │   └── Signup.tsx
│   ├── lib/                # Utility functions
│   │   └── utils.ts
│   ├── App.tsx             # Root component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── supabase/
│   ├── functions/          # Edge functions
│   │   ├── chat/
│   │   ├── generate-quiz/
│   │   ├── process-textbook/
│   │   └── delete-account/
│   ├── migrations/         # Database migrations (auto-generated)
│   └── config.toml         # Supabase configuration
├── public/                 # Static assets
├── .env                    # Environment variables (auto-generated)
├── tailwind.config.ts      # Tailwind configuration
├── vite.config.ts          # Vite configuration
└── package.json            # Dependencies
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### **Code Style**
- Follow TypeScript best practices
- Use ESLint configuration
- Write meaningful commit messages
- Add comments for complex logic

### **Testing**
- Test all user flows manually
- Verify RLS policies in Supabase dashboard
- Check edge function logs for errors
- Validate responsive design on mobile

---

## 📄 License

This project is part of the Lovable platform. See [Lovable Terms](https://lovable.dev/terms) for details.

---

## 🔗 Links

- **Project Dashboard**: [https://lovable.dev/projects/123cafcd-6788-4395-a313-2ae16590396b](https://lovable.dev/projects/123cafcd-6788-4395-a313-2ae16590396b)
- **Lovable Docs**: [https://docs.lovable.dev/](https://docs.lovable.dev/)
- **Supabase Docs**: [https://supabase.com/docs](https://supabase.com/docs)
- **React Docs**: [https://react.dev/](https://react.dev/)
- **Tailwind CSS**: [https://tailwindcss.com/](https://tailwindcss.com/)

---

## 💡 Support

For issues or questions:
- Open an issue on GitHub
- Contact via Lovable support
- Check [Lovable Discord community](https://discord.com/channels/1119885301872070706/1280461670979993613)

---

**Built with ❤️ using Lovable, React, and AI**
