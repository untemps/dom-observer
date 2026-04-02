declare global {
	var _createElement: (id?: string, className?: string, ariaLabel?: string) => HTMLElement
	var _removeElement: (selector: string) => void
	var _modifyElement: (selector: string, attributeName: string, attributeValue: string) => void
	var _createElementWithClass: (className: string) => HTMLElement
	var _sleep: (ms?: number) => Promise<void>
}

export {}
