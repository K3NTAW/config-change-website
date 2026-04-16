import { NextRequest, NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'
import * as XLSX from 'xlsx'
import * as diff from 'diff'
import { listMacros, autoDetectAndExecuteMacros } from '@/lib/macros'
import { prisma } from '@/lib/db/prisma'
import { logRuleChange, normalizeJiraRef } from '@/lib/nrt/rule-change-service'
import { getSessionFromRequest } from '@/lib/auth/request-session'
import { logException } from '@/lib/logger'

const getOctokit = () => {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is not set. Please configure it in your Vercel environment variables.')
  }
  return new Octokit({
    auth: token,
  })
}

export async function GET() {
  try {
    const macros = await listMacros()
    return NextResponse.json({
      success: true,
      macros
    })
  } catch (error) {
    logException(error, {
      route: '/api/nrt-ruleset/process',
      method: 'GET',
      phase: 'listMacros',
    })
    return NextResponse.json(
      {
        success: false,
        message:
          'Makros konnten nicht geladen werden. Bitte versuchen Sie es später erneut.',
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type')
    let action, release, environment, storyNumber, acknowledge, file, macroName, comment: string | undefined

          if (contentType?.includes('multipart/form-data')) {
            const formData = await request.formData()
            action = formData.get('action') as string
            release = formData.get('release') as string
            environment = formData.get('environment') as string
            storyNumber = formData.get('storyNumber') as string
            acknowledge = formData.get('acknowledge') === 'true'
            file = formData.get('file') as File
            macroName = formData.get('macroName') as string
            comment = (formData.get('comment') as string) || undefined
          } else {
            const body = await request.json() as Record<string, unknown>
            action = body.action as string
            release = body.release as string
            environment = body.environment as string
            storyNumber = body.storyNumber as string
            acknowledge = body.acknowledge as boolean
            macroName = body.macroName as string
            comment = typeof body.comment === 'string' ? body.comment : undefined
          }

    if (!release || !environment) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: release, environment'
      }, { status: 400 })
    }

    if (action === 'preview') {
      return handlePreview(release, environment, storyNumber, file, macroName)
    }

    if (action === 'push' && acknowledge) {
      return handlePush(request, release, environment, storyNumber, file, macroName, comment)
    }

    return NextResponse.json({
      success: false,
      message: 'Invalid action or missing acknowledgment'
    }, { status: 400 })

  } catch (error) {
    logException(error, {
      route: '/api/nrt-ruleset/process',
      method: 'POST',
      phase: 'POST',
    })
    return NextResponse.json(
      {
        success: false,
        message:
          'Die NRT-Ruleset-Anfrage konnte nicht verarbeitet werden. Bitte versuchen Sie es später erneut.',
      },
      { status: 500 },
    )
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

    const autoDetectResult = await autoDetectAndExecuteMacros(file, release, environment, storyNumber)
    
    if (autoDetectResult.allResults.length === 0) {
      const xmlContent = await generateXMLFromExcel(file, release, environment, storyNumber)
      const xmlFileName = file.name.replace('.xlsx', '.xml')
      
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
        if ((error as { status?: number }).status === 401) {
          logException(error, {
            route: '/api/nrt-ruleset/process',
            method: 'POST',
            phase: 'handlePreview-github',
          })
          return NextResponse.json(
            {
              success: false,
              message:
                'Die Vorschau konnte nicht geladen werden (GitHub-Zugriff). Bitte Konfiguration prüfen.',
            },
            { status: 502 },
          )
        }
        throw error
      }
    }

    const firstSuccessResult = autoDetectResult.allResults.find(r => r.success)
    if (!firstSuccessResult) {
      logException(
        new Error('all_macros_failed'),
        {
          route: '/api/nrt-ruleset/process',
          method: 'POST',
          phase: 'handlePreview-macros',
          macroErrors: autoDetectResult.allResults.map((r) => r.error).filter(Boolean),
        },
      )
      return NextResponse.json(
        {
          success: false,
          message:
            'Die Makros konnten nicht ausgeführt werden. Bitte Datei und Eingaben prüfen.',
        },
        { status: 500 },
      )
    }

    const xmlContent = firstSuccessResult.xmlContent
    const xmlFileName = firstSuccessResult.fileName

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
      if ((error as { status?: number }).status === 401) {
        logException(error, {
          route: '/api/nrt-ruleset/process',
          method: 'POST',
          phase: 'handlePreview-github-macro',
        })
        return NextResponse.json(
          {
            success: false,
            message:
              'Die Vorschau konnte nicht geladen werden (GitHub-Zugriff). Bitte Konfiguration prüfen.',
          },
          { status: 502 },
        )
      }
      throw error
    }

  } catch (error) {
    logException(error, {
      route: '/api/nrt-ruleset/process',
      method: 'POST',
      phase: 'handlePreview',
    })
    return NextResponse.json(
      {
        success: false,
        message:
          'Die Vorschau konnte nicht erzeugt werden. Bitte versuchen Sie es erneut.',
      },
      { status: 500 },
    )
  }
}

