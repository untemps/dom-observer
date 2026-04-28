import { DOMObserverErrors } from '../DOMObserverErrors'
import type { DOMTarget } from '../DOMObserver'
import isElement from './isElement'

const resolveDOMTarget = (target: DOMTarget | undefined): Element | null => {
	if (!target) return null
	if (isElement(target)) return target as Element
	try {
		return document.querySelector(target as string)
	} catch {
		throw new Error(`${DOMObserverErrors.TARGET}: "${target}" is not a valid CSS selector`)
	}
}

export default resolveDOMTarget
