import { DOMObserver } from '../index'

describe('DOMObserver', () => {
	let instance
	let el
	let onEvent

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
				onEvent = vi.fn()
			})

			describe('Element is already created and mounted in the DOM', () => {
				beforeEach(() => {
					el = _createElement('foo')
				})

				it('Observes an element to be added', () => {
					instance.wait('#foo', onEvent)
					expect(onEvent).toHaveBeenCalledWith(el, DOMObserver.EXIST)
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

				it('Observes an element to be modified (CHANGE only — direct element scope)', async () => {
					instance.wait('#foo', onEvent, { events: [DOMObserver.CHANGE] })
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
					const onError = vi.fn()
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
					expect(event).toBe(DOMObserver.EXIST)
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
						expect(error.message).toMatch('[TIMEOUT]')
					}
				})

				it('Rejects the pending promise when wait() is called again', async () => {
					const first = instance.wait('#bar', null, { events: [DOMObserver.ADD] })
					instance.wait('#baz', null, { events: [DOMObserver.ADD] })
					await expect(first).rejects.toThrow('[ABORT]')
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

		describe('The target can be an DOM element', () => {
			beforeEach(() => {
				onEvent = vi.fn()
			})

			describe('Element is already created and mounted in the DOM', () => {
				beforeEach(() => {
					el = _createElement('foo')
				})

				it('Observes an element to be added', () => {
					instance.wait(el, onEvent)
					expect(onEvent).toHaveBeenCalledWith(el, DOMObserver.EXIST)
				})

				it('Observes an element to be removed', async () => {
					instance.wait(el, onEvent)
					_removeElement('#foo')
					await _sleep()
					expect(onEvent).toHaveBeenCalledWith(el, DOMObserver.REMOVE)
				})

				it('Observes an element to be modified', async () => {
					instance.wait(el, onEvent)
					_modifyElement('#foo', 'class', 'gag')
					await _sleep()
					expect(onEvent).toHaveBeenCalledWith(el, DOMObserver.CHANGE, {
						attributeName: 'class',
						oldValue: 'bar',
					})
				})

				it('Observes an element to be modified (CHANGE only — direct element scope)', async () => {
					instance.wait(el, onEvent, { events: [DOMObserver.CHANGE] })
					_modifyElement('#foo', 'class', 'gag')
					await _sleep()
					expect(onEvent).toHaveBeenCalledWith(el, DOMObserver.CHANGE, {
						attributeName: 'class',
						oldValue: 'bar',
					})
				})
			})
		})
	})

	describe('watch', () => {
		beforeEach(() => {
			onEvent = vi.fn()
		})

		describe('Element is already created and mounted in the DOM', () => {
			beforeEach(() => {
				el = _createElement('foo')
			})

			it('Triggers onEvent immediately with EXIST when element is present', () => {
				instance.watch('#foo', onEvent)
				expect(onEvent).toHaveBeenCalledWith(el, DOMObserver.EXIST)
			})

			it('Triggers onEvent on every successive attribute change', async () => {
				instance.watch('#foo', onEvent, { events: [DOMObserver.CHANGE] })
				_modifyElement('#foo', 'class', 'change1')
				await _sleep()
				_modifyElement('#foo', 'class', 'change2')
				await _sleep()
				expect(onEvent).toHaveBeenCalledTimes(2)
				expect(onEvent).toHaveBeenNthCalledWith(1, el, DOMObserver.CHANGE, {
					attributeName: 'class',
					oldValue: 'bar',
				})
				expect(onEvent).toHaveBeenNthCalledWith(2, el, DOMObserver.CHANGE, {
					attributeName: 'class',
					oldValue: 'change1',
				})
			})

			it('Triggers onEvent for each matching added and removed node', async () => {
				instance.watch('.item', onEvent, { events: [DOMObserver.ADD, DOMObserver.REMOVE] })
				const a = _createElementWithClass('item')
				const b = _createElementWithClass('item')
				await _sleep()
				expect(onEvent).toHaveBeenCalledTimes(2)
				expect(onEvent).toHaveBeenCalledWith(a, DOMObserver.ADD)
				expect(onEvent).toHaveBeenCalledWith(b, DOMObserver.ADD)
				document.body.removeChild(a)
				await _sleep()
				expect(onEvent).toHaveBeenCalledWith(a, DOMObserver.REMOVE)
				expect(onEvent).toHaveBeenCalledTimes(3)
			})

			it('Throws when events array is empty', () => {
				expect(() => instance.watch('#foo', onEvent, { events: [] })).toThrow('[EVENTS]')
			})

			it('Rejects the pending wait() promise when watch() is called', async () => {
				const pending = instance.wait('#bar', null, { events: [DOMObserver.ADD] })
				instance.watch('#foo', onEvent)
				await expect(pending).rejects.toThrow('[ABORT]')
			})

			it('Returns the instance for chaining', () => {
				const result = instance.watch('#foo', onEvent)
				expect(result).toBe(instance)
			})
		})

		describe('Element creation and mounting are delayed', () => {
			it('Triggers onEvent when element is added', async () => {
				instance.watch('#foo', onEvent)
				el = _createElement('foo')
				await _sleep()
				expect(onEvent).toHaveBeenCalledWith(el, DOMObserver.ADD)
			})
		})
	})
})
