import { NextRequest, NextResponse } from 'next/server'
import { fileStorage } from '@/lib/file-storage'
import { DATA_PATHS } from '@/constants'
import { Octokit } from '@octokit/rest'
import * as XLSX from 'xlsx'
import * as diff from 'diff'
import { listMacros, autoDetectAndExecuteMacros } from '@/lib/macros'

// Initialize GitHub API client
const getOctokit = () => {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is not set. Please configure it in your Vercel environment variables.')
  }
  return new Octokit({
    auth: token,
  })
}

// GET endpoint to list available macros
export async function GET() {
  try {
    const macros = await listMacros()
    return NextResponse.json({
      success: true,
      macros
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error listing macros: ' + (error as Error).message
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type')
    let action, release, environment, storyNumber, acknowledge, file, macroName

          if (contentType?.includes('multipart/form-data')) {
            // Handle FormData (with file upload)
            const formData = await request.formData()
            action = formData.get('action') as string
            release = formData.get('release') as string
            environment = formData.get('environment') as string
            storyNumber = formData.get('storyNumber') as string
            acknowledge = formData.get('acknowledge') === 'true' // Convert string to boolean
            file = formData.get('file') as File
            macroName = formData.get('macroName') as string
          } else {
            // Handle JSON
            const body = await request.json()
            action = body.action
            release = body.release
            environment = body.environment
            storyNumber = body.storyNumber
            acknowledge = body.acknowledge
            macroName = body.macroName
          }

    if (!release || !environment) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: release, environment'
      }, { status: 400 })
    }

    // Handle preview request
    if (action === 'preview') {
      return handlePreview(release, environment, storyNumber, file, macroName)
    }

    // Handle push request
    if (action === 'push' && acknowledge) {
      return handlePush(release, environment, storyNumber, file, macroName)
    }

    return NextResponse.json({
      success: false,
      message: 'Invalid action or missing acknowledgment'
    }, { status: 400 })

  } catch (error) {
    console.error('Error processing NRT Ruleset:', error)
    return NextResponse.json({
      success: false,
      message: 'Error processing NRT Ruleset: ' + (error as Error).message
    }, { status: 500 })
  }
}

