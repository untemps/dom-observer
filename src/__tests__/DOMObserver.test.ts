import {
	type ChangeOptions,
	type ChangePayload,
	createDOMObserver,
	DOMObserverEvent,
	type DOMObserverInstance,
	type DOMTarget,
	type EventPayload,
	InvalidEventsError,
	InvalidOptionsError,
	InvalidTargetError,
	InvalidTimeoutError,
	ObservationAbortedError,
	type OnEventCallback,
	TimeoutError,
} from '../index'

describe('createDOMObserver', () => {
	let instance: DOMObserverInstance
	let node: HTMLElement
	let onEvent: ReturnType<typeof vi.fn<OnEventCallback>>

	beforeEach(() => {
		instance = createDOMObserver()
	})

	afterEach(() => {
		instance.disconnect()

		document.body.innerHTML = ''
	})

	it('Creates an instance with no error', () => {
		expect(() => createDOMObserver()).not.toThrow()
	})

	it('Returns independent instances', () => {
		const a = createDOMObserver()
		const b = createDOMObserver()
		a.observe('#foo', vi.fn())
		expect(a.isObserving).toBe(true)
		expect(b.isObserving).toBe(false)
		a.disconnect()
	})

	describe('observeOnce', () => {
		describe('A promise is resolved as soon as an event occurs', () => {
			describe('Element is already created and mounted in the DOM', () => {
				beforeEach(() => {
					node = _createElement('foo')
				})

				it('Observes an element to be added', async () => {
					const { node: foundNode, event } = await instance.observeOnce('#foo')
					expect(foundNode).toEqual(node)
					expect(event).toBe(DOMObserverEvent.EXIST)
				})

				it('Observes an element to be removed', async () => {
					setTimeout(() => {
						_removeElement('#foo')
					}, 100)
					const { node: foundNode, event } = await instance.observeOnce('#foo', {
						events: [DOMObserverEvent.REMOVE],
					})
					expect(foundNode).toEqual(node)
					expect(event).toBe(DOMObserverEvent.REMOVE)
				})

				it('Observes an element to be modified', async () => {
					setTimeout(() => {
						_modifyElement('#foo', 'class', 'gag')
					}, 100)
					const {
						node: foundNode,
						event,
						options: { attributeName, oldValue } = {},
					} = await instance.observeOnce('#foo', {
						events: [DOMObserverEvent.CHANGE],
					})
					expect(foundNode).toEqual(node)
					expect(event).toBe(DOMObserverEvent.CHANGE)
					expect(attributeName).toBe('class')
					expect(oldValue).toBe('bar')
				})

				it('Resolves only when a filtered attribute changes', async () => {
					setTimeout(() => {
						_modifyElement('#foo', 'data-ignored', 'x')
						_modifyElement('#foo', 'data-observed', 'y')
					}, 50)
					const { options } = await instance.observeOnce('#foo', {
						events: [DOMObserverEvent.CHANGE],
						attributeFilter: ['data-observed'],
					})
					expect(options?.attributeName).toBe('data-observed')
				})

				it('Rejects promise when an element is not found after timeout is elapsed', async () => {
					await expect(
						instance.observeOnce('#bar', { events: [DOMObserverEvent.ADD], timeout: 50 })
					).rejects.toThrow(TimeoutError)
				})

				it('Rejects the pending promise when observeOnce() is called again', async () => {
					const first = instance.observeOnce('#bar', { events: [DOMObserverEvent.ADD] })
					instance.observeOnce('#baz', { events: [DOMObserverEvent.ADD] })
					await expect(first).rejects.toThrow(ObservationAbortedError)
				})

				it('Throws when events array is empty', async () => {
					await expect(() => instance.observeOnce('#foo', { events: [] })).rejects.toThrow(InvalidEventsError)
				})

				it.each([
					[-1],
					[NaN],
					[Infinity],
					[-Infinity],
				])('Rejects with InvalidTimeoutError when timeout is %s', async (value) => {
					await expect(instance.observeOnce('#foo', { timeout: value })).rejects.toThrow(InvalidTimeoutError)
				})

				it('Rejects with InvalidTargetError when selector is invalid', async () => {
					await expect(instance.observeOnce('##invalid')).rejects.toThrow(InvalidTargetError)
				})

				it('Rejects with InvalidTargetError when root selector is invalid', async () => {
					await expect(instance.observeOnce('#foo', { root: '##invalid' })).rejects.toThrow(
						InvalidTargetError
					)
				})

				it('Rejects immediately when signal is already aborted', async () => {
					const controller = new AbortController()
					controller.abort()
					await expect(instance.observeOnce('#foo', { signal: controller.signal })).rejects.toMatchObject({
						name: 'AbortError',
					})
				})

				it('Rejects and disconnects when signal is aborted during observation', async () => {
					const controller = new AbortController()
					const promise = instance.observeOnce('#bar', {
						events: [DOMObserverEvent.ADD],
						signal: controller.signal,
					})
					setTimeout(() => controller.abort(), 50)
					await expect(promise).rejects.toMatchObject({ name: 'AbortError' })
				})

				it('Sets isObserving to false after the promise resolves', async () => {
					await instance.observeOnce('#foo')
					expect(instance.isObserving).toBe(false)
				})

				it('Sets isObserving to false synchronously before .then() handler runs', async () => {
					let observingInThen: boolean | undefined
					await instance.observeOnce('#foo').then(() => {
						observingInThen = instance.isObserving
					})
					expect(observingInThen).toBe(false)
				})

				it('Calling disconnect() after observeOnce() resolves is a no-op', async () => {
					await instance.observeOnce('#foo')
					expect(() => instance.disconnect()).not.toThrow()
					expect(instance.isObserving).toBe(false)
				})

				it('Does not disconnect a subsequent observe() when timeout was set', async () => {
					await instance.observeOnce('#foo', { timeout: 100 })
					instance.observe('#foo', vi.fn<OnEventCallback>(), { events: [DOMObserverEvent.CHANGE] })
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
					const { node } = await instance.observeOnce('#scoped', { events: [DOMObserverEvent.ADD], root })
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
					const { node } = await instance.observeOnce('#scoped2', {
						events: [DOMObserverEvent.ADD],
						root: '#root-scope',
					})
					expect(node.id).toBe('scoped2')
					root.remove()
				})

				it('Resolves immediately when filter passes for an existing element', async () => {
					const { node: foundNode, event } = await instance.observeOnce('#foo', { filter: () => true })
					expect(foundNode).toEqual(node)
					expect(event).toBe(DOMObserverEvent.EXIST)
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
					const { node } = await instance.observeOnce('button', {
						events: [DOMObserverEvent.ADD],
						filter: ({ node }) => node.classList.contains('primary'),
					})
					expect(node.classList.contains('primary')).toBe(true)
				})

				it('Rejects with TimeoutError when filter never passes', async () => {
					setTimeout(() => {
						document.body.appendChild(document.createElement('button'))
					}, 30)
					await expect(
						instance.observeOnce('button', {
							events: [DOMObserverEvent.ADD],
							filter: () => false,
							timeout: 80,
						})
					).rejects.toThrow(TimeoutError)
				})

				it('Skips EXIST when filter returns false and resolves on next matching mutation', async () => {
					const btn = document.createElement('button')
					document.body.appendChild(btn)
					setTimeout(() => btn.setAttribute('data-ready', 'true'), 50)
					const { node } = await instance.observeOnce('button', {
						events: [DOMObserverEvent.EXIST, DOMObserverEvent.CHANGE],
						filter: ({ node }) => node.hasAttribute('data-ready'),
					})
					expect(node.getAttribute('data-ready')).toBe('true')
					btn.remove()
				})

				it('Passes ChangeOptions to filter for CHANGE events', async () => {
					const filter = vi.fn(() => true)
					setTimeout(() => _modifyElement('#foo', 'class', 'updated'), 50)
					await instance.observeOnce('#foo', { events: [DOMObserverEvent.CHANGE], filter })
					expect(filter).toHaveBeenCalledWith({
						node,
						event: DOMObserverEvent.CHANGE,
						options: {
							attributeName: 'class',
							oldValue: 'bar',
						},
					})
				})

				it('Leaves result.target undefined for a single-target call', async () => {
					const { target } = await instance.observeOnce('#foo')
					expect(target).toBeUndefined()
				})
			})

			describe('Element creation and mounting are delayed', () => {
				it('Observes an element to be added', async () => {
					setTimeout(() => {
						node = _createElement('foo')
					}, 100)
					const { node: foundNode, event } = await instance.observeOnce('#foo')
					expect(foundNode).toEqual(node)
					expect(event).toBe(DOMObserverEvent.ADD)
				})
			})
		})

		describe('Multiple targets', () => {
			beforeEach(() => {
				node = _createElement('foo')
			})

			it('Resolves on EXIST for the first target found in the DOM', async () => {
				const { node: foundNode, event, target } = await instance.observeOnce(['#foo', '#bar'])
				expect(foundNode).toEqual(node)
				expect(event).toBe(DOMObserverEvent.EXIST)
				expect(target).toBe('#foo')
			})

			it('Resolves on EXIST for the second target when the first is absent', async () => {
				const second = document.createElement('div')
				second.id = 'second'
				document.body.appendChild(second)
				const { node, target } = await instance.observeOnce(['#missing', '#second'])
				expect(node.id).toBe('second')
				expect(target).toBe('#second')
				second.remove()
			})

			it('Resolves on ADD for whichever target is added first', async () => {
				setTimeout(() => {
					const div = document.createElement('div')
					div.id = 'winner'
					document.body.appendChild(div)
				}, 50)
				const { node, target } = await instance.observeOnce(['#winner', '#loser'], {
					events: [DOMObserverEvent.ADD],
				})
				expect(node.id).toBe('winner')
				expect(target).toBe('#winner')
			})

			it('Resolves on ADD for the second target when it fires first', async () => {
				setTimeout(() => {
					const div = document.createElement('div')
					div.id = 'second-wins'
					document.body.appendChild(div)
				}, 50)
				const { node, target } = await instance.observeOnce(['#first-never', '#second-wins'], {
					events: [DOMObserverEvent.ADD],
				})
				expect(node.id).toBe('second-wins')
				expect(target).toBe('#second-wins')
			})

			it('Rejects with InvalidTargetError when any target selector is invalid', async () => {
				await expect(instance.observeOnce(['#foo', '##invalid'])).rejects.toThrow(InvalidTargetError)
			})

			it('Rejects with TimeoutError when no target matches within the time limit', async () => {
				await expect(
					instance.observeOnce(['#missing1', '#missing2'], { events: [DOMObserverEvent.ADD], timeout: 50 })
				).rejects.toThrow(TimeoutError)
			})

			it('Rejects with AbortError when signal is aborted during multi-target observation', async () => {
				const controller = new AbortController()
				const promise = instance.observeOnce(['#missing1', '#missing2'], {
					events: [DOMObserverEvent.ADD],
					signal: controller.signal,
				})
				setTimeout(() => controller.abort(), 50)
				await expect(promise).rejects.toMatchObject({ name: 'AbortError' })
			})

			it('Resolves on REMOVE for the matching target', async () => {
				const second = document.createElement('div')
				second.id = 'removable'
				document.body.appendChild(second)
				setTimeout(() => second.remove(), 50)
				const { node, target } = await instance.observeOnce(['#foo', '#removable'], {
					events: [DOMObserverEvent.REMOVE],
				})
				expect(node.id).toBe('removable')
				expect(target).toBe('#removable')
			})

			it('Resolves on CHANGE for the matching target', async () => {
				const second = document.createElement('div')
				second.id = 'changeable'
				document.body.appendChild(second)
				setTimeout(() => second.setAttribute('data-x', '1'), 50)
				const { node, target } = await instance.observeOnce(['#foo', '#changeable'], {
					events: [DOMObserverEvent.CHANGE],
				})
				expect(node.id).toBe('changeable')
				expect(target).toBe('#changeable')
				second.remove()
			})

			it('Respects filter across multi-target ADD events', async () => {
				let callCount = 0
				setTimeout(() => {
					const div = document.createElement('div')
					div.id = 'filtered-a'
					document.body.appendChild(div)
				}, 20)
				setTimeout(() => {
					const div = document.createElement('div')
					div.id = 'filtered-b'
					document.body.appendChild(div)
				}, 50)
				const { node, target } = await instance.observeOnce(['#filtered-a', '#filtered-b'], {
					events: [DOMObserverEvent.ADD],
					filter: ({ node }) => {
						callCount++
						return node.id === 'filtered-b'
					},
				})
				expect(node.id).toBe('filtered-b')
				expect(target).toBe('#filtered-b')
				expect(callCount).toBeGreaterThanOrEqual(2)
			})
		})
	})

	describe('observe', () => {
		beforeEach(() => {
			onEvent = vi.fn<OnEventCallback>()
		})

		describe('Element is already created and mounted in the DOM', () => {
			beforeEach(() => {
				node = _createElement('foo')
			})

			it('Triggers onEvent immediately with EXIST when element is present', () => {
				instance.observe('#foo', onEvent)
				expect(onEvent).toHaveBeenCalledWith({ node, event: DOMObserverEvent.EXIST })
			})

			it('Accepts an Element reference as target', () => {
				instance.observe(node, onEvent)
				expect(onEvent).toHaveBeenCalledWith({ node, event: DOMObserverEvent.EXIST })
			})

			it('Triggers onEvent on every successive attribute change', async () => {
				instance.observe('#foo', onEvent, { events: [DOMObserverEvent.CHANGE] })
				_modifyElement('#foo', 'class', 'change1')
				await _sleep()
				_modifyElement('#foo', 'class', 'change2')
				await _sleep()
				expect(onEvent).toHaveBeenCalledTimes(2)
				expect(onEvent).toHaveBeenNthCalledWith(1, {
					node,
					event: DOMObserverEvent.CHANGE,
					options: {
						attributeName: 'class',
						oldValue: 'bar',
					},
				})
				expect(onEvent).toHaveBeenNthCalledWith(2, {
					node,
					event: DOMObserverEvent.CHANGE,
					options: {
						attributeName: 'class',
						oldValue: 'change1',
					},
				})
			})

			it('Triggers onEvent for each matching added and removed node', async () => {
				instance.observe('.item', onEvent, { events: [DOMObserverEvent.ADD, DOMObserverEvent.REMOVE] })
				const nodeA = _createElementWithClass('item')
				const nodeB = _createElementWithClass('item')
				await _sleep()
				expect(onEvent).toHaveBeenCalledTimes(2)
				expect(onEvent).toHaveBeenCalledWith({ node: nodeA, event: DOMObserverEvent.ADD })
				expect(onEvent).toHaveBeenCalledWith({ node: nodeB, event: DOMObserverEvent.ADD })
				document.body.removeChild(nodeA)
				await _sleep()
				expect(onEvent).toHaveBeenCalledWith({ node: nodeA, event: DOMObserverEvent.REMOVE })
				expect(onEvent).toHaveBeenCalledTimes(3)
			})

			it('Fires CHANGE for all elements matching a class selector, not just the first', async () => {
				const nodeA = _createElementWithClass('item')
				const nodeB = _createElementWithClass('item')
				instance.observe('.item', onEvent, { events: [DOMObserverEvent.CHANGE] })
				nodeA.setAttribute('data-x', '1')
				await _sleep()
				nodeB.setAttribute('data-x', '2')
				await _sleep()
				expect(onEvent).toHaveBeenCalledTimes(2)
				expect(onEvent).toHaveBeenCalledWith({
					node: nodeA,
					event: DOMObserverEvent.CHANGE,
					options: { attributeName: 'data-x', oldValue: null },
				})
				expect(onEvent).toHaveBeenCalledWith({
					node: nodeB,
					event: DOMObserverEvent.CHANGE,
					options: { attributeName: 'data-x', oldValue: null },
				})
			})

			it('Only fires for attributes in the filter list', async () => {
				instance.observe('#foo', onEvent, {
					events: [DOMObserverEvent.CHANGE],
					attributeFilter: ['data-observed'],
				})
				_modifyElement('#foo', 'data-ignored', 'x')
				await _sleep()
				_modifyElement('#foo', 'data-observed', 'y')
				await _sleep()
				expect(onEvent).toHaveBeenCalledOnce()
				expect(onEvent).toHaveBeenCalledWith({
					node,
					event: DOMObserverEvent.CHANGE,
					options: {
						attributeName: 'data-observed',
						oldValue: null,
					},
				})
			})

			it('Only fires for mutations within the root element', async () => {
				const root = document.createElement('div')
				document.body.appendChild(root)
				const inside = document.createElement('div')
				inside.id = 'inside'
				instance.observe('#inside', onEvent, { events: [DOMObserverEvent.ADD], root })
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
				instance.observe('#outside', onEvent, { events: [DOMObserverEvent.ADD], root })
				document.body.appendChild(outside)
				await _sleep()
				expect(onEvent).not.toHaveBeenCalled()
				outside.remove()
				root.remove()
			})

			it('Accepts a CSS selector as root', async () => {
				const root = document.createElement('div')
				root.id = 'observe-root'
				document.body.appendChild(root)
				const inside = document.createElement('div')
				inside.id = 'inside2'
				instance.observe('#inside2', onEvent, { events: [DOMObserverEvent.ADD], root: '#watch-root' })
				root.appendChild(inside)
				await _sleep()
				expect(onEvent).toHaveBeenCalledOnce()
				root.remove()
			})

			it('Throws InvalidTargetError when root selector is invalid', () => {
				expect(() => instance.observe('#foo', onEvent, { root: '##invalid' })).toThrow(InvalidTargetError)
			})

			it('Respects root when observing CHANGE on an Element reference', async () => {
				const root = document.createElement('div')
				document.body.appendChild(root)
				const observedNode = document.createElement('div')
				root.appendChild(observedNode)
				const outside = document.createElement('div')
				document.body.appendChild(outside)
				instance.observe(observedNode, onEvent, { events: [DOMObserverEvent.CHANGE], root })
				outside.setAttribute('data-x', '1')
				await _sleep()
				expect(onEvent).not.toHaveBeenCalled()
				observedNode.setAttribute('data-x', '1')
				await _sleep()
				expect(onEvent).toHaveBeenCalledOnce()
				outside.remove()
				root.remove()
			})

			it('Calls onEvent when filter passes', async () => {
				instance.observe('#foo', onEvent, { events: [DOMObserverEvent.CHANGE], filter: () => true })
				_modifyElement('#foo', 'class', 'change1')
				await _sleep()
				expect(onEvent).toHaveBeenCalledOnce()
			})

			it('Does not call onEvent when filter returns false', async () => {
				instance.observe('#foo', onEvent, { events: [DOMObserverEvent.CHANGE], filter: () => false })
				_modifyElement('#foo', 'class', 'change1')
				await _sleep()
				expect(onEvent).not.toHaveBeenCalled()
			})

			it('Does not fire EXIST when filter returns false for an existing element', () => {
				instance.observe('#foo', onEvent, { filter: () => false })
				expect(onEvent).not.toHaveBeenCalled()
			})

			it('Passes ChangeOptions to filter for CHANGE events', async () => {
				const filter = vi.fn(() => true)
				instance.observe('#foo', onEvent, { events: [DOMObserverEvent.CHANGE], filter })
				_modifyElement('#foo', 'class', 'updated')
				await _sleep()
				expect(filter).toHaveBeenCalledWith({
					node,
					event: DOMObserverEvent.CHANGE,
					options: { attributeName: 'class', oldValue: 'bar' },
				})
			})

			it('Does not fire for ADD events rejected by filter', async () => {
				const inside = document.createElement('div')
				inside.id = 'allowed'
				instance.observe('div', onEvent, {
					events: [DOMObserverEvent.ADD],
					filter: ({ node }) => node.id === 'allowed',
				})
				document.body.appendChild(document.createElement('div'))
				await _sleep()
				expect(onEvent).not.toHaveBeenCalled()
				document.body.appendChild(inside)
				await _sleep()
				expect(onEvent).toHaveBeenCalledOnce()
				inside.remove()
			})

			it('Does not fire once when filter blocks all events', async () => {
				instance.observe('#foo', onEvent, {
					events: [DOMObserverEvent.CHANGE],
					once: true,
					filter: () => false,
				})
				_modifyElement('#foo', 'class', 'change1')
				await _sleep()
				expect(onEvent).not.toHaveBeenCalled()
				expect(instance.isObserving).toBe(true)
			})

			it('Fires once and stops when filter passes', async () => {
				instance.observe('#foo', onEvent, { events: [DOMObserverEvent.CHANGE], once: true, filter: () => true })
				_modifyElement('#foo', 'class', 'change1')
				await _sleep()
				expect(onEvent).toHaveBeenCalledOnce()
				expect(instance.isObserving).toBe(false)
			})

			it('Throws when events array is empty', () => {
				expect(() => instance.observe('#foo', onEvent, { events: [] })).toThrow(InvalidEventsError)
			})

			it.each([
				[-1],
				[NaN],
				[Infinity],
				[-Infinity],
			])('Throws InvalidTimeoutError when timeout is %s', (value) => {
				expect(() => instance.observe('#foo', onEvent, { timeout: value })).toThrow(InvalidTimeoutError)
			})

			it('Throws InvalidTargetError when selector is invalid', () => {
				expect(() => instance.observe('##invalid', onEvent)).toThrow(InvalidTargetError)
			})

			it('Rejects the pending observeOnce() promise when observe() is called', async () => {
				const pending = instance.observeOnce('#bar', { events: [DOMObserverEvent.ADD] })
				instance.observe('#foo', onEvent)
				await expect(pending).rejects.toThrow(ObservationAbortedError)
			})

			it('Returns the instance for chaining', () => {
				const result = instance.observe('#foo', onEvent)
				expect(result).toBe(instance)
			})

			it('Does nothing when signal is already aborted', () => {
				const controller = new AbortController()
				controller.abort()
				instance.observe('#foo', onEvent, { signal: controller.signal })
				expect(onEvent).not.toHaveBeenCalled()
				expect(instance.isObserving).toBe(false)
			})

			it('Stops observation when signal is aborted', async () => {
				const controller = new AbortController()
				instance.observe('#foo', onEvent, { events: [DOMObserverEvent.CHANGE], signal: controller.signal })
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
				instance.observe('#bar', onEvent, { events: [DOMObserverEvent.ADD], timeout: 50, onError })
				await _sleep(100)
				expect(onEvent).not.toHaveBeenCalled()
				expect(onError).toHaveBeenCalledOnce()
				expect(onError.mock.calls[0][0]).toBeInstanceOf(TimeoutError)
			})

			it('Does not call onError when a mutation occurs before timeout', async () => {
				const onError = vi.fn()
				instance.observe('#foo', onEvent, { events: [DOMObserverEvent.CHANGE], timeout: 200, onError })
				_modifyElement('#foo', 'class', 'change1')
				await _sleep()
				expect(onEvent).toHaveBeenCalledOnce()
				await _sleep(250)
				expect(onError).not.toHaveBeenCalled()
			})

			it('Stops observation after timeout elapses', async () => {
				const onError = vi.fn()
				instance.observe('#foo', onEvent, { events: [DOMObserverEvent.CHANGE], timeout: 50, onError })
				await _sleep(100)
				expect(instance.isObserving).toBe(false)
			})

			it('Fires onEvent only once when once is true', async () => {
				instance.observe('#foo', onEvent, { events: [DOMObserverEvent.CHANGE], once: true })
				_modifyElement('#foo', 'class', 'change1')
				await _sleep()
				_modifyElement('#foo', 'class', 'change2')
				await _sleep()
				expect(onEvent).toHaveBeenCalledOnce()
			})

			it('Sets isObserving to false after the first event when once is true', async () => {
				instance.observe('#foo', onEvent, { events: [DOMObserverEvent.CHANGE], once: true })
				_modifyElement('#foo', 'class', 'change1')
				await _sleep()
				expect(instance.isObserving).toBe(false)
			})

			it('Cancels timeout after the first event when once and timeout are both set', async () => {
				const onError = vi.fn()
				instance.observe('#foo', onEvent, {
					events: [DOMObserverEvent.CHANGE],
					once: true,
					timeout: 200,
					onError,
				})
				_modifyElement('#foo', 'class', 'change1')
				await _sleep()
				expect(onEvent).toHaveBeenCalledOnce()
				await _sleep(250)
				expect(onError).not.toHaveBeenCalled()
			})

			it('Fires onEvent once after a burst of mutations when debounce is set', async () => {
				instance.observe('#foo', onEvent, { events: [DOMObserverEvent.CHANGE], debounce: 50 })
				_modifyElement('#foo', 'class', 'change1')
				_modifyElement('#foo', 'class', 'change2')
				_modifyElement('#foo', 'class', 'change3')
				await _sleep(150)
				expect(onEvent).toHaveBeenCalledOnce()
			})

			it('Forwards the last mutation arguments when debounce is set', async () => {
				instance.observe('#foo', onEvent, { events: [DOMObserverEvent.CHANGE], debounce: 50 })
				_modifyElement('#foo', 'class', 'change1')
				_modifyElement('#foo', 'class', 'change2')
				await _sleep(150)
				expect(onEvent).toHaveBeenCalledWith({
					node,
					event: DOMObserverEvent.CHANGE,
					options: {
						attributeName: 'class',
						oldValue: 'change1',
					},
				})
			})

			it('Does not fire onEvent when disconnect() is called during the debounce period', async () => {
				instance.observe('#foo', onEvent, { events: [DOMObserverEvent.CHANGE], debounce: 100 })
				_modifyElement('#foo', 'class', 'change1')
				instance.disconnect()
				await _sleep(200)
				expect(onEvent).not.toHaveBeenCalled()
			})

			it('Fires onEvent once and stops when debounce and once are both set', async () => {
				instance.observe('#foo', onEvent, { events: [DOMObserverEvent.CHANGE], debounce: 50, once: true })
				_modifyElement('#foo', 'class', 'change1')
				_modifyElement('#foo', 'class', 'change2')
				await _sleep(150)
				expect(onEvent).toHaveBeenCalledOnce()
				expect(instance.isObserving).toBe(false)
			})

			it('Fires onError on timeout when no mutation occurs even with debounce set', async () => {
				const onError = vi.fn()
				instance.observe('#bar', onEvent, {
					events: [DOMObserverEvent.ADD],
					timeout: 50,
					debounce: 200,
					onError,
				})
				await _sleep(100)
				expect(onEvent).not.toHaveBeenCalled()
				expect(onError).toHaveBeenCalledOnce()
			})
		})

		describe('Element creation and mounting are delayed', () => {
			it('Triggers onEvent when element is added', async () => {
				instance.observe('#foo', onEvent)
				node = _createElement('foo')
				await _sleep()
				expect(onEvent).toHaveBeenCalledWith({ node, event: DOMObserverEvent.ADD })
			})
		})
	})

	describe('disconnect', () => {
		it('Returns the instance for chaining', () => {
			expect(instance.disconnect()).toBe(instance)
		})
	})
})

