class DOMObserver {
	_observer = null
	_timeout = null

	async wait(selector, timeout = 1000) {
		this.clear()

		return new Promise((resolve, reject) => {
			const el = document.querySelector(selector)

			if (!!el) {
				resolve(el)
			}

			const error = new Error(`Element ${selector} cannot be found`)
			if (timeout > 0) {
				this._timeout = setTimeout(() => {
					this.clear()
					reject(error)
				}, timeout)
			} else {
				reject(error)
			}

			this._observer = new MutationObserver((mutations) => {
				mutations.forEach((mutation) => {
					if (mutation.type === 'childList') {
						const nodes = [...Array.from(mutation.addedNodes), ...Array.from(mutation.removedNodes)]
						for (let node of nodes) {
							if (!!node.matches && node.matches(selector)) {
								this.clear()
								resolve(node)
							}
						}
					}
				})
			})

			this._observer.observe(document.documentElement, {
				childList: true,
				subtree: true,
			})
		})
	}

	async watch(selector, options = {}, timeout = 0) {
		this.clear()

		return new Promise((resolve, reject) => {
			const el = document.querySelector(selector)

			const error = new Error(`Element ${selector} has not been modified before timeout`)
			if (timeout > 0) {
				this._timeout = setTimeout(() => {
					this.clear()
					reject(error)
				}, timeout)
			}

			this._observer = new MutationObserver((mutations) => {
				mutations.forEach((mutation) => {
					console.log(options)
					if (mutation.type === 'attributes') {
						this.clear()
						resolve({
							target: mutation.target,
							attributeName: mutation.attributeName,
							oldValue: mutation.oldValue,
						})
					}
				})
			})

			this._observer.observe(el, {
				attributes: true,
				attributeOldValue: true,
				attributeFilter: options?.attributeNames
			})
		})
	}

	clear() {
		this._observer?.disconnect()
		clearTimeout(this._timeout)
	}
}

export default DOMObserver
