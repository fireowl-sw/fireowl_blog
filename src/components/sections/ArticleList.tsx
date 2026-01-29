import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { loadArticles, type Article } from '@/data/articles'
import { convertImageProxy } from '@/utils/imageProxy'

// 预设的颜色方案（足够多的颜色供不同分类使用）
const colorPalette = [
  { bg: 'bg-cyan-500', border: 'hover:border-cyan-500', text: 'hover:text-cyan-500', shadow: 'shadow-cyan-500/20' },
  { bg: 'bg-violet-500', border: 'hover:border-violet-500', text: 'hover:text-violet-500', shadow: 'shadow-violet-500/20' },
  { bg: 'bg-green-500', border: 'hover:border-green-400', text: 'hover:text-green-400', shadow: 'shadow-green-500/20' },
  { bg: 'bg-orange-500', border: 'hover:border-orange-400', text: 'hover:text-orange-400', shadow: 'shadow-orange-500/20' },
  { bg: 'bg-pink-500', border: 'hover:border-pink-400', text: 'hover:text-pink-400', shadow: 'shadow-pink-500/20' },
  { bg: 'bg-blue-500', border: 'hover:border-blue-400', text: 'hover:text-blue-400', shadow: 'shadow-blue-500/20' },
  { bg: 'bg-indigo-500', border: 'hover:border-indigo-400', text: 'hover:text-indigo-400', shadow: 'shadow-indigo-500/20' },
  { bg: 'bg-teal-500', border: 'hover:border-teal-400', text: 'hover:text-teal-400', shadow: 'shadow-teal-500/20' },
  { bg: 'bg-rose-500', border: 'hover:border-rose-400', text: 'hover:text-rose-400', shadow: 'shadow-rose-500/20' },
  { bg: 'bg-amber-500', border: 'hover:border-amber-400', text: 'hover:text-amber-400', shadow: 'shadow-amber-500/20' },
]

// 特定分类的颜色映射（保持原有分类的颜色不变）
const categoryColorMap: Record<string, number> = {
  '仿真器开发': 0, // cyan
  '感知算法': 1,   // violet
  '决策规划': 2,   // green
}

// 根据分类名称获取颜色索引
function getColorIndex(category: string): number {
  // 如果已有映射，使用映射
  if (category in categoryColorMap) {
    return categoryColorMap[category]
  }
  // 否则根据字符串哈希值分配颜色
  const hash = category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return hash % colorPalette.length
}

// 获取分类的颜色配置
function getCategoryStyles(category: string) {
  const index = getColorIndex(category)
  const colors = colorPalette[index]

  return {
    bg: colors.bg,
    active: `${colors.bg} text-white shadow-lg ${colors.shadow}`,
    inactive: `bg-gray-800 text-gray-300 border border-gray-700 ${colors.border} ${colors.text}`
  }
}

export function ArticleList() {
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [displayCount, setDisplayCount] = useState(6) // 初始显示6篇

  // 自动加载所有文章
  useEffect(() => {
    loadArticles().then(setArticles).finally(() => setLoading(false))
  }, [])

  // 当筛选改变时，重置显示数量
  useEffect(() => {
    setDisplayCount(6)
  }, [activeFilter])

  // 动态获取所有分类
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(articles.map(a => a.category)))
    return uniqueCategories.sort()
  }, [articles])

  const filteredArticles = activeFilter === 'all'
    ? articles
    : articles.filter(article => article.category === activeFilter)

  // 只显示当前数量的文章
  const displayedArticles = filteredArticles.slice(0, displayCount)
  const hasMore = filteredArticles.length > displayCount

  // 加载更多文章
  const loadMore = () => {
    setDisplayCount(prev => Math.min(prev + 6, filteredArticles.length))
  }

  return (
    <section className="py-20 bg-card/30 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
          <div className="md:flex-1">
            <h2 className="text-3xl font-bold mb-2">技术笔记</h2>
            <div className="h-1 w-20 bg-primary rounded shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
          </div>

          {/* 分类筛选器 - 动态生成 */}
          <div className="flex flex-wrap justify-center gap-2">
            <button
              className={`px-4 py-1.5 rounded-full text-sm transition-all shadow-lg ${
                activeFilter === 'all'
                  ? 'bg-primary text-white shadow-cyan-500/20'
                  : 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-primary hover:text-primary'
              }`}
              onClick={() => setActiveFilter('all')}
            >
              全部
            </button>
            {categories.map((category) => {
              const styles = getCategoryStyles(category)
              return (
                <button
                  key={category}
                  className={`px-4 py-1.5 rounded-full text-sm transition-all shadow-lg ${
                    activeFilter === category ? styles.active : styles.inactive
                  }`}
                  onClick={() => setActiveFilter(category)}
                >
                  {category}
                </button>
              )
            })}
          </div>
        </div>

        {/* 加载状态 */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-400 mt-4">加载文章中...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="col-span-full text-center py-10 text-gray-500 bg-gray-800/50 rounded-xl">
            暂无该分类文章
          </div>
        ) : (
          <div key={activeFilter} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedArticles.map((article, index) => {
              // 计算当前批次中的相对索引，用于动画延迟
              // 第一批(0-5): 0, 1, 2, 3, 4, 5
              // 第二批(6-11): 0, 1, 2, 3, 4, 5 (相对于当前批次)
              const batchIndex = index % 6
              return (
                <Link
                  key={article.id}
                  to={`/article/${article.slug}`}
                  className="blog-card bg-card rounded-xl overflow-hidden border border-gray-700 flex flex-col h-full opacity-0 animate-fade-in-up"
                  style={{ animationDelay: `${batchIndex * 0.1}s` }}
                >
                <div className="h-48 overflow-hidden relative group flex-shrink-0">
                  <img
                    src={convertImageProxy(article.image)}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                  <div className="absolute top-4 left-4">
                    <span
                      className={`px-3 py-1 text-xs font-bold uppercase tracking-wider text-white ${colorPalette[getColorIndex(article.category)].bg} rounded-full shadow-lg`}
                    >
                      {article.category}
                    </span>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="text-gray-500 text-sm mb-3 flex items-center gap-2">
                    <i className="far fa-calendar-alt"></i> {article.date}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-100 hover:text-primary cursor-pointer transition-colors line-clamp-1">
                    {article.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-6 line-clamp-3 flex-1">{article.excerpt}</p>
                  <span className="inline-flex items-center text-primary hover:text-white transition-colors font-medium text-sm group/link">
                    阅读全文{' '}
                    <i className="fas fa-arrow-right ml-2 text-xs transform group-hover/link:translate-x-1 transition-transform"></i>
                  </span>
                </div>
              </Link>
              )
            })}
          </div>
        )}

        {hasMore && (
          <div className="mt-16 text-center">
            <button
              onClick={loadMore}
              className="group relative px-6 py-3 font-bold text-white transition-all duration-200 bg-gray-800 font-lg rounded-full hover:bg-gray-700 focus:outline-none ring-offset-2 focus:ring-2 ring-gray-400"
            >
              <span className="absolute top-0 left-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-gray-700"></span>
              <span className="relative flex items-center gap-2">
                加载更多文章 <i className="fas fa-arrow-down transform group-hover:translate-y-1 transition-transform"></i>
              </span>
            </button>
          </div>
        )}
        {!hasMore && filteredArticles.length > 6 && (
          <div className="mt-16 text-center text-gray-500">
            <p>已显示全部 {filteredArticles.length} 篇文章</p>
          </div>
        )}
      </div>
    </section>
  )
}
