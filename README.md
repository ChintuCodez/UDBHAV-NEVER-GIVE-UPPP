# AI-Driven Peer Review Platform

A comprehensive full-stack web application that leverages advanced AI technology for intelligent code and document analysis, plagiarism detection, and automated peer review generation.

## 🚀 Features

### Core AI Capabilities
- **Advanced Code Analysis**: GPT-4 powered analysis of code quality, complexity, maintainability, and performance
- **Intelligent Text Analysis**: Comprehensive evaluation of readability, grammar, structure, and clarity
- **Plagiarism Detection**: Sophisticated similarity checking using advanced algorithms
- **Automated Feedback Generation**: AI-generated constructive feedback with actionable suggestions

### Platform Features
- **Real-time Collaboration**: Live updates and notifications for peer reviews
- **Interactive Dashboard**: Comprehensive analytics and submission management
- **File Upload System**: Support for multiple file types (code, documents, presentations)
- **Monaco Code Editor**: Built-in code editor with syntax highlighting
- **Advanced Analytics**: Detailed performance metrics and improvement tracking
- **User Authentication**: Secure login system with role-based access control

### Technical Stack
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (easily configurable for PostgreSQL/MySQL)
- **AI Integration**: OpenAI GPT-4 and GPT-3.5 Turbo
- **Authentication**: NextAuth.js
- **UI Components**: Headless UI, Framer Motion, Recharts
- **Code Editor**: Monaco Editor
- **File Processing**: Multer, PDF-parse, Mammoth

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenAI API key

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ai-peer-review-platform
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# OpenAI
OPENAI_API_KEY="your-openai-api-key-here"

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760

# Plagiarism Detection
SIMILARITY_THRESHOLD=0.8
```

### 4. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# (Optional) Seed the database
npx prisma db seed
```

### 5. Start the Development Server
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
ai-peer-review-platform/
├── app/                          # Next.js 14 App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── analytics/            # Analytics data
│   │   ├── submissions/          # Submission management
│   │   └── analyze/              # AI analysis endpoints
│   ├── auth/                     # Authentication pages
│   ├── dashboard/                # Main application pages
│   │   ├── analytics/            # Analytics dashboard
│   │   ├── submit/               # Submission form
│   │   └── submissions/          # Submission details
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/                   # Reusable components
├── lib/                          # Utility libraries
│   ├── auth.ts                   # NextAuth configuration
│   └── ai-service.ts             # AI analysis service
├── prisma/                       # Database schema
│   └── schema.prisma
├── types/                        # TypeScript type definitions
├── public/                       # Static assets
└── uploads/                      # File upload directory
```

## 🔧 Configuration

### Database Configuration
The application uses SQLite by default for easy setup. To use PostgreSQL or MySQL:

1. Update the `DATABASE_URL` in your `.env.local`
2. Change the provider in `prisma/schema.prisma`
3. Run `npx prisma db push`

### AI Service Configuration
The AI service uses OpenAI's GPT models. To configure:

1. Get an API key from [OpenAI](https://platform.openai.com)
2. Add it to your `.env.local` file
3. The service will automatically use the appropriate model for each task

### File Upload Configuration
- Supported file types: `.js`, `.ts`, `.py`, `.java`, `.html`, `.css`, `.txt`, `.pdf`, `.doc`, `.docx`
- Maximum file size: 10MB (configurable)
- Files are stored in the `uploads/` directory

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms
The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 📊 Usage

### For Students
1. **Sign Up**: Create an account with your email
2. **Submit Work**: Upload code or documents for review
3. **View Analysis**: Get detailed AI feedback and scores
4. **Track Progress**: Monitor improvement through analytics

### For Instructors
1. **Review Submissions**: Access all student submissions
2. **AI Insights**: Leverage AI analysis for grading
3. **Analytics**: View class performance metrics
4. **Manage Reviews**: Oversee peer review process

## 🔒 Security Features

- **Authentication**: Secure user authentication with NextAuth.js
- **Authorization**: Role-based access control
- **Data Validation**: Input validation with Zod schemas
- **File Security**: Secure file upload and processing
- **API Protection**: Protected API routes with session validation

## 🤖 AI Capabilities

### Code Analysis
- **Quality Assessment**: Evaluates code structure, best practices, and maintainability
- **Complexity Analysis**: Measures cyclomatic complexity and cognitive load
- **Performance Review**: Identifies potential performance bottlenecks
- **Security Scan**: Basic security vulnerability detection

### Text Analysis
- **Readability Score**: Flesch-Kincaid and other readability metrics
- **Grammar Check**: Advanced grammar and syntax analysis
- **Structure Evaluation**: Document organization and flow assessment
- **Clarity Analysis**: Content clarity and coherence evaluation

### Plagiarism Detection
- **Similarity Matching**: Advanced text similarity algorithms
- **Source Attribution**: Identifies potential sources of copied content
- **Confidence Scoring**: Provides confidence levels for matches
- **Detailed Reports**: Comprehensive similarity analysis reports

## 📈 Analytics & Reporting

- **Performance Metrics**: Track improvement over time
- **Score Distribution**: Visualize performance across submissions
- **Trend Analysis**: Identify patterns and growth areas
- **Quality Insights**: Detailed breakdown of strengths and weaknesses

## 🛠️ Development

### Running Tests
```bash
npm run test
```

### Linting
```bash
npm run lint
```

### Type Checking
```bash
npm run type-check
```

### Database Management
```bash
# View database in Prisma Studio
npx prisma studio

# Reset database
npx prisma db push --force-reset
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation
- Review the FAQ section

## 🔮 Future Enhancements

- **Real-time Collaboration**: Live editing and commenting
- **Advanced AI Models**: Integration with additional AI services
- **Mobile App**: React Native mobile application
- **API Integration**: Third-party tool integrations
- **Advanced Analytics**: Machine learning insights
- **Team Management**: Group and team features

---

Built with ❤️ using Next.js, TypeScript, and OpenAI

