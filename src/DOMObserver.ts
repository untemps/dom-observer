import { InvalidEventsError, InvalidTimeoutError, ObservationAbortedError, TimeoutError } from './DOMObserverErrors'
import type { DOMTarget } from './types'
import isElement from './utils/isElement'
import resolveDOMTarget from './utils/resolveDOMTarget'

export type { DOMTarget }

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

/**
 * Predicate called before invoking the event callback. Return `true` to let the event through,
 * `false` to skip it. Receives the same arguments as `OnEventCallback`.
 */
export type FilterCallback = (node: Element, event: DOMObserverEvent, options?: ChangeOptions) => boolean

/** Resolved value of the Promise returned by `wait()`. */
export interface WaitResult {
	/** The matching DOM element. */
	node: Element
	/** The event type that caused the Promise to settle. */
	event: DOMObserverEvent
	/** Additional mutation metadata, present only for `CHANGE` events. */
	options?: ChangeOptions
	/** The target entry that triggered the match. Only populated when `wait()` was called with an array of targets. */
	target?: DOMTarget
}

/** Options accepted by `wait()`. */
export interface WaitOptions {
	/** Event types to listen for. Defaults to all four event types. */
	events?: DOMObserverEvent[]
	/** Maximum time in milliseconds to wait before rejecting with a `TimeoutError`. `0` disables the timeout. Must be `0` or a positive finite number — rejects with `InvalidTimeoutError` otherwise. */
	timeout?: number
	/** Restrict attribute observation to these attribute names. Passed directly to `MutationObserver.observe()`. */
	attributeFilter?: string[]
	/** When provided, aborting the signal rejects the Promise with an `AbortError`. */
	signal?: AbortSignal
	/** DOM element or CSS selector to use as the observation root. Defaults to `document.documentElement`. */
	root?: DOMTarget
	/** Predicate applied to every matched node before resolving. Return `false` to skip the event and keep waiting. */
	filter?: FilterCallback
}

