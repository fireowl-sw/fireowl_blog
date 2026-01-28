import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import type { Components } from 'react-markdown'
import { convertImageProxy } from '@/utils/imageProxy'

interface MarkdownRendererProps {
  content: string
}

// 生成标题 ID
function generateId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fa5]/g, '') // 移除特殊字符
    .replace(/\s+/g, '-') // 空格替换为短横线
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {

  const components: Components = {
    h1: ({ children }) => {
      const text = String(children).replace(/#/g, '')
      const id = generateId(text)
      return <h1 id={id} className="text-3xl font-bold text-white mt-8 mb-4 scroll-mt-32">{children}</h1>
    },
    h2: ({ children }) => {
      const text = String(children).replace(/#/g, '')
      const id = generateId(text)
      return <h2 id={id} className="text-2xl font-bold text-white mt-8 mb-4 scroll-mt-24">{children}</h2>
    },
    h3: ({ children }) => {
      const text = String(children).replace(/#/g, '')
      const id = generateId(text)
      return <h3 id={id} className="text-xl font-bold text-white mt-6 mb-3 scroll-mt-20">{children}</h3>
    },
    p: ({ children }) => <p className="text-gray-300 mb-4 leading-relaxed">{children}</p>,
    a: ({ href, children }) => (
      <a href={href} className="text-primary hover:text-cyan-400 underline">
        {children}
      </a>
    ),
    ul: ({ children }) => <ul className="list-disc ml-6 mb-4 text-gray-300">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal ml-6 mb-4 text-gray-300">{children}</ol>,
    li: ({ children }) => <li className="mb-2">{children}</li>,
    code: ({ className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '')
      return !match ? (
        <code className="bg-gray-800 text-cyan-300 px-1.5 py-0.5 rounded text-sm" {...props}>
          {children}
        </code>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      )
    },
    pre: ({ children }) => <pre className="bg-gray-900 rounded-lg p-4 mb-4 overflow-x-auto">{children}</pre>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary pl-4 italic text-gray-400 my-4">
        {children}
      </blockquote>
    ),
    img: ({ src, alt }) => (
      <img src={convertImageProxy(src)} alt={alt || ''} className="rounded-lg my-4 max-w-full" />
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border border-gray-700 px-4 py-2 bg-gray-800 font-semibold text-gray-200">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border border-gray-700 px-4 py-2 text-gray-300">{children}</td>
    ),
  }

  return (
    <div className="markdown-body max-w-4xl mx-auto">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
