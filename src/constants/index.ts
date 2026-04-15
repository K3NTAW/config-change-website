export const APP_NAME = 'NRT Rules Automation'

export const SESSION_COOKIE_NAME = "nrt-session" as const;
export const SESSION_MAX_AGE = 8 * 60 * 60;
export const APP_VERSION = '1.0.0'

export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production'
} as const

export const DEFAULT_RELEASES = [
  'R1.0',
  'R1.1',
  'R1.2',
  'R2.0',
  'R2.1'
]

export const FILE_EXTENSIONS = {
  XML: '.xml',
  EXCEL: '.xlsx',
  CSV: '.csv'
} as const

export const EXCEL_CONFIG = {
  MACRO_NAME: 'MakeDVMRulesets',
  INTASSIGN_SHEET: 'IntAssign',
  TEMPLATE_SHEET: 'Template'
} as const

export const GIT_CONFIG = {
  DEFAULT_BRANCH: 'main',
  COMMIT_PREFIX: 'NRT-',
  COMMIT_TEMPLATE: 'NRT-{story_number}: {description}'
} as const

export const DEPLOYMENT_CONFIG = {
  SCRIPT_PATH: '/app/sbl/sblhome/deploy/NRT_import.sh',
  TIMEOUT: 300000,
  RETRY_ATTEMPTS: 3
} as const

export const DATA_PATHS = {
  TEAMBOX: 'data/teambox',
  XML_FILES: 'data/xml-files',
  CONFIG: 'data/config'
} as const

export const VALIDATION_RULES = {
  STORY_NUMBER_PATTERN: /^[A-Z]+-\d+$/,
  CODE_PATTERN: /^[A-Z0-9_-]+$/
} as const
