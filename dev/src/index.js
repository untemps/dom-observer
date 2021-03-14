import { DOMObserver } from '../../src'
import './index.css'

const domObserver = new DOMObserver()

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
	deleteBtn.onclick = removeElement
	const deleteLab = document.createTextNode('x')
	deleteBtn.appendChild(deleteLab)
	addedRect.appendChild(deleteBtn)

	const modifyBtn = document.createElement('button')
	modifyBtn.setAttribute('class', 'item_modify-button')
	modifyBtn.onclick = (e) => modifyElement(e, 'class', 'item--modified')
	const modifyLab = document.createTextNode('Modify class')
	modifyBtn.appendChild(modifyLab)
	addedRect.appendChild(modifyBtn)

	const modify2Btn = document.createElement('button')
	modify2Btn.setAttribute('class', 'item_modify2-button')
	modify2Btn.onclick = (e) => modifyElement(e, 'aria-label', 'Modified item')
	const modify2Lab = document.createTextNode('Modify aria-label')
	modify2Btn.appendChild(modify2Lab)
	addedRect.appendChild(modify2Btn)

	return addedRect
}

const addElement = () => {
	const newId = getItemId(count++)
	const newEl = createElement(newId)

	domObserver
		.wait(`#${newId}`)
		.then((node) => {
			log(`Element ${node.id} added`)
		})
		.catch((err) => console.log(err))

	targetEl.appendChild(newEl)
}

const removeElement = (e) => {
	const oldId = e.currentTarget.parentElement.id

	domObserver
		.wait(`#${oldId}`)
		.then((node) => {
			log(`Element ${node.id} removed`)
		})
		.catch((err) => console.log(err))

	targetEl.removeChild(e.currentTarget.parentElement)
}

const modifyElement = (e, attributeName, attributeNewValue) => {
	const targetEl = e.currentTarget.parentElement
	const id = targetEl.id

	domObserver
		.watch(`#${id}`, { attributeNames: ['class'] }, 20000)
		.then(({ target, attributeName, oldValue }) => {
			const newValue = target.getAttribute(attributeName)
			log(`Element ${target.id} modified`, {attributeName, oldValue, newValue})
		})
		.catch((err) => console.log(err))

	targetEl.setAttribute(attributeName, attributeNewValue)
}

const log = (message, values = null) => {
	outputEl.value += `${message}`
	if(!!values) {
		outputEl.value += `\n\t{`
		for (let z in values) {
			outputEl.value += `\n\t\t${z}: '${values[z]}'`
		}
		outputEl.value += `\n\t}`
	}
	outputEl.value += `\n`
}

const btn = document.getElementById('add-button')
btn.onclick = addElement
