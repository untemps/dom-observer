import { DOMObserverErrors } from './DOMObserverErrors'
import isElement from './utils/isElement'

/** A CSS selector string or a direct DOM Element reference used to identify the observed target. */
export type DOMTarget = Element | string

/** Union of all event types emitted by DOMObserver. */
export type DOMObserverEvent = 'DOMObserver_exist' | 'DOMObserver_add' | 'DOMObserver_remove' | 'DOMObserver_change'

/** Metadata attached to a `CHANGE` event, mirroring the relevant fields of `MutationRecord`. */
export interface ChangeOptions {
	/** Name of the attribute that changed. */
	attributeName: string | null
	/** Value of the attribute before the mutation. */
	oldValue: string | null
}

/**
 * Callback invoked by `watch()` whenever an observed event occurs.
 *
 * @param node - The matching DOM element.
 * @param event - The event type that fired.
 * @param options - Additional mutation metadata, present only for `CHANGE` events.
 */
export type OnEventCallback = (node: Element, event: DOMObserverEvent, options?: ChangeOptions) => void

/** Resolved value of the Promise returned by `wait()`. */
export interface WaitResult {
	/** The matching DOM element. */
	node: Element
	/** The event type that caused the Promise to settle. */
	event: DOMObserverEvent
	/** Additional mutation metadata, present only for `CHANGE` events. */
	options?: ChangeOptions
}

/** Options accepted by `wait()`. */
export interface WaitOptions {
	/** Event types to listen for. Defaults to all four event types. */
	events?: DOMObserverEvent[]
	/** Maximum time in milliseconds to wait before rejecting with a `[TIMEOUT]` error. `0` disables the timeout. */
	timeout?: number
	/** Restrict attribute observation to these attribute names. Passed directly to `MutationObserver.observe()`. */
	attributeFilter?: string[]
	/** When provided, aborting the signal rejects the Promise with an `AbortError`. */
	signal?: AbortSignal
}

/** Options accepted by `watch()`. */
export interface WatchOptions {
	/** Event types to listen for. Defaults to all four event types. */
	events?: DOMObserverEvent[]
	/** Restrict attribute observation to these attribute names. Passed directly to `MutationObserver.observe()`. */
	attributeFilter?: string[]
	/**
	 * Maximum time in milliseconds to wait for the first matching mutation before stopping observation.
	 * The timeout is cancelled as soon as any mutation fires. `0` disables the timeout.
	 */
	timeout?: number
	/** Called with a `[TIMEOUT]` error when the timeout elapses with no matching mutation. */
	onError?: (error: Error) => void
	/** When provided, aborting the signal stops observation immediately. */
	signal?: AbortSignal
}

class DOMObserver {
	/** Fired synchronously when the target element is already present in the DOM at observation time. */
	static EXIST = 'DOMObserver_exist' as const satisfies DOMObserverEvent
	/** Fired when the target element is added to the DOM. */
	static ADD = 'DOMObserver_add' as const satisfies DOMObserverEvent
	/** Fired when the target element is removed from the DOM. */
	static REMOVE = 'DOMObserver_remove' as const satisfies DOMObserverEvent
	/** Fired when an attribute of the target element changes. */
	static CHANGE = 'DOMObserver_change' as const satisfies DOMObserverEvent
	/** Convenience array containing all four event types, used as the default value for the `events` option. */
	static EVENTS: DOMObserverEvent[] = [DOMObserver.EXIST, DOMObserver.ADD, DOMObserver.REMOVE, DOMObserver.CHANGE]

	private _observer: MutationObserver | null = null
	private _pendingReject: ((error: Error | DOMException) => void) | null = null
	private _signal: AbortSignal | null = null
	private _abortHandler: (() => void) | null = null
	private _timeout: ReturnType<typeof setTimeout> | undefined = undefined

	/** `true` while an observation is active, `false` after `clear()` is called or the observation settles. */
	get isObserving(): boolean {
		return this._observer !== null
	}

