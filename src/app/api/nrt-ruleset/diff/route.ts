import { NextRequest, NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'

// Initialize GitHub API client
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

export async function POST(request: NextRequest) {
  try {
    const { release, environment, storyNumber } = await request.json()

    if (!release || !environment) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: release, environment'
      }, { status: 400 })
    }

    // Get repository URL based on environment
    let repoUrl
    switch (environment.toLowerCase()) {
      case 'production':
        repoUrl = process.env.XML_REPO_URL_PROD || 'https://github.com/K3NTAW/xml-prod.git'
        break
      case 'development':
        repoUrl = process.env.XML_REPO_URL_DEV || 'https://github.com/K3NTAW/xml-dev.git'
        break
      default:
        repoUrl = process.env.XML_REPO_URL_DEFAULT || 'https://github.com/K3NTAW/xml-test-repo.git'
    }

    // Parse repository URL to extract owner and name
    const urlMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?$/)
    if (!urlMatch) {
      throw new Error('Invalid repository URL format')
    }
    const repoOwner = urlMatch[1]
    const repoName = urlMatch[2]

    // Generate XML content (same as in process route)
    const xmlContent = generateXMLFromExcel(release, environment, storyNumber)
    const xmlFileName = 'nrt-ruleset.xml'

    try {
      // Try to get the current file content
      const { data: currentFile } = await octokit.rest.repos.getContent({
        owner: repoOwner,
        repo: repoName,
        path: xmlFileName
      })

      if ('content' in currentFile && currentFile.content) {
        // File exists, decode and compare
        const currentContent = Buffer.from(currentFile.content, 'base64').toString('utf-8')
        const newContent = xmlContent

        // Generate diff
        const diff = generateDiff(currentContent, newContent)
        
        return NextResponse.json({
          success: true,
          hasChanges: currentContent !== newContent,
          diff: diff,
          currentContent: currentContent,
          newContent: newContent,
          fileName: xmlFileName
        })
      }
    } catch (error: unknown) {
      if ((error as { status?: number }).status === 404) {
        // File doesn't exist, this will be a new file
        return NextResponse.json({
          success: true,
          hasChanges: true,
          diff: `+ ${xmlContent.split('\n').map(line => `+${line}`).join('\n')}`,
          currentContent: '',
          newContent: xmlContent,
          fileName: xmlFileName,
          isNewFile: true
        })
      }
      throw error
    }

  } catch (error) {
    console.error('Error getting diff:', error)
    return NextResponse.json({
      success: false,
      message: 'Error getting diff: ' + (error as Error).message
    }, { status: 500 })
  }
}

// Simplified XML generation (same as in process route)
function generateXMLFromExcel(release: string, environment: string, storyNumber?: string): string {
  const timestamp = new Date().toISOString()
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<nrt-ruleset>
  <metadata>
    <release>${release}</release>
    <environment>${environment}</environment>
    <story-number>${storyNumber || 'N/A'}</story-number>
    <generated-at>${timestamp}</generated-at>
  </metadata>
  <rules>
    <!-- This is a simplified XML structure -->
    <!-- In real implementation, this would be generated from Excel data -->
    <rule id="rule-1">
      <name>Sample Rule</name>
      <description>Generated for ${release}/${environment}</description>
      <active>true</active>
    </rule>
  </rules>
</nrt-ruleset>`
}

// Simple diff generator
function generateDiff(oldContent: string, newContent: string): string {
  const oldLines = oldContent.split('\n')
  const newLines = newContent.split('\n')
  
  let diff = ''
  const maxLines = Math.max(oldLines.length, newLines.length)
  
  for (let i = 0; i < maxLines; i++) {
    const oldLine = oldLines[i] || ''
    const newLine = newLines[i] || ''
    
    if (oldLine === newLine) {
      diff += `  ${oldLine}\n`
    } else {
      if (oldLine) diff += `- ${oldLine}\n`
      if (newLine) diff += `+ ${newLine}\n`
    }
  }
  
  return diff
}
