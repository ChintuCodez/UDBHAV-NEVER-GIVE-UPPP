import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const submissionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  fileType: z.enum(['CODE', 'DOCUMENT', 'PRESENTATION', 'OTHER']),
  language: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = submissionSchema.parse(body)

    // Create a default project for the user if none exists
    let project = await prisma.project.findFirst({
      where: { ownerId: session.user.id }
    })

    if (!project) {
      project = await prisma.project.create({
        data: {
          title: `${session.user.name}'s Project`,
          description: 'Default project for submissions',
          ownerId: session.user.id
        }
      })
    }

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        fileType: validatedData.fileType,
        projectId: project.id,
        submitterId: session.user.id,
        status: 'PENDING'
      },
      include: {
        project: true,
        submitter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Submission created successfully',
      submission
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }

    console.error('Submission creation error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')

    const where: any = { submitterId: session.user.id }
    if (status) {
      where.status = status
    }

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        project: true,
        aiAnalysis: true,
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    const total = await prisma.submission.count({ where })

    return NextResponse.json({
      submissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Submissions fetch error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

