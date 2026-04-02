import isElement from './utils/isElement'

class DOMObserver {
	static EXIST = 'DOMObserver_exist'
	static ADD = 'DOMObserver_add'
	static REMOVE = 'DOMObserver_remove'
	static CHANGE = 'DOMObserver_change'
	static EVENTS = [DOMObserver.EXIST, DOMObserver.ADD, DOMObserver.REMOVE, DOMObserver.CHANGE]

	_observer = null

	wait(
		target,
		onEvent = null,
		{ events = DOMObserver.EVENTS, timeout = 0, attributeFilter = undefined, onError = undefined } = {}
	) {
		if (!events?.length) {
			return Promise.reject(new Error('[EVENTS]: events array cannot be empty'))
		}

		this.clear()

		const hasExist  = events.includes(DOMObserver.EXIST)
		const hasAdd    = events.includes(DOMObserver.ADD)
		const hasRemove = events.includes(DOMObserver.REMOVE)
		const hasChange = events.includes(DOMObserver.CHANGE)

		return new Promise((resolve, reject) => {
			const el = isElement(target) ? target : document.querySelector(target)
			if (el && hasExist) {
				if (onEvent) {
					onEvent(el, DOMObserver.EXIST)
				} else {
					resolve({ node: el, event: DOMObserver.EXIST })
				}
			}

			if (timeout > 0) {
				this._timeout = setTimeout(() => {
					this.clear()
					const error = new Error(`[TIMEOUT]: Element ${target} cannot be found after ${timeout}ms`)
					if (onEvent) {
						onError?.(error)
					} else {
						reject(error)
					}
				}, timeout)
			}

			this._observer = new MutationObserver((mutations) => {
				mutations.forEach(({ type, target: targetNode, addedNodes, removedNodes, attributeName, oldValue }) => {
					if (type === 'childList' && (hasAdd || hasRemove)) {
						const notify = (node, event) => {
							if (node === target || (!isElement(target) && node.matches?.(target))) {
								if (onEvent) {
									onEvent(node, event)
								} else {
									resolve({ node, event })
								}
							}
						}
						if (hasAdd) for (const node of addedNodes) notify(node, DOMObserver.ADD)
						if (hasRemove) for (const node of removedNodes) notify(node, DOMObserver.REMOVE)
					}
					if (type === 'attributes' && hasChange) {
						if (targetNode === target || (!isElement(target) && targetNode.matches?.(target))) {
							if (onEvent) {
								onEvent(targetNode, DOMObserver.CHANGE, {
									attributeName,
									oldValue,
								})
							} else {
								resolve({
									node: targetNode,
									event: DOMObserver.CHANGE,
									options: {
										attributeName,
										oldValue,
									},
								})
							}
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
		})
	}

	clear() {
		this._observer?.disconnect()
		clearTimeout(this._timeout)
	}
}

export default DOMObserver
