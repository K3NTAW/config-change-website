'use client'

import { useState } from 'react'
import { Layout } from '@/components/layout/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, FileText, GitBranch, CheckCircle, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function NRTRulesetPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [release, setRelease] = useState('')
  const [environment, setEnvironment] = useState('')
  const [storyNumber, setStoryNumber] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
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

  const handleProcess = async () => {
    if (!selectedFile || !release || !environment) {
      alert('Please fill in all required fields')
      return
    }

    setIsProcessing(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('release', release)
      formData.append('environment', environment)
      formData.append('storyNumber', storyNumber)

      const response = await fetch('/api/nrt-ruleset/process', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: 'Error processing file: ' + (error as Error).message
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">NRT Ruleset Processing</h1>
            <p className="text-muted-foreground mt-2">
              Upload an Excel file to generate NRT Ruleset XML and push to GIT
            </p>
          </div>

          <div className="grid gap-6">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
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
                    className="mt-1"
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Configuration Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Configuration
                </CardTitle>
                <CardDescription>
                  Configure release and environment settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="release">Release *</Label>
                    <Select value={release} onValueChange={setRelease}>
                      <SelectTrigger>
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
                      <SelectTrigger>
                        <SelectValue placeholder="Select environment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="development">Development</SelectItem>
                        <SelectItem value="staging">Staging</SelectItem>
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
                  />
                </div>
              </CardContent>
            </Card>

            {/* Process Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleProcess}
                disabled={!selectedFile || !release || !environment || isProcessing}
                size="lg"
                className="min-w-48"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <GitBranch className="h-4 w-4 mr-2" />
                    Generate XML & Push to GIT
                  </>
                )}
              </Button>
            </div>

            {/* Result Section */}
            {result && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    Processing Result
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert variant={result.success ? "default" : "destructive"}>
                    <AlertDescription>
                      {result.message}
                    </AlertDescription>
                  </Alert>
                  
                  {result.success && result.xmlFile && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium">Generated Files:</p>
                      <p className="text-sm text-muted-foreground">XML: {result.xmlFile}</p>
                      {result.gitCommit && (
                        <p className="text-sm text-muted-foreground">GIT Commit: {result.gitCommit}</p>
                      )}
                      {result.gitPush && (
                        <p className="text-sm text-muted-foreground">GIT Push: {result.gitPush}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
