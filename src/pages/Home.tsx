import { Hero } from '@/components/sections/Hero'
import { ProjectShowcase } from '@/components/sections/ProjectShowcase'
import { ArticleList } from '@/components/sections/ArticleList'
import { About } from '@/components/sections/About'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function Home() {
  const location = useLocation()

  // 处理页面跳转时的滚动
  useEffect(() => {
    if (location.hash) {
      // 如果有 hash，滚动到对应锚点
      const id = location.hash.replace('#', '')
      const element = document.getElementById(id)
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      }
    } else {
      // 如果没有 hash，滚动到顶部
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [location.pathname, location.hash])

  return (
    <>
      <Hero />
      <div id="articles">
        <ArticleList />
      </div>
      <ProjectShowcase />
      <About />
    </>
  )
}
