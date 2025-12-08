/**
 * Macro executor - runs macro logic to generate XML from Excel files
 */

import * as XLSX from 'xlsx'
import type { MacroConfig, MacroExecutionContext, MacroResult } from './types'
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

/**
 * Execute a macro to generate XML from Excel file
 */
export async function executeMacro(
  file: File,
  config: MacroConfig,
  release: string,
  environment: string,
  storyNumber?: string
): Promise<MacroResult[]> {
  try {
    // Read Excel file
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    
    // Get the worksheet
    const worksheet = workbook.Sheets[config.xlSheet]
    if (!worksheet) {
      throw new Error(`Worksheet "${config.xlSheet}" not found in Excel file`)
    }
    
    // Initialize column mappings
    const { allFields, allXLFields, columnIndices } = initColumnMappings(
      config.allXLFields,
      config.allFields,
      worksheet
    )
    
    // Get output field column indices
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
    
    // Read sequence from tab
    const inFieldsSeq = readSeqFromTab(workbook, config.inFieldsSeqTab)
    const inFieldsSeqArray = inFieldsSeq ? inFieldsSeq.split(';') : ['']
    
    // Determine filter values based on release
    let filterValues = config.inXLFilterValuesNew
    if (release === '202109' || release.startsWith('R1.0')) {
      filterValues = config.inXLFilterValuesOld
    }
    
    const filterValueArray = filterValues.split(',').map(v => v.trim())
    const results: MacroResult[] = []
    
    // Process each filter value
    for (const filterValue of filterValueArray) {
      let filterName = ''
      let filter = ''
      
      if (filterValue === '%') {
        filterName = ''
        // For %, create a NOT filter with all other values
        const otherValues = filterValues.split(',').filter(v => v.trim() !== '%').join(',')
        filter = '!' + otherValues
      } else {
        filterName = '-' + filterValue
        filter = '=' + filterValue
      }
      
      // Create XML
      const dvmName = config.outDVM.replace('%', filterName)
      let xml = XMLcreate(dvmName, config.outBC)
      
      let loopSuffix = ''
      if (config.outLoop) {
        xml += XMLAddLoop()
        loopSuffix = ',Loop'
      }
      
      // Process each sequence
      for (let seqIndex = 0; seqIndex < inFieldsSeqArray.length; seqIndex++) {
        const currentSeq = inFieldsSeqArray[seqIndex]
        
        const textArray: string[] = []
        const inListArray: string[] = []
        const outListArray: string[] = []
        
        initClearList(textArray, inListArray, outListArray)
        
        // Get filtered fields
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
        
        // Add list to XML
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
      
      // Check and add empty list if needed
      xml += XMLCheckAddEmpty(
        config.outBC,
        config.outReturnCode,
        config.outDefault,
        inFieldsSeqArray.length + 1
      )
      
      // Close XML
      const inFieldsWithLoop = config.inFields + loopSuffix
      xml += XMLclose(inFieldsWithLoop)
      
      // Generate file name
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

