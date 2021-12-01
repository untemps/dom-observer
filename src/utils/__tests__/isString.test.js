import isString from '../isString'

describe('isString', () => {
	it('returns truthy checks', () => {
		expect.assertions(3)
		expect(isString('abc')).toBeTruthy()
		expect(isString('')).toBeTruthy()
		expect(isString(String('abc'))).toBeTruthy()
	})

	it('returns falsy checks', () => {
		expect.assertions(6)
		expect(isString(1)).toBeFalsy()
		expect(isString([])).toBeFalsy()
		expect(isString(() => undefined)).toBeFalsy()
		expect(isString(false)).toBeFalsy()
		expect(isString(null)).toBeFalsy()
		expect(isString(undefined)).toBeFalsy()
	})
})
