import * as XLSX from 'xlsx'

export function XMLcreate(dvmName: string, businessComponent: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<SiebelMessage MessageId="" MessageType="Integration Object" IntObjectName="${dvmName}">
  <IntObject>
    <BusinessComponent Name="${businessComponent}">`
}

export function XMLAddLoop(): string {
  return `
      <Loop>`
}

export function XMLAddList(
  _businessComponent: string,
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
  
  const defaults = parseDefaultValues(defaultValues)
  
  defaults.forEach(defaultField => {
    if (defaultField.value !== '-') {
      xml += `
        <${defaultField.field}>${escapeXml(defaultField.value)}</${defaultField.field}>`
    }
  })
  
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

export function XMLCheckAddEmpty(
  _businessComponent: string,
  _returnCode: string,
  _defaultValues: string,
  _sequence: number
): string {
  return ''
}

export function XMLclose(_fields: string): string {
  return `
    </BusinessComponent>
  </IntObject>
</SiebelMessage>`
}

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

function escapeXml(text: string | number | boolean | null | undefined): string {
  const str = String(text || '')
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

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
  
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
  let headerRow = 0
  
  for (let row = 0; row <= range.e.r; row++) {
    const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: 0 })]
    if (cell && String(cell.v || '').trim() === allXLFieldsArray[0]) {
      headerRow = row
      break
    }
  }
  
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
      columnIndices.push(-1)
    }
  }
  
  return {
    allFields: allFieldsArray,
    allXLFields: allXLFieldsArray,
    columnIndices
  }
}

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
  _sequence: number
): {
  hasMore: boolean
  nextRow: number
  text: string
  inList: string
  outList: string
} {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
  const currentRow = startRow
  
  const textColIndex = allXLFields.indexOf(inXLText)
  const textCol = textColIndex >= 0 ? columnIndices[textColIndex] : -1
  
  const filterColIndex = allXLFields.indexOf(filterField)
  const filterCol = filterColIndex >= 0 ? columnIndices[filterColIndex] : -1
  
  const filterValue = filter.startsWith('=') ? filter.substring(1) : filter.startsWith('!') ? filter.substring(1) : filter
  
  let foundRow = -1
  let text = ''
  let inList = ''
  let outList = ''
  
  for (let row = currentRow; row <= range.e.r; row++) {
    if (filterCol >= 0) {
      const filterCell = worksheet[XLSX.utils.encode_cell({ r: row, c: filterCol })]
      const filterCellValue = String(filterCell?.v || '').trim()
      
      if (filter.startsWith('!')) {
        const excludeValues = filterValue.split(',').map(v => v.trim())
        if (excludeValues.includes(filterCellValue)) {
          continue
        }
      } else if (filter.startsWith('=')) {
        if (filterCellValue !== filterValue) {
          continue
        }
      }
    }
    
    if (textCol >= 0) {
      const textCell = worksheet[XLSX.utils.encode_cell({ r: row, c: textCol })]
      text = String(textCell?.v || '').trim()
    }
    
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

export function readSeqFromTab(
  workbook: XLSX.WorkBook,
  tabName: string
): string {
  const sheet = workbook.Sheets[tabName]
  if (!sheet) {
    return ''
  }
  
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1')
  const sequences: string[] = []
  
  for (let row = 0; row <= range.e.r; row++) {
    const cell = sheet[XLSX.utils.encode_cell({ r: row, c: 0 })]
    const value = String(cell?.v || '').trim()
    if (value) {
      sequences.push(value)
    }
  }
  
  return sequences.join(';')
}

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

export function initClearList(
  textArray: string[],
  inListArray: string[],
  outListArray: string[]
): void {
  textArray.length = 0
  inListArray.length = 0
  outListArray.length = 0
}
