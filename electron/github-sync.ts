import { Octokit } from '@octokit/rest'

export interface GitHubSyncConfig {
  repo: string // 格式: owner/repo
  token: string
}

export interface SyncResult {
  success: boolean
  message: string
  lastSyncTime?: number
}

/**
 * GitHub 同步管理器
 */
export class GitHubSync {
  private octokit: Octokit | null = null
  private config: GitHubSyncConfig | null = null

  /**
   * 配置 GitHub 同步
   */
  configure(config: GitHubSyncConfig) {
    this.config = config
    this.octokit = new Octokit({
      auth: config.token,
    })
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.octokit || !this.config) {
      return { success: false, message: '未配置 GitHub 同步' }
    }

    try {
      const [owner, repo] = this.config.repo.split('/')
      await this.octokit.repos.get({ owner, repo })
      return { success: true, message: '连接成功' }
    } catch (error: any) {
      if (error.status === 404) {
        return { success: false, message: '仓库不存在' }
      }
      return { success: false, message: error.message || '连接失败' }
    }
  }

  /**
   * 创建私有仓库
   */
  async createRepo(repoName: string): Promise<{ success: boolean; message: string; repo?: string }> {
    if (!this.octokit) {
      return { success: false, message: '未配置 GitHub Token' }
    }

    try {
      const response = await this.octokit.repos.createForAuthenticatedUser({
        name: repoName,
        private: true,
        description: 'Pan Todo - 待办事项数据同步',
        auto_init: true,
      })

      const repo = response.data.full_name
      return { success: true, message: '仓库创建成功', repo }
    } catch (error: any) {
      return { success: false, message: error.message || '创建仓库失败' }
    }
  }

  /**
   * 上传数据到 GitHub
   */
  async push(data: any): Promise<SyncResult> {
    if (!this.octokit || !this.config) {
      return { success: false, message: '未配置 GitHub 同步' }
    }

    try {
      const [owner, repo] = this.config.repo.split('/')
      const path = 'todo.json'
      const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64')

      // 尝试获取文件以获取 SHA（用于更新）
      let sha: string | undefined
      try {
        const { data: fileData } = await this.octokit.repos.getContent({
          owner,
          repo,
          path,
        })
        if ('sha' in fileData) {
          sha = fileData.sha
        }
      } catch (error: any) {
        // 文件不存在，首次创建
      }

      // 创建或更新文件
      await this.octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message: `Update todo.json - ${new Date().toISOString()}`,
        content,
        sha,
      })

      return {
        success: true,
        message: '同步成功',
        lastSyncTime: Date.now(),
      }
    } catch (error: any) {
      console.error('GitHub sync push error:', error)
      return { success: false, message: error.message || '同步失败' }
    }
  }

  /**
   * 从 GitHub 拉取数据
   */
  async pull(): Promise<{ success: boolean; message: string; data?: any }> {
    if (!this.octokit || !this.config) {
      return { success: false, message: '未配置 GitHub 同步' }
    }

    try {
      const [owner, repo] = this.config.repo.split('/')
      const path = 'todo.json'

      const { data: fileData } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
      })

      if ('content' in fileData) {
        const content = Buffer.from(fileData.content, 'base64').toString('utf-8')
        const data = JSON.parse(content)
        return { success: true, message: '拉取成功', data }
      }

      return { success: false, message: '文件格式错误' }
    } catch (error: any) {
      if (error.status === 404) {
        return { success: false, message: '远程数据不存在' }
      }
      console.error('GitHub sync pull error:', error)
      return { success: false, message: error.message || '拉取失败' }
    }
  }

  /**
   * 检查是否已配置
   */
  isConfigured(): boolean {
    return this.config !== null && this.octokit !== null
  }

  /**
   * 获取当前配置
   */
  getConfig(): GitHubSyncConfig | null {
    return this.config
  }
}

// 单例实例
export const githubSync = new GitHubSync()
