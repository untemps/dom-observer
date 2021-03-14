const { toBeInTheDocument, toHaveAttribute, toHaveStyle } = require('@testing-library/jest-dom/matchers')
import '@testing-library/jest-dom/extend-expect'

expect.extend({ toBeInTheDocument, toHaveAttribute, toHaveStyle })

global.generateDOM = (text = '') => {
	const containerElement = document.createElement('div')
	const contentElement = document.createElement('span')
	contentElement.setAttribute('id', 'foo')
	contentElement.setAttribute('class', 'foo')
	containerElement.appendChild(contentElement)
	const textNode = document.createTextNode(text)
	contentElement.appendChild(textNode)
	document.body.appendChild(containerElement)
	return containerElement
}
