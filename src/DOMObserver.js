import isElement from './utils/isElement'

class DOMObserver {
	static EXIST = 'DOMObserver_exist'
	static ADD = 'DOMObserver_add'
	static REMOVE = 'DOMObserver_remove'
	static CHANGE = 'DOMObserver_change'
	static EVENTS = [DOMObserver.EXIST, DOMObserver.ADD, DOMObserver.REMOVE, DOMObserver.CHANGE]

	_observer = null
	_pendingReject = null

	wait(
		target,
		onEvent = null,
		{ events = DOMObserver.EVENTS, timeout = 0, attributeFilter = undefined, onError = undefined } = {}
	) {
		if (!events?.length) {
			return Promise.reject(new Error('[EVENTS]: events array cannot be empty'))
		}

		this._pendingReject?.(new Error('[ABORT]: Observation replaced by a new wait() call'))
		this._pendingReject = null
		this.clear()

		return new Promise((resolve, reject) => {
			if (!onEvent) this._pendingReject = reject
			const settle = (value) => {
				this._pendingReject = null
				resolve(value)
			}
			const callback =
				onEvent ?? ((node, event, options) => settle(options ? { node, event, options } : { node, event }))

			if (timeout > 0) {
				this._timeout = setTimeout(() => {
					this.clear()
					const error = new Error(`[TIMEOUT]: Element ${target} cannot be found after ${timeout}ms`)
					onEvent ? onError?.(error) : reject(error)
				}, timeout)
			}

			this._observe(target, callback, { events, attributeFilter })
		})
	}

	watch(target, onEvent, { events = DOMObserver.EVENTS, attributeFilter = undefined } = {}) {
		if (!events?.length) {
			throw new Error('[EVENTS]: events array cannot be empty')
		}

		this._pendingReject?.(new Error('[ABORT]: Observation replaced by a new watch() call'))
		this._pendingReject = null
		this.clear()

		this._observe(target, onEvent, { events, attributeFilter })

		return this
	}

	_observe(target, callback, { events, attributeFilter }) {
		const hasExist  = events.includes(DOMObserver.EXIST)
		const hasAdd    = events.includes(DOMObserver.ADD)
		const hasRemove = events.includes(DOMObserver.REMOVE)
		const hasChange = events.includes(DOMObserver.CHANGE)

		const el = isElement(target) ? target : document.querySelector(target)
		if (el && hasExist) {
			callback(el, DOMObserver.EXIST)
		}

		this._observer = new MutationObserver((mutations) => {
			mutations.forEach(({ type, target: targetNode, addedNodes, removedNodes, attributeName, oldValue }) => {
				if (type === 'childList' && (hasAdd || hasRemove)) {
					const notify = (node, event) => {
						if (node === target || (!isElement(target) && node.matches?.(target))) {
							callback(node, event)
						}
					}
					if (hasAdd) for (const node of addedNodes) notify(node, DOMObserver.ADD)
					if (hasRemove) for (const node of removedNodes) notify(node, DOMObserver.REMOVE)
				}
				if (type === 'attributes' && hasChange) {
					if (targetNode === target || (!isElement(target) && targetNode.matches?.(target))) {
						callback(targetNode, DOMObserver.CHANGE, { attributeName, oldValue })
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

	clear() {
		this._pendingReject = null
		this._observer?.disconnect()
		clearTimeout(this._timeout)
	}
}

export default DOMObserver
