import { DOMObserver, type OnEventCallback } from '../index'

describe('DOMObserver', () => {
	let instance: DOMObserver
	let el: HTMLElement
	let onEvent: ReturnType<typeof vi.fn<OnEventCallback>>

	beforeEach(() => {
		instance = new DOMObserver()
	})

	afterEach(() => {
		instance.clear()

		document.body.innerHTML = ''
	})

	it('Instantiates the class with no error', () => {
		expect(() => new DOMObserver()).not.toThrow()
	})

	describe('wait', () => {
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
					const { node, event } = await instance.wait('#foo', { events: [DOMObserver.REMOVE] })
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
						options: { attributeName, oldValue } = {},
					} = await instance.wait('#foo', {
						events: [DOMObserver.CHANGE],
					})
					expect(node).toEqual(el)
					expect(event).toBe(DOMObserver.CHANGE)
					expect(attributeName).toBe('class')
					expect(oldValue).toBe('bar')
				})

				it('Rejects promise when an element is not found after timeout is elapsed', async () => {
					await expect(instance.wait('#bar', { events: [DOMObserver.ADD], timeout: 50 })).rejects.toThrow(
						'[TIMEOUT]'
					)
				})

				it('Rejects the pending promise when wait() is called again', async () => {
					const first = instance.wait('#bar', { events: [DOMObserver.ADD] })
					instance.wait('#baz', { events: [DOMObserver.ADD] })
					await expect(first).rejects.toThrow('[ABORT]')
				})

				it('Throws when events array is empty', async () => {
					await expect(() => instance.wait('#foo', { events: [] })).rejects.toThrow()
				})

				it('Rejects with [TARGET] error when selector is invalid', async () => {
					await expect(instance.wait('##invalid')).rejects.toThrow('[TARGET]')
				})

				it('Rejects immediately when signal is already aborted', async () => {
					const controller = new AbortController()
					controller.abort()
					await expect(instance.wait('#foo', { signal: controller.signal })).rejects.toMatchObject({
						name: 'AbortError',
					})
				})

				it('Rejects and disconnects when signal is aborted during observation', async () => {
					const controller = new AbortController()
					const promise = instance.wait('#bar', {
						events: [DOMObserver.ADD],
						signal: controller.signal,
					})
					setTimeout(() => controller.abort(), 50)
					await expect(promise).rejects.toMatchObject({ name: 'AbortError' })
				})

				it('Sets isObserving to false after the promise resolves', async () => {
					await instance.wait('#foo')
					expect(instance.isObserving).toBe(false)
				})

				it('Does not clear a subsequent watch() when timeout was set', async () => {
					await instance.wait('#foo', { timeout: 100 })
					instance.watch('#foo', vi.fn<OnEventCallback>(), { events: [DOMObserver.CHANGE] })
					await _sleep(150)
					expect(instance.isObserving).toBe(true)
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

	describe('watch', () => {
		beforeEach(() => {
			onEvent = vi.fn<OnEventCallback>()
		})

		describe('Element is already created and mounted in the DOM', () => {
			beforeEach(() => {
				el = _createElement('foo')
			})

			it('Triggers onEvent immediately with EXIST when element is present', () => {
				instance.watch('#foo', onEvent)
				expect(onEvent).toHaveBeenCalledWith(el, DOMObserver.EXIST)
			})

			it('Accepts an Element reference as target', () => {
				instance.watch(el, onEvent)
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

			it('Fires CHANGE for all elements matching a class selector, not just the first', async () => {
				const a = _createElementWithClass('item')
				const b = _createElementWithClass('item')
				instance.watch('.item', onEvent, { events: [DOMObserver.CHANGE] })
				a.setAttribute('data-x', '1')
				await _sleep()
				b.setAttribute('data-x', '2')
				await _sleep()
				expect(onEvent).toHaveBeenCalledTimes(2)
				expect(onEvent).toHaveBeenCalledWith(a, DOMObserver.CHANGE, { attributeName: 'data-x', oldValue: null })
				expect(onEvent).toHaveBeenCalledWith(b, DOMObserver.CHANGE, { attributeName: 'data-x', oldValue: null })
			})

			it('Throws when events array is empty', () => {
				expect(() => instance.watch('#foo', onEvent, { events: [] })).toThrow('[EVENTS]')
			})

			it('Throws with [TARGET] error when selector is invalid', () => {
				expect(() => instance.watch('##invalid', onEvent)).toThrow('[TARGET]')
			})

			it('Rejects the pending wait() promise when watch() is called', async () => {
				const pending = instance.wait('#bar', { events: [DOMObserver.ADD] })
				instance.watch('#foo', onEvent)
				await expect(pending).rejects.toThrow('[ABORT]')
			})

			it('Returns the instance for chaining', () => {
				const result = instance.watch('#foo', onEvent)
				expect(result).toBe(instance)
			})

			it('Does nothing when signal is already aborted', () => {
				const controller = new AbortController()
				controller.abort()
				instance.watch('#foo', onEvent, { signal: controller.signal })
				expect(onEvent).not.toHaveBeenCalled()
				expect(instance.isObserving).toBe(false)
			})

			it('Stops observation when signal is aborted', async () => {
				const controller = new AbortController()
				instance.watch('#foo', onEvent, { events: [DOMObserver.CHANGE], signal: controller.signal })
				_modifyElement('#foo', 'class', 'change1')
				await _sleep()
				expect(onEvent).toHaveBeenCalledTimes(1)
				controller.abort()
				_modifyElement('#foo', 'class', 'change2')
				await _sleep()
				expect(onEvent).toHaveBeenCalledTimes(1)
			})

			it('Calls onError when timeout elapses with no matching mutation', async () => {
				const onError = vi.fn()
				instance.watch('#bar', onEvent, { events: [DOMObserver.ADD], timeout: 50, onError })
				await _sleep(100)
				expect(onEvent).not.toHaveBeenCalled()
				expect(onError).toHaveBeenCalledOnce()
				expect((onError.mock.calls[0][0] as Error).message).toMatch('[TIMEOUT]')
			})

			it('Does not call onError when a mutation occurs before timeout', async () => {
				const onError = vi.fn()
				instance.watch('#foo', onEvent, { events: [DOMObserver.CHANGE], timeout: 200, onError })
				_modifyElement('#foo', 'class', 'change1')
				await _sleep()
				expect(onEvent).toHaveBeenCalledOnce()
				await _sleep(250)
				expect(onError).not.toHaveBeenCalled()
			})

			it('Stops observation after timeout elapses', async () => {
				const onError = vi.fn()
				instance.watch('#foo', onEvent, { events: [DOMObserver.CHANGE], timeout: 50, onError })
				await _sleep(100)
				expect(instance.isObserving).toBe(false)
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

	describe('clear', () => {
		it('Returns the instance for chaining', () => {
			expect(instance.clear()).toBe(instance)
		})
	})
})
