Option Explicit

Const gcsXLSheet As String = "Umsys SR"
Const gcsAllXLFields As String = "Start,End,Beschreibung,AppID,Type,SubTyp,SR Domain,SR Typ,SR Detail,SR Status,SR Comment,SR Reusable Flag"
Const gcsAllFields As String = "Start,End,Text,AppID,OrderType,OrderSubType,SR Domain,SR Type,SR Detail,SR Status,SR Comment,Reusable SCM"

Const gcsInXLText As String = "Beschreibung"
Const gcsInXLFilter As String = "AppID"
Const gcsInXLFilterValuesOld As String = "%,EOR,GEN,ECO,EMB"
Const gcsInXLFilterValuesNew As String = "%,ABV,AGO,AHQ,AIO,ALL,BIQ,COS,CQ5,EBP,ECC,ECO,EMB,EOR,eSBill,GEN,HIRO,MDS,MOB,MYI,NEO,OCE,OFM,OMS,POC,SAM,SAP,SSU,STAX,TRI,WFM"
Dim gcsInXLFilterValues As String
Const gcsInFields As String = "AppID,OrderType,OrderSubType"
Const gcsInFieldsSeqTab = "Umsys SR"
Dim gcsInFieldsSeq As String

Const gcsOutDVM As String = "Umsysteme% SR Mapping Rule Set SCM"
Const gcsOutFile As String = "Umsysteme% SR Mapping Rule Set SCM"
Const gcsOutReturnCode As String = "1000"
Const gcsOutBC As String = "Account"
Const gcsOutFields As String = "SR Domain,SR Type,SR Detail,SR Status,SR Comment,Reusable SCM"
Const gcsOutDefault As String = "BS,SR Domain,x,|" _
                              & "BS,SR Type,x,|" _
                              & "BS,SR Detail,-,|" _
                              & "BS,SR Status,x,Default|" _
                              & "BS,SR Comment,x,|" _
                              & "BS,Reusable SCM,x,N,|" _
                              & "BS,Complain Flag,-,|" _
                              & "BS,Template Name,-,"
Const gcbOutLoop = False

Public Sub Start()

    Dim asAllXLFields() As String
    Dim asAllFields() As String
    Dim aiAllCols() As Integer
    Dim asInFieldsSeq() As String
    Dim asOutFields() As String
    Dim asOutValues() As String
    Dim aiOutCols() As Integer
    Dim sXML As String
    Dim sRule As String
    Dim sText As String
    Dim iSeq As Integer
    Dim iRow As Integer
    Dim iArray As Integer
    Dim iCol As Integer
    Dim sInList As String
    Dim sOutList As String
    Dim asInlist() As String
    Dim asOutList() As String
    Dim asText() As String
    Dim sXLName As String
    Dim bLoop As Boolean
    Dim sLoop As String
    Dim iFilter As Integer
    Dim asFilterValue() As String
    Dim sFilter As String
    Dim sFilterName As String
        
    sXLName = ActiveWorkbook.Name
    gcsInXLFilterValues = gcsInXLFilterValuesNew
        
    init gcsAllXLFields, asAllXLFields, gcsAllFields, asAllFields, aiAllCols
    gcsInFieldsSeq = ReadSeqFromTab(gcsInFieldsSeqTab)
    
    If (OpenCheckFile(gcsXLSheet, asAllXLFields, aiAllCols, "Seq")) Then
        
        If (gsRELEASE = "202109") Then
            gcsInXLFilterValues = gcsInXLFilterValuesOld
        End If
        
        asOutFields = Split(gcsOutFields, ",")
        ReDim asOutValues(UBound(asOutFields))
        ReDim aiOutCols(UBound(asOutFields))
        For iArray = 0 To UBound(asOutFields)
            aiOutCols(iArray) = aiAllCols(SearchPosInArray(asAllFields, asOutFields(iArray)))
        Next iArray
    
        asFilterValue = Split(gcsInXLFilterValues, ",")
        For iFilter = 0 To UBound(asFilterValue)
            sFilter = asFilterValue(iFilter)
            If (sFilter = "%") Then
                sFilterName = ""
                sFilter = "!" & Mid(gcsInXLFilterValues, 3)
            Else
                sFilterName = "-" & sFilter
                sFilter = "=" & sFilter
            End If
            
            sXML = XMLcreate(Replace(gcsOutDVM, "%", sFilterName), gcsOutBC)
            If (gcbOutLoop) Then
                sXML = sXML & XMLAddLoop
                sLoop = ",Loop"
            End If
            
            asInFieldsSeq = Split(gcsInFieldsSeq, ";")
            For iSeq = 0 To UBound(asInFieldsSeq)
                iRow = 1
                InitClearList asText, asInlist, asOutList
                Do
                    bLoop = GetFilteredFields(gcsInXLText, asInFieldsSeq(iSeq), asAllXLFields, asAllFields, asOutFields, aiAllCols, aiOutCols, iRow, sText, sInList, sOutList, , sFilter, iSeq, gcsInXLFilter)
                    If (bLoop) Then
                        BuildList sText, sInList, sOutList, asText, asInlist, asOutList
                    End If
                Loop While (bLoop)
                sXML = sXML + XMLAddList(gcsOutBC, gcsOutReturnCode, gcsOutDefault, iSeq + 1, asText, asInlist, asOutList)
            Next iSeq
            InitClearList asText, asInlist, asOutList
            sXML = sXML + XMLCheckAddEmpty(gcsOutBC, gcsOutReturnCode, gcsOutDefault, iSeq + 1)
            sXML = sXML & XMLclose(gcsInFields & sLoop)
            
            SaveXML Replace(gcsOutFile, "%", sFilterName), sXML
    
        Next iFilter
    End If

    If (sXLName <> ActiveWorkbook.Name) Then
        UpdateCells
        ActiveWorkbook.Close (giTargetCol > 0)
    End If

End Sub

