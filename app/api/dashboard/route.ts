import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Get user's submissions
    const submissions = await prisma.submission.findMany({
      where: { submitterId: userId },
      include: { aiAnalysis: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Calculate stats
    const totalSubmissions = submissions.length
    const pendingReviews = submissions.filter(s => s.status === 'PENDING').length
    const completedReviews = submissions.filter(s => s.status === 'REVIEWED' || s.status === 'APPROVED').length
    
    const scoresWithAnalysis = submissions
      .filter(s => s.aiAnalysis?.overallScore)
      .map(s => s.aiAnalysis!.overallScore)
    
    const averageScore = scoresWithAnalysis.length > 0 
      ? scoresWithAnalysis.reduce((sum, score) => sum + score, 0) / scoresWithAnalysis.length
      : 0

    // Format recent submissions
    const recentSubmissions = submissions.map(submission => ({
      id: submission.id,
      title: submission.title,
      status: submission.status,
      createdAt: submission.createdAt.toISOString(),
      overallScore: submission.aiAnalysis?.overallScore
    }))

    return NextResponse.json({
      stats: {
        totalSubmissions,
        pendingReviews,
        completedReviews,
        averageScore
      },
      recentSubmissions
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

