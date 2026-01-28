import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navClasses = `glass-nav fixed w-full z-50 transition-all duration-300 ${
    scrolled ? 'shadow-lg bg-slate-900/95' : ''
  }`

  return (
    <nav className={navClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex-shrink-0 cursor-pointer group"
          >
            <span className="text-2xl font-bold tracking-tighter group-hover:text-primary transition-colors">
              Fireowl<span className="text-primary">.Sim</span>
            </span>
          </Link>

          {/* 桌面端菜单 */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link to="/#home" className="hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">
                首页
              </Link>
              <Link to="/#articles" className="hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">
                技术文章
              </Link>
              <Link to="/#projects" className="hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">
                开源项目
              </Link>
              <Link to="/#about" className="hover:text-primary transition-colors px-3 py-2 rounded-md text-sm font-medium">
                关于我
              </Link>
            </div>
          </div>

          {/* 移动端菜单按钮 */}
          <div className="-mr-2 flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none transition-colors"
            >
              <i className="fas fa-bars text-xl"></i>
            </button>
          </div>
        </div>
      </div>

      {/* 移动端菜单面板 */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-card border-b border-gray-700 shadow-xl">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/#home"
              onClick={() => setMobileMenuOpen(false)}
              className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
            >
              首页
            </Link>
            <Link
              to="/#articles"
              onClick={() => setMobileMenuOpen(false)}
              className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
            >
              技术文章
            </Link>
            <Link
              to="/#projects"
              onClick={() => setMobileMenuOpen(false)}
              className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
            >
              开源项目
            </Link>
            <Link
              to="/#about"
              onClick={() => setMobileMenuOpen(false)}
              className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
            >
              关于我
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
