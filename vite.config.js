import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import process from 'node:process'
import matter from 'gray-matter'

function githubPagesBase() {
  if (process.env.GITHUB_ACTIONS !== 'true' || !process.env.GITHUB_REPOSITORY) return '/'

  const [owner, repository] = process.env.GITHUB_REPOSITORY.split('/')
  return repository.toLowerCase() === `${owner}.github.io`.toLowerCase() ? '/' : `/${repository}/`
}

function markdownPostPlugin() {
  return {
    name: 'memory-nebula-markdown-posts',
    enforce: 'pre',
    load(id) {
      const queryIndex = id.indexOf('?')
      if (queryIndex === -1) return null

      const filePath = id.slice(0, queryIndex)
      const query = new URLSearchParams(id.slice(queryIndex + 1))
      if (!query.has('post') || !/\.mdx?$/.test(filePath)) return null

      this.addWatchFile(filePath)
      const { data, content } = matter(readFileSync(filePath, 'utf8'))
      return `export default ${JSON.stringify({ data, content })}`
    },
  }
}

function vendorChunk(id) {
  if (!id.includes('node_modules')) return undefined

  if (id.includes('/node_modules/three/build/three.core.js')) return 'three-core'
  if (id.includes('/node_modules/three/build/three.module.js')) return 'three-webgl'
  if (id.includes('/node_modules/three/')) return 'three'
  if (
    id.includes('/node_modules/react/') ||
    id.includes('/node_modules/react-dom/') ||
    id.includes('/node_modules/scheduler/')
  ) return 'react'
  if (id.includes('/node_modules/postprocessing/') || id.includes('/node_modules/@react-three/postprocessing/')) {
    return 'postprocessing'
  }
  if (
    id.includes('/node_modules/@react-three/') ||
    id.includes('/node_modules/three-stdlib/') ||
    id.includes('/node_modules/maath/') ||
    id.includes('/node_modules/troika-three-')
  ) return 'react-three'
  if (id.includes('/node_modules/gsap/')) return 'animation'
  if (
    id.includes('/node_modules/react-markdown/') ||
    id.includes('/node_modules/remark-') ||
    id.includes('/node_modules/rehype-') ||
    id.includes('/node_modules/unified/') ||
    id.includes('/node_modules/micromark') ||
    id.includes('/node_modules/mdast-') ||
    id.includes('/node_modules/hast-') ||
    id.includes('/node_modules/unist-') ||
    id.includes('/node_modules/vfile')
  ) return 'markdown'

  return undefined
}

export default defineConfig({
  base: githubPagesBase(),
  plugins: [markdownPostPlugin(), react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: vendorChunk,
      },
    },
  },
})