describe('EventPayload type narrowing', () => {
	let instance: DOMObserverInstance

	beforeEach(() => {
		instance = createDOMObserver()
	})

	afterEach(() => {
		instance.disconnect()
		document.body.innerHTML = ''
	})

	it('options is ChangeOptions (not undefined) for CHANGE events', async () => {
		_createElement('foo')
		setTimeout(() => _modifyElement('#foo', 'data-x', 'new'), 50)

		await new Promise<void>((resolve) => {
			instance.observe(
				'#foo',
				({ event, options }) => {
					if (event === DOMObserverEvent.CHANGE) {
						expectTypeOf(options).toEqualTypeOf<ChangeOptions>()
						expect(options.attributeName).toBe('data-x')
						resolve()
					}
				},
				{ events: [DOMObserverEvent.CHANGE] }
			)
		})
	})

	it('options is absent for non-CHANGE events', async () => {
		const captured: EventPayload[] = []

		instance.observe('#foo', (payload) => captured.push(payload), { events: [DOMObserverEvent.ADD] })

		_createElement('foo')
		await _sleep()

		expect(captured).toHaveLength(1)
		expect(captured[0].event).toBe(DOMObserverEvent.ADD)
		expect(captured[0].options).toBeUndefined()
	})

	it('observeOnce() resolves ChangePayload with options typed as ChangeOptions after CHANGE guard', async () => {
		_createElement('foo')
		setTimeout(() => _modifyElement('#foo', 'class', 'updated'), 50)

		const result = await instance.observeOnce('#foo', { events: [DOMObserverEvent.CHANGE] })

		expect(result.event).toBe(DOMObserverEvent.CHANGE)
		if (result.event === DOMObserverEvent.CHANGE) {
			expectTypeOf(result).toEqualTypeOf<ChangePayload & { target?: DOMTarget }>()
			expect(result.options.attributeName).toBe('class')
		}
	})
})

