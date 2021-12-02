import isElement from './utils/isElement'

class DOMObserver {
	static ADD = 'DOMObserver_add'
	static REMOVE = 'DOMObserver_remove'
	static CHANGE = 'DOMObserver_change'
	static EVENTS = [DOMObserver.ADD, DOMObserver.REMOVE, DOMObserver.CHANGE]

	_observer = null

	wait(
		target,
		onEvent = null,
		{ events = DOMObserver.EVENTS, timeout = 0, attributeFilter = undefined, onError = undefined } = {}
	) {
		this.clear()

		return new Promise((resolve, reject) => {
			const el = isElement(target) ? target : document.querySelector(target)
			if (!!el && events.includes(DOMObserver.ADD)) {
				if (onEvent) {
					onEvent(el, DOMObserver.ADD)
				} else {
					resolve({ node: el, event: DOMObserver.ADD })
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
					if (
						type === 'childList' &&
						(events.includes(DOMObserver.ADD) || events.includes(DOMObserver.REMOVE))
					) {
						const nodes = [
							...(events.includes(DOMObserver.ADD) ? Array.from(addedNodes) : []),
							...(events.includes(DOMObserver.REMOVE) ? Array.from(removedNodes) : []),
						]
						for (let node of nodes) {
							if (node === target || (!isElement(target) && node.matches?.(target))) {
								if (onEvent) {
									onEvent(
										node,
										Array.from(addedNodes).includes(node) ? DOMObserver.ADD : DOMObserver.REMOVE
									)
								} else {
									resolve({
										node,
										event: Array.from(addedNodes).includes(node)
											? DOMObserver.ADD
											: DOMObserver.REMOVE,
									})
								}
							}
						}
					}
					if (type === 'attributes' && events.includes(DOMObserver.CHANGE)) {
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

			this._observer.observe(document.documentElement, {
				subtree: true,
				childList: events.includes(DOMObserver.ADD) || events.includes(DOMObserver.REMOVE),
				attributes: events.includes(DOMObserver.CHANGE),
				attributeOldValue: events.includes(DOMObserver.CHANGE),
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
