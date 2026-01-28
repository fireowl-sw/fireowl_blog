import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { loadArticles, categoryNames, type Article } from '@/data/articles'
import { MarkdownRenderer } from '@/components/md/MarkdownRenderer'

// 预设的颜色方案（与 ArticleList 保持一致）
const colorPalette = [
  'bg-cyan-500',    // 仿真器开发
  'bg-violet-500',  // 感知算法
  'bg-green-500',   // 决策规划
  'bg-orange-500',
  'bg-pink-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-rose-500',
  'bg-amber-500',
]

const categoryColorMap: Record<string, number> = {
  '仿真器开发': 0,
  '感知算法': 1,
  '决策规划': 2,
}

function getCategoryColor(category: string): string {
  if (category in categoryColorMap) {
    return colorPalette[categoryColorMap[category]]
  }
  const hash = category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colorPalette[hash % colorPalette.length]
}

// 从 Markdown 内容生成目录
function generateToc(content: string): { id: string; text: string; level: number }[] {
  const toc: { id: string; text: string; level: number }[] = []

  // 匹配标题（支持 h1, h2 和 h3）
  const headingRegex = /^#{1,3}\s+(.+)$/gm
  let match

  while ((match = headingRegex.exec(content)) !== null) {
    const fullText = match[1]
    const level = match[0].startsWith('###') ? 3 : match[0].startsWith('##') ? 2 : 1
    const id = fullText
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5]/g, '') // 移除特殊字符
      .replace(/\s+/g, '-') // 空格替换为短横线
      .replace(/^#{1,6}\s+/, '') // 移除 # 符号

    toc.push({
      id,
      text: fullText.replace(/^#{1,6}\s+/, ''),
      level
    })
  }

  return toc
}

export function Article() {
  const { slug } = useParams<{ slug: string }>()
  const [article, setArticle] = useState<Article | null>(null)
  const [toc, setToc] = useState<{ id: string; text: string; level: number }[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.scrollTo(0, 0)

    const loadArticle = async () => {
      try {
        // 加载所有文章
        const articles = await loadArticles()
        const foundArticle = articles.find((a: Article) => a.slug === slug)

        if (!foundArticle) {
          setError('文章未找到')
          setLoading(false)
          return
        }

        setArticle(foundArticle)

        // 生成目录（直接使用存储的 content）
        const tocItems = generateToc(foundArticle.content)
        setToc(tocItems)

        setLoading(false)
      } catch (err) {
        console.error('Failed to load article:', err)
        setError('无法加载文章内容: ' + (err as Error).message)
        setLoading(false)
      }
    }

    loadArticle()
  }, [slug])

  // 监听滚动，高亮当前章节
  useEffect(() => {
    if (toc.length === 0) return

    const handleScroll = () => {
      const headingElements = toc.map(item => ({
        id: item.id,
        element: document.getElementById(item.id)
      })).filter(h => h.element !== null)

      if (headingElements.length === 0) return

      // 找到当前滚动位置对应的标题
      const scrollPosition = window.scrollY + 200 // 偏移量，考虑 header 高度

      let activeId = headingElements[0].id

      for (const heading of headingElements) {
        if (heading.element && heading.element.offsetTop <= scrollPosition) {
          activeId = heading.id
        } else {
          break
        }
      }

      setActiveId(activeId)
    }

    // 初始设置
    handleScroll()

    // 添加滚动监听
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [toc])

  // 点击目录项滚动到对应位置
  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 128 // header 高度
      const top = element.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        <p className="text-gray-400 mt-4">加载文章中...</p>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-red-500">
            {error ? '加载失败' : '文章未找到'}
          </h1>
          {error && <p className="text-gray-400 mb-4">{error}</p>}
          <Link to="/articles" className="text-primary hover:underline">
            返回文章列表
          </Link>
        </div>
      </div>
    )
  }

  return (
    <article className="pt-32 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-8">
        {/* 左侧目录导航 */}
        {toc.length > 0 && (
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <nav className="sticky top-32">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                目录
              </h3>
              <ul className="space-y-2">
                {toc.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault()
                        scrollToHeading(item.id)
                      }}
                      className={`block py-1.5 px-3 rounded-lg text-sm transition-colors overflow-hidden text-ellipsis whitespace-nowrap ${
                        activeId === item.id
                          ? 'bg-primary/20 text-primary font-medium'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                      }`}
                      style={{ paddingLeft: `${(item.level - 1) * 0.75}rem` }}
                    >
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        )}

        {/* 主内容区域 */}
        <div className="flex-1 min-w-0">
          {/* 文章头部 */}
          <header className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider text-white ${getCategoryColor(article.category)} rounded-full`}>
                {article.category}
              </span>
              <span className="text-gray-500 text-sm flex items-center gap-2">
                <i className="far fa-calendar-alt"></i> {article.date}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">{article.title}</h1>
            <p className="text-xl text-gray-400">{article.excerpt}</p>
            {article.tags && (
              <div className="flex flex-wrap gap-2 mt-4">
                {article.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 text-sm bg-card border border-gray-700 rounded-full text-gray-300">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* 文章内容 */}
          <div className="bg-card rounded-xl p-8 border border-gray-700">
            <MarkdownRenderer content={article?.content || ''} />
          </div>

          {/* 文章导航 */}
          <nav className="mt-12 flex justify-between">
            <Link to="/articles" className="text-primary hover:text-cyan-400 flex items-center gap-2">
              <i className="fas fa-arrow-left"></i> 返回文章列表
            </Link>
          </nav>
        </div>
      </div>
    </article>
  )
}