describe('Error classes', () => {
	it('TimeoutError exposes target and timeout properties', () => {
		const err = new TimeoutError('#foo', 500)
		expect(err).toBeInstanceOf(TimeoutError)
		expect(err.name).toBe('TimeoutError')
		expect(err.target).toBe('#foo')
		expect(err.timeout).toBe(500)
	})

	it('TimeoutError formats selector targets in message', () => {
		const err = new TimeoutError('#foo', 500)
		expect(err.message).toBe('#foo could not be found after 500ms')
	})

	it('TimeoutError formats Element targets in message', () => {
		const el = document.createElement('div')
		el.id = 'bar'
		const err = new TimeoutError(el, 300)
		expect(err.message).toBe('<div#bar> could not be found after 300ms')
		expect(err.target).toBe(el)
	})

	it('TimeoutError handles array targets', () => {
		const err = new TimeoutError(['#a', '#b'], 200)
		expect(err.target).toEqual(['#a', '#b'])
		expect(err.message).toBe('None of [#a, #b] could not be found after 200ms')
	})

	it('ObservationAbortedError has correct name', () => {
		const err = new ObservationAbortedError('test reason')
		expect(err).toBeInstanceOf(ObservationAbortedError)
		expect(err.name).toBe('ObservationAbortedError')
		expect(err.message).toBe('test reason')
	})

	it('InvalidEventsError has correct name', () => {
		const err = new InvalidEventsError()
		expect(err).toBeInstanceOf(InvalidEventsError)
		expect(err.name).toBe('InvalidEventsError')
	})

	it('InvalidTargetError exposes selector property', () => {
		const err = new InvalidTargetError('##bad')
		expect(err).toBeInstanceOf(InvalidTargetError)
		expect(err.name).toBe('InvalidTargetError')
		expect(err.selector).toBe('##bad')
	})

	it('InvalidOptionsError is a generic base with custom message', () => {
		const err = new InvalidOptionsError('Some option is invalid')
		expect(err).toBeInstanceOf(InvalidOptionsError)
		expect(err.name).toBe('InvalidOptionsError')
		expect(err.message).toBe('Some option is invalid')
	})

	it('InvalidTimeoutError has correct name and baked-in message', () => {
		const err = new InvalidTimeoutError()
		expect(err).toBeInstanceOf(InvalidTimeoutError)
		expect(err.name).toBe('InvalidTimeoutError')
		expect(err.message).toBe('Timeout must be 0 or a positive finite number')
	})

	it('InvalidTimeoutError is an instance of InvalidOptionsError', () => {
		const err = new InvalidTimeoutError()
		expect(err).toBeInstanceOf(InvalidOptionsError)
	})
})
