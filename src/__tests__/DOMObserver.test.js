import DOMObserver from '../DOMObserver'

describe('DOMObserver', () => {
	let instance, el, onEvent

	beforeEach(() => {
		instance = new DOMObserver()
	})

	afterEach(() => {
		instance.clear()
		instance = null

		document.body.innerHTML = ''
	})

	it('Instantiates the class with no error', () => {
		expect(() => new DOMObserver()).not.toThrow()
	})

	describe('wait', () => {
		describe('The onEvent callback is triggered as soon as an event occurs', () => {
			beforeEach(() => {
				onEvent = jest.fn()
			})

			describe('Element is already created and mounted in the DOM', () => {
				beforeEach(() => {
					el = _createElement('foo')
				})

				it('Observes an element to be added', () => {
					instance.wait('#foo', onEvent)
					expect(onEvent).toHaveBeenCalledWith(el, DOMObserver.ADD)
				})

				it('Ignores an element to be added', async () => {
					instance.wait('#foo', onEvent, { events: [DOMObserver.CHANGE] })
					expect(onEvent).not.toHaveBeenCalled()
				})

				it('Ignores an element to be added that is not observed', async () => {
					instance.wait('#bar', onEvent)
					expect(onEvent).not.toHaveBeenCalled()
				})

				it('Observes an element to be removed', async () => {
					instance.wait('#foo', onEvent)
					_removeElement('#foo')
					await _sleep()
					expect(onEvent).toHaveBeenCalledWith(el, DOMObserver.REMOVE)
				})

				it('Ignores an element to be removed', async () => {
					instance.wait('#foo', onEvent, { events: [DOMObserver.CHANGE] })
					_removeElement('#foo')
					await _sleep()
					expect(onEvent).not.toHaveBeenCalled()
				})

				it('Observes an element to be modified', async () => {
					instance.wait('#foo', onEvent)
					_modifyElement('#foo', 'class', 'gag')
					await _sleep()
					expect(onEvent).toHaveBeenCalledWith(el, DOMObserver.CHANGE, {
						attributeName: 'class',
						oldValue: 'bar',
					})
				})

				it('Observes an element to be modified at a specific attribute', async () => {
					instance.wait('#foo', onEvent, { events: [DOMObserver.CHANGE], attributeFilter: ['aria-label'] })
					_modifyElement('#foo', 'class', 'gag')
					await _sleep()
					expect(onEvent).not.toHaveBeenCalled()
					_modifyElement('#foo', 'aria-label', 'bar')
					await _sleep()
					expect(onEvent).toHaveBeenCalledWith(el, DOMObserver.CHANGE, {
						attributeName: 'aria-label',
						oldValue: 'gag',
					})
				})

				it('Ignores an element to be modified', async () => {
					instance.wait('#foo', onEvent, { events: [DOMObserver.REMOVE] })
					_modifyElement('#foo', 'class', 'gag')
					await _sleep()
					expect(onEvent).not.toHaveBeenCalled()
				})

				it('Triggers onError when an element is not found after timeout is elapsed', async () => {
					const onError = jest.fn()
					instance.wait('#foo', onEvent, { onError, timeout: 50 })
					await _sleep()
					expect(onError).toHaveBeenCalled()
				})

				it('Throws when events array is empty', async () => {
					await expect(() => instance.wait('#foo', onEvent, { events: [] })).rejects.toThrow()
				})
			})

			describe('Element creation and mounting are delayed', () => {
				it('Observes an element to be added', async () => {
					instance.wait('#foo', onEvent)
					el = _createElement('foo')
					await _sleep()
					expect(onEvent).toHaveBeenCalledWith(el, DOMObserver.ADD)
				})
			})
		})

		describe('A promise is resolved as soon as an event occurs', () => {
			describe('Element is already created and mounted in the DOM', () => {
				beforeEach(() => {
					el = _createElement('foo')
				})

				it('Observes an element to be added', async () => {
					const { node, event } = await instance.wait('#foo')
					expect(node).toEqual(el)
					expect(event).toBe(DOMObserver.ADD)
				})

				it('Observes an element to be removed', async () => {
					setTimeout(() => {
						_removeElement('#foo')
					}, 100)
					const { node, event } = await instance.wait('#foo', null, { events: [DOMObserver.REMOVE] })
					expect(node).toEqual(el)
					expect(event).toBe(DOMObserver.REMOVE)
				})

				it('Observes an element to be modified', async () => {
					setTimeout(() => {
						_modifyElement('#foo', 'class', 'gag')
					}, 100)
					const {
						node,
						event,
						options: { attributeName, oldValue },
					} = await instance.wait('#foo', null, {
						events: [DOMObserver.CHANGE],
					})
					expect(node).toEqual(el)
					expect(event).toBe(DOMObserver.CHANGE)
					expect(attributeName).toBe('class')
					expect(oldValue).toBe('bar')
				})

				it('Rejects promise when an element is not found after timeout is elapsed', async () => {
					const instance = new DOMObserver()
					try {
						await instance.wait('#foo', null, { timeout: 50 })
					} catch (error) {
						expect(error.message).toMatch(`[TIMEOUT]`)
					}
				})
			})

			describe('Element creation and mounting are delayed', () => {
				it('Observes an element to be added', async () => {
					setTimeout(() => {
						el = _createElement('foo')
					}, 100)
					const { node, event } = await instance.wait('#foo')
					expect(node).toEqual(el)
					expect(event).toBe(DOMObserver.ADD)
				})
			})
		})
	})
})
