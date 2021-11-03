import DOMObserver from '../DOMObserver'

describe('DOMObserver', () => {
	afterEach(() => {
		document.body.innerHTML = ''
	})

	it('Instantiates the class with no error', () => {
		expect(() => new DOMObserver()).not.toThrow()
	})

	describe('wait', () => {
		it('Observes an element already added', () => {
			const el = createAndAddElement('foo')
			const instance = new DOMObserver()
			const onEvent = jest.fn()
			instance.wait('#foo', onEvent)
			expect(onEvent).toHaveBeenCalledWith(el, DOMObserver.ADD)
		})

		it('Observes an element to be added', async () => {
			const instance = new DOMObserver()
			const onEvent = jest.fn()
			instance.wait('#foo', onEvent)
			const el = createAndAddElement('foo')
			await sleep()
			expect(onEvent).toHaveBeenCalledWith(el, DOMObserver.ADD)
		})

		it('Ignores an element to be added', async () => {
			const instance = new DOMObserver()
			const onEvent = jest.fn()
			instance.wait('#foo', onEvent, { events: [DOMObserver.CHANGE] })
			createAndAddElement('foo')
			await sleep()
			expect(onEvent).not.toHaveBeenCalled()
		})

		it('Ignores an element to be added that is not observed', async () => {
			const instance = new DOMObserver()
			const onEvent = jest.fn()
			instance.wait('#bar', onEvent)
			createAndAddElement('foo')
			await sleep()
			expect(onEvent).not.toHaveBeenCalled()
		})

		it('Observes an element to be removed', async () => {
			const instance = new DOMObserver()
			const onEvent = jest.fn()
			instance.wait('#foo', onEvent)
			const el = createAndAddElement('foo')
			await sleep()
			deleteElement('#foo')
			await sleep()
			expect(onEvent).toHaveBeenCalledWith(el, DOMObserver.REMOVE)
		})

		it('Ignores an element to be removed', async () => {
			const instance = new DOMObserver()
			const onEvent = jest.fn()
			instance.wait('#foo', onEvent, { events: [DOMObserver.CHANGE] })
			createAndAddElement('foo')
			await sleep()
			deleteElement('#foo')
			await sleep()
			expect(onEvent).not.toHaveBeenCalled()
		})

		it('Observes an element to be modified', async () => {
			const instance = new DOMObserver()
			const onEvent = jest.fn()
			instance.wait('#foo', onEvent)
			const el = createAndAddElement('foo', 'bar')
			modifyElement('#foo', 'class', 'gag')
			await sleep()
			expect(onEvent).toHaveBeenCalledWith(el, DOMObserver.CHANGE, { attributeName: 'class', oldValue: 'bar' })
		})

		it('Observes an element to be modified at a specific attribute', async () => {
			const instance = new DOMObserver()
			const onEvent = jest.fn()
			instance.wait('#foo', onEvent, { events: [DOMObserver.CHANGE], attributeFilter: ['aria-label'] })
			const el = createAndAddElement('foo', 'bar', 'gag')
			modifyElement('#foo', 'class', 'gag')
			await sleep()
			expect(onEvent).not.toHaveBeenCalled()
			modifyElement('#foo', 'aria-label', 'bar')
			await sleep()
			expect(onEvent).toHaveBeenCalledWith(el, DOMObserver.CHANGE, {
				attributeName: 'aria-label',
				oldValue: 'gag',
			})
		})

		it('Ignores an element to be modified', async () => {
			const instance = new DOMObserver()
			const onEvent = jest.fn()
			instance.wait('#foo', onEvent, { events: [DOMObserver.REMOVE] })
			createAndAddElement('foo', 'bar')
			modifyElement('#foo', 'class', 'gag')
			await sleep()
			expect(onEvent).not.toHaveBeenCalled()
		})

		it('Triggers onError when an element is not found after timeout is elapsed', async () => {
			const instance = new DOMObserver()
			const onEvent = jest.fn()
			const onError = jest.fn()
			instance.wait('#foo', onEvent, { onError, timeout: 50 })
			await sleep()
			expect(onError).toHaveBeenCalled()
		})

		it('Throws when events array is empty', async () => {
			const instance = new DOMObserver()
			const onEvent = jest.fn()
			expect(() => instance.wait('#foo', onEvent, { events: [] })).toThrow()
		})
	})
})
