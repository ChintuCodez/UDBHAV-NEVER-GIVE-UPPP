'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  CodeBracketIcon, 
  DocumentTextIcon, 
  ChartBarIcon, 
  SparklesIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

const features = [
  {
    name: 'AI-Powered Analysis',
    description: 'Advanced NLP and machine learning algorithms analyze code quality, readability, and structure.',
    icon: SparklesIcon,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    name: 'Plagiarism Detection',
    description: 'Sophisticated similarity checking algorithms detect copied content and provide detailed reports.',
    icon: ShieldCheckIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  {
    name: 'Intelligent Feedback',
    description: 'Generate constructive, personalized feedback with actionable suggestions for improvement.',
    icon: LightBulbIcon,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  {
    name: 'Real-time Collaboration',
    description: 'Work together with peers and instructors in real-time with live updates and notifications.',
    icon: ChartBarIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
]

const stats = [
  { name: 'Projects Analyzed', value: '10,000+' },
  { name: 'Accuracy Rate', value: '98.5%' },
  { name: 'Time Saved', value: '75%' },
  { name: 'User Satisfaction', value: '4.9/5' },
]

export default function HomePage() {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status !== 'loading') {
      setIsLoading(false)
    }
  }, [status])

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

  return (
    <div className="min-h-screen gradient-bg">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <CodeBracketIcon className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gradient">AI Peer Review</span>
            </div>
            <div className="flex items-center space-x-4">
              {session ? (
                <Link href="/dashboard" className="btn-primary">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/auth/signin" className="text-gray-600 hover:text-gray-900">
                    Sign In
                  </Link>
                  <Link href="/auth/signup" className="btn-primary">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
            >
              AI-Driven{' '}
              <span className="text-gradient">Peer Review</span>
              <br />
              Platform
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
            >
              Revolutionize your code and document review process with cutting-edge AI technology. 
              Get instant, intelligent feedback, detect plagiarism, and improve your work quality.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href={session ? "/dashboard" : "/auth/signup"} className="btn-primary text-lg px-8 py-3">
                Start Analyzing
                <ArrowRightIcon className="ml-2 h-5 w-5 inline" />
              </Link>
              <Link href="#features" className="btn-secondary text-lg px-8 py-3">
                Learn More
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 animate-float">
          <div className="w-20 h-20 bg-primary-100 rounded-full opacity-60"></div>
        </div>
        <div className="absolute top-40 right-20 animate-float" style={{ animationDelay: '2s' }}>
          <div className="w-16 h-16 bg-secondary-100 rounded-full opacity-60"></div>
        </div>
        <div className="absolute bottom-20 left-1/4 animate-float" style={{ animationDelay: '4s' }}>
          <div className="w-12 h-12 bg-purple-100 rounded-full opacity-60"></div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need for comprehensive peer review and code analysis
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card hover:shadow-lg transition-shadow duration-300"
              >
                <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.name}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-primary-100">
                  {stat.name}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Review Process?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of developers and educators who trust our AI-powered platform
          </p>
          <Link href={session ? "/dashboard" : "/auth/signup"} className="btn-primary text-lg px-8 py-3">
            Get Started Free
            <ArrowRightIcon className="ml-2 h-5 w-5 inline" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <CodeBracketIcon className="h-8 w-8 text-primary-400" />
              <span className="ml-2 text-xl font-bold">AI Peer Review</span>
            </div>
            <p className="text-gray-400 mb-4">
              Powered by advanced AI technology for intelligent code and document analysis
            </p>
            <p className="text-gray-500 text-sm">
              © 2024 AI Peer Review Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

