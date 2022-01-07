import { DOMObserver } from '../../src'

import { createCard, createTooltip } from './elements'
import { log } from './log'
import { addElement, destroyElement } from './utils'

import './index.css'

const tooltip = createTooltip()

const cardTarget = document.querySelector('#container')

const addButton = document.querySelector('#add-button')
addButton.addEventListener('mouseenter', () => {
	const tooltipContainer = document.querySelector('#add-button')
	addElement(tooltip, tooltipContainer)
})
addButton.addEventListener('mouseleave', () => {
	destroyElement(tooltip)
})
addButton.addEventListener('click', () => {
	destroyElement(tooltip)
	const el = document.querySelector('#card')
	if (!el) {
		const card = createCard()
		addElement(card, cardTarget)
	}
})

const onEvent = (node, event, { attributeName } = {}) => {
	switch (event) {
		case DOMObserver.ADD: {
			log(`[ADD]\t\tElement id: ${node.id}`)
			break
		}
		case DOMObserver.REMOVE: {
			log(`[REMOVE]\tElement id: ${node.id}`)
			break
		}
		default: {
			log(`[CHANGE]\tElement id: ${node.id} - Attribute: ${attributeName}`)
		}
	}
}

const tooltipObserver = new DOMObserver()
tooltipObserver.wait(tooltip, onEvent, { events: [DOMObserver.ADD, DOMObserver.REMOVE] })

const cardObserver = new DOMObserver()
cardObserver.wait(`#card`).then(({ node }) => {
	log(`[ADD]\t\tElement id: ${node.id}`)
	new DOMObserver().wait(`#card`, onEvent, { events: [DOMObserver.REMOVE, DOMObserver.CHANGE] })
})
