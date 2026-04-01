import { defineConfig } from 'vitest/config'

export default defineConfig({
	build: {
		lib: {
			entry: 'src/index.js',
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
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./test/setup.js'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov'],
			include: ['src/**'],
			exclude: ['src/**/__tests__/**', 'src/index.js'],
		},
		restoreMocks: true,
	},
})