	/**
	 * Observes the target once and returns a Promise that resolves with the first matching event.
	 *
	 * If the target already exists in the DOM and `EXIST` is among the requested events, the Promise
	 * resolves synchronously on the next microtask. The observer is automatically disconnected as soon
	 * as the Promise settles — whether by resolution, rejection, timeout, or abort.
	 *
	 * Calling `wait()` while a previous call is still pending rejects the previous Promise with `[ABORT]`
	 * and starts a fresh observation.
	 *
	 * @param target - CSS selector or Element to observe.
	 * @param options - Observation options.
	 * @returns A Promise that resolves with the matching node, event type, and optional change metadata.
	 * @throws `[EVENTS]` when the `events` array is empty.
	 * @throws `[TARGET]` when `target` is a string that is not a valid CSS selector.
	 */
	wait(
		target: DOMTarget,
		{ events = DOMObserver.EVENTS, timeout = 0, attributeFilter = undefined, signal = undefined }: WaitOptions = {}
	): Promise<WaitResult> {
		if (!events?.length) {
			return Promise.reject(new Error(`${DOMObserverErrors.EVENTS}: events array cannot be empty`))
		}

		if (signal?.aborted) {
			return Promise.reject(signal.reason ?? new DOMException('Aborted', 'AbortError'))
		}

		this._pendingReject?.(new Error(`${DOMObserverErrors.ABORT}: Observation replaced by a new wait() call`))
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

			this._pendingReject = cancel

			const callback: OnEventCallback = (node, event, options) =>
				settle(options ? { node, event, options } : { node, event })

			if (signal) {
				onAbort = () => cancel(signal.reason ?? new DOMException('Aborted', 'AbortError'))
				signal.addEventListener('abort', onAbort, { once: true })
			}

			if (timeout > 0) {
				this._timeout = setTimeout(
					() =>
						cancel(
							new Error(
								`${DOMObserverErrors.TIMEOUT}: Element ${target} cannot be found after ${timeout}ms`
							)
						),
					timeout
				)
			}

			this._observe(target, callback, { events, attributeFilter })
		}).finally(() => {
			this.clear()
		})
	}

	/**
	 * Observes the target continuously and invokes `onEvent` for every matching mutation.
	 *
	 * If the target already exists in the DOM and `EXIST` is among the requested events, `onEvent` is
	 * called synchronously before this method returns.
	 *
	 * Calling `watch()` while a previous `wait()` is still pending rejects that Promise with `[ABORT]`
	 * and starts a fresh observation.
	 *
	 * When `timeout` is set, the observation stops automatically after the first matching mutation —
	 * subsequent mutations will not fire `onEvent`.
	 *
	 * @param target - CSS selector or Element to observe.
	 * @param onEvent - Callback invoked on every matching event.
	 * @param options - Observation options.
	 * @returns The `DOMObserver` instance, allowing method chaining.
	 * @throws `[EVENTS]` when the `events` array is empty.
	 * @throws `[TARGET]` when `target` is a string that is not a valid CSS selector.
	 */
	watch(
		target: DOMTarget,
		onEvent: OnEventCallback,
		{
			events = DOMObserver.EVENTS,
			attributeFilter = undefined,
			timeout = 0,
			onError = undefined,
			signal = undefined,
		}: WatchOptions = {}
	): this {
		if (!events?.length) {
			throw new Error(`${DOMObserverErrors.EVENTS}: events array cannot be empty`)
		}

		if (signal?.aborted) {
			return this
		}

		this._pendingReject?.(new Error(`${DOMObserverErrors.ABORT}: Observation replaced by a new watch() call`))
		this._pendingReject = null
		this.clear()

		if (signal) {
			this._abortHandler = () => this.clear()
			this._signal = signal
			signal.addEventListener('abort', this._abortHandler, { once: true })
		}

		const callback: OnEventCallback =
			timeout > 0
				? (...args) => {
						clearTimeout(this._timeout)
						onEvent(...args)
					}
				: onEvent

		if (timeout > 0) {
			this._timeout = setTimeout(() => {
				this.clear()
				onError?.(
					new Error(`${DOMObserverErrors.TIMEOUT}: Element ${target} cannot be found after ${timeout}ms`)
				)
			}, timeout)
		}

		this._observe(target, callback, { events, attributeFilter })

		return this
	}

	private _observe(
		target: DOMTarget,
		callback: OnEventCallback,
		{ events, attributeFilter }: { events: DOMObserverEvent[]; attributeFilter?: string[] }
	): void {
		const hasExist = events.includes(DOMObserver.EXIST)
		const hasAdd = events.includes(DOMObserver.ADD)
		const hasRemove = events.includes(DOMObserver.REMOVE)
		const hasChange = events.includes(DOMObserver.CHANGE)

		let el: Element | null = isElement(target) ? target : null
		if (!el) {
			try {
				el = document.querySelector(target as string)
			} catch {
				throw new Error(`${DOMObserverErrors.TARGET}: "${target}" is not a valid CSS selector`)
			}
		}
		if (el && hasExist) {
			callback(el, DOMObserver.EXIST)
		}

		this._observer = new MutationObserver((mutations) => {
			mutations.forEach(({ type, target: targetNode, addedNodes, removedNodes, attributeName, oldValue }) => {
				if (type === 'childList' && (hasAdd || hasRemove)) {
					const notify = (node: Node, event: DOMObserverEvent) => {
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

		const observerTarget =
			hasChange && !hasAdd && !hasRemove && isElement(target) ? target : document.documentElement
		this._observer.observe(observerTarget, {
			subtree: observerTarget === document.documentElement,
			childList: hasAdd || hasRemove,
			attributes: hasChange,
			attributeOldValue: hasChange,
			attributeFilter,
		})
	}

	/**
	 * Stops the active observation and resets all internal state.
	 *
	 * Safe to call at any time — including when no observation is active.
	 *
	 * @returns The instance, enabling method chaining.
	 */
	clear(): this {
		if (this._signal && this._abortHandler) {
			this._signal.removeEventListener('abort', this._abortHandler)
		}
		this._signal = null
		this._abortHandler = null
		this._pendingReject = null
		this._observer?.disconnect()
		this._observer = null
		clearTimeout(this._timeout)
		return this
	}
}

export default DOMObserver