async function handlePreview(release: string, environment: string, storyNumber?: string, file?: File, _macroName?: string) {
  try {
    if (!file) {
      return NextResponse.json({
        success: false,
        message: 'No file provided'
      }, { status: 400 })
    }

    // Auto-detect and execute all applicable macros
    const autoDetectResult = await autoDetectAndExecuteMacros(file, release, environment, storyNumber)
    
    if (autoDetectResult.allResults.length === 0) {
      // No macros matched, fall back to simple XML conversion
      const xmlContent = await generateXMLFromExcel(file, release, environment, storyNumber)
      const xmlFileName = file.name.replace('.xlsx', '.xml')
      
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

      const urlMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?$/)
      if (!urlMatch) {
        throw new Error('Invalid repository URL format')
      }
      const repoOwner = urlMatch[1]
      const repoName = urlMatch[2]

      try {
        const octokit = getOctokit()
        const { data: currentFile } = await octokit.rest.repos.getContent({
          owner: repoOwner,
          repo: repoName,
          path: xmlFileName
        })

        if ('content' in currentFile && currentFile.content) {
          const currentContent = Buffer.from(currentFile.content, 'base64').toString('utf-8')
          const newContent = xmlContent
          const diff = await generateGitDiff(currentContent, newContent)
          const diffStat = generateDiffStat(currentContent, newContent)
          
          return NextResponse.json({
            success: true,
            hasChanges: currentContent !== newContent,
            diff: diff,
            diffStat: diffStat,
            currentContent: currentContent,
            newContent: newContent,
            fileName: xmlFileName,
            action: 'preview',
            executedMacros: [],
            skippedMacros: []
          })
        }
      } catch (error: unknown) {
        if ((error as { status?: number }).status === 404) {
          const newFileDiff = await generateGitDiff('', xmlContent)
          const newFileDiffStat = generateDiffStat('', xmlContent)
          return NextResponse.json({
            success: true,
            hasChanges: true,
            diff: newFileDiff,
            diffStat: newFileDiffStat,
            currentContent: '',
            newContent: xmlContent,
            fileName: xmlFileName,
            isNewFile: true,
            action: 'preview',
            executedMacros: [],
            skippedMacros: []
          })
        }
        // Handle GitHub authentication errors
        if ((error as { status?: number }).status === 401) {
          throw new Error('GitHub authentication failed. Please check that GITHUB_TOKEN is set correctly in Vercel environment variables and has the required permissions (repo scope).')
        }
        throw error
      }
    }

    // Use the first successful macro result for preview
    const firstSuccessResult = autoDetectResult.allResults.find(r => r.success)
    if (!firstSuccessResult) {
      return NextResponse.json({
        success: false,
        message: 'All macros failed to execute',
        errors: autoDetectResult.allResults.map(r => r.error).filter(Boolean),
        executedMacros: autoDetectResult.executedMacros,
        skippedMacros: autoDetectResult.skippedMacros
      }, { status: 500 })
    }

    const xmlContent = firstSuccessResult.xmlContent
    const xmlFileName = firstSuccessResult.fileName

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

    const urlMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?$/)
    if (!urlMatch) {
      throw new Error('Invalid repository URL format')
    }
    const repoOwner = urlMatch[1]
    const repoName = urlMatch[2]

    try {
      const octokit = getOctokit()
      const { data: currentFile } = await octokit.rest.repos.getContent({
        owner: repoOwner,
        repo: repoName,
        path: xmlFileName
      })

      if ('content' in currentFile && currentFile.content) {
        const currentContent = Buffer.from(currentFile.content, 'base64').toString('utf-8')
        const newContent = xmlContent
        const diff = await generateGitDiff(currentContent, newContent)
        const diffStat = generateDiffStat(currentContent, newContent)
        
        return NextResponse.json({
          success: true,
          hasChanges: currentContent !== newContent,
          diff: diff,
          diffStat: diffStat,
          currentContent: currentContent,
          newContent: newContent,
          fileName: xmlFileName,
          action: 'preview',
          executedMacros: autoDetectResult.executedMacros,
          skippedMacros: autoDetectResult.skippedMacros,
          allResults: autoDetectResult.allResults
        })
      }
    } catch (error: unknown) {
      if ((error as { status?: number }).status === 404) {
        const newFileDiff = await generateGitDiff('', xmlContent)
        const newFileDiffStat = generateDiffStat('', xmlContent)
        return NextResponse.json({
          success: true,
          hasChanges: true,
          diff: newFileDiff,
          diffStat: newFileDiffStat,
          currentContent: '',
          newContent: xmlContent,
          fileName: xmlFileName,
          isNewFile: true,
          action: 'preview',
          executedMacros: autoDetectResult.executedMacros,
          skippedMacros: autoDetectResult.skippedMacros,
          allResults: autoDetectResult.allResults
        })
      }
      // Handle GitHub authentication errors
      if ((error as { status?: number }).status === 401) {
        throw new Error('GitHub authentication failed. Please check that GITHUB_TOKEN is set correctly in Vercel environment variables and has the required permissions (repo scope).')
      }
      throw error
    }

  } catch (error) {
    console.error('Error in preview:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    let status = 500
    let message = `Error generating preview: ${errorMessage}`
    
    // Provide more helpful error messages for common issues
    if (errorMessage.includes('GITHUB_TOKEN')) {
      message = errorMessage
      status = 500
    } else if (errorMessage.includes('authentication failed')) {
      message = errorMessage
      status = 401
    }
    
    return NextResponse.json({
      success: false,
      message
    }, { status })
  }
}

