import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs'
import { join, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const repositoryName = 'ZJU_Botany_Tests'
const isGitHubPagesBuild = process.env.GITHUB_PAGES === 'true'

function copyDirSync(src: string, dest: string) {
  if (!existsSync(src)) return
  mkdirSync(dest, { recursive: true })
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry)
    const destPath = join(dest, entry)
    if (statSync(srcPath).isDirectory()) {
      copyDirSync(srcPath, destPath)
    } else {
      copyFileSync(srcPath, destPath)
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: isGitHubPagesBuild ? `/${repositoryName}/` : '/',
  plugins: [
    react(),
    {
      name: 'copy-data',
      closeBundle() {
        const dataDir = resolve(__dirname, 'data')
        const distDataDir = resolve(__dirname, 'dist', 'data')
        if (existsSync(dataDir)) {
          copyDirSync(dataDir, distDataDir)
          console.log(`Copied data/ to dist/data/`)
        }
      },
    },
  ],
  server: {
    fs: {
      allow: ['..'],
    },
  },
})
