// Application Constants
export const APP_NAME = 'NRT Rules Automation'
export const APP_VERSION = '1.0.0'

// Environments
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production'
} as const

// Default Releases
export const DEFAULT_RELEASES = [
  'R1.0',
  'R1.1',
  'R1.2',
  'R2.0',
  'R2.1'
]

// File Extensions
export const FILE_EXTENSIONS = {
  XML: '.xml',
  EXCEL: '.xlsx',
  CSV: '.csv'
} as const

// Excel Integration
export const EXCEL_CONFIG = {
  MACRO_NAME: 'MakeDVMRulesets',
  INTASSIGN_SHEET: 'IntAssign',
  TEMPLATE_SHEET: 'Template'
} as const

// GIT Configuration
export const GIT_CONFIG = {
  DEFAULT_BRANCH: 'main',
  COMMIT_PREFIX: 'NRT-',
  COMMIT_TEMPLATE: 'NRT-{story_number}: {description}'
} as const

// Deployment Configuration
export const DEPLOYMENT_CONFIG = {
  SCRIPT_PATH: '/app/sbl/sblhome/deploy/NRT_import.sh',
  TIMEOUT: 300000, // 5 minutes
  RETRY_ATTEMPTS: 3
} as const

// File Paths
export const DATA_PATHS = {
  TEAMBOX: 'data/teambox',
  XML_FILES: 'data/xml-files',
  AUDIT_LOGS: 'data/audit-logs',
  CONFIG: 'data/config'
} as const

// Validation Rules
export const VALIDATION_RULES = {
  STORY_NUMBER_PATTERN: /^[A-Z]+-\d+$/,
  CODE_PATTERN: /^[A-Z0-9_-]+$/
} as const