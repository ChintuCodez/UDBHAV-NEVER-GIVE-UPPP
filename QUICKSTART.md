# 🚀 Quick Start Guide

Get your AI Peer Review Platform up and running in minutes!

## Prerequisites
- Node.js 18+ installed
- OpenAI API key (get one at [platform.openai.com](https://platform.openai.com))

## 1. Clone and Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd ai-peer-review-platform

# Run the automated setup
npm run setup
```

## 2. Configure Environment
Edit `.env.local` and add your OpenAI API key:
```env
OPENAI_API_KEY="sk-your-actual-api-key-here"
```

## 3. Start the Application
```bash
npm run dev
```

## 4. Open Your Browser
Navigate to `http://localhost:3000`

## 5. Create Your First Account
1. Click "Get Started" on the homepage
2. Fill out the registration form
3. Sign in with your new account

## 6. Submit Your First Review
1. Go to Dashboard → "New Submission"
2. Upload a code file or paste text
3. Watch the AI analyze your submission
4. View detailed feedback and scores

## 🎯 What You Can Do

### For Students
- **Submit Code**: Upload JavaScript, Python, Java, or other code files
- **Submit Documents**: Upload PDFs, Word docs, or plain text
- **Get AI Feedback**: Receive detailed analysis and suggestions
- **Track Progress**: View analytics and improvement over time

### For Instructors
- **Review Submissions**: Access all student work
- **AI Insights**: Leverage AI analysis for grading
- **Analytics**: Monitor class performance
- **Peer Reviews**: Manage the review process

## 🔧 Troubleshooting

### Common Issues

**"OpenAI API Error"**
- Check your API key in `.env.local`
- Ensure you have credits in your OpenAI account

**"Database Error"**
- Run `npm run db:push` to sync the database
- Check that SQLite is working properly

**"File Upload Issues"**
- Ensure the `uploads/` directory exists
- Check file size limits (10MB max)

### Getting Help
- Check the full [README.md](README.md) for detailed documentation
- Review the console logs for error messages
- Ensure all dependencies are installed with `npm install`

## 🚀 Next Steps

1. **Customize the AI prompts** in `lib/ai-service.ts`
2. **Add more file types** by updating the file upload configuration
3. **Deploy to production** using Vercel, Netlify, or your preferred platform
4. **Integrate with your LMS** using the API endpoints

## 📊 Features Overview

- ✅ **AI-Powered Analysis** - GPT-4 code and text analysis
- ✅ **Plagiarism Detection** - Advanced similarity checking
- ✅ **Interactive Dashboard** - Beautiful, responsive UI
- ✅ **Real-time Feedback** - Instant AI-generated suggestions
- ✅ **Analytics** - Performance tracking and insights
- ✅ **File Upload** - Support for multiple file types
- ✅ **Authentication** - Secure user management
- ✅ **Monaco Editor** - Built-in code editor

---

**Need more help?** Check the full documentation in [README.md](README.md) or create an issue in the repository.

