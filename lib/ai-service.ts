import OpenAI from 'openai'
import { PrismaClient } from '@prisma/client'
import { diffLines } from 'diff'

const prisma = new PrismaClient()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface CodeAnalysis {
  quality: number
  complexity: number
  maintainability: number
  performance: number
  readability: number
  suggestions: string[]
  strengths: string[]
  weaknesses: string[]
}

export interface TextAnalysis {
  readability: number
  grammar: number
  structure: number
  clarity: number
  suggestions: string[]
  strengths: string[]
  weaknesses: string[]
}

export interface PlagiarismResult {
  score: number
  matches: Array<{
    text: string
    similarity: number
    source?: string
  }>
}

export class AIService {
  static async analyzeCode(code: string, language: string = 'javascript'): Promise<CodeAnalysis> {
    try {
      const prompt = `
        You are an expert code reviewer. Analyze the following ${language} code thoroughly and provide detailed assessment.
        
        Code:
        \`\`\`${language}
        ${code}
        \`\`\`
        
        Evaluate each aspect and provide scores from 0-100:
        - quality: Overall code quality, best practices, structure
        - complexity: Cyclomatic complexity, cognitive load
        - maintainability: How easy it is to modify and extend
        - performance: Efficiency, optimization opportunities
        - readability: Code clarity, naming, documentation
        
        Provide specific, actionable feedback. Be thorough but constructive.
        
        Respond in JSON format:
        {
          "quality": number,
          "complexity": number,
          "maintainability": number,
          "performance": number,
          "readability": number,
          "suggestions": ["specific actionable suggestion 1", "specific actionable suggestion 2", "specific actionable suggestion 3"],
          "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
          "weaknesses": ["specific weakness 1", "specific weakness 2", "specific weakness 3"]
        }
      `

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 2500,
      })

      const analysis = JSON.parse(response.choices[0].message.content || '{}')
      
      // Ensure all scores are within valid range
      const validatedAnalysis = {
        quality: Math.min(Math.max(analysis.quality || 0, 0), 100),
        complexity: Math.min(Math.max(analysis.complexity || 0, 0), 100),
        maintainability: Math.min(Math.max(analysis.maintainability || 0, 0), 100),
        performance: Math.min(Math.max(analysis.performance || 0, 0), 100),
        readability: Math.min(Math.max(analysis.readability || 0, 0), 100),
        suggestions: analysis.suggestions || [],
        strengths: analysis.strengths || [],
        weaknesses: analysis.weaknesses || []
      }
      
