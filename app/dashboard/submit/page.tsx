'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import {
  DocumentArrowUpIcon,
  CodeBracketIcon,
  DocumentTextIcon,
  XMarkIcon,
  SparklesIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { Editor } from '@monaco-editor/react'
import toast from 'react-hot-toast'

interface SubmissionData {
  title: string
  description: string
  content: string
  fileType: 'CODE' | 'DOCUMENT' | 'PRESENTATION' | 'OTHER'
  language: string
}

export default function SubmitPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [submissionData, setSubmissionData] = useState<SubmissionData>({
    title: '',
    description: '',
    content: '',
    fileType: 'CODE',
    language: 'javascript'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setUploadedFile(file)
      
      // Read file content
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setSubmissionData(prev => ({
          ...prev,
          content,
          title: file.name,
          fileType: getFileType(file.name)
        }))
      }
      reader.readAsText(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/json': ['.json'],
      'text/javascript': ['.js', '.jsx', '.ts', '.tsx'],
      'text/x-python': ['.py'],
      'text/x-java': ['.java'],
      'text/x-c': ['.c', '.cpp', '.h'],
      'text/html': ['.html', '.htm'],
      'text/css': ['.css'],
      'text/xml': ['.xml'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1
  })

  const getFileType = (filename: string): 'CODE' | 'DOCUMENT' | 'PRESENTATION' | 'OTHER' => {
    const ext = filename.split('.').pop()?.toLowerCase()
    const codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'html', 'css', 'xml', 'json']
    const docExtensions = ['txt', 'pdf', 'doc', 'docx']
    const presentationExtensions = ['ppt', 'pptx']
    
    if (codeExtensions.includes(ext || '')) return 'CODE'
    if (docExtensions.includes(ext || '')) return 'DOCUMENT'
    if (presentationExtensions.includes(ext || '')) return 'PRESENTATION'
    return 'OTHER'
  }

  const getLanguageFromFilename = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase()
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'h': 'c',
      'html': 'html',
      'css': 'css',
      'xml': 'xml',
      'json': 'json'
    }
    return languageMap[ext || ''] || 'plaintext'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!submissionData.title || !submissionData.content) {
      toast.error('Please provide a title and content')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...submissionData,
          language: getLanguageFromFilename(submissionData.title)
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success('Submission created successfully!')
        
        // Start AI analysis and wait for completion
        setIsAnalyzing(true)
        try {
          console.log('Starting AI analysis for submission:', result.submission.id)
          const analysisResponse = await fetch(`/api/analyze/${result.submission.id}`, {
            method: 'POST'
          })
          
          if (analysisResponse.ok) {
            const analysisResult = await analysisResponse.json()
            console.log('Analysis response:', analysisResult)
            toast.success('AI analysis completed!')
            router.push(`/dashboard/submissions/${result.submission.id}`)
          } else {
            const errorResult = await analysisResponse.json()
            console.error('Analysis failed:', errorResult)
            toast.error(`AI analysis failed: ${errorResult.error || 'Unknown error'}`)
            router.push(`/dashboard/submissions/${result.submission.id}`)
          }
        } catch (analysisError) {
          console.error('Analysis error:', analysisError)
          toast.error('AI analysis failed, but submission was saved')
          router.push(`/dashboard/submissions/${result.submission.id}`)
        }
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to create submission')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
      setIsAnalyzing(false)
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    setSubmissionData(prev => ({
      ...prev,
      content: '',
      title: ''
    }))
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
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Submit for Review
            </h1>
            <p className="text-gray-600">
              Upload your code or document for AI-powered analysis and peer review
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    id="title"
                    type="text"
                    required
                    value={submissionData.title}
                    onChange={(e) => setSubmissionData(prev => ({ ...prev, title: e.target.value }))}
                    className="input-field"
                    placeholder="Enter submission title"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={submissionData.description}
                    onChange={(e) => setSubmissionData(prev => ({ ...prev, description: e.target.value }))}
                    className="input-field"
                    placeholder="Describe your submission (optional)"
                  />
                </div>

                <div>
                  <label htmlFor="fileType" className="block text-sm font-medium text-gray-700 mb-1">
                    File Type
                  </label>
                  <select
                    id="fileType"
                    value={submissionData.fileType}
                    onChange={(e) => setSubmissionData(prev => ({ 
                      ...prev, 
                      fileType: e.target.value as 'CODE' | 'DOCUMENT' | 'PRESENTATION' | 'OTHER' 
                    }))}
                    className="input-field"
                  >
                    <option value="CODE">Code</option>
                    <option value="DOCUMENT">Document</option>
                    <option value="PRESENTATION">Presentation</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload File</h2>
              
              {!uploadedFile ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ${
                    isDragActive
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    {isDragActive ? 'Drop the file here' : 'Drag & drop a file here'}
                  </p>
                  <p className="text-gray-600 mb-4">
                    or click to select a file
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports: .js, .ts, .py, .java, .html, .css, .txt, .pdf, .doc, .docx
                  </p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {submissionData.fileType === 'CODE' ? (
                        <CodeBracketIcon className="h-8 w-8 text-blue-500" />
                      ) : (
                        <DocumentTextIcon className="h-8 w-8 text-green-500" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(uploadedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Code Editor */}
            {submissionData.content && submissionData.fileType === 'CODE' && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Code Preview</h2>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <Editor
                    height="400px"
                    language={submissionData.language}
                    value={submissionData.content}
                    onChange={(value) => setSubmissionData(prev => ({ ...prev, content: value || '' }))}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 14,
                      lineNumbers: 'on',
                      wordWrap: 'on'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Text Preview */}
            {submissionData.content && submissionData.fileType !== 'CODE' && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Content Preview</h2>
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-900">
                    {submissionData.content}
                  </pre>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isAnalyzing || !submissionData.title || !submissionData.content}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  'Submitting...'
                ) : isAnalyzing ? (
                  <>
                    <SparklesIcon className="h-4 w-4 mr-2 animate-spin" />
                    AI Analyzing...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Submit for Review
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

