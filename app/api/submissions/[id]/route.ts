import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
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

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        project: true,
        submitter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        aiAnalysis: true,
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!submission) {
      return NextResponse.json(
        { message: 'Submission not found' },
        { status: 404 }
      )
    }

    // Check if user owns this submission or is an instructor
    if (submission.submitterId !== session.user.id && session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json({ submission })
  } catch (error) {
    console.error('Submission fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const body = await request.json()

    // Check if user owns this submission
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId }
    })

    if (!submission) {
      return NextResponse.json(
        { message: 'Submission not found' },
        { status: 404 }
      )
    }

    if (submission.submitterId !== session.user.id) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      )
    }

    // Update submission
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        title: body.title,
        content: body.content,
        fileType: body.fileType
      },
      include: {
        project: true,
        submitter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        aiAnalysis: true,
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Submission updated successfully',
      submission: updatedSubmission
    })
  } catch (error) {
    console.error('Submission update error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Check if user owns this submission
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId }
    })

    if (!submission) {
      return NextResponse.json(
        { message: 'Submission not found' },
        { status: 404 }
      )
    }

    if (submission.submitterId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      )
    }

    // Delete submission (cascade will handle related records)
    await prisma.submission.delete({
      where: { id: submissionId }
    })

    return NextResponse.json({
      message: 'Submission deleted successfully'
    })
  } catch (error) {
    console.error('Submission deletion error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

