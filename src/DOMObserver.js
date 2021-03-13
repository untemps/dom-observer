class DOMObserver {
	_observer = null
	_timeout = null

	async wait(selector, timeout = 1000) {
		return new Promise((resolve, reject) => {
			const el = document.querySelector(selector)

			if (!!el) {
				resolve(el)
			}

			const error = new Error(`Element ${selector} cannot be found`)
			if (timeout > 0) {
				this._timeout = setTimeout(() => {
					this.unwait()
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
								this.unwait()
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
		return new Promise((resolve, reject) => {
			const el = document.querySelector(selector)

			const error = new Error(`Element ${selector} has not been modified before timeout`)
			if (timeout > 0) {
				this._timeout = setTimeout(() => {
					this.unwait()
					reject(error)
				}, timeout)
			}

			this._observer = new MutationObserver((mutations) => {
				mutations.forEach((mutation) => {
					if (
						(mutation.type === 'attributes' && !options?.attributeName) ||
						options?.attributeName === mutation.attributeName
					) {
						this.unwait()
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
			})
		})
	}

	unwait() {
		!!this._observer && this._observer.disconnect()
		!!this._timeout && clearTimeout(this._timeout)
	}
}

export default DOMObserver