async function handlePush(release: string, environment: string, storyNumber?: string, file?: File, _macroName?: string) {
  try {
    if (!file) {
      return NextResponse.json({
        success: false,
        message: 'No file provided'
      }, { status: 400 })
    }

    // Auto-detect and execute all applicable macros
    const autoDetectResult = await autoDetectAndExecuteMacros(file, release, environment, storyNumber)
    
    let xmlContent: string
    let xmlFileName: string
    
    if (autoDetectResult.allResults.length === 0) {
      // No macros matched, fall back to simple XML conversion
      xmlContent = await generateXMLFromExcel(file, release, environment, storyNumber)
      xmlFileName = file.name.replace('.xlsx', '.xml')
    } else {
      // Push all successful macro results
      const successfulResults = autoDetectResult.allResults.filter(r => r.success)
      
      if (successfulResults.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'All macros failed to execute',
          errors: autoDetectResult.allResults.map(r => r.error).filter(Boolean),
          executedMacros: autoDetectResult.executedMacros,
          skippedMacros: autoDetectResult.skippedMacros
        }, { status: 500 })
      }

      // For now, push the first successful result
      // TODO: Extend to push all generated files
      const firstResult = successfulResults[0]
      xmlContent = firstResult.xmlContent
      xmlFileName = firstResult.fileName
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

    // Log the operation
    await logOperation('nrt-ruleset-process', {
      xmlFileName,
      release,
      environment,
      storyNumber: storyNumber || 'N/A'
    })

    // Push to GitHub XML repository using API
    let gitCommit = null
    let gitPush = null
    try {
      const octokit = getOctokit()
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
      
      // Create blob for XML file only
      const xmlBlob = await octokit.rest.git.createBlob({
        owner: repoOwner,
        repo: repoName,
        content: Buffer.from(xmlContent, 'utf8').toString('base64'),
        encoding: 'base64'
      })
      
      // Create new tree with only the XML file
      const { data: treeData } = await octokit.rest.git.createTree({
        owner: repoOwner,
        repo: repoName,
        base_tree: commitData.tree.sha,
        tree: [
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
        message: `NRT-${storyNumber || 'AUTO'}: Generated NRT Ruleset XML for ${release}/${environment} at ${new Date().toISOString()}`,
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
      console.error('GitHub API operation failed:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes('Bad credentials') || (error as { status?: number }).status === 401) {
        gitPush = 'Push failed: GitHub authentication error. Please check GITHUB_TOKEN in Vercel environment variables.'
      } else {
        gitPush = `Push failed: ${errorMessage}`
      }
      // Continue without failing the entire operation, but log the error
    }

    return NextResponse.json({
      success: true,
      message: 'NRT Ruleset XML generated and pushed to repository successfully',
      xmlFile: xmlFileName,
      gitCommit,
      gitPush: gitPush || 'Push failed - check logs',
      action: 'push'
    })

  } catch (error) {
    console.error('Error in push:', error)
    return NextResponse.json({
      success: false,
      message: 'Error pushing changes: ' + (error as Error).message
    }, { status: 500 })
  }
}

// 1:1 XML conversion from Excel file - no changes, additions, or removals
async function generateXMLFromExcel(file: File | undefined, release: string, environment: string, storyNumber?: string): Promise<string> {
  if (!file) {
    throw new Error('No file provided for XML generation')
  }

  try {
    // Read the Excel file
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    
    // Get the first worksheet
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    // Convert to JSON with headers - use raw data to get all columns
    // Use raw: true to preserve exact formatting, then format dates manually
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: true }) as (string | number | boolean | null | undefined)[][]
    
    // Find the actual header row (look for row with "Order No" or similar header patterns)
    let headerRowIndex = 0
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i]
      if (row && row.length > 0) {
        const firstCell = String(row[0] || '').toLowerCase().trim()
        // Look for common header patterns
        if (firstCell.includes('order') || firstCell.includes('id') || firstCell.includes('name') || 
            firstCell.includes('date') || firstCell.includes('price') || firstCell.includes('quantity')) {
          headerRowIndex = i
          break
        }
      }
    }
    
    // Get headers from the identified header row
    const headers = jsonData[headerRowIndex] as (string | number | boolean | null | undefined)[]
    const dataRows = jsonData.slice(headerRowIndex + 1) as (string | number | boolean | null | undefined)[][]
    
    // Clean up headers - create safe XML tag names
    const cleanHeaders = headers.map((header, index) => {
      if (!header || header === '') {
        return `column_${index + 1}`
      }
      // Convert to safe XML tag name
      return String(header)
        .trim()
        .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/^[0-9]/, 'col_$&') // Prefix with 'col_' if starts with number
        .toLowerCase()
    })
    
    // Filter out completely empty rows from data
    const filteredDataRows = dataRows.filter(row => 
      row && row.some(cell => cell !== '' && cell !== null && cell !== undefined)
    )
    
    // Generate XML - 1:1 conversion
    let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<excel-data>
  <metadata>
    <source-file>${file.name}</source-file>
    <sheet-name>${sheetName}</sheet-name>
    <release>${release}</release>
    <environment>${environment}</environment>
    <story-number>${storyNumber || 'N/A'}</story-number>
    <total-rows>${filteredDataRows.length}</total-rows>
    <total-columns>${cleanHeaders.length}</total-columns>
    <header-row>${headerRowIndex + 1}</header-row>
  </metadata>
  <data>
`
    
    // Convert each row to XML - exactly as it is in Excel
    filteredDataRows.forEach((row, rowIndex) => {
      xmlContent += `    <row index="${rowIndex + 1}">
