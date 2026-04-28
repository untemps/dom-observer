import { DOMObserver, DOMObserverErrors, type OnEventCallback } from '../index'

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

				it('Resolves only when a filtered attribute changes', async () => {
					setTimeout(() => {
						_modifyElement('#foo', 'data-ignored', 'x')
						_modifyElement('#foo', 'data-watched', 'y')
					}, 50)
					const { options } = await instance.wait('#foo', {
						events: [DOMObserver.CHANGE],
						attributeFilter: ['data-watched'],
					})
					expect(options?.attributeName).toBe('data-watched')
				})

				it('Rejects promise when an element is not found after timeout is elapsed', async () => {
					await expect(instance.wait('#bar', { events: [DOMObserver.ADD], timeout: 50 })).rejects.toThrow(
						DOMObserverErrors.TIMEOUT
					)
				})

				it('Rejects the pending promise when wait() is called again', async () => {
					const first = instance.wait('#bar', { events: [DOMObserver.ADD] })
					instance.wait('#baz', { events: [DOMObserver.ADD] })
					await expect(first).rejects.toThrow(DOMObserverErrors.ABORT)
				})

				it('Throws when events array is empty', async () => {
					await expect(() => instance.wait('#foo', { events: [] })).rejects.toThrow()
				})

				it('Rejects with [TARGET] error when selector is invalid', async () => {
					await expect(instance.wait('##invalid')).rejects.toThrow(DOMObserverErrors.TARGET)
				})

				it('Rejects with [TARGET] error when root selector is invalid', async () => {
					await expect(instance.wait('#foo', { root: '##invalid' })).rejects.toThrow(DOMObserverErrors.TARGET)
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

				it('Resolves when target is added within the root element', async () => {
					const root = document.createElement('div')
					document.body.appendChild(root)
					setTimeout(() => {
						const child = document.createElement('div')
						child.id = 'scoped'
						root.appendChild(child)
					}, 50)
					const { node } = await instance.wait('#scoped', { events: [DOMObserver.ADD], root })
					expect(node.id).toBe('scoped')
					root.remove()
				})

				it('Resolves when target is added within the root CSS selector', async () => {
					const root = document.createElement('div')
					root.id = 'root-scope'
					document.body.appendChild(root)
					setTimeout(() => {
						const child = document.createElement('div')
						child.id = 'scoped2'
						root.appendChild(child)
					}, 50)
					const { node } = await instance.wait('#scoped2', { events: [DOMObserver.ADD], root: '#root-scope' })
					expect(node.id).toBe('scoped2')
					root.remove()
				})

				it('Resolves immediately when filter passes for an existing element', async () => {
					const { node, event } = await instance.wait('#foo', { filter: () => true })
					expect(node).toEqual(el)
					expect(event).toBe(DOMObserver.EXIST)
				})

				it('Skips nodes rejected by filter and resolves on the first passing one', async () => {
					setTimeout(() => {
						document.body.appendChild(document.createElement('button'))
					}, 50)
					setTimeout(() => {
						const btn = document.createElement('button')
						btn.className = 'primary'
						document.body.appendChild(btn)
					}, 100)
					const { node } = await instance.wait('button', {
						events: [DOMObserver.ADD],
						filter: (n) => n.classList.contains('primary'),
					})
					expect(node.classList.contains('primary')).toBe(true)
				})

				it('Rejects with TIMEOUT when filter never passes', async () => {
					setTimeout(() => {
						document.body.appendChild(document.createElement('button'))
					}, 30)
					await expect(
						instance.wait('button', { events: [DOMObserver.ADD], filter: () => false, timeout: 80 })
					).rejects.toThrow(DOMObserverErrors.TIMEOUT)
				})

				it('Skips EXIST when filter returns false and resolves on next matching mutation', async () => {
					const btn = document.createElement('button')
					document.body.appendChild(btn)
					setTimeout(() => btn.setAttribute('data-ready', 'true'), 50)
					const { node } = await instance.wait('button', {
						events: [DOMObserver.EXIST, DOMObserver.CHANGE],
						filter: (n) => n.hasAttribute('data-ready'),
					})
					expect(node.getAttribute('data-ready')).toBe('true')
					btn.remove()
				})

				it('Passes ChangeOptions to filter for CHANGE events', async () => {
					const filter = vi.fn(() => true)
					setTimeout(() => _modifyElement('#foo', 'class', 'updated'), 50)
					await instance.wait('#foo', { events: [DOMObserver.CHANGE], filter })
					expect(filter).toHaveBeenCalledWith(el, DOMObserver.CHANGE, { attributeName: 'class', oldValue: 'bar' })
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

			it('Only fires for attributes in the filter list', async () => {
				instance.watch('#foo', onEvent, {
					events: [DOMObserver.CHANGE],
					attributeFilter: ['data-watched'],
				})
				_modifyElement('#foo', 'data-ignored', 'x')
				await _sleep()
				_modifyElement('#foo', 'data-watched', 'y')
				await _sleep()
				expect(onEvent).toHaveBeenCalledOnce()
				expect(onEvent).toHaveBeenCalledWith(el, DOMObserver.CHANGE, {
					attributeName: 'data-watched',
					oldValue: null,
				})
			})

			it('Only fires for mutations within the root element', async () => {
				const root = document.createElement('div')
				document.body.appendChild(root)
				const inside = document.createElement('div')
				inside.id = 'inside'
				instance.watch('#inside', onEvent, { events: [DOMObserver.ADD], root })
				root.appendChild(inside)
				await _sleep()
				expect(onEvent).toHaveBeenCalledOnce()
				root.remove()
			})

			it('Does not fire for mutations outside the root element', async () => {
				const root = document.createElement('div')
				document.body.appendChild(root)
				const outside = document.createElement('div')
				outside.id = 'outside'
				instance.watch('#outside', onEvent, { events: [DOMObserver.ADD], root })
				document.body.appendChild(outside)
				await _sleep()
				expect(onEvent).not.toHaveBeenCalled()
				outside.remove()
				root.remove()
			})

			it('Accepts a CSS selector as root', async () => {
				const root = document.createElement('div')
				root.id = 'watch-root'
				document.body.appendChild(root)
				const inside = document.createElement('div')
				inside.id = 'inside2'
				instance.watch('#inside2', onEvent, { events: [DOMObserver.ADD], root: '#watch-root' })
				root.appendChild(inside)
				await _sleep()
				expect(onEvent).toHaveBeenCalledOnce()
				root.remove()
			})

			it('Throws with [TARGET] error when root selector is invalid', () => {
				expect(() => instance.watch('#foo', onEvent, { root: '##invalid' })).toThrow(DOMObserverErrors.TARGET)
			})

			it('Respects root when observing CHANGE on an Element reference', async () => {
				const root = document.createElement('div')
				document.body.appendChild(root)
				const el = document.createElement('div')
				root.appendChild(el)
				const outside = document.createElement('div')
				document.body.appendChild(outside)
				instance.watch(el, onEvent, { events: [DOMObserver.CHANGE], root })
				outside.setAttribute('data-x', '1')
				await _sleep()
				expect(onEvent).not.toHaveBeenCalled()
				el.setAttribute('data-x', '1')
				await _sleep()
				expect(onEvent).toHaveBeenCalledOnce()
				outside.remove()
				root.remove()
			})

			it('Calls onEvent when filter passes', async () => {
				instance.watch('#foo', onEvent, { events: [DOMObserver.CHANGE], filter: () => true })
				_modifyElement('#foo', 'class', 'change1')
				await _sleep()
				expect(onEvent).toHaveBeenCalledOnce()
			})

			it('Does not call onEvent when filter returns false', async () => {
				instance.watch('#foo', onEvent, { events: [DOMObserver.CHANGE], filter: () => false })
				_modifyElement('#foo', 'class', 'change1')
				await _sleep()
				expect(onEvent).not.toHaveBeenCalled()
			})

			it('Does not fire EXIST when filter returns false for an existing element', () => {
				instance.watch('#foo', onEvent, { filter: () => false })
				expect(onEvent).not.toHaveBeenCalled()
			})

			it('Passes ChangeOptions to filter for CHANGE events', async () => {
				const filter = vi.fn(() => true)
				instance.watch('#foo', onEvent, { events: [DOMObserver.CHANGE], filter })
				_modifyElement('#foo', 'class', 'updated')
				await _sleep()
				expect(filter).toHaveBeenCalledWith(el, DOMObserver.CHANGE, { attributeName: 'class', oldValue: 'bar' })
			})

			it('Throws when events array is empty', () => {
				expect(() => instance.watch('#foo', onEvent, { events: [] })).toThrow(DOMObserverErrors.EVENTS)
			})

			it('Throws with [TARGET] error when selector is invalid', () => {
				expect(() => instance.watch('##invalid', onEvent)).toThrow(DOMObserverErrors.TARGET)
			})

			it('Rejects the pending wait() promise when watch() is called', async () => {
				const pending = instance.wait('#bar', { events: [DOMObserver.ADD] })
				instance.watch('#foo', onEvent)
				await expect(pending).rejects.toThrow(DOMObserverErrors.ABORT)
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
				expect((onError.mock.calls[0][0] as Error).message).toMatch(DOMObserverErrors.TIMEOUT)
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

			it('Fires onEvent only once when once is true', async () => {
				instance.watch('#foo', onEvent, { events: [DOMObserver.CHANGE], once: true })
				_modifyElement('#foo', 'class', 'change1')
				await _sleep()
				_modifyElement('#foo', 'class', 'change2')
				await _sleep()
				expect(onEvent).toHaveBeenCalledOnce()
			})

			it('Sets isObserving to false after the first event when once is true', async () => {
				instance.watch('#foo', onEvent, { events: [DOMObserver.CHANGE], once: true })
				_modifyElement('#foo', 'class', 'change1')
				await _sleep()
				expect(instance.isObserving).toBe(false)
			})

			it('Cancels timeout after the first event when once and timeout are both set', async () => {
				const onError = vi.fn()
				instance.watch('#foo', onEvent, { events: [DOMObserver.CHANGE], once: true, timeout: 200, onError })
				_modifyElement('#foo', 'class', 'change1')
				await _sleep()
				expect(onEvent).toHaveBeenCalledOnce()
				await _sleep(250)
				expect(onError).not.toHaveBeenCalled()
			})

			it('Fires onEvent once after a burst of mutations when debounce is set', async () => {
				instance.watch('#foo', onEvent, { events: [DOMObserver.CHANGE], debounce: 50 })
				_modifyElement('#foo', 'class', 'change1')
				_modifyElement('#foo', 'class', 'change2')
				_modifyElement('#foo', 'class', 'change3')
				await _sleep(150)
				expect(onEvent).toHaveBeenCalledOnce()
			})

			it('Forwards the last mutation arguments when debounce is set', async () => {
				instance.watch('#foo', onEvent, { events: [DOMObserver.CHANGE], debounce: 50 })
				_modifyElement('#foo', 'class', 'change1')
				_modifyElement('#foo', 'class', 'change2')
				await _sleep(150)
				expect(onEvent).toHaveBeenCalledWith(el, DOMObserver.CHANGE, {
					attributeName: 'class',
					oldValue: 'change1',
				})
			})

			it('Does not fire onEvent when clear() is called during the debounce period', async () => {
				instance.watch('#foo', onEvent, { events: [DOMObserver.CHANGE], debounce: 100 })
				_modifyElement('#foo', 'class', 'change1')
				instance.clear()
				await _sleep(200)
				expect(onEvent).not.toHaveBeenCalled()
			})

			it('Fires onEvent once and stops when debounce and once are both set', async () => {
				instance.watch('#foo', onEvent, { events: [DOMObserver.CHANGE], debounce: 50, once: true })
				_modifyElement('#foo', 'class', 'change1')
				_modifyElement('#foo', 'class', 'change2')
				await _sleep(150)
				expect(onEvent).toHaveBeenCalledOnce()
				expect(instance.isObserving).toBe(false)
			})

			it('Fires onError on timeout when no mutation occurs even with debounce set', async () => {
				const onError = vi.fn()
				instance.watch('#bar', onEvent, { events: [DOMObserver.ADD], timeout: 50, debounce: 200, onError })
				await _sleep(100)
				expect(onEvent).not.toHaveBeenCalled()
				expect(onError).toHaveBeenCalledOnce()
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

describe('DOMObserverErrors', () => {
	it('Exports expected error code values', () => {
		expect(DOMObserverErrors.TIMEOUT).toBe('[TIMEOUT]')
		expect(DOMObserverErrors.ABORT).toBe('[ABORT]')
		expect(DOMObserverErrors.EVENTS).toBe('[EVENTS]')
		expect(DOMObserverErrors.TARGET).toBe('[TARGET]')
	})
})