      return validatedAnalysis
    } catch (error) {
      console.error('Error analyzing code:', error)
      throw new Error('Failed to analyze code')
    }
  }

  static async analyzeText(text: string): Promise<TextAnalysis> {
    try {
      const prompt = `
        You are an expert writing reviewer. Analyze the following text thoroughly for quality and provide detailed assessment.
        
        Text:
        ${text}
        
        Evaluate each aspect and provide scores from 0-100:
        - readability: How easy it is to read and understand
        - grammar: Correctness of grammar, punctuation, spelling
        - structure: Organization, flow, logical progression
        - clarity: Clear communication, precision of language
        
        Provide specific, actionable feedback. Be thorough but constructive.
        
        Respond in JSON format:
        {
          "readability": number,
          "grammar": number,
          "structure": number,
          "clarity": number,
          "suggestions": ["specific actionable suggestion 1", "specific actionable suggestion 2", "specific actionable suggestion 3"],
          "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
          "weaknesses": ["specific weakness 1", "specific weakness 2", "specific weakness 3"]
        }
      `

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 2500,
      })

      const analysis = JSON.parse(response.choices[0].message.content || '{}')
      
      // Ensure all scores are within valid range
      const validatedAnalysis = {
        readability: Math.min(Math.max(analysis.readability || 0, 0), 100),
        grammar: Math.min(Math.max(analysis.grammar || 0, 0), 100),
        structure: Math.min(Math.max(analysis.structure || 0, 0), 100),
        clarity: Math.min(Math.max(analysis.clarity || 0, 0), 100),
        suggestions: analysis.suggestions || [],
        strengths: analysis.strengths || [],
        weaknesses: analysis.weaknesses || []
      }
      
      return validatedAnalysis
    } catch (error) {
      console.error('Error analyzing text:', error)
      throw new Error('Failed to analyze text')
    }
  }

  static async detectPlagiarism(content: string, submissionId: string): Promise<PlagiarismResult> {
    try {
      // Get all other submissions for comparison
      const otherSubmissions = await prisma.submission.findMany({
        where: {
          id: { not: submissionId },
          content: { not: "" }
        },
        select: {
          id: true,
          content: true,
          title: true
        }
      })

      const matches: Array<{
        text: string
        similarity: number
        source?: string
      }> = []

      // Simple similarity check using OpenAI
      for (const submission of otherSubmissions) {
        if (!submission.content) continue

        const similarity = await this.calculateSimilarity(content, submission.content)
        
        if (similarity > 0.3) { // Threshold for potential plagiarism
          matches.push({
            text: submission.content.substring(0, 200) + '...',
            similarity,
            source: submission.title
          })
        }
      }

      const maxSimilarity = matches.length > 0 ? Math.max(...matches.map(m => m.similarity)) : 0

      return {
        score: maxSimilarity,
        matches: matches.slice(0, 10) // Limit to top 10 matches
      }
    } catch (error) {
      console.error('Error detecting plagiarism:', error)
      throw new Error('Failed to detect plagiarism')
    }
  }

  private static async calculateSimilarity(text1: string, text2: string): Promise<number> {
    try {
      const prompt = `
        Calculate the similarity between these two texts on a scale of 0 to 1.
        Consider semantic similarity, not just word overlap.
        
        Text 1: ${text1.substring(0, 1000)}
        Text 2: ${text2.substring(0, 1000)}
        
        Respond with only a number between 0 and 1.
      `

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 10,
      })

      const similarity = parseFloat(response.choices[0].message.content || '0')
      return Math.min(Math.max(similarity, 0), 1) // Clamp between 0 and 1
    } catch (error) {
      console.error('Error calculating similarity:', error)
      return 0
    }
  }

  static async generateFeedback(
    content: string,
    analysis: CodeAnalysis | TextAnalysis,
    plagiarismResult: PlagiarismResult
  ): Promise<string> {
    try {
      const isCode = 'quality' in analysis
      const contentType = isCode ? 'code' : 'document'
      
      const prompt = `
        You are an expert ${isCode ? 'code reviewer' : 'writing instructor'}. Generate comprehensive, constructive feedback for a student's ${contentType} submission.
        
        Content (first 1000 characters):
        ${content.substring(0, 1000)}${content.length > 1000 ? '...' : ''}
        
        Analysis Results:
        ${JSON.stringify(analysis, null, 2)}
        
        Plagiarism Detection:
        Similarity Score: ${(plagiarismResult.score * 100).toFixed(1)}%
        ${plagiarismResult.score > 0.3 ? '⚠️ High similarity detected - please review for potential plagiarism.' : '✅ No significant similarity detected.'}
        
        Generate detailed feedback that includes:
        1. **Overall Assessment**: Brief summary of the submission's quality
        2. **Key Strengths**: Highlight 2-3 specific positive aspects
        3. **Areas for Improvement**: Identify 2-3 specific areas needing work
        4. **Specific Recommendations**: Provide 3-5 actionable suggestions
        5. **Next Steps**: Suggest concrete actions for improvement
        6. **Encouragement**: End with positive, motivating words
        
        Be specific, constructive, and encouraging. Use examples from their work when possible.
        Keep the tone professional but friendly and supportive.
        Aim for 300-500 words of detailed, actionable feedback.
      `

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 2000,
      })

      return response.choices[0].message.content || 'Unable to generate feedback'
    } catch (error) {
      console.error('Error generating feedback:', error)
      throw new Error('Failed to generate feedback')
    }
  }

  static async analyzeSubmission(submissionId: string): Promise<void> {
    try {
      console.log(`Starting AI analysis for submission: ${submissionId}`)
      
      const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: { aiAnalysis: true }
      })

      if (!submission) {
        throw new Error('Submission not found')
      }

      if (submission.aiAnalysis) {
        console.log('Submission already analyzed')
        return // Already analyzed
      }

      console.log(`Analyzing ${submission.fileType} submission: ${submission.title}`)
      const content = submission.content
      let analysis: CodeAnalysis | TextAnalysis
      let overallScore: number

      if (submission.fileType === 'CODE') {
        console.log('Running code analysis...')
        analysis = await this.analyzeCode(content)
        overallScore = (
          analysis.quality +
          analysis.complexity +
          analysis.maintainability +
          analysis.performance +
          analysis.readability
        ) / 5
        console.log(`Code analysis completed. Overall score: ${overallScore.toFixed(1)}`)
      } else {
        console.log('Running text analysis...')
        analysis = await this.analyzeText(content)
        overallScore = (
          analysis.readability +
          analysis.grammar +
          analysis.structure +
          analysis.clarity
        ) / 4
        console.log(`Text analysis completed. Overall score: ${overallScore.toFixed(1)}`)
      }

      console.log('Running plagiarism detection...')
      const plagiarismResult = await this.detectPlagiarism(content, submissionId)
      console.log(`Plagiarism detection completed. Score: ${(plagiarismResult.score * 100).toFixed(1)}%`)

      console.log('Generating AI feedback...')
      const aiFeedback = await this.generateFeedback(content, analysis, plagiarismResult)
      console.log('AI feedback generated')

      // Save analysis to database
      console.log('Saving analysis to database...')
      await prisma.aiAnalysis.create({
        data: {
          submissionId,
          codeQuality: 'quality' in analysis ? analysis.quality : null,
          complexity: 'complexity' in analysis ? analysis.complexity : null,
          maintainability: 'maintainability' in analysis ? analysis.maintainability : null,
          performance: 'performance' in analysis ? analysis.performance : null,
          readability: analysis.readability,
          grammar: 'grammar' in analysis ? analysis.grammar : null,
          structure: 'structure' in analysis ? analysis.structure : null,
          plagiarismScore: plagiarismResult.score,
          similarityMatches: plagiarismResult.matches,
          aiFeedback,
          suggestions: analysis.suggestions,
          strengths: analysis.strengths,
          weaknesses: analysis.weaknesses,
          overallScore,
          confidence: 0.85, // High confidence in AI analysis
        }
      })

      // Update submission status
      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: 'REVIEWED' }
      })

      console.log(`AI analysis completed successfully for submission: ${submissionId}`)
    } catch (error) {
      console.error('Error analyzing submission:', error)
      
      // Update submission status to indicate analysis failed
      try {
        await prisma.submission.update({
          where: { id: submissionId },
          data: { status: 'PENDING' } // Reset to pending so it can be retried
        })
      } catch (updateError) {
        console.error('Error updating submission status:', updateError)
      }
      
      throw new Error(`Failed to analyze submission: ${error.message}`)
    }
  }
}
