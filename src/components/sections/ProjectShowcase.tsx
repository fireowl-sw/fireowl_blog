import { useState, useEffect } from 'react'
import { loadProjects, type Project } from '@/data/projects'
import { convertImageProxy } from '@/utils/imageProxy'

export function ProjectShowcase() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  // 自动加载所有项目
  useEffect(() => {
    loadProjects().then(setProjects).finally(() => setLoading(false))
  }, [])

  return (
    <section id="projects" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">精选项目</h2>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-400 mt-4">加载项目中...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-10 text-gray-500 bg-gray-800/50 rounded-xl">
            暂无项目
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {projects.map((project) => (
              <a
                key={project.id}
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative bg-card rounded-xl overflow-hidden border border-gray-700 hover:border-primary transition-all duration-300 flex flex-col md:flex-row cursor-pointer"
              >
                <div className="md:w-2/5 h-48 md:h-auto bg-gray-800 relative overflow-hidden">
                  {project.image ? (
                    <img
                      src={convertImageProxy(project.image)}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-700 opacity-80"></div>
                  )}
                </div>
                <div className="p-6 md:w-3/5 flex flex-col justify-center">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{project.title}</h3>
                    <i className="fab fa-github text-xl text-gray-400 group-hover:text-white transition-transform group-hover:rotate-12"></i>
                  </div>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{project.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs rounded bg-gray-700 border border-gray-600 text-cyan-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
