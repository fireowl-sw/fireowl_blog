export function About() {
  return (
    <section id="about" className="py-20 bg-card/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* 头像区域 */}
          <div className="w-full lg:w-1/3 flex justify-center lg:justify-end">
            <div className="relative w-64 h-64 md:w-80 md:h-80">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary to-secondary rounded-full animate-pulse-slow blur-md opacity-60"></div>
              <div className="absolute inset-0 border-2 border-white/10 rounded-full animate-spin-slow border-t-transparent"></div>
              <img
                src="https://picsum.photos/seed/robotics/400/400.jpg"
                alt="Fireowl Avatar"
                className="relative w-full h-full object-cover rounded-full border-4 border-card shadow-2xl"
              />
            </div>
          </div>

          {/* 文本内容 */}
          <div className="w-full lg:w-2/3 text-center lg:text-left">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              <span className="text-gradient">Fireowl</span>
            </h2>
            <p className="text-lg text-gray-300 mb-6 leading-relaxed">
              你好！我是一名专注于自动驾驶仿真系统的研发工程师。我热衷于在比特世界里构建原子级的物理法则，让智能机器人在上线前经历成千上万次的"虚拟死亡"，从而在现实中安全运行。
            </p>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              我的核心技能涵盖<strong>多传感器融合仿真、场景重建、强化学习训练环境搭建</strong>
              以及<strong>大规模云端仿真调度</strong>。
            </p>

            <div className="flex gap-4 justify-center lg:justify-start">
              <a
                href="https://github.com/fireowl-sw?tab=repositories"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-gray-400 hover:bg-white hover:text-dark transition-all border border-gray-700 hover:border-transparent"
              >
                <i className="fab fa-github"></i>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-gray-400 hover:bg-[#0077b5] hover:text-white transition-all border border-gray-700 hover:border-transparent"
              >
                <i className="fab fa-linkedin-in"></i>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-gray-400 hover:bg-[#07c160] hover:text-white transition-all border border-gray-700 hover:border-transparent"
              >
                <i className="fab fa-weixin"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
