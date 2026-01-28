export interface Project {
  id: string
  title: string
  description: string
  tags: string[]  // 简化为字符串数组
  image?: string  // 添加图片字段
  link: string
}

// 使用 Vite 的 glob 导入自动发现所有项目 Markdown 文件
const projectModules = import.meta.glob('../content/projects/*.md', {
  query: '?raw',
  import: 'default',
})

// 从文件路径提取项目 slug
function extractSlugFromPath(path: string): string {
  const matches = path.match(/\/([^/]+)\.md$/)
  return matches ? matches[1] : 'unknown'
}

// 解析 Markdown 文件的 frontmatter
function parseFrontmatter(content: string): { frontmatter: any; content: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
  const match = content.match(frontmatterRegex)

  if (!match) {
    return { frontmatter: {}, content }
  }

  const frontmatterStr = match[1]
  const markdownContent = match[2]

  // 改进的 YAML 解析器（支持简单字符串数组）
  const frontmatter: any = {}
  const lines = frontmatterStr.split('\n')

  let currentKey: string | null = null
  let isArray = false
  let currentArray: string[] = []  // 改为字符串数组

  for (const line of lines) {
    const trimmedLine = line.trim()

    // 跳过空行
    if (!trimmedLine) continue

    // 处理数组项
    if (trimmedLine.startsWith('- ')) {
      if (!isArray) {
        // 第一次遇到数组项，初始化数组
        isArray = true
        currentArray = []
        // 不要重置 currentKey，需要它来保存数组
      }
      // 提取数组项值
      const itemValue = trimmedLine.slice(2).trim().replace(/^["']|["']$/g, '')
      currentArray.push(itemValue)
      continue
    }

    // 处理普通的键值对
    if (trimmedLine.includes(':')) {
      // 如果之前在数组中，先结束数组
      if (isArray && currentKey) {
        frontmatter[currentKey] = currentArray
        currentArray = []
        isArray = false
      }

      const colonIndex = trimmedLine.indexOf(':')
      currentKey = trimmedLine.slice(0, colonIndex).trim()
      const value = trimmedLine.slice(colonIndex + 1).trim().replace(/^["']|["']$/g, '')

      // 如果值不为空，直接设置
      if (value) {
        frontmatter[currentKey] = value
        currentKey = null
      }
      // 如果值为空，可能是数组，等待下一行
    }
  }

  // 处理最后可能未结束的数组
  if (isArray && currentKey) {
    frontmatter[currentKey] = currentArray
  }

  return { frontmatter, content: markdownContent }
}

// 自动加载所有项目
export async function loadProjects(): Promise<Project[]> {
  const projects: Project[] = []

  for (const path in projectModules) {
    try {
      const rawContent = await projectModules[path]() as string
      const { frontmatter } = parseFrontmatter(rawContent)
      const slug = extractSlugFromPath(path)

      // 从 frontmatter 获取项目信息
      const project: Project = {
        id: slug,
        title: frontmatter.title || slug,
        description: frontmatter.description || '',
        tags: frontmatter.tags || [],
        image: frontmatter.image,
        link: frontmatter.link || '#',
      }

      projects.push(project)
    } catch (err) {
      console.error(`Failed to load project from ${path}:`, err)
    }
  }

  return projects
}

// 同步版本的项目列表（用于初始渲染）
// 注意：这个列表会在异步加载后被真实数据替换
export const projects: Project[] = []
