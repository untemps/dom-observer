import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Compatibility alias for jest.fn() / jest.spyOn() used in existing tests.
// Note: this only covers the spy/mock API. jest.useFakeTimers() and similar
// timer utilities are NOT aliased — use vi.useFakeTimers() directly if needed.
global.jest = vi

global._createElement = (id = 'foo', className = 'bar', ariaLabel = 'gag') => {
	const el = document.createElement('div')
	el.setAttribute('id', id)
	el.setAttribute('class', className)
	el.setAttribute('aria-label', ariaLabel)
	document.body.appendChild(el)
	return el
}

global._removeElement = (selector) => {
	const el = document.querySelector(selector)
	if (el) {
		el.parentNode.removeChild(el)
	}
}

global._modifyElement = (selector, attributeName, attributeValue) => {
	const el = document.querySelector(selector)
	if (el) {
		el.setAttribute(attributeName, attributeValue)
	}
}

global._sleep = (ms = 100) => {
	return new Promise((resolve) => setTimeout(resolve, ms))
}
