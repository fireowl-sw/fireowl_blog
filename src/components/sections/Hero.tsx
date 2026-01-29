import { useEffect, useState } from 'react'

export function Hero() {
  const words = ['智能边界', '感知极限', '决策逻辑', '安全基石']
  const [currentWord, setCurrentWord] = useState(words[0])
  const [isDeleting, setIsDeleting] = useState(false)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (currentWord.length < words[index].length) {
          setCurrentWord(words[index].slice(0, currentWord.length + 1))
        } else {
          setIsDeleting(true)
          setTimeout(() => setIsDeleting(false), 2000)
          setIndex((i) => (i + 1) % words.length)
        }
      } else {
        if (currentWord.length > 0) {
          setCurrentWord(currentWord.slice(0, -1))
        } else {
          setIsDeleting(false)
        }
      }
    }, isDeleting ? 50 : 100)

    return () => clearTimeout(timeout)
  }, [currentWord, isDeleting, index])

  return (
    <section id="home" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 animate-pulse-slow"></div>
        <div
          className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 animate-pulse-slow"
          style={{ animationDelay: '2s' }}
        ></div>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        ></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-sm animate-fade-in-up">
          <span className="text-sm text-primary font-medium">
            <i className="fas fa-robot mr-2"></i>
            专注于自动驾驶与机器人仿真
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          在 <span className="text-gradient">虚拟世界</span> 测试未来
          <br />
          验证 <span className="text-gradient">{currentWord}</span>
          <span className="cursor-blink">|</span>
        </h1>

        <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-400 mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          我是 Fireowl，一名仿真工程师。致力于通过高保真仿真、强化学习与传感器模拟，加速自动驾驶算法的安全落地。
        </p>

        <div className="flex justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <a
            href="#articles"
            className="bg-primary text-white px-8 py-3.5 rounded-full font-bold hover:bg-cyan-600 transition-transform hover:-translate-y-1 shadow-lg shadow-cyan-500/30"
          >
            阅读技术文章
          </a>
          <a
            href="#projects"
            className="border border-gray-600 text-white px-8 py-3.5 rounded-full font-bold hover:border-secondary hover:text-secondary transition-all hover:bg-gray-800/50"
          >
            查看仿真项目
          </a>
        </div>
      </div>
    </section>
  )
}
