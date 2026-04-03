import dts from 'vite-plugin-dts'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	build: {
		lib: {
			entry: 'src/index.ts',
			name: 'DOMObserver',
			formats: ['es', 'cjs', 'umd'],
			fileName: (format) => {
				if (format === 'es') return 'index.es.js'
				if (format === 'umd') return 'index.umd.js'
				return 'index.cjs'
			},
		},
		sourcemap: true,
	},
	plugins: [dts({ tsconfigPath: './tsconfig.build.json' })],
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./test/setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov'],
			include: ['src/**'],
			exclude: ['src/**/__tests__/**', 'src/index.ts'],
		},
		restoreMocks: true,
	},
})
