import type * as XLSX from 'xlsx'

export interface MacroConfig {
  xlSheet: string
  allXLFields: string
  allFields: string
  inXLText: string
  inXLFilter: string
  inXLFilterValuesOld: string
  inXLFilterValuesNew: string
  inFields: string
  inFieldsSeqTab: string
  outDVM: string
  outFile: string
  outReturnCode: string
  outBC: string
  outFields: string
  outDefault: string
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
