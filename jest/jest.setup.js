const { toBeInTheDocument, toHaveAttribute, toHaveStyle } = require('@testing-library/jest-dom/matchers')
import '@testing-library/jest-dom/extend-expect'

expect.extend({ toBeInTheDocument, toHaveAttribute, toHaveStyle })

global.createElement = (id = 'foo', className = 'bar', ariaLabel = 'gag') => {
	const el = document.createElement('div')
	el.setAttribute('id', id)
	el.setAttribute('class', className)
	el.setAttribute('aria-label', ariaLabel)
	document.body.appendChild(el)
	return el
}

global.deleteElement = (selector) => {
	const el = document.querySelector(selector)
	if (!!el) {
		el.parentNode.removeChild(el)
	}
}

global.modifyElement = (selector, attributeName, attributeValue) => {
	const el = document.querySelector(selector)
	if (!!el) {
		el.setAttribute(attributeName, attributeValue)
	}
}

global.sleep = (ms = 100) => {
	return new Promise((resolve) => setTimeout(resolve, ms))
}
