import * as XLSX from 'xlsx'
import type { MacroConfig, MacroResult } from './types'
import {
  XMLcreate,
  XMLAddLoop,
  XMLAddList,
  XMLCheckAddEmpty,
  XMLclose,
  initColumnMappings,
  getFilteredFields,
  readSeqFromTab,
  buildList,
  initClearList
} from './helpers'

export async function executeMacro(
  file: File,
  config: MacroConfig,
  release: string,
  _environment: string,
  _storyNumber?: string
): Promise<MacroResult[]> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    
    const worksheet = workbook.Sheets[config.xlSheet]
    if (!worksheet) {
      throw new Error(`Worksheet "${config.xlSheet}" not found in Excel file`)
    }
    
    const { allFields, allXLFields, columnIndices } = initColumnMappings(
      config.allXLFields,
      config.allFields,
      worksheet
    )
    
    const outFields = config.outFields.split(',').map(f => f.trim())
    const outColumnIndices: number[] = []
    for (const outField of outFields) {
      const fieldIndex = allFields.indexOf(outField)
      if (fieldIndex >= 0) {
        outColumnIndices.push(columnIndices[fieldIndex])
      } else {
        outColumnIndices.push(-1)
      }
    }
    
    const inFieldsSeq = readSeqFromTab(workbook, config.inFieldsSeqTab)
    const inFieldsSeqArray = inFieldsSeq ? inFieldsSeq.split(';') : ['']
    
    let filterValues = config.inXLFilterValuesNew
    if (release === '202109' || release.startsWith('R1.0')) {
      filterValues = config.inXLFilterValuesOld
    }
    
    const filterValueArray = filterValues.split(',').map(v => v.trim())
    const results: MacroResult[] = []
    
    for (const filterValue of filterValueArray) {
      let filterName = ''
      let filter = ''
      
      if (filterValue === '%') {
        filterName = ''
        const otherValues = filterValues.split(',').filter(v => v.trim() !== '%').join(',')
        filter = '!' + otherValues
      } else {
        filterName = '-' + filterValue
        filter = '=' + filterValue
      }
      
      const dvmName = config.outDVM.replace('%', filterName)
      let xml = XMLcreate(dvmName, config.outBC)
      
      let loopSuffix = ''
      if (config.outLoop) {
        xml += XMLAddLoop()
        loopSuffix = ',Loop'
      }
      
      for (let seqIndex = 0; seqIndex < inFieldsSeqArray.length; seqIndex++) {
        const currentSeq = inFieldsSeqArray[seqIndex]
        
        const textArray: string[] = []
        const inListArray: string[] = []
        const outListArray: string[] = []
        
        initClearList(textArray, inListArray, outListArray)
        
        let row = 1
        let hasMore = true
        
        while (hasMore) {
          const result = getFilteredFields(
            worksheet,
            config.inXLText,
            currentSeq,
            allXLFields,
            allFields,
            outFields,
            columnIndices,
            outColumnIndices,
            row,
            filter,
            config.inXLFilter,
            seqIndex
          )
          
          if (result.hasMore || result.text || result.inList || result.outList) {
            buildList(result.text, result.inList, result.outList, textArray, inListArray, outListArray)
            row = result.nextRow
            hasMore = result.hasMore && row <= (worksheet['!ref'] ? XLSX.utils.decode_range(worksheet['!ref']).e.r : 0)
          } else {
            hasMore = false
          }
        }
        
        xml += XMLAddList(
          config.outBC,
          config.outReturnCode,
          config.outDefault,
          seqIndex + 1,
          textArray,
          inListArray,
          outListArray
        )
      }
      
      xml += XMLCheckAddEmpty(
        config.outBC,
        config.outReturnCode,
        config.outDefault,
        inFieldsSeqArray.length + 1
      )
      
      const inFieldsWithLoop = config.inFields + loopSuffix
      xml += XMLclose(inFieldsWithLoop)
      
      const fileName = config.outFile.replace('%', filterName) + '.xml'
      
      results.push({
        xmlContent: xml,
        fileName,
        success: true
      })
    }
    
    return results
  } catch (error) {
    return [{
      xmlContent: '',
      fileName: '',
      success: false,
      error: (error as Error).message
    }]
  }
}
