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
    console.log(`Starting AI analysis for submission: ${submissionId}`)

    // Run AI analysis synchronously
    await AIService.analyzeSubmission(submissionId)

    console.log(`AI analysis completed successfully for submission: ${submissionId}`)
    return NextResponse.json({
      message: 'AI analysis completed successfully',
      submissionId,
      status: 'REVIEWED'
    })
  } catch (error) {
    console.error('AI analysis error:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      submissionId: params.id
    })
    
    return NextResponse.json(
      { 
        message: 'AI analysis failed', 
        error: error.message,
        submissionId: params.id,
        status: 'PENDING'
      },
      { status: 500 }
    )
  }
}

