'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeftIcon,
  CodeBracketIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
  LightBulbIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import { Editor } from '@monaco-editor/react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Submission {
  id: string
  title: string
  content: string
  fileType: string
  status: string
  createdAt: string
  aiAnalysis?: {
    codeQuality?: number
    complexity?: number
    maintainability?: number
    performance?: number
    readability: number
    grammar?: number
    structure?: number
    plagiarismScore: number
    aiFeedback: string
    suggestions: string[]
    strengths: string[]
    weaknesses: string[]
    overallScore: number
    confidence: number
  }
  reviews: Array<{
    id: string
    score: number
    feedback: string
    suggestions?: string
    reviewer: {
      name: string
    }
    createdAt: string
  }>
}

export default function SubmissionDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isManualAnalyzing, setIsManualAnalyzing] = useState(false)

  useEffect(() => {
    if (session) {
      fetchSubmission()
    }
  }, [session, params.id])

  // Auto-refresh if submission is pending analysis
  useEffect(() => {
    if (submission && submission.status === 'PENDING' && !submission.aiAnalysis) {
      setIsAnalyzing(true)
      const interval = setInterval(() => {
        fetchSubmission()
      }, 3000) // Check every 3 seconds
      
      return () => clearInterval(interval)
    } else if (submission && submission.aiAnalysis) {
      setIsAnalyzing(false)
    }
  }, [submission])

  const fetchSubmission = async () => {
    try {
      const response = await fetch(`/api/submissions/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setSubmission(data.submission)
      } else {
        toast.error('Failed to fetch submission')
        router.push('/dashboard')
      }
    } catch (error) {
      toast.error('An error occurred')
      router.push('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const triggerManualAnalysis = async () => {
    if (!submission) return
    
    setIsManualAnalyzing(true)
    try {
      console.log('Manually triggering AI analysis for submission:', submission.id)
      const response = await fetch(`/api/analyze/${submission.id}`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Manual analysis response:', result)
        toast.success('AI analysis completed!')
        // Refresh the submission data
        await fetchSubmission()
      } else {
        const errorResult = await response.json()
        console.error('Manual analysis failed:', errorResult)
        toast.error(`AI analysis failed: ${errorResult.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Manual analysis error:', error)
      toast.error('Failed to trigger AI analysis')
    } finally {
      setIsManualAnalyzing(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'REVIEWED':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'APPROVED':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'REJECTED':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100'
      case 'REVIEWED':
        return 'text-green-600 bg-green-100'
      case 'APPROVED':
        return 'text-green-700 bg-green-200'
      case 'REJECTED':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-dots">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Submission not found</p>
          <Link href="/dashboard" className="btn-primary mt-4">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <CodeBracketIcon className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gradient">AI Peer Review</span>
            </div>
            <Link
              href="/dashboard"
              className="flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Submission Header */}
          <div className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  {submission.fileType === 'CODE' ? (
                    <CodeBracketIcon className="h-6 w-6 text-blue-500" />
                  ) : (
                    <DocumentTextIcon className="h-6 w-6 text-green-500" />
                  )}
                  <h1 className="text-2xl font-bold text-gray-900">{submission.title}</h1>
                </div>
                <p className="text-gray-600 mb-4">
                  Submitted on {new Date(submission.createdAt).toLocaleDateString()}
                </p>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(submission.status)}`}>
                    {submission.status}
                  </span>
                  {submission.aiAnalysis && (
                    <div className={`px-3 py-1 text-sm font-medium rounded-full ${getScoreBgColor(submission.aiAnalysis.overallScore)} ${getScoreColor(submission.aiAnalysis.overallScore)}`}>
                      Overall Score: {submission.aiAnalysis.overallScore.toFixed(1)}/100
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Code/Content Display */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {submission.fileType === 'CODE' ? 'Code' : 'Content'}
                </h2>
                {submission.fileType === 'CODE' ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <Editor
                      height="500px"
                      language="javascript"
                      value={submission.content}
                      theme="vs-dark"
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 14,
                        lineNumbers: 'on',
                        wordWrap: 'on'
                      }}
                    />
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-900">
                      {submission.content}
                    </pre>
                  </div>
                )}
              </div>

              {/* AI Analysis Results */}
              {isAnalyzing || isManualAnalyzing ? (
                <div className="card">
                  <div className="flex items-center mb-4">
                    <SparklesIcon className="h-6 w-6 text-purple-600 mr-2 animate-spin" />
                    <h2 className="text-xl font-semibold text-gray-900">AI Analysis in Progress...</h2>
                  </div>
                  <div className="text-center py-8">
                    <div className="loading-dots mx-auto mb-4">
                      <div></div>
                      <div></div>
                      <div></div>
                      <div></div>
                    </div>
                    <p className="text-gray-600">Our AI is analyzing your submission. This may take a few moments...</p>
                  </div>
                </div>
              ) : submission.aiAnalysis ? (
                <div className="card">
                  <div className="flex items-center mb-4">
                    <SparklesIcon className="h-6 w-6 text-purple-600 mr-2" />
                    <h2 className="text-xl font-semibold text-gray-900">AI Analysis Results</h2>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {submission.aiAnalysis.codeQuality && (
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Code Quality</p>
                        <p className={`text-2xl font-bold ${getScoreColor(submission.aiAnalysis.codeQuality)}`}>
                          {submission.aiAnalysis.codeQuality.toFixed(1)}
                        </p>
                      </div>
                    )}
                    {submission.aiAnalysis.complexity && (
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <p className="text-sm text-gray-600">Complexity</p>
                        <p className={`text-2xl font-bold ${getScoreColor(submission.aiAnalysis.complexity)}`}>
                          {submission.aiAnalysis.complexity.toFixed(1)}
                        </p>
                      </div>
                    )}
                    {submission.aiAnalysis.maintainability && (
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">Maintainability</p>
                        <p className={`text-2xl font-bold ${getScoreColor(submission.aiAnalysis.maintainability)}`}>
                          {submission.aiAnalysis.maintainability.toFixed(1)}
                        </p>
                      </div>
                    )}
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600">Readability</p>
                      <p className={`text-2xl font-bold ${getScoreColor(submission.aiAnalysis.readability)}`}>
                        {submission.aiAnalysis.readability.toFixed(1)}
                      </p>
                    </div>
                  </div>

                  {/* Plagiarism Detection */}
                  <div className="mb-6 p-4 bg-red-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <ShieldCheckIcon className="h-5 w-5 text-red-600 mr-2" />
                      <h3 className="font-semibold text-gray-900">Plagiarism Detection</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Similarity Score: <span className={`font-medium ${getScoreColor(submission.aiAnalysis.plagiarismScore * 100)}`}>
                        {(submission.aiAnalysis.plagiarismScore * 100).toFixed(1)}%
                      </span>
                    </p>
                    {submission.aiAnalysis.plagiarismScore > 0.3 && (
                      <p className="text-sm text-red-600 mt-1">
                        ⚠️ High similarity detected. Please review for potential plagiarism.
                      </p>
                    )}
                  </div>

                  {/* AI Feedback */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">AI Feedback</h3>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {submission.aiAnalysis.aiFeedback}
                      </p>
                    </div>
                  </div>

                  {/* Strengths and Weaknesses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-green-700 mb-2 flex items-center">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Strengths
                      </h3>
                      <ul className="space-y-1">
                        {submission.aiAnalysis.strengths.map((strength, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start">
                            <span className="text-green-500 mr-2">•</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-red-700 mb-2 flex items-center">
                        <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                        Areas for Improvement
                      </h3>
                      <ul className="space-y-1">
                        {submission.aiAnalysis.weaknesses.map((weakness, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start">
                            <span className="text-red-500 mr-2">•</span>
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Suggestions */}
                  {submission.aiAnalysis.suggestions.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold text-blue-700 mb-2 flex items-center">
                        <LightBulbIcon className="h-4 w-4 mr-1" />
                        Suggestions
                      </h3>
                      <ul className="space-y-1">
                        {submission.aiAnalysis.suggestions.map((suggestion, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : submission.status === 'PENDING' ? (
                <div className="card">
                  <div className="text-center py-8">
                    <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">AI Analysis Not Started</h2>
                    <p className="text-gray-600 mb-6">
                      The AI analysis hasn't been completed yet. Click the button below to start the analysis.
                    </p>
                    <button
                      onClick={triggerManualAnalysis}
                      disabled={isManualAnalyzing}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isManualAnalyzing ? (
                        <>
                          <SparklesIcon className="h-4 w-4 mr-2 animate-spin" />
                          Starting Analysis...
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="h-4 w-4 mr-2" />
                          Start AI Analysis
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Peer Reviews */}
              {submission.reviews.length > 0 && (
                <div className="card">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Peer Reviews</h2>
                  <div className="space-y-4">
                    {submission.reviews.map((review) => (
                      <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{review.reviewer.name}</h3>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getScoreBgColor(review.score)} ${getScoreColor(review.score)}`}>
                              {review.score}/100
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-2">{review.feedback}</p>
                        {review.suggestions && (
                          <p className="text-sm text-gray-600">
                            <strong>Suggestions:</strong> {review.suggestions}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">File Type</span>
                    <span className="text-sm font-medium">{submission.fileType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`text-sm font-medium ${getStatusColor(submission.status)}`}>
                      {submission.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Reviews</span>
                    <span className="text-sm font-medium">{submission.reviews.length}</span>
                  </div>
                  {submission.aiAnalysis && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">AI Confidence</span>
                      <span className="text-sm font-medium">
                        {(submission.aiAnalysis.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>
                <div className="space-y-2">
                  <button className="w-full btn-secondary text-sm">
                    Download Submission
                  </button>
                  <button className="w-full btn-secondary text-sm">
                    Share with Peers
                  </button>
                  <button className="w-full btn-secondary text-sm">
                    Request Review
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

