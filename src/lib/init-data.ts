import { fileStorage } from './file-storage'
import { DATA_PATHS, DEFAULT_RELEASES, ENVIRONMENTS } from '@/constants'
import type { TeamboxMapping, IntAssignMatrix, Environment, Release } from '@/types'

// Initialize default data files
export async function initializeData() {
  try {
    // Create default environments
    const environments: Environment[] = [
      { name: ENVIRONMENTS.DEVELOPMENT, description: 'Development Environment', is_active: true },
      { name: ENVIRONMENTS.STAGING, description: 'Staging Environment', is_active: true },
      { name: ENVIRONMENTS.PRODUCTION, description: 'Production Environment', is_active: false }
    ]
    await fileStorage.writeJson(`${DATA_PATHS.CONFIG}/environments.json`, environments)

    // Create default releases
    const releases: Release[] = DEFAULT_RELEASES.map(name => ({
      name,
      version: name,
      description: `Release ${name}`,
      is_active: name === 'R2.1'
    }))
    await fileStorage.writeJson(`${DATA_PATHS.CONFIG}/releases.json`, releases)

    // Create sample teambox mappings
    const sampleTeamboxMappings: TeamboxMapping[] = [
      { code: 'T001', teambox_name: 'Team Alpha', environment: ENVIRONMENTS.DEVELOPMENT, release: 'R2.1' },
      { code: 'T002', teambox_name: 'Team Beta', environment: ENVIRONMENTS.DEVELOPMENT, release: 'R2.1' },
      { code: 'T003', teambox_name: 'Team Gamma', environment: ENVIRONMENTS.STAGING, release: 'R2.1' }
    ]
    await fileStorage.writeJson(`${DATA_PATHS.TEAMBOX}/mappings.json`, sampleTeamboxMappings)

    // Create sample IntAssign matrix
    const sampleMatrix: IntAssignMatrix[] = [
      { row_code: 'R001', column_code: 'C001', value: '1', environment: ENVIRONMENTS.DEVELOPMENT, release: 'R2.1' },
      { row_code: 'R001', column_code: 'C002', value: '0', environment: ENVIRONMENTS.DEVELOPMENT, release: 'R2.1' },
      { row_code: 'R002', column_code: 'C001', value: '0', environment: ENVIRONMENTS.DEVELOPMENT, release: 'R2.1' },
      { row_code: 'R002', column_code: 'C002', value: '1', environment: ENVIRONMENTS.DEVELOPMENT, release: 'R2.1' }
    ]
    await fileStorage.writeJson(`${DATA_PATHS.TEAMBOX}/matrix.json`, sampleMatrix)

    // Create empty audit log
    await fileStorage.writeJson(`${DATA_PATHS.AUDIT_LOGS}/audit.json`, [])

    console.log('✅ Data initialized successfully')
    return true
  } catch (error) {
    console.error('❌ Failed to initialize data:', error)
    return false
  }
}

// Check if data is initialized
export async function isDataInitialized(): Promise<boolean> {
  try {
    const environments = await fileStorage.readJson(`${DATA_PATHS.CONFIG}/environments.json`)
    return environments !== null
  } catch {
    return false
  }
}
