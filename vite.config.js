import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// @weirdscience/based-client@0.3.0 was published with the React dev JSX
// runtime baked into its dist (jsxDEV from react/jsx-dev-runtime). React's
// production jsx-dev-runtime exports jsxDEV as undefined, so the bundled
// app crashes with "jsxDEV is not a function". Rewrite its single JSX call
// to the production runtime until upstream republishes.
function fixBasedClientJsxRuntime() {
  return {
    name: 'fix-based-client-jsx-runtime',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('@weirdscience/based-client')) return null
      if (!code.includes('jsx-dev-runtime')) return null
      return code
        .replace(/react\/jsx-dev-runtime/g, 'react/jsx-runtime')
        .replace(/\bjsxDEV\b/g, 'jsx')
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [fixBasedClientJsxRuntime(), react()],
  base: '/learn-japanese/',
})
