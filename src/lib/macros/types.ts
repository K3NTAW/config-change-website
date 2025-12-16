/**
 * Type definitions for macro processing
 */

import type * as XLSX from 'xlsx'

export interface MacroConfig {
  // Excel sheet name
  xlSheet: string
  // All Excel field names (comma-separated)
  allXLFields: string
  // All field names (comma-separated)
  allFields: string
  // Input Excel text field
  inXLText: string
  // Input Excel filter field
  inXLFilter: string
  // Input Excel filter values (old)
  inXLFilterValuesOld: string
  // Input Excel filter values (new)
  inXLFilterValuesNew: string
  // Input fields (comma-separated)
  inFields: string
  // Input fields sequence tab name
  inFieldsSeqTab: string
  // Output DVM name (with % placeholder)
  outDVM: string
  // Output file name (with % placeholder)
  outFile: string
  // Output return code
  outReturnCode: string
  // Output business component
  outBC: string
  // Output fields (comma-separated)
  outFields: string
  // Output default values
  outDefault: string
  // Output loop flag
  outLoop: boolean
}

export interface MacroExecutionContext {
  workbook: XLSX.WorkBook
  release: string
  environment: string
  storyNumber?: string
  config: MacroConfig
}

export interface ProcessedField {
  text: string
  inList: string
  outList: string
}

export interface MacroResult {
  xmlContent: string
  fileName: string
  success: boolean
  error?: string
}

