export interface TeamboxMapping {
  code: string
  teambox_name: string
  environment: string
  release: string
}

export interface IntAssignMatrix {
  row_code: string
  column_code: string
  value: string
  environment: string
  release: string
}

export interface XMLGenerationRequest {
  release: string
  environment: string
  story_number?: string
}

export interface XMLGenerationResult {
  success: boolean
  file_path: string
  file_name: string
  generated_at: string
  error?: string
}

export interface FileInfo {
  name: string
  path: string
  size: number
  created_at: string
  modified_at: string
}

export interface Environment {
  name: string
  description: string
  is_active: boolean
}

export interface Release {
  name: string
  version: string
  description: string
  is_active: boolean
}

export interface AuditLog {
  timestamp: string
  action: string
  details: string
  story_number?: string
  file_name?: string
}
