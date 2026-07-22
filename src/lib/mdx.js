const postFiles = import.meta.glob('/content/posts/*.{md,mdx}', {
  eager: true,
  query: '?post',
  import: 'default',
})

function stablePosition(slug) {
  let hash = 2166136261
  for (let index = 0; index < slug.length; index += 1) {
    hash ^= slug.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  const angle = ((hash >>> 0) % 360) * (Math.PI / 180)
  const radius = 2.2 + (((hash >>> 8) % 190) / 100)
  const height = (((hash >>> 16) % 500) / 100) - 2.5
  return [Math.cos(angle) * radius, height, Math.sin(angle) * radius * 0.65]
}

function normalizePosition(position, slug) {
  if (!Array.isArray(position) || position.length !== 3) return stablePosition(slug)
  const normalized = position.map(Number)
  return normalized.every(Number.isFinite) ? normalized : stablePosition(slug)
}

function slugFromPath(filePath) {
  return filePath.split('/').pop().replace(/\.mdx?$/, '')
}

export function getAllPosts() {
  return Object.entries(postFiles)
    .map(([filePath, postFile]) => {
      const slug = slugFromPath(filePath)
      const { data, content } = postFile

      return {
        id: String(data.id || slug),
        slug,
        title: String(data.title || '无标题碎片'),
        category: String(data.category || '未分类'),
        date: String(data.date || '1970-01-01'),
        summary: String(data.summary || ''),
        color: String(data.color || '#79e1d0'),
        position: normalizePosition(data.position, slug),
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        readTime: String(data.readTime || '3 分钟'),
        content: content.trim(),
      }
    })
    .sort((first, second) => second.date.localeCompare(first.date))
}
