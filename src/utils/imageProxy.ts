// 图片 CORS 代理转换工具
export function convertImageProxy(src: string | undefined): string {
  if (!src) return ''
  // 如果是本地图片（以 / 开头），直接返回
  if (src.startsWith('/')) return src
  // 使用公共 CORS 代理服务（仅对不支持 CORS 的图床）
  // 大部分 PicGo 支持的图床（阿里云 OSS、腾讯云 COS、七牛云、Imgur 等）都直接支持 CORS
  // 只有 GitHub/Gitee 需要代理
  if (src.includes('gitee.com') || src.includes('github.com')) {
    return `https://corsproxy.io/?${encodeURIComponent(src)}`
  }
  // 其他图床（PicGo 默认支持的）直接返回原链接
  return src
}
