import fs from 'fs/promises'
import path from 'path'

export class FileStorage {
  private basePath: string

  constructor(basePath: string = process.cwd()) {
    this.basePath = basePath
  }

  async ensureDir(dirPath: string): Promise<void> {
    const fullPath = path.join(this.basePath, dirPath)
    try {
      await fs.access(fullPath)
    } catch {
      await fs.mkdir(fullPath, { recursive: true })
    }
  }

  async readJson<T>(filePath: string): Promise<T | null> {
    try {
      const fullPath = path.join(this.basePath, filePath)
      const data = await fs.readFile(fullPath, 'utf-8')
      return JSON.parse(data)
    } catch {
      return null
    }
  }

  async writeJson<T>(filePath: string, data: T): Promise<void> {
    const fullPath = path.join(this.basePath, filePath)
    await this.ensureDir(path.dirname(filePath))
    await fs.writeFile(fullPath, JSON.stringify(data, null, 2))
  }

  async listFiles(dirPath: string): Promise<string[]> {
    try {
      const fullPath = path.join(this.basePath, dirPath)
      const files = await fs.readdir(fullPath)
      return files.filter(file => !file.startsWith('.'))
    } catch {
      return []
    }
  }

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

export const fileStorage = new FileStorage()
