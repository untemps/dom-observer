import DOMObserver from '../DOMObserver'

describe('DOMObserver', () => {
	afterEach(() => {
		document.body.innerHTML = ''
	})

	it('Instantiates the class with no error', () => {
		expect(() => new DOMObserver()).not.toThrow()
	})

	describe('wait', () => {
		it('Waits for an element already added', async () => {
			const instance = new DOMObserver()
			generateDOM()
			const el = await instance.wait('#foo')
			expect(el).toBeDefined()
		})

		it('Waits for an element to be added', (done) => {
			const target = generateDOM()

			const instance = new DOMObserver()
			instance.wait('#bar').then((node) => {
				expect(node).toBeDefined()
				expect(node.id).toBe('bar')
				done()
			})

			const additionalElement = document.createElement('span')
			additionalElement.setAttribute('id', 'bar')
			target.appendChild(additionalElement)
		})

		it('Waits for an element to be removed', (done) => {
			const target = generateDOM()
			const additionalElement = document.createElement('span')
			additionalElement.setAttribute('id', 'bar')
			target.appendChild(additionalElement)

			const instance = new DOMObserver()
			instance.wait('#bar').then((node) => {
				expect(node).toBeDefined()
				expect(node.id).toBe('bar')
				done()
			})

			additionalElement.remove()
		})

		it('Throws if element is not found', (done) => {
			generateDOM()

			const instance = new DOMObserver()
			instance.wait('#gag').catch((err) => {
				expect(err.message).toBe(`Element #gag cannot be found`)
				done()
			})
		})

		it('Throws if timeout is set to 0 and element is not immediately found', (done) => {
			const target = generateDOM()

			const instance = new DOMObserver()
			instance.wait('#bar', 0).catch((err) => {
				expect(err.message).toBe(`Element #bar cannot be found`)
				done()
			})

			const additionalElement = document.createElement('span')
			additionalElement.setAttribute('id', 'bar')
			target.appendChild(additionalElement)
		})
	})

	describe('watch', () => {
		it('Watches for an element attribute to change', (done) => {
			generateDOM()

			const instance = new DOMObserver()
			instance.watch('#foo').then(({ target, attributeName, oldValue }) => {
				expect(target).toBe(el)
				expect(attributeName).toBe('class')
				expect(oldValue).toBe('foo')
				done()
			})

			const el = document.querySelector('.foo')
			el.setAttribute('class', 'bar')
		})

		it('Watches for an untracked element attribute to change', (done) => {
			generateDOM()

			const instance = new DOMObserver()
			instance.watch('#foo', { attributeNames: ['id'] }, 1000).catch((err) => {
				expect(err.message).toBe(`Element #foo has not been modified before timeout expired`)
				done()
			})

			const el = document.querySelector('.foo')
			el.setAttribute('class', 'bar')
		})

		it('Throws if no modification occurs before timeout expiration', (done) => {
			generateDOM()

			const instance = new DOMObserver()
			instance.watch('#foo', {}, 1000).catch((err) => {
				expect(err.message).toBe(`Element #foo has not been modified before timeout expired`)
				done()
			})
		})
	})
})
