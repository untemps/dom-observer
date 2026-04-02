import isElement from '../isElement'

describe('isElement', () => {
	it('returns truthy checks', () => {
		expect.assertions(1)
		expect(isElement(_createElement('foo'))).toBeTruthy()
	})

	it('returns falsy checks', () => {
		expect.assertions(6)
		expect(isElement(1)).toBeFalsy()
		expect(isElement([])).toBeFalsy()
		expect(isElement(() => undefined)).toBeFalsy()
		expect(isElement(false)).toBeFalsy()
		expect(isElement(null)).toBeFalsy()
		expect(isElement(undefined)).toBeFalsy()
	})
})
