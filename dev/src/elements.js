import { addElement, createElement, modifyElement, destroyElement } from './utils'

export const createTooltip = () => {
	return createElement({
		id: 'tooltip',
		class: 'tooltip',
		content: 'This tooltip is observed continuously',
	})
}

export const createCard = () => {
	const card = createElement({
		id: 'card',
		class: 'card',
		'aria-label': 'Dynamic card',
	})

	const closeButtonCell = createElement({
		class: 'card_cell_close-button',
	})
	const closeButton = createElement({
		tagName: 'button',
		class: 'button card_close-button',
	})
	closeButton.onclick = () => destroyElement(card)
	const closeButtonLabel = createElement({
		content: 'Remove this element',
	})
	addElement(closeButtonLabel, closeButton)
	addElement(closeButton, closeButtonCell)
	addElement(closeButtonCell, card)

	const imageCell = createElement({
		class: 'card_cell_image',
	})
	const image = createElement({
		tagName: 'img',
		class: 'card_image',
		alt: 'Card image',
		src: 'https://picsum.photos/300',
	})
	addElement(image, imageCell)
	addElement(imageCell, card)

	const descriptionCell = createElement({
		class: 'card_cell_description',
	})
	const description = createElement({
		class: 'card_description',
	})
	const descriptionText1 = createElement({
		tagName: 'p',
		content:
			'The addition of this card is observed one-shot then rerun continuously to observe changes and deletion',
	})
	const descriptionText2 = createElement({
		tagName: 'p',
		content: 'Click the bottom button to log attribute changes',
	})
	addElement(descriptionText1, description)
	addElement(descriptionText2, description)
	addElement(description, descriptionCell)
	addElement(descriptionCell, card)

	const leftButtonCell = createElement({
		class: 'card_cell_left-button',
	})
	const leftButton = createElement({
		tagName: 'button',
		class: 'button',
		content: 'Change class',
	})
	leftButton.onclick = (e) => modifyElement(card, 'class', 'card card--modified')
	addElement(leftButton, leftButtonCell)
	addElement(leftButtonCell, card)

	const rightButtonCell = createElement({
		class: 'card_cell_right-button',
	})
	const rightButton = createElement({
		tagName: 'button',
		class: 'button',
		content: 'Change aria-label',
	})
	rightButton.onclick = (e) => modifyElement(card, 'aria-label', 'Modified card')
	addElement(rightButton, rightButtonCell)
	addElement(rightButtonCell, card)

	return card
}
