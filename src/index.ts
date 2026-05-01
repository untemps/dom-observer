export type {
	ChangeOptions,
	DOMObserverEvent,
	DOMTarget,
	FilterCallback,
	OnEventCallback,
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
