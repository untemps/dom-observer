export type {
	AddPayload,
	ChangeOptions,
	ChangePayload,
	DOMObserverEvent,
	DOMTarget,
	EventPayload,
	ExistPayload,
	FilterCallback,
	OnEventCallback,
	RemovePayload,
	WaitOptions,
	WaitResult,
	WatchOptions,
} from './DOMObserver'
export { default as DOMObserver } from './DOMObserver'
export {
	InvalidEventsError,
	InvalidOptionsError,
	InvalidTargetError,
	InvalidTimeoutError,
	ObservationAbortedError,
	TimeoutError,
} from './DOMObserverErrors'
