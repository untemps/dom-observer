import { createDOMObserver, DOMObserverEvent } from '../../src'

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

const onEvent = ({ node, event, options }) => {
	switch (event) {
		case DOMObserverEvent.ADD: {
			log(`[ADD]\t\tElement id: ${node.id}`)
			break
		}
		case DOMObserverEvent.REMOVE: {
			log(`[REMOVE]\tElement id: ${node.id}`)
			break
		}
		default: {
			log(`[CHANGE]\tElement id: ${node.id} - Attribute: ${options?.attributeName}`)
		}
	}
}

const tooltipObserver = createDOMObserver()
tooltipObserver.observe(tooltip, onEvent, { events: [DOMObserverEvent.ADD, DOMObserverEvent.REMOVE] })

const observeCard = () => {
	createDOMObserver()
		.observeOnce(`#card`)
		.then(({ node }) => {
			log(`[ADD]\t\tElement id: ${node.id}`)
			const cardObserver = createDOMObserver()
			cardObserver.observe(
				`#card`,
				(payload) => {
					onEvent(payload)
					if (payload.event === DOMObserverEvent.REMOVE) {
						cardObserver.disconnect()
						observeCard()
					}
				},
				{ events: [DOMObserverEvent.REMOVE, DOMObserverEvent.CHANGE] }
			)
		})
}
observeCard()
