import { DOMObserver } from '../../src'
import './index.css'

let count = 0
const targetEl = document.getElementById('container')
const outputEl = document.getElementById('output')

const getItemId = (index) => {
	return `item-${index + 1}`
}

const getElement = (id) => {
	const addedRect = document.createElement('div')
	addedRect.setAttribute('id', id)
	addedRect.setAttribute('class', `item`)
	addedRect.setAttribute('aria-label', 'Dynamic item')
	const addedLab = document.createTextNode(id)
	addedRect.appendChild(addedLab)
	const deleteBtn = document.createElement('button')
	deleteBtn.setAttribute('class', 'item-button')
	deleteBtn.onclick = removeElement
	const deleteLab = document.createTextNode('x')
	deleteBtn.appendChild(deleteLab)
	addedRect.appendChild(deleteBtn)
	return addedRect
}

const addElement = () => {
	const newId = getItemId(count++)
	const newEl = getElement(newId)

	const domObserver = new DOMObserver()
	domObserver
		.wait(`#${newId}`)
		.then((a) => {
			outputEl.value += `Element ${a.id} created\n`
		})
		.catch((err) => console.log(err))

	targetEl.appendChild(newEl)
}

const removeElement = (e) => {
	targetEl.removeChild(e.currentTarget.parentElement)
}

const btn = document.getElementById('add-button')
btn.onclick = addElement
