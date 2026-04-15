import fs from 'fs/promises'
import path from 'path'

export interface ParsedMacro {
  name: string
  config: {
    xlSheet?: string
    allXLFields?: string
    allFields?: string
    inXLText?: string
    inXLFilter?: string
    inXLFilterValuesOld?: string
    inXLFilterValuesNew?: string
    inFields?: string
    inFieldsSeqTab?: string
    outDVM?: string
    outFile?: string
    outReturnCode?: string
    outBC?: string
    outFields?: string
    outDefault?: string
    outLoop?: boolean
  }
  code: string
}

export async function parseMacroFile(filePath: string): Promise<ParsedMacro> {
  const content = await fs.readFile(filePath, 'utf-8')
  const fileName = path.basename(filePath, '.md')
  
  const config: ParsedMacro['config'] = {}
  
  const constPattern = /Const\s+(\w+)\s+As\s+String\s*=\s*"([^"]+)"/gi
  const boolPattern = /Const\s+(\w+)\s+As\s+Boolean\s*=\s*(True|False)/gi
  
  let match
  
  while ((match = constPattern.exec(content)) !== null) {
    const [, name, value] = match
    const configKey = mapVBAConstantToConfig(name)
    if (configKey && configKey !== 'outLoop') {
      type StringConfigKeys = Exclude<keyof ParsedMacro['config'], 'outLoop'>
      ;(config as Record<StringConfigKeys, string | undefined>)[configKey as StringConfigKeys] = value
    }
  }
  
  while ((match = boolPattern.exec(content)) !== null) {
    const [, name, value] = match
    const configKey = mapVBAConstantToConfig(name)
    if (configKey && configKey === 'outLoop') {
      config[configKey] = value === 'True'
    }
  }
  
  return {
    name: fileName,
    config,
    code: content
  }
}

function mapVBAConstantToConfig(vbaName: string): keyof ParsedMacro['config'] | null {
  const mapping: Record<string, keyof ParsedMacro['config']> = {
    'gcsXLSheet': 'xlSheet',
    'gcsAllXLFields': 'allXLFields',
    'gcsAllFields': 'allFields',
    'gcsInXLText': 'inXLText',
    'gcsInXLFilter': 'inXLFilter',
    'gcsInXLFilterValuesOld': 'inXLFilterValuesOld',
    'gcsInXLFilterValuesNew': 'inXLFilterValuesNew',
    'gcsInFields': 'inFields',
    'gcsInFieldsSeqTab': 'inFieldsSeqTab',
    'gcsOutDVM': 'outDVM',
    'gcsOutFile': 'outFile',
    'gcsOutReturnCode': 'outReturnCode',
    'gcsOutBC': 'outBC',
    'gcsOutFields': 'outFields',
    'gcsOutDefault': 'outDefault',
    'gcbOutLoop': 'outLoop'
  }
  
  return mapping[vbaName] || null
}

export async function listMacros(macrosDir: string = 'src/lib/macros'): Promise<string[]> {
  try {
    const files = await fs.readdir(macrosDir)
    return files
      .filter(file => file.endsWith('.md') && file !== 'all.md')
      .map(file => path.basename(file, '.md'))
  } catch {
    return []
  }
}

export async function loadMacro(macroName: string, macrosDir: string = 'src/lib/macros'): Promise<ParsedMacro | null> {
  try {
    const filePath = path.join(process.cwd(), macrosDir, `${macroName}.md`)
    return await parseMacroFile(filePath)
  } catch {
    return null
  }
}