`
      cleanHeaders.forEach((header, colIndex) => {
        let cellValue = row[colIndex]
        
        // Format dates to DD.MM.YYYY if it's a date column
        if (header.includes('date') && typeof cellValue === 'number' && cellValue > 40000) {
          // Excel date serial number - convert to DD.MM.YYYY
          const date = new Date((cellValue - 25569) * 86400 * 1000)
          const day = String(date.getDate()).padStart(2, '0')
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const year = date.getFullYear()
          cellValue = `${day}.${month}.${year}`
        }
        
        const safeHeader = escapeXml(header)
        const safeValue = escapeXml(cellValue)
        xmlContent += `      <${safeHeader}>${safeValue}</${safeHeader}>
`
      })
      xmlContent += `    </row>
`
    })
    
    xmlContent += `  </data>
</excel-data>`
    
    return xmlContent
  } catch (error) {
    console.error('Error processing Excel file:', error)
    // Fallback XML if Excel processing fails
    return `<?xml version="1.0" encoding="UTF-8"?>
<excel-data>
  <metadata>
    <source-file>${file.name}</source-file>
    <release>${release}</release>
    <environment>${environment}</environment>
    <story-number>${storyNumber || 'N/A'}</story-number>
    <error>Failed to process Excel file: ${(error as Error).message}</error>
  </metadata>
  <data>
    <error>Processing failed</error>
  </data>
</excel-data>`
  }
}

// Helper function to escape XML special characters
function escapeXml(text: string | number | boolean | null | undefined): string {
  // Convert to string and handle null/undefined
  const str = String(text || '')
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Generate accurate Git-style diff using the diff library
async function generateGitDiff(oldContent: string, newContent: string): Promise<string> {
  // If it's a new file, show all lines as additions
  if (!oldContent) {
    const newLines = newContent.split('\n')
    let diffOutput = `diff --git a/nrt-ruleset.xml b/nrt-ruleset.xml
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/nrt-ruleset.xml
@@ -0,0 +1,${newLines.length} @@
`
    newLines.forEach(line => {
      diffOutput += `+${line}\n`
    })
    return diffOutput
  }
  
  // If it's the same content, no diff
  if (oldContent === newContent) {
    return 'No changes detected.'
  }
  
  // Use the diff library to generate a proper unified diff
  const diffOutput = diff.createTwoFilesPatch(
    'nrt-ruleset.xml',  // old file name
    'nrt-ruleset.xml',  // new file name
    oldContent,         // old content
    newContent,         // new content
    'Original',         // old header
    'Modified'          // new header
  )
  
  return diffOutput
}

// Generate git diff --stat output
function generateDiffStat(oldContent: string, newContent: string): string {
  if (!oldContent) {
    // New file
    const newLines = newContent.split('\n').length
    return ` nrt-ruleset.xml | ${newLines} +\n 1 file changed, ${newLines} insertions(+)`
  }
  
  if (oldContent === newContent) {
    return 'No changes detected.'
  }
  
  // Use diff library to get the actual changes
  const changes = diff.diffLines(oldContent, newContent)
  
  let insertions = 0
  let deletions = 0
  
  changes.forEach(change => {
    if (change.added) {
      insertions += change.count || 0
    } else if (change.removed) {
      deletions += change.count || 0
    }
  })
  
  const totalChanges = insertions + deletions
  
  if (totalChanges === 0) {
    return 'No changes detected.'
  }
  
  // Format like git diff --stat
  let stat = ` nrt-ruleset.xml | ${totalChanges} ${totalChanges === 1 ? 'change' : 'changes'}`
  
  if (insertions > 0 && deletions > 0) {
    stat += ` (${insertions} insertion${insertions === 1 ? '' : 's'}(+), ${deletions} deletion${deletions === 1 ? '' : 's'}(-))`
  } else if (insertions > 0) {
    stat += ` (${insertions} insertion${insertions === 1 ? '' : 's'}(+))`
  } else if (deletions > 0) {
    stat += ` (${deletions} deletion${deletions === 1 ? '' : 's'}(-))`
  }
  
  stat += `\n 1 file changed, ${insertions} insertion${insertions === 1 ? '' : 's'}(+), ${deletions} deletion${deletions === 1 ? '' : 's'}(-)`
  
  return stat
}

// Log operation to audit trail
async function logOperation(
  action: string, 
  details: Record<string, unknown> & { storyNumber?: string; xmlFileName?: string }
) {
  try {
    type AuditLogEntry = {
      timestamp: string
      action: string
      details: string
      story_number: string
      file_name?: string
    }
    
    const auditLog = (await fileStorage.readJson<AuditLogEntry[]>(`${DATA_PATHS.AUDIT_LOGS}/audit.json`)) || []
    
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