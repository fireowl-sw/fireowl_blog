export interface Article {
  id: string
  title: string
  slug: string
  category: string  // 改为动态字符串类型，对应文件夹名
  date: string
  excerpt: string
  image?: string
  tags?: string[]
  project: string
  content: string
}

// 使用 Vite 的 glob 导入自动发现所有 Markdown 文件
const markdownModules = import.meta.glob('../content/posts/**/*.md', {
  query: '?raw',
  import: 'default',
})

// 解析 YAML frontmatter
function parseFrontmatter(content: string): { frontmatter: Record<string, any>; content: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
  const match = content.match(frontmatterRegex)

  if (match) {
    const frontmatter: Record<string, any> = {}
    const lines = match[1].split('\n')

    for (const line of lines) {
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim()
        let value: any = line.slice(colonIndex + 1).trim()

        // 处理数组格式
        if (value.startsWith('[') && value.endsWith(']')) {
          value = value.slice(1, -1).split(',').map((v: string) => v.trim().replace(/^['"]|['"]$/g, ''))
        }
        // 处理字符串引号
        else if ((value.startsWith('"') && value.endsWith('"')) ||
                 (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1)
        }

        frontmatter[key] = value
      }
    }

    return {
      frontmatter,
      content: match[2]
    }
  }

  return { frontmatter: {}, content }
}

// 从文件路径提取信息
function extractInfoFromPath(path: string): { project: string; slug: string } {
  // 路径格式: ../content/posts/{project}/{filename}.md
  const match = path.match(/\/content\/posts\/([^/]+)\/(.+)\.md$/)

  if (match) {
    return {
      project: match[1],
      slug: match[2]
    }
  }

  return { project: 'general', slug: 'unknown' }
}

// 生成默认图片
function getDefaultImage(category: string): string {
  const images: Record<string, string> = {
    '仿真器开发': 'https://picsum.photos/seed/sim/600/400.jpg',
    '感知算法': 'https://picsum.photos/seed/perception/600/400.jpg',
    '决策规划': 'https://picsum.photos/seed/planning/600/400.jpg',
  }
  return images[category] || 'https://picsum.photos/seed/general/600/400.jpg'
}

// 自动加载所有文章
export async function loadArticles(): Promise<Article[]> {
  const articles: Article[] = []

  for (const path in markdownModules) {
    try {
      const rawContent = await markdownModules[path]() as string
      const { frontmatter, content } = parseFrontmatter(rawContent)
      const { project, slug } = extractInfoFromPath(path)

      // 从 frontmatter 获取文章信息，如果缺少则使用默认值
      const article: Article = {
        id: slug,
        title: frontmatter.title || slug,
        slug: slug,
        category: frontmatter.category || project || '仿真器开发',
        date: frontmatter.date || new Date().toISOString().split('T')[0],
        excerpt: frontmatter.excerpt || '',
        image: frontmatter.image || getDefaultImage(frontmatter.category || project || '仿真器开发'),
        tags: frontmatter.tags || [],
        project: project,
        content: content,  // 存储解析后的 Markdown 内容
      }

      articles.push(article)
    } catch (err) {
      console.error(`Failed to load article from ${path}:`, err)
    }
  }

  // 按日期排序（最新的在前）
  articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return articles
}

// 同步版本的文章列表（用于初始渲染）
// 注意：这个列表会在异步加载后被真实数据替换
export const articles: Article[] = []

// 分类名称
export { categoryNames } from './categories'
