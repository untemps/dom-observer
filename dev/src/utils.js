export const createElement = ({ tagName, content, ...attributes }) => {
	if (tagName === null && !!content) {
		return document.createTextNode(content)
	} else {
		const el = document.createElement(tagName || 'div')
		if (!!attributes) {
			for (let z in attributes) {
				el.setAttribute(z, attributes[z])
			}
		}
		if (!!content) {
			const text = document.createTextNode(content)
			addElement(text, el)
		}
		return el
	}
}

export const addElement = (element, container) => {
	if (!element) {
		return
	}
	if (!container) {
		container = document.querySelector('body')
	}
	container.appendChild(element)
}

export const destroyElement = (element) => {
	element?.parentNode?.removeChild(element)
}

export const modifyElement = (element, attributeName, attributeNewValue) => {
	if (!element) {
		return
	}
	element.setAttribute(attributeName, attributeNewValue)
}
