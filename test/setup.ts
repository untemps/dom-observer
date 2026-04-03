import '@testing-library/jest-dom/vitest'

global._createElement = (id = 'foo', className = 'bar', ariaLabel = 'gag'): HTMLElement => {
	const el = document.createElement('div')
	el.setAttribute('id', id)
	el.setAttribute('class', className)
	el.setAttribute('aria-label', ariaLabel)
	document.body.appendChild(el)
	return el
}

global._removeElement = (selector: string): void => {
	const el = document.querySelector(selector)
	if (el) {
		el.parentNode?.removeChild(el)
	}
}

global._modifyElement = (selector: string, attributeName: string, attributeValue: string): void => {
	const el = document.querySelector(selector)
	if (el) {
		el.setAttribute(attributeName, attributeValue)
	}
}

global._createElementWithClass = (className: string): HTMLElement => {
	const el = document.createElement('div')
	el.setAttribute('class', className)
	document.body.appendChild(el)
	return el
}

global._sleep = (ms = 100): Promise<void> => {
	return new Promise((resolve) => setTimeout(resolve, ms))
}
