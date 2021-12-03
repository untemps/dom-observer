import css from 'rollup-plugin-css-only'
import replace from '@rollup/plugin-replace'
import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload'

export default {
	input: 'src/index.js',
	output: {
		format: 'es',
		file: 'public/index.js',
	},
	plugins: [
		css({ output: 'index.css' }),
		replace({
			'process.env.NODE_ENV': JSON.stringify('production'),
			preventAssignment: true,
		}),
		babel({
			exclude: 'node_modules/**',
			babelHelpers: 'bundled',
		}),
		nodeResolve({
			exportConditions: ['default', 'module', 'require'],
		}),
		commonjs(),
		serve({
			open: true,
			contentBase: ['public'],
			port: 10001,
		}),
		livereload(),
	],
}
