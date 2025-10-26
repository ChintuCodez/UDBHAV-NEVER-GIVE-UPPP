import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { AIService } from '@/lib/ai-service'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const submissionId = params.id

    // Run AI analysis synchronously
    await AIService.analyzeSubmission(submissionId)

    return NextResponse.json({
      message: 'AI analysis completed',
      submissionId
    })
  } catch (error) {
    console.error('AI analysis error:', error)
    return NextResponse.json(
      { message: 'AI analysis failed', error: error.message },
      { status: 500 }
    )
  }
}

