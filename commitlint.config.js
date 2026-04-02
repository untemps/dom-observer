export default {
	extends: ['@commitlint/config-conventional'],
	ignores: [(commit) => commit.includes('[skip ci]')],
	rules: {
		'subject-case': [2, 'always', 'sentence-case'],
		'scope-case': [2, 'always', ['lower-case', 'upper-case']],
	},
}
