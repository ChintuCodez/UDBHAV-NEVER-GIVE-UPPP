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

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '6months'

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (timeRange) {
      case '1month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case '3months':
        startDate.setMonth(now.getMonth() - 3)
        break
      case '6months':
        startDate.setMonth(now.getMonth() - 6)
        break
      case '1year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }

    // Get user's submissions with AI analysis
    const submissions = await prisma.submission.findMany({
      where: {
        submitterId: session.user.id,
        createdAt: {
          gte: startDate
        }
      },
      include: {
        aiAnalysis: true
      },
      orderBy: { createdAt: 'asc' }
    })

    // Calculate overview stats
    const totalSubmissions = submissions.length
    const submissionsWithAnalysis = submissions.filter(s => s.aiAnalysis)
    
    const averageScore = submissionsWithAnalysis.length > 0
      ? submissionsWithAnalysis.reduce((sum, s) => sum + (s.aiAnalysis?.overallScore || 0), 0) / submissionsWithAnalysis.length
      : 0

    // Calculate improvement rate (compare first half vs second half)
    const midPoint = Math.floor(submissionsWithAnalysis.length / 2)
    const firstHalf = submissionsWithAnalysis.slice(0, midPoint)
    const secondHalf = submissionsWithAnalysis.slice(midPoint)
    
    const firstHalfAvg = firstHalf.length > 0
      ? firstHalf.reduce((sum, s) => sum + (s.aiAnalysis?.overallScore || 0), 0) / firstHalf.length
      : 0
    const secondHalfAvg = secondHalf.length > 0
      ? secondHalf.reduce((sum, s) => sum + (s.aiAnalysis?.overallScore || 0), 0) / secondHalf.length
      : 0
    
    const improvementRate = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0

    // Calculate plagiarism rate
    const plagiarismCount = submissionsWithAnalysis.filter(s => (s.aiAnalysis?.plagiarismScore || 0) > 0.3).length
    const plagiarismRate = submissionsWithAnalysis.length > 0 ? (plagiarismCount / submissionsWithAnalysis.length) * 100 : 0

    // Score distribution
    const scoreRanges = [
      { range: '0-20', min: 0, max: 20 },
      { range: '21-40', min: 21, max: 40 },
      { range: '41-60', min: 41, max: 60 },
      { range: '61-80', min: 61, max: 80 },
      { range: '81-100', min: 81, max: 100 }
    ]

    const scoreDistribution = scoreRanges.map(range => ({
      range: range.range,
      count: submissionsWithAnalysis.filter(s => {
        const score = s.aiAnalysis?.overallScore || 0
        return score >= range.min && score <= range.max
      }).length
    }))

    // Monthly trends
    const monthlyData: { [key: string]: { submissions: number, totalScore: number, count: number } } = {}
    
    submissions.forEach(submission => {
      const month = submission.createdAt.toISOString().substring(0, 7) // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { submissions: 0, totalScore: 0, count: 0 }
      }
      monthlyData[month].submissions++
      if (submission.aiAnalysis?.overallScore) {
        monthlyData[month].totalScore += submission.aiAnalysis.overallScore
        monthlyData[month].count++
      }
    })

    const monthlyTrends = Object.entries(monthlyData).map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      submissions: data.submissions,
      averageScore: data.count > 0 ? data.totalScore / data.count : 0
    })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())

    // File type distribution
    const fileTypeCounts: { [key: string]: number } = {}
    submissions.forEach(submission => {
      fileTypeCounts[submission.fileType] = (fileTypeCounts[submission.fileType] || 0) + 1
    })

    const fileTypeDistribution = Object.entries(fileTypeCounts).map(([type, count]) => ({
      type,
      count,
      percentage: totalSubmissions > 0 ? Math.round((count / totalSubmissions) * 100) : 0
    }))

    // Quality metrics (average of all submissions with analysis)
    const qualityMetrics = {
      codeQuality: submissionsWithAnalysis.length > 0
        ? submissionsWithAnalysis.reduce((sum, s) => sum + (s.aiAnalysis?.codeQuality || 0), 0) / submissionsWithAnalysis.length
        : 0,
      readability: submissionsWithAnalysis.length > 0
        ? submissionsWithAnalysis.reduce((sum, s) => sum + (s.aiAnalysis?.readability || 0), 0) / submissionsWithAnalysis.length
        : 0,
      maintainability: submissionsWithAnalysis.length > 0
        ? submissionsWithAnalysis.reduce((sum, s) => sum + (s.aiAnalysis?.maintainability || 0), 0) / submissionsWithAnalysis.length
        : 0,
      performance: submissionsWithAnalysis.length > 0
        ? submissionsWithAnalysis.reduce((sum, s) => sum + (s.aiAnalysis?.performance || 0), 0) / submissionsWithAnalysis.length
        : 0
    }

    return NextResponse.json({
      overview: {
        totalSubmissions,
        averageScore,
        improvementRate,
        plagiarismRate
      },
      scoreDistribution,
      monthlyTrends,
      fileTypeDistribution,
      qualityMetrics
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

