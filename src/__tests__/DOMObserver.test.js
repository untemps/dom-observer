import DOMObserver from '../DOMObserver'

describe('DOMObserver', () => {
	it('Instantiates the class with no error', () => {
		expect(() => new DOMObserver()).not.toThrow()
	})

	describe('wait', () => {
		afterEach(() => {
			document.body.innerHTML = ''
		})

		it('Waits for an element immediately found', async () => {
			const instance = new DOMObserver()
			generateDOM()
			const el = await instance.wait('#foo')
			expect(el).toBeDefined()
		})

		it('Waits for an element created afterwards', (done) => {
			const target = generateDOM()

			const instance = new DOMObserver()
			instance.wait('#bar').then((el) => {
				expect(el).toBeDefined()
				done()
			})

			const additionalElement = document.createElement('span')
			additionalElement.setAttribute('id', 'bar')
			target.appendChild(additionalElement)
		})

		it('Throws if element is not found', (done) => {
			generateDOM()

			const instance = new DOMObserver()
			instance.wait('#gag').catch((err) => {
				expect(err.message).toBe(`Error: Element #gag cannot be found`)
				done()
			})
		})

		it('Throws if timeout is set to 0 and element is not immediately found', (done) => {
			const target = generateDOM()

			const instance = new DOMObserver()
			instance.wait('#bar', 0).catch((err) => {
				expect(err.message).toBe(`Error: Element #bar cannot be found`)
				done()
			})

			const additionalElement = document.createElement('span')
			additionalElement.setAttribute('id', 'bar')
			target.appendChild(additionalElement)
		})
	})
})
