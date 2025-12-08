import fs from 'fs/promises'
import path from 'path'

// Simple file-based storage utilities
export class FileStorage {
  private basePath: string

  constructor(basePath: string = process.cwd()) {
    this.basePath = basePath
  }

  // Ensure directory exists
  async ensureDir(dirPath: string): Promise<void> {
    const fullPath = path.join(this.basePath, dirPath)
    try {
      await fs.access(fullPath)
    } catch {
      await fs.mkdir(fullPath, { recursive: true })
    }
  }

  // Read JSON file
  async readJson<T>(filePath: string): Promise<T | null> {
    try {
      const fullPath = path.join(this.basePath, filePath)
      const data = await fs.readFile(fullPath, 'utf-8')
      return JSON.parse(data)
    } catch {
      return null
    }
  }

  // Write JSON file
  async writeJson<T>(filePath: string, data: T): Promise<void> {
    const fullPath = path.join(this.basePath, filePath)
    await this.ensureDir(path.dirname(filePath))
    await fs.writeFile(fullPath, JSON.stringify(data, null, 2))
  }

  // List files in directory
  async listFiles(dirPath: string): Promise<string[]> {
    try {
      const fullPath = path.join(this.basePath, dirPath)
      const files = await fs.readdir(fullPath)
      return files.filter(file => !file.startsWith('.'))
    } catch {
      return []
    }
  }

  // Get file info
  async getFileInfo(filePath: string) {
    try {
      const fullPath = path.join(this.basePath, filePath)
      const stats = await fs.stat(fullPath)
      return {
        name: path.basename(filePath),
        path: filePath,
        size: stats.size,
        created_at: stats.birthtime.toISOString(),
        modified_at: stats.mtime.toISOString()
      }
    } catch {
      return null
    }
  }

  // Delete file
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.basePath, filePath)
      await fs.unlink(fullPath)
      return true
    } catch {
      return false
    }
  }
}

// Create default file storage instance
export const fileStorage = new FileStorage()