/** Options accepted by `watch()`. */
export interface WatchOptions {
	/** Event types to listen for. Defaults to all four event types. */
	events?: DOMObserverEvent[]
	/** Restrict attribute observation to these attribute names. Passed directly to `MutationObserver.observe()`. */
	attributeFilter?: string[]
	/**
	 * Maximum time in milliseconds to wait for the first matching mutation before stopping observation.
	 * The timeout is cancelled as soon as any mutation fires. `0` disables the timeout. Must be `0` or
	 * a positive finite number — throws `InvalidTimeoutError` otherwise.
	 */
	timeout?: number
	/** Called with a `TimeoutError` when the timeout elapses with no matching mutation. */
	onError?: (error: Error) => void
	/** When provided, aborting the signal stops observation immediately. */
	signal?: AbortSignal
	/** When `true`, automatically calls `clear()` after the first matching event. */
	once?: boolean
	/** Milliseconds to wait after the last mutation before invoking the callback. The callback receives the last mutation's arguments. `0` disables debouncing. */
	debounce?: number
	/** DOM element or CSS selector to use as the observation root. Defaults to `document.documentElement`. */
	root?: DOMTarget
	/**
	 * Predicate applied to every matched node before invoking the callback. Return `false` to skip the event.
	 * When used with `debounce`, only events that pass the filter start the debounce timer.
	 */
	filter?: FilterCallback
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
	private _debounceTimer: ReturnType<typeof setTimeout> | undefined = undefined

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
	 * Calling `wait()` while a previous call is still pending rejects the previous Promise with `ObservationAbortedError`
	 * and starts a fresh observation.
	 *
	 * When an array of targets is passed, the Promise resolves as soon as any one of them fires a
	 * matching event. The resolved `WaitResult.target` identifies which entry won. For EXIST checks,
	 * the first target found in the DOM wins.
	 *
	 * @param target - CSS selector, Element, or array of either to observe.
	 * @param options - Observation options.
	 * @returns A Promise that resolves with the matching node, event type, and optional change metadata.
	 * @throws `InvalidEventsError` when the `events` array is empty.
	 * @throws `InvalidTimeoutError` when `timeout` is negative, `NaN`, or `Infinity`.
	 * @throws `InvalidTargetError` when any target string is not a valid CSS selector.
	 */
	wait(target: DOMTarget, options?: WaitOptions): Promise<WaitResult>
	wait(targets: DOMTarget[], options?: WaitOptions): Promise<WaitResult>
	wait(
		target: DOMTarget | DOMTarget[],
		{
			events = DOMObserver.EVENTS,
			timeout = 0,
			attributeFilter = undefined,
			signal = undefined,
			root = undefined,
			filter = undefined,
		}: WaitOptions = {}
	): Promise<WaitResult> {
		if (!events?.length) {
			return Promise.reject(new InvalidEventsError())
		}

		if (timeout !== 0 && (!Number.isFinite(timeout) || timeout < 0)) {
			return Promise.reject(new InvalidTimeoutError())
		}

		if (signal?.aborted) {
			return Promise.reject(signal.reason ?? new DOMException('Aborted', 'AbortError'))
		}

		this._pendingReject?.(new ObservationAbortedError('Observation replaced by a new wait() call'))
		this._pendingReject = null
		this.clear()

		const isMulti = Array.isArray(target)

		return new Promise<WaitResult>((resolve, reject) => {
			let onAbort: (() => void) | null = null
			let matchedTarget: DOMTarget | undefined

			const cleanup = () => {
				if (onAbort) signal?.removeEventListener('abort', onAbort)
				this._pendingReject = null
			}
			const settle = (value: WaitResult) => {
				cleanup()
				this.clear()
				resolve(value)
			}
			const cancel = (error: Error | DOMException) => {
				cleanup()
				reject(error)
			}

			this._pendingReject = cancel

			// onMatch always fires synchronously before fireCallback in _observe, so matchedTarget
			// is guaranteed to be set before callback runs.
			const callback: OnEventCallback = (node, event, options) => {
				const result: WaitResult = options ? { node, event, options } : { node, event }
				if (isMulti) result.target = matchedTarget
				settle(result)
			}

			if (signal) {
				onAbort = () => cancel(signal.reason ?? new DOMException('Aborted', 'AbortError'))
				signal.addEventListener('abort', onAbort, { once: true })
			}

			if (timeout > 0) {
				this._timeout = setTimeout(() => cancel(new TimeoutError(target, timeout)), timeout)
			}

			this._observe(target, callback, { events, attributeFilter, root, filter }, (t) => {
				matchedTarget = t
			})
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
	 * Calling `watch()` while a previous `wait()` is still pending rejects that Promise with `ObservationAbortedError`
	 * and starts a fresh observation.
	 *
	 * When `timeout` is set, the observation stops automatically after the first matching mutation —
	 * subsequent mutations will not fire `onEvent`.
	 *
	 * When `once` is set, the observation stops automatically after the first matching mutation,
	 * equivalent to calling `clear()` manually inside `onEvent`.
	 *
	 * When `debounce` is set, `onEvent` is deferred after each mutation and only fires once the
	 * mutations have stopped for the specified duration. The callback receives the last mutation's arguments.
	 *
	 * @param target - CSS selector or Element to observe.
	 * @param onEvent - Callback invoked on every matching event.
	 * @param options - Observation options.
	 * @returns The `DOMObserver` instance, allowing method chaining.
	 * @throws `InvalidEventsError` when the `events` array is empty.
	 * @throws `InvalidTimeoutError` when `timeout` is negative, `NaN`, or `Infinity`.
	 * @throws `InvalidTargetError` when `target` is a string that is not a valid CSS selector.
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
			once = false,
			debounce = 0,
			root = undefined,
			filter = undefined,
		}: WatchOptions = {}
	): this {
		if (!events?.length) {
			throw new InvalidEventsError()
		}

		if (timeout !== 0 && (!Number.isFinite(timeout) || timeout < 0)) {
			throw new InvalidTimeoutError()
		}

		if (signal?.aborted) {
			return this
		}

		this._pendingReject?.(new ObservationAbortedError('Observation replaced by a new watch() call'))
		this._pendingReject = null
		this.clear()

		if (signal) {
			this._abortHandler = () => this.clear()
			this._signal = signal
			signal.addEventListener('abort', this._abortHandler, { once: true })
		}

		let callback: OnEventCallback = onEvent
		if (timeout > 0) {
			const wrapped = callback
			callback = (...args) => {
				clearTimeout(this._timeout)
				wrapped(...args)
			}
			this._timeout = setTimeout(() => {
				this.clear()
				onError?.(new TimeoutError(target, timeout))
			}, timeout)
		}
		if (debounce > 0) {
			const wrapped = callback
			callback = (...args) => {
				clearTimeout(this._debounceTimer)
				this._debounceTimer = setTimeout(() => wrapped(...args), debounce)
			}
		}
		if (once) {
			const wrapped = callback
			callback = (...args) => {
				this.clear()
				wrapped(...args)
			}
		}

		this._observe(target, callback, { events, attributeFilter, root, filter })

		return this
	}

	private _observe(
		target: DOMTarget | DOMTarget[],
		callback: OnEventCallback,
		{
			events,
			attributeFilter,
			root,
			filter,
		}: { events: DOMObserverEvent[]; attributeFilter?: string[]; root?: DOMTarget; filter?: FilterCallback },
		onMatch?: (matchedTarget: DOMTarget) => void
	): void {
		const hasExist = events.includes(DOMObserver.EXIST)
		const hasAdd = events.includes(DOMObserver.ADD)
		const hasRemove = events.includes(DOMObserver.REMOVE)
		const hasChange = events.includes(DOMObserver.CHANGE)

		const targets = Array.isArray(target) ? target : [target]
		const resolvedTargets = targets.map((t) => ({ target: t, el: resolveDOMTarget(t) }))
		const defaultRoot = resolveDOMTarget(root) ?? document.documentElement

		const fireCallback = (node: Element, event: DOMObserverEvent, opts?: ChangeOptions) => {
			if (filter && !filter(node, event, opts)) return
			opts !== undefined ? callback(node, event, opts) : callback(node, event)
		}

		const nodeMatchesTarget = (node: Node, t: DOMTarget): boolean =>
			node === t || (!isElement(t) && (node as Element).matches?.(t as string))

		const notify = (node: Node, event: DOMObserverEvent) => {
			for (const { target: t } of resolvedTargets) {
				if (nodeMatchesTarget(node, t)) {
					onMatch?.(t)
					fireCallback(node as Element, event)
					return
				}
			}
		}

		if (hasExist) {
			for (const { target: t, el } of resolvedTargets) {
				if (el) {
					onMatch?.(t)
					fireCallback(el, DOMObserver.EXIST)
					break
				}
			}
		}

		this._observer = new MutationObserver((mutations) => {
			mutations.forEach(({ type, target: targetNode, addedNodes, removedNodes, attributeName, oldValue }) => {
				if (type === 'childList' && (hasAdd || hasRemove)) {
					if (hasAdd) for (const node of addedNodes) notify(node, DOMObserver.ADD)
					if (hasRemove) for (const node of removedNodes) notify(node, DOMObserver.REMOVE)
				}
				if (type === 'attributes' && hasChange) {
					for (const { target: t } of resolvedTargets) {
						if (nodeMatchesTarget(targetNode, t)) {
							onMatch?.(t)
							fireCallback(targetNode as Element, DOMObserver.CHANGE, { attributeName, oldValue })
							break
						}
					}
				}
			})
		})

		const isDirectObservation =
			targets.length === 1 && hasChange && !hasAdd && !hasRemove && isElement(targets[0]) && !root
		const observerTarget = isDirectObservation ? (targets[0] as Element) : defaultRoot
		this._observer.observe(observerTarget, {
			subtree: !isDirectObservation,
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
		clearTimeout(this._debounceTimer)
		return this
	}
}

export default DOMObserver
