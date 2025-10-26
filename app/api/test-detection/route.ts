import { NextRequest, NextResponse } from 'next/server'
import { AIService } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json(
        { message: 'Content is required' },
        { status: 400 }
      )
    }

    // Test AI content detection
    const aiContentScore = (AIService as any).detectAIContent(content)
    
    // Test plagiarism detection
    const plagiarismResult = await AIService.detectPlagiarism(content, 'test-detection-id')

    return NextResponse.json({
      message: 'Detection completed',
      content: content.substring(0, 100) + '...',
      aiContentScore: Number(aiContentScore.toFixed(3)),
      aiContentPercentage: (aiContentScore * 100).toFixed(1) + '%',
      plagiarismScore: plagiarismResult.score,
      plagiarismPercentage: (plagiarismResult.score * 100).toFixed(1) + '%',
      matches: plagiarismResult.matches,
      isAIContent: aiContentScore > 0.6,
      isHumanContent: aiContentScore < 0.6,
      verdict: aiContentScore > 0.6 ? 'AI-GENERATED' : 'HUMAN-WRITTEN'
    })
  } catch (error) {
    console.error('Detection test error:', error)
    return NextResponse.json(
      { 
        message: 'Detection test failed', 
        error: error.message 
      },
      { status: 500 }
    )
  }
}
