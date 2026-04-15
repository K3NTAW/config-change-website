'use client'

import { useState } from 'react'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, FileText, CheckCircle, AlertCircle, ArrowRight, GitBranch } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function NRTRulesetPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [release, setRelease] = useState('')
  const [environment, setEnvironment] = useState('')
  const [storyNumber, setStoryNumber] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showDiff, setShowDiff] = useState(false)
  const [diffData, setDiffData] = useState<{
    hasChanges: boolean
    diff: string
    diffStat: string
    currentContent: string
    newContent: string
    fileName: string
    isNewFile?: boolean
  } | null>(null)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    xmlFile?: string
    gitCommit?: string
    gitPush?: string
  } | null>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.name.endsWith('.xlsx')) {
      setSelectedFile(file)
      setResult(null)
    } else {
      alert('Please select a valid Excel file (.xlsx)')
    }
  }

  const handlePreview = async () => {
    if (!selectedFile || !release || !environment) {
      alert('Please fill in all required fields and upload a file')
      return
    }

    setIsProcessing(true)
    setResult(null)
    setShowDiff(false)
    setDiffData(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('action', 'preview')
      formData.append('release', release)
      formData.append('environment', environment)
      formData.append('storyNumber', storyNumber)

      const response = await fetch('/api/nrt-ruleset/process', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      
      if (data.success) {
        setDiffData(data)
        setShowDiff(true)
      } else {
        setResult({
          success: false,
          message: data.message
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Error generating preview: ' + (error as Error).message
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePush = async () => {
    if (!selectedFile || !release || !environment) return

    setIsProcessing(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('action', 'push')
      formData.append('release', release)
      formData.append('environment', environment)
      formData.append('storyNumber', storyNumber)
      formData.append('acknowledge', 'true')

      const response = await fetch('/api/nrt-ruleset/process', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      setResult(data)
      setShowDiff(false)
      setDiffData(null)
    } catch (error) {
      setResult({
        success: false,
        message: 'Error pushing changes: ' + (error as Error).message
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = () => {
    setShowDiff(false)
    setDiffData(null)
  }

  return (
    <Layout>
      <div className="bg-[#F8F9FA] text-slate-800">
        <section className="container relative overflow-hidden px-4 py-16 md:px-8 md:py-20">
          <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-[#0055FF]/5 blur-3xl" />
          <div className="relative z-10 mx-auto max-w-5xl">
            <div className="mb-10 text-center">
              <h1 className="text-4xl font-semibold tracking-tight text-[#001D70] sm:text-5xl">NRT Ruleset Processing</h1>
              <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
                Upload an Excel file, preview the git-style diff, and push your generated XML safely.
              </p>
            </div>

            <div className="grid gap-6">
              {}
              <Card className="rounded-2xl border-slate-100 bg-white shadow-[0_2px_20px_rgba(0,0,0,0.03)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#001D70]">
                    <Upload className="h-5 w-5 text-[#0055FF]" />
                    Excel File Upload
                  </CardTitle>
                  <CardDescription>
                    Upload your Excel file containing NRT Ruleset data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="file">Excel File (.xlsx)</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".xlsx"
                      onChange={handleFileUpload}
                      className="mt-2 border-slate-200 bg-white"
                    />
                    {selectedFile && (
                      <p className="mt-2 text-sm text-slate-500">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {}
              <Card className="rounded-2xl border-slate-100 bg-white shadow-[0_2px_20px_rgba(0,0,0,0.03)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#001D70]">
                    <FileText className="h-5 w-5 text-[#0055FF]" />
                    Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure release and environment settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="release">Release *</Label>
                      <Select value={release} onValueChange={setRelease}>
                        <SelectTrigger className="mt-2 border-slate-200 bg-white">
                          <SelectValue placeholder="Select release" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="R1.0">R1.0</SelectItem>
                          <SelectItem value="R1.1">R1.1</SelectItem>
                          <SelectItem value="R1.2">R1.2</SelectItem>
                          <SelectItem value="R2.0">R2.0</SelectItem>
                          <SelectItem value="R2.1">R2.1</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="environment">Environment *</Label>
                      <Select value={environment} onValueChange={setEnvironment}>
                        <SelectTrigger className="mt-2 border-slate-200 bg-white">
                          <SelectValue placeholder="Select environment" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="development">Development</SelectItem>
                          <SelectItem value="production">Production</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="storyNumber">Story Number (Optional)</Label>
                    <Input
                      id="storyNumber"
                      value={storyNumber}
                      onChange={(e) => setStoryNumber(e.target.value)}
                      placeholder="e.g., NRT-123"
                      className="mt-2 border-slate-200 bg-white"
                    />
                  </div>
                  <div className="rounded-xl border border-[#CDE0FF] bg-[#F0F4FF] p-3">
                    <p className="text-sm text-[#0A3A93]">
                      <strong>Automatic Macro Detection:</strong> The system will automatically detect and run all applicable macros based on the sheets in your Excel file.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {}
              <div className="flex justify-center gap-4">
                <Button
                  onClick={handlePreview}
                  disabled={!selectedFile || !release || !environment || isProcessing}
                  size="lg"
                  className="min-w-52 rounded-full bg-[#0055FF] text-white hover:bg-[#0044CC]"
                >
                  {isProcessing ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                      Generating Preview...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Preview Changes
                    </>
                  )}
                </Button>
              </div>

              {}
              {showDiff && diffData && (
                <Card className="mt-2 rounded-2xl border-slate-100 bg-white shadow-[0_2px_20px_rgba(0,0,0,0.03)]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#001D70]">
                      <AlertCircle className="h-5 w-5 text-[#0055FF]" />
                      Changes Preview
                    </CardTitle>
                    <CardDescription>
                      {diffData.isNewFile
                        ? `This will create a new file: ${diffData.fileName}`
                        : `Changes to ${diffData.fileName}`
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {diffData.hasChanges ? (
                      <div className="space-y-4">
                        <Alert className="border-[#CDE0FF] bg-[#F0F4FF]">
                          <AlertCircle className="h-4 w-4 text-[#0055FF]" />
                          <AlertDescription className="text-[#0A3A93]">
                            {diffData.isNewFile
                              ? 'This will create a new XML file in the repository.'
                              : 'The following changes will be made to the existing file:'}
                          </AlertDescription>
                        </Alert>

                        <div className="rounded-lg bg-slate-100 p-3 font-mono text-sm">
                          <pre className="text-slate-700">{diffData.diffStat}</pre>
                        </div>

                        <div className="overflow-x-auto rounded-lg bg-slate-900 p-4 font-mono text-sm text-green-400">
                          <pre>{diffData.diff}</pre>
                        </div>

                        <div className="flex justify-center gap-4">
                          <Button
                            onClick={handlePush}
                            disabled={isProcessing}
                            size="lg"
                            className="min-w-40 rounded-full bg-[#0055FF] text-white hover:bg-[#0044CC]"
                          >
                            {isProcessing ? (
                              <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                                Pushing...
                              </>
                            ) : (
                              <>
                                <GitBranch className="mr-2 h-4 w-4" />
                                Push Changes
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={handleCancel}
                            disabled={isProcessing}
                            variant="outline"
                            size="lg"
                            className="min-w-32 rounded-full border-slate-300"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Alert className="border-emerald-200 bg-emerald-50">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        <AlertDescription className="text-emerald-800">
                          No changes detected. The file content is identical to what&apos;s already in the repository.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}

              {}
              {result && (
                <Card className="rounded-2xl border-slate-100 bg-white shadow-[0_2px_20px_rgba(0,0,0,0.03)]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#001D70]">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      Processing Result
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Alert variant={result.success ? 'default' : 'destructive'}>
                      <AlertDescription>
                        {result.message}
                      </AlertDescription>
                    </Alert>

                    {result.success && result.xmlFile && (
                      <div className="mt-4 space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-sm font-medium text-slate-800">Generated Files:</p>
                        <p className="text-sm text-slate-600">XML: {result.xmlFile}</p>
                        {result.gitCommit && (
                          <p className="text-sm text-slate-600">GIT Commit: {result.gitCommit}</p>
                        )}
                        {result.gitPush && (
                          <p className="text-sm text-slate-600">GIT Push: {result.gitPush}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="mt-10 flex justify-center">
              <Button
                variant="ghost"
                className="rounded-full text-[#0055FF] hover:bg-[#F0F4FF] hover:text-[#0044CC]"
                onClick={() => {
                  setSelectedFile(null)
                  setRelease('')
                  setEnvironment('')
                  setStoryNumber('')
                  setResult(null)
                  setShowDiff(false)
                  setDiffData(null)
                }}
              >
                Reset Form
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  )
}
