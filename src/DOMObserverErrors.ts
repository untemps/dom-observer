import type { DOMTarget } from './DOMObserver'

export class TimeoutError extends Error {
	readonly target: DOMTarget | DOMTarget[]
	readonly timeout: number

	constructor(target: DOMTarget | DOMTarget[], timeout: number) {
		const label = Array.isArray(target)
			? `None of [${(target as DOMTarget[]).join(', ')}]`
			: `Element "${target}"`
		super(`${label} could not be found after ${timeout}ms`)
		this.name = 'TimeoutError'
		this.target = target
		this.timeout = timeout
	}
}

export class ObservationAbortedError extends Error {
	constructor(reason?: string) {
		super(reason ?? 'Observation replaced by a newer call')
		this.name = 'ObservationAbortedError'
	}
}

export class InvalidEventsError extends Error {
	constructor() {
		super('events array cannot be empty')
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
	constructor(message: string) {
		super(message)
		this.name = 'InvalidOptionsError'
	}
}
