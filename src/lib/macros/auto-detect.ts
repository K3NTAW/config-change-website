/**
 * Auto-detect and execute all applicable macros based on Excel file sheets
 */

import * as XLSX from 'xlsx'
import { listMacros, loadMacro } from './parser'
import { executeMacro } from './executor'
import type { MacroConfig, MacroResult } from './types'

export interface AutoDetectResult {
  allResults: MacroResult[]
  executedMacros: string[]
  skippedMacros: string[]
}

/**
 * Automatically detect and execute all applicable macros for an Excel file
 */
export async function autoDetectAndExecuteMacros(
  file: File,
  release: string,
  environment: string,
  storyNumber?: string
): Promise<AutoDetectResult> {
  // Read Excel file to get sheet names
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const sheetNames = workbook.SheetNames

  // Load all available macros
  const macroNames = await listMacros()
  const allResults: MacroResult[] = []
  const executedMacros: string[] = []
  const skippedMacros: string[] = []

  // Check each macro to see if its target sheet exists
  for (const macroName of macroNames) {
    const macro = await loadMacro(macroName)
    
    if (!macro || !macro.config.xlSheet) {
      skippedMacros.push(`${macroName} (no xlSheet config)`)
      continue
    }

    const targetSheet = macro.config.xlSheet

    // Check if the target sheet exists in the Excel file
    if (!sheetNames.includes(targetSheet)) {
      skippedMacros.push(`${macroName} (sheet "${targetSheet}" not found)`)
      continue
    }

    // Convert parsed macro config to MacroConfig
    const config: MacroConfig = {
      xlSheet: macro.config.xlSheet || '',
      allXLFields: macro.config.allXLFields || '',
      allFields: macro.config.allFields || '',
      inXLText: macro.config.inXLText || '',
      inXLFilter: macro.config.inXLFilter || '',
      inXLFilterValuesOld: macro.config.inXLFilterValuesOld || '',
      inXLFilterValuesNew: macro.config.inXLFilterValuesNew || '',
      inFields: macro.config.inFields || '',
      inFieldsSeqTab: macro.config.inFieldsSeqTab || '',
      outDVM: macro.config.outDVM || '',
      outFile: macro.config.outFile || '',
      outReturnCode: macro.config.outReturnCode || '1000',
      outBC: macro.config.outBC || '',
      outFields: macro.config.outFields || '',
      outDefault: macro.config.outDefault || '',
      outLoop: macro.config.outLoop || false
    }

    // Execute the macro
    try {
      const results = await executeMacro(file, config, release, environment, storyNumber)
      allResults.push(...results)
      executedMacros.push(macroName)
    } catch (error) {
      allResults.push({
        xmlContent: '',
        fileName: '',
        success: false,
        error: `Error executing macro ${macroName}: ${(error as Error).message}`
      })
      skippedMacros.push(`${macroName} (execution error)`)
    }
  }

  return {
    allResults,
    executedMacros,
    skippedMacros
  }
}

