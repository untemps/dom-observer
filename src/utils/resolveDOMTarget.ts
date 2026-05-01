import type { DOMTarget } from '../DOMObserver'
import { InvalidTargetError } from '../DOMObserverErrors'
import isElement from './isElement'

const resolveDOMTarget = (target: DOMTarget | undefined): Element | null => {
	if (!target) return null
	if (isElement(target)) return target as Element
	try {
		return document.querySelector(target as string)
	} catch {
		throw new InvalidTargetError(target as string)
	}
}

export default resolveDOMTarget
