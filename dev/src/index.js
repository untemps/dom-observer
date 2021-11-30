import { DOMObserver } from '../../src'
import './index.css'

const observer = new DOMObserver()

let count = 0
const targetEl = document.getElementById('container')
const outputEl = document.getElementById('output')

const getItemId = (index) => {
	return `item-${index + 1}`
}

const createElement = (id) => {
	const addedRect = document.createElement('div')
	addedRect.setAttribute('id', id)
	addedRect.setAttribute('class', `item`)
	addedRect.setAttribute('aria-label', 'Dynamic item')
	const addedLab = document.createTextNode(id)
	addedRect.appendChild(addedLab)

	const deleteBtn = document.createElement('button')
	deleteBtn.setAttribute('class', 'item_delete-button')
	deleteBtn.onclick = () => removeElement(addedRect)
	const deleteLab = document.createTextNode('x')
	deleteBtn.appendChild(deleteLab)
	addedRect.appendChild(deleteBtn)

	const modifyBtn = document.createElement('button')
	modifyBtn.setAttribute('class', 'item_modify-button')
	modifyBtn.onclick = (e) => modifyElement(addedRect, 'class', 'item--modified')
	const modifyLab = document.createTextNode('Modify class')
	modifyBtn.appendChild(modifyLab)
	addedRect.appendChild(modifyBtn)

	const modify2Btn = document.createElement('button')
	modify2Btn.setAttribute('class', 'item_modify2-button')
	modify2Btn.onclick = (e) => modifyElement(addedRect, 'aria-label', 'Modified item')
	const modify2Lab = document.createTextNode('Modify aria-label')
	modify2Btn.appendChild(modify2Lab)
	addedRect.appendChild(modify2Btn)

	return addedRect
}

const addElement = (el) => {
	if (!el) {
		el = createElement(getItemId(count++))
	}
	targetEl.appendChild(el)
}

const removeElement = (el) => {
	el.parentNode.removeChild(el)
}

const modifyElement = (el, attributeName, attributeNewValue) => {
	el.setAttribute(attributeName, attributeNewValue)
}

const log = (message, values = null) => {
	outputEl.value += `${message}`
	if (!!values) {
		outputEl.value += `\n\t{`
		for (let z in values) {
			outputEl.value += `\n\t\t${z}: '${values[z]}'`
		}
		outputEl.value += `\n\t}`
	}
	outputEl.value += `\n`
}

const btn = document.getElementById('add-button')
btn.onclick = () => {
	const el = document.querySelector('#new-element')
	if (!!el) {
		removeElement(el)
	} else {
		addElement(createElement('new-element'))
	}
}

const onEvent = (node, event, { attributeName } = {}) => {
	switch (event) {
		case DOMObserver.ADD: {
			log(`Element ${node.id} added`)
			break
		}
		case DOMObserver.REMOVE: {
			log(`Element ${node.id} removed`)
			break
		}
		default: {
			log(`Attribute ${attributeName} for element ${node.id} changed`)
		}
	}
}

observer.wait(`#new-element`, onEvent)
