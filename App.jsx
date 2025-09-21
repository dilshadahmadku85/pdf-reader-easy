import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Upload, FileText, Download, BarChart3 } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import './App.css'

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString()

function App() {
  const [file, setFile] = useState(null)
  const [extractedText, setExtractedText] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const [showDemo, setShowDemo] = useState(false)
  const fileInputRef = useRef(null)

  const demoText = `# Sample Document

This is a sample document for testing the PDF analyzer application. 

## Introduction

The PDF analyzer is designed to extract text from PDF documents and provide comprehensive writing analysis. This includes word count, readability scores, and key topic identification.

## Features

The application provides the following features:
- Text extraction from PDF files
- Word count and sentence analysis
- Readability scoring using the Flesch Reading Ease formula
- Key topic identification through frequency analysis
- Export functionality for analysis reports

## Conclusion

This sample document demonstrates the capabilities of the PDF analyzer. The text extraction should work properly, and the analysis should provide meaningful insights about the document structure and content quality.

Thank you for testing the PDF analyzer application!`

  const runDemo = async () => {
    setShowDemo(true)
    setFile({ name: 'demo_document.pdf', size: 1024 })
    setExtractedText(demoText)
    setIsProcessing(true)
    setProgress(10)
    
    // Simulate processing delay
    setTimeout(() => setProgress(50), 500)
    setTimeout(() => setProgress(80), 1000)
    
    // Perform analysis
    await performBasicAnalysis(demoText)
    setProgress(100)
    setIsProcessing(false)
    setProgress(0)
  }

  const handleFileSelect = (selectedFile) => {
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
      extractTextFromPDF(selectedFile)
    } else {
      alert('Please select a valid PDF file.')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    handleFileSelect(droppedFile)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const extractTextFromPDF = async (pdfFile) => {
    setIsProcessing(true)
    setProgress(10)
    
    try {
      const arrayBuffer = await pdfFile.arrayBuffer()
      setProgress(30)
      
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise
      setProgress(50)
      
      let fullText = ''
      const totalPages = pdf.numPages
      
      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = textContent.items.map(item => item.str).join(' ')
        fullText += pageText + '\n\n'
        setProgress(50 + (i / totalPages) * 30)
      }
      
      setExtractedText(fullText.trim())
      setProgress(80)
      
      // Perform basic analysis
      await performBasicAnalysis(fullText.trim())
      setProgress(100)
      
    } catch (error) {
      console.error('Error extracting text from PDF:', error)
      alert('Error processing PDF. Please try again.')
    } finally {
      setIsProcessing(false)
      setProgress(0)
    }
  }

  const performBasicAnalysis = async (text) => {
    try {
      // Call backend API for AI analysis
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text })
      })
      
      if (response.ok) {
        const analysisResult = await response.json()
        
        // Combine basic stats with AI analysis
        const combinedAnalysis = {
          ...analysisResult.basic_stats,
          aiAnalysis: analysisResult.ai_analysis,
          keyTopics: analysisResult.ai_analysis.main_topics || extractKeyTopics(text)
        }
        
        setAnalysis(combinedAnalysis)
      } else {
        // Fallback to basic analysis if API fails
        performFallbackAnalysis(text)
      }
    } catch (error) {
      console.error('API call failed, using fallback analysis:', error)
      performFallbackAnalysis(text)
    }
  }

  const performFallbackAnalysis = (text) => {
    // Basic text analysis (original implementation)
    const words = text.split(/\s+/).filter(word => word.length > 0)
    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0)
    const paragraphs = text.split(/\n\s*\n/).filter(para => para.trim().length > 0)
    
    // Calculate readability score (simplified Flesch Reading Ease)
    const avgWordsPerSentence = words.length / sentences.length
    const avgSyllablesPerWord = calculateAvgSyllables(words)
    const readabilityScore = Math.max(0, Math.min(100, 
      206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord)
    ))
    
    // Extract key topics (simple keyword extraction)
    const keyTopics = extractKeyTopics(text)
    
    setAnalysis({
      wordCount: words.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      readabilityScore: Math.round(readabilityScore),
      avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
      keyTopics: keyTopics,
      estimatedReadingTime: Math.ceil(words.length / 200), // 200 words per minute
      aiAnalysis: null // No AI analysis available
    })
  }

  const calculateAvgSyllables = (words) => {
    const totalSyllables = words.reduce((total, word) => {
      return total + countSyllables(word.toLowerCase())
    }, 0)
    return totalSyllables / words.length
  }

  const countSyllables = (word) => {
    word = word.replace(/[^a-z]/g, '')
    if (word.length <= 3) return 1
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
    word = word.replace(/^y/, '')
    const matches = word.match(/[aeiouy]{1,2}/g)
    return matches ? matches.length : 1
  }

  const extractKeyTopics = (text) => {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4)
    
    const wordFreq = {}
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1
    })
    
    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word)
  }

  const exportAnalysis = () => {
    if (!analysis || !extractedText) return
    
    const report = `PDF Analysis Report
Generated: ${new Date().toLocaleString()}
File: ${file?.name || 'Unknown'}

=== DOCUMENT STATISTICS ===
Word Count: ${analysis.wordCount || analysis.word_count}
Sentence Count: ${analysis.sentenceCount || analysis.sentence_count}
Paragraph Count: ${analysis.paragraphCount || analysis.paragraph_count}
Average Words per Sentence: ${analysis.avgWordsPerSentence || analysis.avg_words_per_sentence}
Estimated Reading Time: ${analysis.estimatedReadingTime || analysis.estimated_reading_time} minutes

=== READABILITY ANALYSIS ===
Readability Score: ${analysis.readabilityScore || analysis.readability_score}/100
${(analysis.readabilityScore || analysis.readability_score) >= 90 ? 'Very Easy' :
  (analysis.readabilityScore || analysis.readability_score) >= 80 ? 'Easy' :
  (analysis.readabilityScore || analysis.readability_score) >= 70 ? 'Fairly Easy' :
  (analysis.readabilityScore || analysis.readability_score) >= 60 ? 'Standard' :
  (analysis.readabilityScore || analysis.readability_score) >= 50 ? 'Fairly Difficult' :
  (analysis.readabilityScore || analysis.readability_score) >= 30 ? 'Difficult' : 'Very Difficult'}

=== KEY TOPICS ===
${analysis.keyTopics.map((topic, i) => `${i + 1}. ${topic}`).join('\n')}

${analysis.aiAnalysis ? `=== AI-POWERED ANALYSIS ===
Writing Quality Score: ${analysis.aiAnalysis.quality_score}/10
Tone & Style: ${analysis.aiAnalysis.tone_and_style}
Grammar Assessment: ${analysis.aiAnalysis.grammar_assessment}
Structure Analysis: ${analysis.aiAnalysis.structure_analysis}

Strengths:
${analysis.aiAnalysis.strengths ? analysis.aiAnalysis.strengths.map((strength, i) => `${i + 1}. ${strength}`).join('\n') : 'None identified'}

Areas for Improvement:
${analysis.aiAnalysis.improvements ? analysis.aiAnalysis.improvements.map((improvement, i) => `${i + 1}. ${improvement}`).join('\n') : 'None identified'}

Suggestions:
${analysis.aiAnalysis.suggestions ? analysis.aiAnalysis.suggestions.map((suggestion, i) => `${i + 1}. ${suggestion}`).join('\n') : 'None provided'}

${analysis.aiAnalysis.full_analysis ? `\nDetailed Analysis:\n${analysis.aiAnalysis.full_analysis}` : ''}
` : '=== AI ANALYSIS ===\nAI analysis not available for this document.\n'}

=== EXTRACTED TEXT ===
${extractedText}
`
    
    const blob = new Blob([report], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${file?.name?.replace('.pdf', '') || 'document'}_analysis.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">PDF Analyzer</h1>
          <p className="text-lg text-gray-600 mb-4">AI-Powered Writing Analysis & Quality Assessment</p>
          <div className="flex justify-center gap-4">
            <Button 
              onClick={runDemo}
              variant="outline"
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
            >
              Try Demo
            </Button>
            {(analysis || extractedText) && (
              <Button 
                onClick={() => {
                  setFile(null)
                  setExtractedText('')
                  setAnalysis(null)
                  setShowDemo(false)
                  setIsProcessing(false)
                  setProgress(0)
                }}
                variant="outline"
                className="bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
              >
                Reset
              </Button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload PDF Document
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Drop your PDF here or click to browse
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Supports PDF files up to 10MB
                </p>
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                >
                  Choose File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
              </div>
              
              {file && (
                <div className={`mt-4 p-3 border rounded-lg ${showDemo ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
                  <p className={`text-sm font-medium ${showDemo ? 'text-blue-800' : 'text-green-800'}`}>
                    {showDemo ? 'Demo: ' : 'Selected: '}{file.name}
                  </p>
                  <p className={`text-xs ${showDemo ? 'text-blue-600' : 'text-green-600'}`}>
                    {showDemo ? 'Sample document for demonstration' : `Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`}
                  </p>
                </div>
              )}
              
              {isProcessing && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Processing PDF...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analysis Results */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysis ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-600 font-medium">Word Count</p>
                      <p className="text-2xl font-bold text-blue-900">{analysis.wordCount.toLocaleString()}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm text-green-600 font-medium">Readability Score</p>
                      <p className="text-2xl font-bold text-green-900">{analysis.readabilityScore}/100</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="text-sm text-purple-600 font-medium">Sentences</p>
                      <p className="text-2xl font-bold text-purple-900">{analysis.sentenceCount}</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <p className="text-sm text-orange-600 font-medium">Reading Time</p>
                      <p className="text-2xl font-bold text-orange-900">{analysis.estimatedReadingTime}m</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Key Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.keyTopics.map((topic, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {analysis.aiAnalysis && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                      <h4 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        AI-Powered Analysis
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-white p-3 rounded-lg">
                          <p className="text-sm text-purple-600 font-medium">Writing Quality</p>
                          <p className="text-xl font-bold text-purple-900">
                            {analysis.aiAnalysis.quality_score}/10
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <p className="text-sm text-purple-600 font-medium">Tone & Style</p>
                          <p className="text-sm text-purple-900">
                            {analysis.aiAnalysis.tone_and_style}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="bg-white p-3 rounded-lg">
                          <p className="text-sm font-medium text-purple-900 mb-1">Grammar Assessment</p>
                          <p className="text-sm text-gray-700">{analysis.aiAnalysis.grammar_assessment}</p>
                        </div>
                        
                        {analysis.aiAnalysis.strengths && analysis.aiAnalysis.strengths.length > 0 && (
                          <div className="bg-white p-3 rounded-lg">
                            <p className="text-sm font-medium text-green-900 mb-1">Strengths</p>
                            <ul className="text-sm text-gray-700 list-disc list-inside">
                              {analysis.aiAnalysis.strengths.slice(0, 3).map((strength, index) => (
                                <li key={index}>{strength}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {analysis.aiAnalysis.improvements && analysis.aiAnalysis.improvements.length > 0 && (
                          <div className="bg-white p-3 rounded-lg">
                            <p className="text-sm font-medium text-orange-900 mb-1">Areas for Improvement</p>
                            <ul className="text-sm text-gray-700 list-disc list-inside">
                              {analysis.aiAnalysis.improvements.slice(0, 3).map((improvement, index) => (
                                <li key={index}>{improvement}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    onClick={exportAnalysis}
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Analysis Report
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Upload a PDF to see analysis results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Extracted Text Preview */}
        {extractedText && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Extracted Text Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                  {extractedText.substring(0, 2000)}
                  {extractedText.length > 2000 && '...'}
                </pre>
              </div>
              {extractedText.length > 2000 && (
                <p className="text-sm text-gray-500 mt-2">
                  Showing first 2000 characters. Full text available in exported report.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default App

