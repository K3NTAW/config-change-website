/**
 * Shared helper functions for macro processing
 * These replicate the VBA helper functions used in the Excel macros
 */

import * as XLSX from 'xlsx'
import type { MacroConfig, ProcessedField } from './types'

/**
 * Create XML header for DVM ruleset
 */
export function XMLcreate(dvmName: string, businessComponent: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<SiebelMessage MessageId="" MessageType="Integration Object" IntObjectName="${dvmName}">
  <IntObject>
    <BusinessComponent Name="${businessComponent}">`
}

/**
 * Add loop element to XML
 */
export function XMLAddLoop(): string {
  return `
      <Loop>`
}

/**
 * Add a list to XML
 */
export function XMLAddList(
  businessComponent: string,
  returnCode: string,
  defaultValues: string,
  sequence: number,
  textArray: string[],
  inListArray: string[],
  outListArray: string[]
): string {
  let xml = `
      <List>
        <ReturnCode>${returnCode}</ReturnCode>
        <Sequence>${sequence}</Sequence>`
  
  // Parse default values
  const defaults = parseDefaultValues(defaultValues)
  
  // Add default fields
  defaults.forEach(defaultField => {
    if (defaultField.value !== '-') {
      xml += `
        <${defaultField.field}>${escapeXml(defaultField.value)}</${defaultField.field}>`
    }
  })
  
  // Add rules
  if (textArray.length > 0) {
    xml += `
        <Rules>`
    
    for (let i = 0; i < textArray.length; i++) {
      xml += `
          <Rule>
            <Text>${escapeXml(textArray[i] || '')}</Text>
            <InList>${escapeXml(inListArray[i] || '')}</InList>
            <OutList>${escapeXml(outListArray[i] || '')}</OutList>
          </Rule>`
    }
    
    xml += `
        </Rules>`
  }
  
  xml += `
      </List>`
  
  return xml
}

/**
 * Check and add empty list if needed
 */
export function XMLCheckAddEmpty(
  businessComponent: string,
  returnCode: string,
  defaultValues: string,
  sequence: number
): string {
  // If sequence is 1 and no rules exist, add empty list
  // This is a simplified version - adjust based on actual VBA logic
  return ''
}

/**
 * Close XML
 */
export function XMLclose(fields: string): string {
  return `
    </BusinessComponent>
  </IntObject>
</SiebelMessage>`
}

/**
 * Parse default values string
 * Format: "BS,Field1,x,Value1|BS,Field2,-,|BS,Field3,x,Value3"
 */
function parseDefaultValues(defaultStr: string): Array<{ field: string; value: string }> {
  const defaults: Array<{ field: string; value: string }> = []
  const parts = defaultStr.split('|')
  
  for (const part of parts) {
    const fields = part.split(',')
    if (fields.length >= 3) {
      defaults.push({
        field: fields[1]?.trim() || '',
        value: fields[3]?.trim() || fields[2]?.trim() || '-'
      })
    }
  }
  
  return defaults
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string | number | boolean | null | undefined): string {
  const str = String(text || '')
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Initialize column mappings from Excel fields
 */
export function initColumnMappings(
  allXLFields: string,
  allFields: string,
  worksheet: XLSX.WorkSheet
): {
  allFields: string[]
  allXLFields: string[]
  columnIndices: number[]
} {
  const allXLFieldsArray = allXLFields.split(',').map(f => f.trim())
  const allFieldsArray = allFields.split(',').map(f => f.trim())
  
  // Find header row
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
  let headerRow = 0
  
  // Try to find header row by looking for first field
  for (let row = 0; row <= range.e.r; row++) {
    const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: 0 })]
    if (cell && String(cell.v || '').trim() === allXLFieldsArray[0]) {
      headerRow = row
      break
    }
  }
  
  // Map columns
  const columnIndices: number[] = []
  for (const xlField of allXLFieldsArray) {
    let found = false
    for (let col = 0; col <= range.e.c; col++) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: headerRow, c: col })]
      if (cell && String(cell.v || '').trim() === xlField) {
        columnIndices.push(col)
        found = true
        break
      }
    }
    if (!found) {
      columnIndices.push(-1) // Not found
    }
  }
  
  return {
    allFields: allFieldsArray,
    allXLFields: allXLFieldsArray,
    columnIndices
  }
}

/**
 * Get filtered fields from worksheet
 */
export function getFilteredFields(
  worksheet: XLSX.WorkSheet,
  inXLText: string,
  inFieldsSeq: string,
  allXLFields: string[],
  allFields: string[],
  outFields: string[],
  columnIndices: number[],
  outColumnIndices: number[],
  startRow: number,
  filter: string,
  filterField: string,
  sequence: number
): {
  hasMore: boolean
  nextRow: number
  text: string
  inList: string
  outList: string
} {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
  let currentRow = startRow
  
  // Find text column index
  const textColIndex = allXLFields.indexOf(inXLText)
  const textCol = textColIndex >= 0 ? columnIndices[textColIndex] : -1
  
  // Find filter column index
  const filterColIndex = allXLFields.indexOf(filterField)
  const filterCol = filterColIndex >= 0 ? columnIndices[filterColIndex] : -1
  
  // Parse filter
  const filterValue = filter.startsWith('=') ? filter.substring(1) : filter.startsWith('!') ? filter.substring(1) : filter
  
  // Find matching row
  let foundRow = -1
  let text = ''
  let inList = ''
  let outList = ''
  
  for (let row = currentRow; row <= range.e.r; row++) {
    // Check filter
    if (filterCol >= 0) {
      const filterCell = worksheet[XLSX.utils.encode_cell({ r: row, c: filterCol })]
      const filterCellValue = String(filterCell?.v || '').trim()
      
      if (filter.startsWith('!')) {
        // NOT filter - exclude these values
        const excludeValues = filterValue.split(',').map(v => v.trim())
        if (excludeValues.includes(filterCellValue)) {
          continue
        }
      } else if (filter.startsWith('=')) {
        // Exact match
        if (filterCellValue !== filterValue) {
          continue
        }
      }
    }
    
    // Get text value
    if (textCol >= 0) {
      const textCell = worksheet[XLSX.utils.encode_cell({ r: row, c: textCol })]
      text = String(textCell?.v || '').trim()
    }
    
    // Build inList from inFieldsSeq
    const inFieldsSeqParts = inFieldsSeq.split(',')
    const inListParts: string[] = []
    for (const field of inFieldsSeqParts) {
      const fieldIndex = allFields.indexOf(field.trim())
      if (fieldIndex >= 0 && columnIndices[fieldIndex] >= 0) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: columnIndices[fieldIndex] })]
        inListParts.push(String(cell?.v || '').trim())
      }
    }
    inList = inListParts.join(',')
    
    // Build outList from outFields
    const outListParts: string[] = []
    for (let i = 0; i < outFields.length; i++) {
      if (outColumnIndices[i] >= 0) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: outColumnIndices[i] })]
        outListParts.push(String(cell?.v || '').trim())
      }
    }
    outList = outListParts.join(',')
    
    foundRow = row
    break
  }
  
  return {
    hasMore: foundRow >= 0 && foundRow < range.e.r,
    nextRow: foundRow >= 0 ? foundRow + 1 : currentRow + 1,
    text,
    inList,
    outList
  }
}

/**
 * Read sequence from a specific tab
 */
export function readSeqFromTab(
  workbook: XLSX.WorkBook,
  tabName: string
): string {
  const sheet = workbook.Sheets[tabName]
  if (!sheet) {
    return ''
  }
  
  // Read sequence data from the sheet
  // This is a simplified version - adjust based on actual VBA logic
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1')
  const sequences: string[] = []
  
  // Read from first column, starting from row 1
  for (let row = 0; row <= range.e.r; row++) {
    const cell = sheet[XLSX.utils.encode_cell({ r: row, c: 0 })]
    const value = String(cell?.v || '').trim()
    if (value) {
      sequences.push(value)
    }
  }
  
  return sequences.join(';')
}

/**
 * Build lists from processed fields
 */
export function buildList(
  text: string,
  inList: string,
  outList: string,
  textArray: string[],
  inListArray: string[],
  outListArray: string[]
): void {
  textArray.push(text)
  inListArray.push(inList)
  outListArray.push(outList)
}

/**
 * Initialize/clear lists
 */
export function initClearList(
  textArray: string[],
  inListArray: string[],
  outListArray: string[]
): void {
  textArray.length = 0
  inListArray.length = 0
  outListArray.length = 0
}

