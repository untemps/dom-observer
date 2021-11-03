class DOMObserver {
	static ADD = 'DOMObserver_add'
	static REMOVE = 'DOMObserver_remove'
	static CHANGE = 'DOMObserver_change'
	static EVENTS = [DOMObserver.ADD, DOMObserver.REMOVE, DOMObserver.CHANGE]

	_observer = null

	wait(
		selector,
		onEvent,
		{ events = DOMObserver.EVENTS, timeout = 0, attributeFilter = undefined, onError = undefined } = {}
	) {
		this.clear()

		const el = document.querySelector(selector)
		if (!!el) {
			onEvent(el, DOMObserver.ADD)
		}

		if (timeout > 0) {
			this._timeout = setTimeout(() => {
				this.clear()
				onError?.(new Error(`[TIMEOUT]: Element ${selector} cannot be found after ${timeout}ms`))
			}, timeout)
		}

		this._observer = new MutationObserver((mutations) => {
			mutations.forEach(({ type, target, addedNodes, removedNodes, attributeName, oldValue }) => {
				if (type === 'childList' && (events.includes(DOMObserver.ADD) || events.includes(DOMObserver.REMOVE))) {
					const nodes = [
						...(events.includes(DOMObserver.ADD) ? Array.from(addedNodes) : []),
						...(events.includes(DOMObserver.REMOVE) ? Array.from(removedNodes) : []),
					]
					for (let node of nodes) {
						if (node.matches?.(selector)) {
							onEvent(node, Array.from(addedNodes).includes(node) ? DOMObserver.ADD : DOMObserver.REMOVE)
						}
					}
				}
				if (type === 'attributes' && events.includes(DOMObserver.CHANGE)) {
					if (target.matches?.(selector)) {
						onEvent(target, DOMObserver.CHANGE, {
							attributeName,
							oldValue,
						})
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
	}

	clear() {
		this._observer?.disconnect()
		clearTimeout(this._timeout)
	}
}

export default DOMObserver
