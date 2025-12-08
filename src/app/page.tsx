import { Layout } from '@/components/layout/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Upload, FileText, GitBranch, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="container py-24 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            NRT Rules Automation
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Upload Excel files to generate NRT Ruleset XML and automatically push to GIT. 
            Streamline your CRM operations with automated processing.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button asChild size="lg">
              <Link href="/nrt-ruleset">
                Process NRT Ruleset
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple & Powerful
          </h2>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Everything you need to process NRT Rulesets from Excel to GIT
          </p>
        </div>
        
        <div className="mx-auto mt-16 max-w-4xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Upload */}
            <Card className="relative overflow-hidden">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Upload className="h-6 w-6 text-primary" />
                  <CardTitle>1. Upload Excel</CardTitle>
                </div>
                <CardDescription>
                  Upload your Excel file containing NRT Ruleset data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Supports .xlsx files</li>
                  <li>• File validation</li>
                  <li>• Secure upload</li>
                </ul>
              </CardContent>
            </Card>

            {/* Generate */}
            <Card className="relative overflow-hidden">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <FileText className="h-6 w-6 text-primary" />
                  <CardTitle>2. Generate XML</CardTitle>
                </div>
                <CardDescription>
                  Automatically generate XML from your Excel data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Release & environment selection</li>
                  <li>• Automatic XML generation</li>
                  <li>• File naming conventions</li>
                </ul>
              </CardContent>
            </Card>

            {/* GIT Push */}
            <Card className="relative overflow-hidden">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <GitBranch className="h-6 w-6 text-primary" />
                  <CardTitle>3. Push to GIT</CardTitle>
                </div>
                <CardDescription>
                  Automatically commit and push to your GIT repository
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Automatic GIT commit</li>
                  <li>• Story number tracking</li>
                  <li>• Audit trail logging</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Feature Card */}
      <section className="container py-24">
        <div className="mx-auto max-w-4xl">
          <Card className="relative overflow-hidden">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-6 w-6 text-primary" />
                <CardTitle>NRT Ruleset Processing</CardTitle>
              </div>
              <CardDescription>
                Complete workflow from Excel upload to GIT push in one simple process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">What it does:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Uploads and validates Excel files</li>
                      <li>• Generates XML with proper naming</li>
                      <li>• Commits to GIT with story tracking</li>
                      <li>• Maintains audit trail</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Configuration:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Select release (R1.0, R2.1, etc.)</li>
                      <li>• Choose environment (dev/prod)</li>
                      <li>• Optional story number</li>
                      <li>• Automatic timestamping</li>
                    </ul>
                  </div>
                </div>
                <div className="pt-4">
                  <Button asChild size="lg" className="w-full">
                    <Link href="/nrt-ruleset">
                      Start Processing NRT Rulesets
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Status Section */}
      <section className="container py-24">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg border bg-card p-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">System Status</h3>
                <p className="text-muted-foreground">
                  Ready to process NRT Rulesets
                </p>
              </div>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Online
              </Badge>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">Ready</div>
                <div className="text-sm text-muted-foreground">System Status</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">Excel → XML</div>
                <div className="text-sm text-muted-foreground">Processing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">GIT</div>
                <div className="text-sm text-muted-foreground">Integration</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}