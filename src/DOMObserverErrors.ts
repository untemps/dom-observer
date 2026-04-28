export const DOMObserverErrors = {
	TIMEOUT: '[TIMEOUT]',
	ABORT: '[ABORT]',
	EVENTS: '[EVENTS]',
	TARGET: '[TARGET]',
} as const

export type DOMObserverErrorCode = (typeof DOMObserverErrors)[keyof typeof DOMObserverErrors]
