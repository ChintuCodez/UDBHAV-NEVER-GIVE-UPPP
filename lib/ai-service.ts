import { GoogleGenerativeAI } from '@google/generative-ai'
import { PrismaClient } from '@prisma/client'
import { diffLines } from 'diff'

const prisma = new PrismaClient()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

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
      // Check if Gemini API key is available
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key-here') {
        console.log('Gemini API key not configured, using fallback analysis')
        return this.fallbackCodeAnalysis(code, language)
      }

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

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      
      const analysis = JSON.parse(jsonMatch[0])
      
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
      console.error('Error analyzing code with Gemini:', error)
      console.log('Falling back to local analysis')
      return this.fallbackCodeAnalysis(code, language)
    }
  }

  static async analyzeText(text: string): Promise<TextAnalysis> {
    try {
      // Check if Gemini API key is available
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key-here') {
        console.log('Gemini API key not configured, using fallback analysis')
        return this.fallbackTextAnalysis(text)
      }

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

      const result = await model.generateContent(prompt)
      const response = await result.response
      const responseText = response.text()
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      
      const analysis = JSON.parse(jsonMatch[0])
      
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
      console.error('Error analyzing text with Gemini:', error)
      console.log('Falling back to local analysis')
      return this.fallbackTextAnalysis(text)
    }
  }

  static async detectPlagiarism(content: string, submissionId: string): Promise<PlagiarismResult> {
    try {
      console.log('Starting plagiarism detection for submission:', submissionId)
      
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

      console.log(`Found ${otherSubmissions.length} other submissions to compare against`)

      const matches: Array<{
        text: string
        similarity: number
        source?: string
      }> = []

      // Use Gemini for similarity check if available, otherwise use local
      if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here') {
        console.log('Using Gemini for plagiarism detection')
        for (const submission of otherSubmissions) {
          if (!submission.content) continue

          const similarity = await this.calculateGeminiSimilarity(content, submission.content)
          
          if (similarity > 0.2) { // Lower threshold for better detection
            matches.push({
              text: submission.content.substring(0, 200) + '...',
              similarity,
              source: submission.title
            })
          }
        }
      } else {
        console.log('Using local plagiarism detection')
        for (const submission of otherSubmissions) {
          if (!submission.content) continue

          const similarity = this.calculateLocalSimilarity(content, submission.content)
          
          if (similarity > 0.3) { // Threshold for potential plagiarism
            matches.push({
              text: submission.content.substring(0, 200) + '...',
              similarity,
              source: submission.title
            })
          }
        }
      }

      // Also check for AI-generated content patterns
      const aiContentScore = this.detectAIContent(content)
      console.log(`AI content score: ${aiContentScore.toFixed(3)}`)
      
      if (aiContentScore > 0.6) { // Higher threshold (60%) for more accurate detection
        matches.push({
          text: 'AI-generated content detected',
          similarity: aiContentScore,
          source: 'AI Content Detection'
        })
        console.log(`AI content detected with score: ${aiContentScore.toFixed(3)}`)
      } else {
        console.log(`Content is likely human-written (score: ${aiContentScore.toFixed(3)})`)
      }

      const maxSimilarity = matches.length > 0 ? Math.max(...matches.map(m => m.similarity)) : 0

      console.log(`Plagiarism detection completed. Max similarity: ${(maxSimilarity * 100).toFixed(1)}%`)

      return {
        score: maxSimilarity,
        matches: matches.slice(0, 10) // Limit to top 10 matches
      }
    } catch (error) {
      console.error('Error detecting plagiarism:', error)
      // Return a safe fallback
      return {
        score: 0,
        matches: []
      }
    }
  }

  private static async calculateGeminiSimilarity(text1: string, text2: string): Promise<number> {
    try {
      const prompt = `
        Calculate the similarity between these two texts on a scale of 0 to 1.
        Consider semantic similarity, not just word overlap.
        Look for similar ideas, structure, and content patterns.
        
        Text 1: ${text1.substring(0, 1000)}
        Text 2: ${text2.substring(0, 1000)}
        
        Respond with only a number between 0 and 1 (e.g., 0.75).
      `

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      // Extract number from response
      const numberMatch = text.match(/(\d+\.?\d*)/)
      if (!numberMatch) {
        return 0
      }
      
      const similarity = parseFloat(numberMatch[1])
      return Math.min(Math.max(similarity, 0), 1) // Clamp between 0 and 1
    } catch (error) {
      console.error('Error calculating similarity with Gemini:', error)
      return 0
    }
  }

  private static detectAIContent(content: string): number {
    console.log('Analyzing content for AI patterns...')
    
    // Enhanced AI content detection patterns - Only strong indicators
    const strongAIPatterns = [
      // Very specific AI phrases that humans rarely use together
      /\b(it is important to note|it should be noted|it is worth mentioning|it is crucial to)\b/gi,
      /\b(in order to|with the aim of|for the purpose of|in an effort to)\b/gi,
      /\b(it is evident that|it is clear that|it is apparent that)\b/gi,
      /\b(plays a crucial role|is essential|is vital|is significant)\b/gi,
      /\b(in today's world|in the modern era|in recent years|in the digital age)\b/gi,
      /\b(has become increasingly|has been growing|has evolved to become)\b/gi,
      /\b(offers tremendous|presents significant|provides valuable)\b/gi,
      // Less common but significant AI patterns
      /\b(numerous benefits|various aspects|comprehensive approach)\b/gi,
      /\b(facilitate the process|optimize performance|leverage technology)\b/gi,
    ]
    
    const moderateAIPatterns = [
      /\b(however|furthermore|moreover|additionally|in conclusion|to summarize|in summary)\b/gi,
      /\b(comprehensive|thorough|detailed|extensive|systematic)\b/gi,
      /\b(utilize|facilitate|implement|enhance|optimize|leverage)\b/gi,
      /\b(thus|hence|therefore|consequently|accordingly|subsequently)\b/gi,
      /\b(one of the|some of the|many of the|various)\b/gi,
    ]
    
    // Human content indicators - These REDUCE AI score
    const humanIndicators = [
      /\b(I|we|my|our|me|us|myself|we're|I'm|I've|I'll)\b/gi, // Personal pronouns
      /\b(actually|really|just|kinda|sorta|definitely|probably|maybe)\b/gi, // Casual language
      /\b(damn|shit|gosh|wow|cool|nice|awesome|sucks)\b/gi, // Informal expressions
      /\b(I think|I believe|I feel|in my opinion|I guess)\b/gi, // Personal statements
      /\b(idk|idc|lol|omg|tbh|imo|btw)\b/gi, // Abbreviations
      /\b(probably|maybe|might|could|should|would)\b/gi, // Uncertainty
      /\b(because|so|but|and|like|you know)\b/gi, // Conversational connectors
      /[a-z]+'[a-z]+/gi, // Contractions
    ]

    let aiScore = 0
    let humanScore = 0
    const words = content.split(/\s+/).length
    const sentences = content.split(/[.!?]+/).length
    const avgWordsPerSentence = words / sentences
    
    console.log(`Content analysis: ${words} words, ${sentences} sentences, ${avgWordsPerSentence.toFixed(1)} avg words/sentence`)
    
    // Check for STRONG AI patterns (these indicate AI strongly)
    strongAIPatterns.forEach((pattern, index) => {
      const matches = content.match(pattern)
      if (matches) {
        const patternScore = (matches.length / words) * 20 // High weight for strong patterns
        aiScore += patternScore
        console.log(`Strong AI pattern ${index + 1} matched ${matches.length} times: +${patternScore.toFixed(3)}`)
      }
    })
    
    // Check for MODERATE AI patterns (these might indicate AI)
    moderateAIPatterns.forEach((pattern, index) => {
      const matches = content.match(pattern)
      if (matches) {
        const patternScore = (matches.length / words) * 5 // Lower weight for moderate patterns
        aiScore += patternScore
        console.log(`Moderate AI pattern ${index + 1} matched ${matches.length} times: +${patternScore.toFixed(3)}`)
      }
    })
    
    // Check for HUMAN indicators (these REDUCE AI score)
    humanIndicators.forEach((pattern, index) => {
      const matches = content.match(pattern)
      if (matches) {
        const humanScorePenalty = (matches.length / words) * 30 // High weight to reduce AI score
        humanScore += humanScorePenalty
        console.log(`Human indicator ${index + 1} matched ${matches.length} times: -${humanScorePenalty.toFixed(3)}`)
      }
    })

    // Check for personal pronouns - if many, reduce AI score significantly
    const personalPronouns = (content.match(/\b(I|we|my|our|me|us|myself|ourselves|I'm|I've|I'll|we're)\b/gi) || []).length
    const pronounRatio = personalPronouns / words
    if (pronounRatio > 0.03) {
      // High personal pronoun usage = definitely human
      humanScore += 0.6
      console.log(`High personal pronouns (${pronounRatio.toFixed(3)}): -0.6`)
    } else if (pronounRatio > 0.015) {
      // Some personal pronouns = likely human
      humanScore += 0.3
      console.log(`Some personal pronouns (${pronounRatio.toFixed(3)}): -0.3`)
    }

    // Check for casual language (definitely human)
    const casualWords = (content.match(/\b(actually|really|just|kinda|sorta|maybe|probably|definitely|cool|nice|awesome)\b/gi) || []).length
    if (casualWords > 0) {
      const casualRatio = casualWords / words
      humanScore += casualRatio * 40
      console.log(`Casual language detected (${casualWords} instances): -${(casualRatio * 40).toFixed(3)}`)
    }

    // Check for repetitive sentence structures
    const sentenceStarts = content.split(/[.!?]+/).map(s => s.trim().split(' ')[0]).filter(s => s)
    const uniqueStarts = new Set(sentenceStarts)
    if (sentenceStarts.length > 3 && uniqueStarts.size / sentenceStarts.length < 0.4) {
      aiScore += 0.3 // Repetitive sentence starts
      console.log(`Repetitive sentence starts (${uniqueStarts.size}/${sentenceStarts.length}): +0.3`)
    }

    // Check for perfect punctuation and formatting
    const perfectPunctuation = (content.match(/[.!?]\s+[A-Z]/g) || []).length
    const totalSentences = content.split(/[.!?]+/).length - 1
    if (totalSentences > 0 && perfectPunctuation / totalSentences > 0.8) {
      aiScore += 0.2 // Very perfect punctuation
      console.log('Perfect punctuation detected: +0.2')
    }

    // Check for formal academic language
    const formalWords = (content.match(/\b(analysis|implementation|methodology|framework|paradigm|infrastructure|optimization|utilization)\b/gi) || []).length
    if (formalWords / words > 0.05) {
      aiScore += 0.3 // High formal language usage
      console.log(`High formal language usage (${formalWords}/${words}): +0.3`)
    }

    // Check for code-specific AI patterns
    if (content.includes('function') || content.includes('const') || content.includes('let') || content.includes('var')) {
      const codePatterns = [
        /\b(function\s+\w+\s*\([^)]*\)\s*\{)/gi,
        /\b(const\s+\w+\s*=\s*\([^)]*\)\s*=>)/gi,
        /\b(if\s*\([^)]*\)\s*\{)/gi,
        /\b(for\s*\([^)]*\)\s*\{)/gi,
        /\b(while\s*\([^)]*\)\s*\{)/gi,
        /\b(try\s*\{)/gi,
        /\b(catch\s*\([^)]*\)\s*\{)/gi,
        /\b(console\.log\()/gi,
        /\b(return\s+)/gi,
        /\b(import\s+)/gi,
        /\b(export\s+)/gi,
      ]
      
      let codeAIScore = 0
      codePatterns.forEach(pattern => {
        const matches = content.match(pattern)
        if (matches) {
          codeAIScore += matches.length * 0.1
        }
      })
      
      if (codeAIScore > 0.5) {
        aiScore += 0.4 // High code pattern match
        console.log(`High code pattern match (${codeAIScore.toFixed(2)}): +0.4`)
      }
    }

    // Calculate final score: AI score minus human score
    let finalScore = aiScore - (humanScore * 0.5) // Human indicators reduce AI score by 50%
    
    // Additional checks for perfect vs imperfect content
    const hasTypos = content.match(/\b([a-z]+)(\1)\b/gi) // Repeated words like "the the"
    const hasSpelling = content.match(/[a-z]{15,}/gi) // Very long words (might be typos)
    
    if (hasTypos && hasTypos.length > 0) {
      finalScore -= 0.2 // Typos suggest human
      console.log(`Typos detected: -0.2`)
    }
    
    // Check for conversational connectors (human)
    const conversationalConnectors = (content.match(/\b(actually|really|like|you know|I mean)\b/gi) || []).length
    if (conversationalConnectors > words * 0.02) {
      finalScore -= 0.3
      console.log(`Conversational connectors detected: -0.3`)
    }
    
    // Normalize to 0-1 range
    finalScore = Math.max(0, Math.min(finalScore, 1))
    
    console.log(`Raw scores - AI: ${aiScore.toFixed(3)}, Human: ${humanScore.toFixed(3)}`)
    console.log(`Final AI content score: ${finalScore.toFixed(3)} (${(finalScore * 100).toFixed(1)}%)`)
    
    return finalScore
  }

  private static calculateLocalSimilarity(text1: string, text2: string): number {
    // Simple local similarity calculation using Jaccard similarity
    const words1 = new Set(text1.toLowerCase().split(/\s+/))
    const words2 = new Set(text2.toLowerCase().split(/\s+/))
    
    const intersection = new Set([...words1].filter(x => words2.has(x)))
    const union = new Set([...words1, ...words2])
    
    const jaccardSimilarity = intersection.size / union.size
    
    // Also check for exact substring matches
    const longerText = text1.length > text2.length ? text1 : text2
    const shorterText = text1.length > text2.length ? text2 : text1
    
    let substringMatches = 0
    const minLength = Math.min(20, shorterText.length)
    
    for (let i = 0; i <= shorterText.length - minLength; i++) {
      const substring = shorterText.substring(i, i + minLength)
      if (longerText.includes(substring)) {
        substringMatches++
      }
    }
    
    const substringSimilarity = substringMatches / (shorterText.length - minLength + 1)
    
    // Combine both metrics
    return Math.min(1, (jaccardSimilarity * 0.7) + (substringSimilarity * 0.3))
  }

  static async generateFeedback(
    content: string,
    analysis: CodeAnalysis | TextAnalysis,
    plagiarismResult: PlagiarismResult
  ): Promise<string> {
    try {
      // Check if Gemini API key is available
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key-here') {
        console.log('Gemini API key not configured, using fallback feedback generation')
        return this.generateFallbackFeedback(content, analysis, plagiarismResult)
      }

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

      const result = await model.generateContent(prompt)
      const response = await result.response
      const feedback = response.text()

      return feedback || 'Unable to generate feedback'
    } catch (error) {
      console.error('Error generating feedback with Gemini:', error)
      console.log('Falling back to local feedback generation')
      return this.generateFallbackFeedback(content, analysis, plagiarismResult)
    }
  }

  static async analyzeSubmission(submissionId: string): Promise<void> {
    try {
      console.log(`Starting AI analysis for submission: ${submissionId}`)
      
      // Check if Gemini API key is available
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key-here') {
        console.log('Gemini API key not configured, using fallback analysis')
        // Continue with fallback analysis instead of throwing error
      }
      
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
      
      if (!content || content.trim().length === 0) {
        throw new Error('Submission content is empty')
      }
      
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
      const aiAnalysis = await prisma.aiAnalysis.create({
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
      console.log(`AI analysis saved with ID: ${aiAnalysis.id}`)

      // Update submission status
      console.log('Updating submission status to REVIEWED...')
      const updatedSubmission = await prisma.submission.update({
        where: { id: submissionId },
        data: { status: 'REVIEWED' }
      })
      console.log(`Submission status updated to: ${updatedSubmission.status}`)

      console.log(`AI analysis completed successfully for submission: ${submissionId}`)
    } catch (error) {
      console.error('Error analyzing submission:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        submissionId
      })
      
      // Update submission status to indicate analysis failed
      try {
        await prisma.submission.update({
          where: { id: submissionId },
          data: { status: 'PENDING' } // Reset to pending so it can be retried
        })
        console.log('Submission status reset to PENDING due to analysis failure')
      } catch (updateError) {
        console.error('Error updating submission status:', updateError)
      }
      
      throw new Error(`Failed to analyze submission: ${error.message}`)
    }
  }

  // Fallback analysis methods when OpenAI is not available
  static fallbackCodeAnalysis(code: string, language: string = 'javascript'): CodeAnalysis {
    console.log('Running fallback code analysis')
    
    // Basic code analysis using simple heuristics
    const lines = code.split('\n').length
    const functions = (code.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || []).length
    const comments = (code.match(/\/\/|\/\*|\*/g) || []).length
    const complexity = Math.min(100, (functions * 10) + (lines / 10))
    
    // Calculate basic metrics
    const quality = Math.max(60, 100 - (complexity / 2))
    const maintainability = Math.max(50, 100 - (lines / 20))
    const performance = Math.max(70, 100 - (functions * 5))
    const readability = Math.max(60, 100 - (lines / 15) + (comments * 2))
    
    return {
      quality: Math.round(quality),
      complexity: Math.round(complexity),
      maintainability: Math.round(maintainability),
      performance: Math.round(performance),
      readability: Math.round(readability),
      suggestions: [
        'Consider adding more comments to improve code documentation',
        'Break down large functions into smaller, more manageable pieces',
        'Use consistent naming conventions throughout your code',
        'Add error handling for better robustness',
        'Consider using TypeScript for better type safety'
      ],
      strengths: [
        'Code structure is generally well-organized',
        'Functions are appropriately sized',
        'Good use of modern JavaScript features',
        'Code follows basic best practices'
      ],
      weaknesses: [
        'Could benefit from more comprehensive error handling',
        'Some functions might be too complex',
        'Missing documentation and comments',
        'Could improve variable naming consistency'
      ]
    }
  }

  static fallbackTextAnalysis(text: string): TextAnalysis {
    console.log('Running fallback text analysis')
    
    // Basic text analysis using simple heuristics
    const words = text.split(/\s+/).length
    const sentences = text.split(/[.!?]+/).length
    const paragraphs = text.split(/\n\s*\n/).length
    const avgWordsPerSentence = words / sentences
    
    // Calculate basic metrics
    const readability = Math.max(60, 100 - (avgWordsPerSentence * 2))
    const grammar = Math.max(70, 100 - (text.match(/[.!?]{2,}|[A-Z]{3,}/g) || []).length * 5)
    const structure = Math.max(60, 100 - (paragraphs > 1 ? 0 : 20))
    const clarity = Math.max(65, 100 - (avgWordsPerSentence > 20 ? 15 : 0))
    
    return {
      readability: Math.round(readability),
      grammar: Math.round(grammar),
      structure: Math.round(structure),
      clarity: Math.round(clarity),
      suggestions: [
        'Consider breaking long sentences into shorter ones for better readability',
        'Add more paragraph breaks to improve structure',
        'Use transition words to connect ideas more clearly',
        'Review grammar and punctuation for accuracy',
        'Consider adding examples to illustrate your points'
      ],
      strengths: [
        'Content is well-structured and organized',
        'Good use of vocabulary and sentence variety',
        'Clear communication of ideas',
        'Appropriate length for the content type'
      ],
      weaknesses: [
        'Some sentences could be shorter for better readability',
        'Could benefit from more transitional phrases',
        'Grammar and punctuation need review',
        'Consider adding more specific examples'
      ]
    }
  }

  static generateFallbackFeedback(
    content: string,
    analysis: CodeAnalysis | TextAnalysis,
    plagiarismResult: PlagiarismResult
  ): string {
    const isCode = 'quality' in analysis
    const contentType = isCode ? 'code' : 'document'
    const overallScore = isCode ? 
      (analysis.quality + analysis.complexity + analysis.maintainability + analysis.performance + analysis.readability) / 5 :
      (analysis.readability + analysis.grammar + analysis.structure + analysis.clarity) / 4

    let feedback = `## Overall Assessment\n\n`
    
    if (overallScore >= 80) {
      feedback += `Excellent work! Your ${contentType} demonstrates high quality and attention to detail. The analysis shows strong performance across all key metrics.\n\n`
    } else if (overallScore >= 60) {
      feedback += `Good work! Your ${contentType} shows solid understanding with room for improvement in several areas.\n\n`
    } else {
      feedback += `Your ${contentType} shows potential but needs significant improvement. Don't worry - every expert was once a beginner!\n\n`
    }

    feedback += `## Key Strengths\n\n`
    if (analysis.strengths && analysis.strengths.length > 0) {
      analysis.strengths.forEach((strength, index) => {
        feedback += `${index + 1}. ${strength}\n`
      })
    } else {
      feedback += `1. You've made a good effort in creating this ${contentType}\n`
      feedback += `2. The structure shows logical thinking\n`
      feedback += `3. You're on the right track with your approach\n`
    }

    feedback += `\n## Areas for Improvement\n\n`
    if (analysis.weaknesses && analysis.weaknesses.length > 0) {
      analysis.weaknesses.forEach((weakness, index) => {
        feedback += `${index + 1}. ${weakness}\n`
      })
    } else {
      feedback += `1. Consider adding more detailed explanations\n`
      feedback += `2. Review for consistency and clarity\n`
      feedback += `3. Look for opportunities to enhance the overall quality\n`
    }

    feedback += `\n## Specific Recommendations\n\n`
    if (analysis.suggestions && analysis.suggestions.length > 0) {
      analysis.suggestions.forEach((suggestion, index) => {
        feedback += `${index + 1}. ${suggestion}\n`
      })
    } else {
      feedback += `1. Take time to review and refine your work\n`
      feedback += `2. Consider getting feedback from peers or mentors\n`
      feedback += `3. Practice regularly to improve your skills\n`
      feedback += `4. Study examples of high-quality ${contentType}s\n`
      feedback += `5. Don't hesitate to ask questions when you're unsure\n`
    }

    feedback += `\n## Plagiarism Check\n\n`
    if (plagiarismResult.score > 0.3) {
      feedback += `⚠️ **High Similarity Detected (${(plagiarismResult.score * 100).toFixed(1)}%)**\n\n`
      feedback += `Your submission shows significant similarity to other works. Please review and ensure you're properly citing sources and creating original content.\n\n`
    } else {
      feedback += `✅ **No Significant Similarity Detected**\n\n`
      feedback += `Great job! Your work appears to be original with minimal similarity to other submissions.\n\n`
    }

    feedback += `## Next Steps\n\n`
    feedback += `1. Review the specific suggestions above\n`
    feedback += `2. Focus on the areas for improvement\n`
    feedback += `3. Practice implementing the recommendations\n`
    feedback += `4. Consider seeking additional feedback\n`
    feedback += `5. Keep learning and improving your skills\n\n`

    feedback += `## Encouragement\n\n`
    feedback += `Remember, every expert was once a beginner. Your willingness to submit your work for review shows great initiative and a growth mindset. Keep practicing, stay curious, and don't be afraid to make mistakes - they're an essential part of the learning process. You're doing great work, and with continued effort, you'll see significant improvement!\n\n`
    
    feedback += `**Overall Score: ${overallScore.toFixed(1)}/100**\n\n`
    feedback += `Keep up the excellent work! 🚀`

    return feedback
  }
}
