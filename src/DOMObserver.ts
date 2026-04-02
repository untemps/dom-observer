import isElement from './utils/isElement'

export type DOMTarget = Element | string

export interface ChangeOptions {
	attributeName: string | null
	oldValue: string | null
}

export type OnEventCallback = (node: Element, event: string, options?: ChangeOptions) => void

export interface WaitResult {
	node: Element
	event: string
	options?: ChangeOptions
}

export interface WaitOptions {
	events?: string[]
	timeout?: number
	attributeFilter?: string[]
	onError?: (error: Error) => void
	signal?: AbortSignal
}

export interface WatchOptions {
	events?: string[]
	attributeFilter?: string[]
	signal?: AbortSignal
}

class DOMObserver {
	static EXIST = 'DOMObserver_exist' as const
	static ADD = 'DOMObserver_add' as const
	static REMOVE = 'DOMObserver_remove' as const
	static CHANGE = 'DOMObserver_change' as const
	static EVENTS: string[] = [DOMObserver.EXIST, DOMObserver.ADD, DOMObserver.REMOVE, DOMObserver.CHANGE]

	private _observer: MutationObserver | null = null
	private _pendingReject: ((error: Error | DOMException) => void) | null = null
	private _signal: AbortSignal | null = null
	private _abortHandler: (() => void) | null = null
	private _timeout: ReturnType<typeof setTimeout> | undefined = undefined

	get isObserving(): boolean {
		return this._observer !== null
	}

	wait(target: DOMTarget, onEvent?: null, options?: WaitOptions): Promise<WaitResult>
	wait(target: DOMTarget, onEvent: OnEventCallback, options?: WaitOptions): Promise<void>
	wait(
		target: DOMTarget,
		onEvent: OnEventCallback | null = null,
		{
			events = DOMObserver.EVENTS,
			timeout = 0,
			attributeFilter = undefined,
			onError = undefined,
			signal = undefined,
		}: WaitOptions = {}
	): Promise<unknown> {
		if (!events?.length) {
			return Promise.reject(new Error('[EVENTS]: events array cannot be empty'))
		}

		if (signal?.aborted) {
			return Promise.reject(signal.reason ?? new DOMException('Aborted', 'AbortError'))
		}

		this._pendingReject?.(new Error('[ABORT]: Observation replaced by a new wait() call'))
		this._pendingReject = null
		this.clear()

		return new Promise<WaitResult>((resolve, reject) => {
			let onAbort: (() => void) | null = null

			const cleanup = () => {
				if (onAbort) signal?.removeEventListener('abort', onAbort)
				this._pendingReject = null
			}
			const settle = (value: WaitResult) => {
				cleanup()
				resolve(value)
			}
			const cancel = (error: Error | DOMException) => {
				cleanup()
				reject(error)
			}

			if (!onEvent) this._pendingReject = cancel

			const callback: OnEventCallback =
				onEvent ?? ((node, event, options) => settle(options ? { node, event, options } : { node, event }))

			if (signal) {
				onAbort = () => {
					this.clear()
					if (!onEvent) cancel(signal.reason ?? new DOMException('Aborted', 'AbortError'))
				}
				signal.addEventListener('abort', onAbort, { once: true })
			}

			if (timeout > 0) {
				this._timeout = setTimeout(() => {
					this.clear()
					const error = new Error(`[TIMEOUT]: Element ${target} cannot be found after ${timeout}ms`)
					onEvent ? onError?.(error) : cancel(error)
				}, timeout)
			}

			this._observe(target, callback, { events, attributeFilter })
		})
	}

	watch(
		target: DOMTarget,
		onEvent: OnEventCallback,
		{ events = DOMObserver.EVENTS, attributeFilter = undefined, signal = undefined }: WatchOptions = {}
	): this {
		if (!events?.length) {
			throw new Error('[EVENTS]: events array cannot be empty')
		}

		if (signal?.aborted) {
			return this
		}

		this._pendingReject?.(new Error('[ABORT]: Observation replaced by a new watch() call'))
		this._pendingReject = null
		this.clear()

		if (signal) {
			this._abortHandler = () => this.clear()
			this._signal = signal
			signal.addEventListener('abort', this._abortHandler, { once: true })
		}

		this._observe(target, onEvent, { events, attributeFilter })

		return this
	}

	private _observe(
		target: DOMTarget,
		callback: OnEventCallback,
		{ events, attributeFilter }: { events: string[]; attributeFilter?: string[] }
	): void {
		const hasExist = events.includes(DOMObserver.EXIST)
		const hasAdd = events.includes(DOMObserver.ADD)
		const hasRemove = events.includes(DOMObserver.REMOVE)
		const hasChange = events.includes(DOMObserver.CHANGE)

		const el = isElement(target) ? target : document.querySelector(target as string)
		if (el && hasExist) {
			callback(el, DOMObserver.EXIST)
		}

		this._observer = new MutationObserver((mutations) => {
			mutations.forEach(({ type, target: targetNode, addedNodes, removedNodes, attributeName, oldValue }) => {
				if (type === 'childList' && (hasAdd || hasRemove)) {
					const notify = (node: Node, event: string) => {
						if (node === target || (!isElement(target) && (node as Element).matches?.(target as string))) {
							callback(node as Element, event)
						}
					}
					if (hasAdd) for (const node of addedNodes) notify(node, DOMObserver.ADD)
					if (hasRemove) for (const node of removedNodes) notify(node, DOMObserver.REMOVE)
				}
				if (type === 'attributes' && hasChange) {
					if (
						targetNode === target ||
						(!isElement(target) && (targetNode as Element).matches?.(target as string))
					) {
						callback(targetNode as Element, DOMObserver.CHANGE, { attributeName, oldValue })
					}
				}
			})
		})

		const observerTarget = hasChange && !hasAdd && !hasRemove && el ? el : document.documentElement
		this._observer.observe(observerTarget, {
			subtree: observerTarget === document.documentElement,
			childList: hasAdd || hasRemove,
			attributes: hasChange,
			attributeOldValue: hasChange,
			attributeFilter,
		})
	}

	clear(): void {
		if (this._signal && this._abortHandler) {
			this._signal.removeEventListener('abort', this._abortHandler)
		}
		this._signal = null
		this._abortHandler = null
		this._pendingReject = null
		this._observer?.disconnect()
		clearTimeout(this._timeout)
	}
}

export default DOMObserver
