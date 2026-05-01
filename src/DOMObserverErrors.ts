import type { DOMTarget } from './types'

const formatTarget = (t: DOMTarget): string =>
	t instanceof Element ? `<${t.tagName.toLowerCase()}${t.id ? `#${t.id}` : ''}>` : String(t)

export class TimeoutError extends Error {
	readonly target: DOMTarget | DOMTarget[]
	readonly timeout: number

	constructor(target: DOMTarget | DOMTarget[], timeout: number) {
		const label = Array.isArray(target) ? `None of [${target.map(formatTarget).join(', ')}]` : formatTarget(target)
		super(`${label} could not be found after ${timeout}ms`)
		this.name = 'TimeoutError'
		this.target = target
		this.timeout = timeout
	}
}

export class ObservationAbortedError extends Error {
	constructor(reason: string) {
		super(reason)
		this.name = 'ObservationAbortedError'
	}
}

export class InvalidEventsError extends Error {
	constructor() {
		super('Events array cannot be empty')
		this.name = 'InvalidEventsError'
	}
}

export class InvalidTargetError extends Error {
	readonly selector: string

	constructor(selector: string) {
		super(`"${selector}" is not a valid CSS selector`)
		this.name = 'InvalidTargetError'
		this.selector = selector
	}
}

export class InvalidOptionsError extends Error {
	constructor() {
		super('Timeout must be 0 or a positive finite number')
		this.name = 'InvalidOptionsError'
	}
}
