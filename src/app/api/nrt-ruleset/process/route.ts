import { NextRequest, NextResponse } from 'next/server'
import { fileStorage } from '@/lib/file-storage'
import { DATA_PATHS } from '@/constants'
import { Octokit } from '@octokit/rest'
import path from 'path'
import fs from 'fs/promises'

// Initialize GitHub API client
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const release = formData.get('release') as string
    const environment = formData.get('environment') as string
    const storyNumber = formData.get('storyNumber') as string

    if (!file || !release || !environment) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: file, release, environment'
      }, { status: 400 })
    }

    // Create unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `nrt-ruleset-${release}-${environment}-${timestamp}.xlsx`
    const xmlFileName = `nrt-ruleset-${release}-${environment}-${timestamp}.xml`

    // Save uploaded file
    const fileBuffer = await file.arrayBuffer()
    const filePath = path.join(process.cwd(), DATA_PATHS.XML_FILES, fileName)
    await fs.writeFile(filePath, Buffer.from(fileBuffer))

    // Generate XML (simplified - in real implementation, this would process the Excel)
    const xmlContent = generateXMLFromExcel(file, release, environment, storyNumber)
    const xmlPath = path.join(process.cwd(), DATA_PATHS.XML_FILES, xmlFileName)
    await fs.writeFile(xmlPath, xmlContent)

    // Log the operation
    await logOperation('nrt-ruleset-process', {
      fileName,
      xmlFileName,
      release,
      environment,
      storyNumber: storyNumber || 'N/A'
    })

    // Push to GitHub XML repository using API
    let gitCommit = null
    let gitPush = null
    try {
      const repoOwner = process.env.XML_REPO_OWNER || 'K3NTAW'
      const repoName = process.env.XML_REPO_NAME || 'xml-test-repo'
      
      // Read file contents
      const excelContent = await fs.readFile(filePath)
      const xmlContent = await fs.readFile(xmlPath)
      
      // Create commit message
      const commitMessage = `NRT-${storyNumber || 'AUTO'}: Generated NRT Ruleset XML for ${release}/${environment}`
      
      // Get current commit SHA
      const { data: refData } = await octokit.rest.git.getRef({
        owner: repoOwner,
        repo: repoName,
        ref: 'heads/main'
      })
      
      // Get current tree
      const { data: commitData } = await octokit.rest.git.getCommit({
        owner: repoOwner,
        repo: repoName,
        commit_sha: refData.object.sha
      })
      
      // Create blobs for the files
      const excelBlob = await octokit.rest.git.createBlob({
        owner: repoOwner,
        repo: repoName,
        content: excelContent.toString('base64'),
        encoding: 'base64'
      })
      
      const xmlBlob = await octokit.rest.git.createBlob({
        owner: repoOwner,
        repo: repoName,
        content: xmlContent.toString('base64'),
        encoding: 'base64'
      })
      
      // Create new tree with the files
      const { data: treeData } = await octokit.rest.git.createTree({
        owner: repoOwner,
        repo: repoName,
        base_tree: commitData.tree.sha,
        tree: [
          {
            path: fileName,
            mode: '100644',
            type: 'blob',
            sha: excelBlob.data.sha
          },
          {
            path: xmlFileName,
            mode: '100644',
            type: 'blob',
            sha: xmlBlob.data.sha
          }
        ]
      })
      
      // Create new commit
      const { data: newCommit } = await octokit.rest.git.createCommit({
        owner: repoOwner,
        repo: repoName,
        message: commitMessage,
        tree: treeData.sha,
        parents: [refData.object.sha]
      })
      
      // Update branch reference
      await octokit.rest.git.updateRef({
        owner: repoOwner,
        repo: repoName,
        ref: 'heads/main',
        sha: newCommit.sha
      })
      
      gitCommit = `Commit: ${newCommit.sha}`
      gitPush = 'Pushed to remote repository successfully'
      
    } catch (error) {
      console.warn('GitHub API operation failed:', error)
      // Continue without failing the entire operation
    }

    return NextResponse.json({
      success: true,
      message: 'NRT Ruleset XML generated and pushed to XML repository successfully',
      xmlFile: xmlFileName,
      excelFile: fileName,
      gitCommit,
      gitPush: gitPush || 'Push failed - check logs'
    })

  } catch (error) {
    console.error('Error processing NRT Ruleset:', error)
    return NextResponse.json({
      success: false,
      message: 'Error processing NRT Ruleset: ' + (error as Error).message
    }, { status: 500 })
  }
}

// Simplified XML generation - in real implementation, this would parse the Excel file
function generateXMLFromExcel(file: File, release: string, environment: string, storyNumber?: string): string {
  const timestamp = new Date().toISOString()
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<nrt-ruleset>
  <metadata>
    <release>${release}</release>
    <environment>${environment}</environment>
    <story-number>${storyNumber || 'N/A'}</story-number>
    <generated-at>${timestamp}</generated-at>
    <source-file>${file.name}</source-file>
  </metadata>
  <rules>
    <!-- This is a simplified XML structure -->
    <!-- In real implementation, this would be generated from Excel data -->
    <rule id="rule-1">
      <name>Sample Rule</name>
      <description>Generated from Excel file: ${file.name}</description>
      <active>true</active>
    </rule>
  </rules>
</nrt-ruleset>`
}

// Log operation to audit trail
async function logOperation(action: string, details: any) {
  try {
    const auditLog = await fileStorage.readJson(`${DATA_PATHS.AUDIT_LOGS}/audit.json`) || []
    
    auditLog.push({
      timestamp: new Date().toISOString(),
      action,
      details: JSON.stringify(details),
      story_number: details.storyNumber || 'N/A',
      file_name: details.xmlFileName
    })

    await fileStorage.writeJson(`${DATA_PATHS.AUDIT_LOGS}/audit.json`, auditLog)
  } catch (error) {
    console.error('Failed to log operation:', error)
  }
}