async function fetchRepoFileText(
  octokit: InstanceType<typeof Octokit>,
  owner: string,
  repo: string,
  path: string,
): Promise<string> {
  try {
    const { data } = await octokit.rest.repos.getContent({ owner, repo, path })
    if (data && typeof data === 'object' && !Array.isArray(data) && 'content' in data && data.content) {
      return Buffer.from(data.content as string, 'base64').toString('utf-8')
    }
  } catch (e: unknown) {
    if ((e as { status?: number }).status === 404) return ''
    throw e
  }
  return ''
}

async function handlePush(
  request: NextRequest,
  release: string,
  environment: string,
  storyNumber?: string,
  file?: File,
  _macroName?: string,
  comment?: string,
) {
  try {
    if (!file) {
      return NextResponse.json({
        success: false,
        message: 'No file provided'
      }, { status: 400 })
    }

    const autoDetectResult = await autoDetectAndExecuteMacros(file, release, environment, storyNumber)
    
    let xmlContent: string
    let xmlFileName: string
    
    if (autoDetectResult.allResults.length === 0) {
      xmlContent = await generateXMLFromExcel(file, release, environment, storyNumber)
      xmlFileName = file.name.replace('.xlsx', '.xml')
    } else {
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

      const firstResult = successfulResults[0]
      xmlContent = firstResult.xmlContent
      xmlFileName = firstResult.fileName
    }

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

    let gitCommit = null
    let gitPush = null
    try {
      const octokit = getOctokit()
      const previousContent = await fetchRepoFileText(octokit, repoOwner, repoName, xmlFileName)

      const { data: refData } = await octokit.rest.git.getRef({
        owner: repoOwner,
        repo: repoName,
        ref: 'heads/main'
      })
      
      const { data: commitData } = await octokit.rest.git.getCommit({
        owner: repoOwner,
        repo: repoName,
        commit_sha: refData.object.sha
      })
      
      const xmlBlob = await octokit.rest.git.createBlob({
        owner: repoOwner,
        repo: repoName,
        content: Buffer.from(xmlContent, 'utf8').toString('base64'),
        encoding: 'base64'
      })
      
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
      
      const jiraLabel = normalizeJiraRef(storyNumber)
      const { data: newCommit } = await octokit.rest.git.createCommit({
        owner: repoOwner,
        repo: repoName,
        message: `${jiraLabel}: Generated NRT Ruleset XML for ${release}/${environment} at ${new Date().toISOString()}`,
        tree: treeData.sha,
        parents: [refData.object.sha]
      })
      
      await octokit.rest.git.updateRef({
        owner: repoOwner,
        repo: repoName,
        ref: 'heads/main',
        sha: newCommit.sha
      })
      
      gitCommit = `Commit: ${newCommit.sha}`
      gitPush = 'Pushed to remote repository successfully'

      const session = await getSessionFromRequest(request)
      const pushDiff = await generateGitDiff(previousContent, xmlContent)
      const diffStatStr = generateDiffStat(previousContent, xmlContent)
      try {
        await logRuleChange(prisma, {
          jiraRef: jiraLabel,
          comment: comment?.trim() || null,
          diff: pushDiff,
          diffStat: diffStatStr,
          fileName: xmlFileName,
          release,
          environment,
          commitSha: newCommit.sha,
          userId: session?.sub ?? null,
          ipAddress:
            request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
            request.headers.get('x-real-ip') ??
            null,
          userAgent: request.headers.get('user-agent') ?? null,
        })
      } catch (auditErr) {
        logException(auditErr, {
          route: '/api/nrt-ruleset/process',
          method: 'POST',
          phase: 'rule-change-audit',
        })
        gitPush = `${gitPush} Hinweis: Audit-Eintrag konnte nicht gespeichert werden.`
      }

    } catch (error) {
      logException(error, {
        route: '/api/nrt-ruleset/process',
        method: 'POST',
        phase: 'handlePush-github',
      })
      const status = (error as { status?: number }).status
      if (status === 401 || status === 403) {
        gitPush =
          'Push fehlgeschlagen: GitHub-Authentifizierung. Konfiguration prüfen (siehe Server-Logs).'
      } else {
        gitPush = 'Push fehlgeschlagen. Details siehe Server-Logs.'
      }
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
    logException(error, {
      route: '/api/nrt-ruleset/process',
      method: 'POST',
      phase: 'handlePush',
    })
    return NextResponse.json(
      {
        success: false,
        message:
          'Der Push konnte nicht abgeschlossen werden. Bitte versuchen Sie es später erneut.',
      },
      { status: 500 },
    )
  }
}

async function generateXMLFromExcel(file: File | undefined, release: string, environment: string, storyNumber?: string): Promise<string> {
  if (!file) {
    throw new Error('No file provided for XML generation')
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: true }) as (string | number | boolean | null | undefined)[][]
    
    let headerRowIndex = 0
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i]
      if (row && row.length > 0) {
        const firstCell = String(row[0] || '').toLowerCase().trim()
        if (firstCell.includes('order') || firstCell.includes('id') || firstCell.includes('name') || 
            firstCell.includes('date') || firstCell.includes('price') || firstCell.includes('quantity')) {
          headerRowIndex = i
          break
        }
      }
    }
    
    const headers = jsonData[headerRowIndex] as (string | number | boolean | null | undefined)[]
    const dataRows = jsonData.slice(headerRowIndex + 1) as (string | number | boolean | null | undefined)[][]
    
    const cleanHeaders = headers.map((header, index) => {
      if (!header || header === '') {
        return `column_${index + 1}`
      }
      return String(header)
        .trim()
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '_')
        .replace(/^[0-9]/, 'col_$&')
        .toLowerCase()
    })
    
    const filteredDataRows = dataRows.filter(row => 
      row && row.some(cell => cell !== '' && cell !== null && cell !== undefined)
    )
    
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
    
    filteredDataRows.forEach((row, rowIndex) => {
      xmlContent += `    <row index="${rowIndex + 1}">
`
      cleanHeaders.forEach((header, colIndex) => {
        let cellValue = row[colIndex]
        
        if (header.includes('date') && typeof cellValue === 'number' && cellValue > 40000) {
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
    logException(error, {
      route: '/api/nrt-ruleset/process',
      method: 'POST',
      phase: 'generateXMLFromExcel',
    })
    return `<?xml version="1.0" encoding="UTF-8"?>
<excel-data>
  <metadata>
    <source-file>${file.name}</source-file>
    <release>${release}</release>
    <environment>${environment}</environment>
    <story-number>${storyNumber || 'N/A'}</story-number>
    <error>Excel-Datei konnte nicht verarbeitet werden.</error>
  </metadata>
  <data>
    <error>Verarbeitung fehlgeschlagen</error>
  </data>
</excel-data>`
  }
}

function escapeXml(text: string | number | boolean | null | undefined): string {
  const str = String(text || '')
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

async function generateGitDiff(oldContent: string, newContent: string): Promise<string> {
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
  
  if (oldContent === newContent) {
    return 'No changes detected.'
  }
  
  const diffOutput = diff.createTwoFilesPatch(
    'nrt-ruleset.xml',
    'nrt-ruleset.xml',
    oldContent,
    newContent,
    'Original',
    'Modified'
  )
  
  return diffOutput
}

function generateDiffStat(oldContent: string, newContent: string): string {
  if (!oldContent) {
    const newLines = newContent.split('\n').length
    return ` nrt-ruleset.xml | ${newLines} +\n 1 file changed, ${newLines} insertions(+)`
  }
  
  if (oldContent === newContent) {
    return 'No changes detected.'
  }
  
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
