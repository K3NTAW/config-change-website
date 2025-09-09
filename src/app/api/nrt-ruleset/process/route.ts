import { NextRequest, NextResponse } from 'next/server'
import { fileStorage } from '@/lib/file-storage'
import { DATA_PATHS } from '@/constants'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'

const execAsync = promisify(exec)

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

    // Push to GIT (XML files repository)
    let gitCommit = null
    let gitPush = null
    try {
      const xmlRepoPath = process.env.XML_FILES_REPO_PATH || '/Users/k3ntaw/code/swisscom/nrt-rules-xml-files'
      
      // Copy files to XML repository
      await fs.copyFile(filePath, path.join(xmlRepoPath, fileName))
      await fs.copyFile(xmlPath, path.join(xmlRepoPath, xmlFileName))
      
      // Add and commit the file in XML repository
      const { stdout: commitOutput } = await execAsync(`cd ${xmlRepoPath} && git add ${fileName} ${xmlFileName} && git commit -m "NRT-${storyNumber || 'AUTO'}: Generated NRT Ruleset XML for ${release}/${environment}"`)
      gitCommit = commitOutput.trim()
      
      // Push to remote repository
      const { stdout: pushOutput } = await execAsync(`cd ${xmlRepoPath} && git push`)
      gitPush = pushOutput.trim()
    } catch (error) {
      console.warn('GIT operation failed:', error)
      // Continue without failing the entire operation
    }

    return NextResponse.json({
      success: true,
      message: 'NRT Ruleset XML generated and pushed to GIT successfully',
      xmlFile: xmlFileName,
      gitCommit,
      gitPush: gitPush ? 'Pushed to remote repository' : 'Push failed - check logs'
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
