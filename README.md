# @untemps/dom-observer

Observe DOM mutations of a specific element in one-shot or continuous mode.

A factory-based wrapper around the MutationObserver API targeting a specific element.  
That means you can observe an element to be added to the DOM and access to its properties, an attribute from that element to be changed and get the old and the new values, the element to be removed from the DOM and destroy all its dependencies.

![npm](https://img.shields.io/npm/v/@untemps/dom-observer?style=for-the-badge)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/untemps/dom-observer/publish.yml?style=for-the-badge)](https://github.com/untemps/dom-observer/actions)
![Codecov](https://img.shields.io/codecov/c/github/untemps/dom-observer?style=for-the-badge)

## Installation

```bash
yarn add @untemps/dom-observer
```

## Usage

Import `createDOMObserver`:

```javascript
import { createDOMObserver, DOMObserverEvent } from '@untemps/dom-observer'
```

Create an observer instance:

```javascript
const instance = createDOMObserver()
```

### Observe recurring mutations

Use the `observe()` method when you want to be notified **every time** a mutation occurs — for instance, tracking all successive attribute changes on an element or reacting to every matching node added to the DOM.

```javascript
import { createDOMObserver, DOMObserverEvent } from '@untemps/dom-observer'

// Track every attribute change on an element
const instance = createDOMObserver()
instance.observe('#foo', ({ node, options }) => {
	console.log(`${options?.attributeName} changed from ${options?.oldValue} to ${node.getAttribute(options?.attributeName ?? '')}`)
}, { events: [DOMObserverEvent.CHANGE] })

// React to every matching node added or removed
const listInstance = createDOMObserver()
listInstance.observe('.list-item', ({ node, event }) => {
	if (event === DOMObserverEvent.ADD) console.log(`Item added: ${node.textContent}`)
	if (event === DOMObserverEvent.REMOVE) console.log(`Item removed: ${node.textContent}`)
}, { events: [DOMObserverEvent.ADD, DOMObserverEvent.REMOVE] })
```

Unlike `observeOnce`, `observe` does not return a Promise. It returns `this`, allowing method chaining. Call `disconnect()` to stop the observation.

Pass `once: true` to stop the observation automatically after the first matching event, without needing to call `disconnect()` manually:

```javascript
instance.observe('#foo', ({ node }) => {
	doSomething(node)  // called exactly once
}, { events: [DOMObserverEvent.ADD], once: true })
```

Pass `debounce` to delay the callback until mutations have stopped for a given number of milliseconds — useful when you only care about the final state after a burst of rapid changes:

```javascript
instance.observe('#progress', ({ node }) => {
	console.log('final value:', node.getAttribute('data-value'))
}, {
	events: [DOMObserverEvent.CHANGE],
	attributeFilter: ['data-value'],
	debounce: 100,
})
```

Pass a `timeout` to automatically stop the observation if no matching mutation occurs within the allotted time:

```javascript
const instance = createDOMObserver()
instance.observe('#foo', ({ node, event }) => {
	console.log(`Event: ${event}`)
}, {
	events: [DOMObserverEvent.ADD],
	timeout: 3000,
	onError: (err) => console.error(err.message),
})
```

#### `observe` method arguments

| Props               | Type              | Description                                                                                                                                              |
| ------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `target`            | Element or String | DOM element or selector of the DOM element to observe. See [querySelector spec](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector) |
| `onEvent`           | Function          | Callback triggered each time an event occurs on the observed element                                                                                    |
| `options`           | Object            | Options object:                                                                                                                                          |
| - `events`          | Array             | List of [events](#events) to observe (All events are observed by default)                                                                                |
| - `attributeFilter` | Array             | List of attribute names to observe (DOMObserverEvent.CHANGE event only)                                                                                       |
| - `timeout`         | Number            | Duration (in ms) after which observation stops if no matching mutation occurred. Triggers `onError` with a `TimeoutError` when elapsed. Must be `0` or a positive finite number — throws `InvalidTimeoutError` otherwise. |
| - `onError`         | Function          | Callback triggered when `timeout` elapses with no matching mutation                                                                                      |
| - `signal`          | AbortSignal       | An `AbortSignal` to stop the observation. If already aborted, `observe()` returns immediately without observing.                                           |
| - `once`            | Boolean           | When `true`, automatically calls `disconnect()` after the first matching event. Defaults to `false`.                                                          |
| - `debounce`        | Number            | Milliseconds to wait after the last mutation before invoking the callback. The callback receives the last mutation's arguments. `0` disables debouncing. |
| - `root`            | Element or String | DOM element or CSS selector to use as the observation root. Only mutations within this subtree are observed. Defaults to `document.documentElement`.     |
| - `filter`          | Function          | `(payload: EventPayload) => boolean`. Called before invoking the callback. Return `false` to skip the event and keep observing.                               |

#### `onEvent` callback payload

The callback receives a single `EventPayload` object — a **discriminated union** on `event`. Narrow on `event` to access `options` without optional chaining:

```typescript
instance.observe('#foo', ({ event, node, options }) => {
	if (event === DOMObserverEvent.CHANGE) {
		console.log(options.attributeName) // ✅ ChangeOptions — never undefined here
	}
})
```

| Props             | Type           | Description                                                                 |
| ----------------- | -------------- | --------------------------------------------------------------------------- |
| `node`            | Element        | Observed element node                                                       |
| `event`           | String         | Event that triggered the callback                                           |
| `options`         | Object         | `ChangeOptions` for `CHANGE` events, absent (`never`) for all other events: |
| - `attributeName` | String         | Name of the attribute that changed                                          |
| - `oldValue`      | String or null | Value of the attribute before the mutation                                  |

#### `onError` callback arguments

| Props   | Type  | Description  |
| ------- | ----- | ------------ |
| `error` | Error | Error thrown |

### Observe a one-shot mutation

Use the `observeOnce()` method to get a Promise that resolves on the **first** matching mutation.

```javascript
import { createDOMObserver, DOMObserverEvent } from '@untemps/dom-observer'

const instance = createDOMObserver()
const result = await instance.observeOnce('#foo', { events: [DOMObserverEvent.REMOVE, DOMObserverEvent.CHANGE] })
switch (result.event) {
	case DOMObserverEvent.REMOVE: {
		console.log('Element ' + result.node.id + ' has been removed')
		break
	}
	case DOMObserverEvent.CHANGE: {
		// options is ChangeOptions here — no fallback needed
		console.log('Element ' + result.node.id + ' has been changed (' + result.options.attributeName + ')')
		break
	}
}
```

Pass an **array of targets** to resolve as soon as any one of them fires a matching event. The resolved value includes a `target` field identifying which entry won:

```javascript
const { node, target } = await instance.observeOnce(['#success', '#error'], {
	events: [DOMObserverEvent.ADD],
})
console.log(`Matched: ${target}`)
```

Once the first matching mutation occurs, the Promise resolves and the observation stops automatically — the internal observer is disconnected and all state is reset before the Promise settles. `isObserving` is `false` immediately after `await`:

```javascript
const instance = createDOMObserver()
const { node } = await instance.observeOnce('#foo')
console.log(instance.isObserving) // false — auto-cleared on resolution
```

Calling `disconnect()` after `observeOnce()` resolves is safe and is a no-op. If a `timeout` is set and elapses before any matching mutation, the Promise rejects with a `TimeoutError`.

#### `observeOnce` method arguments

| Props               | Type                       | Description                                                                                                                                              |
| ------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `target`            | Element, String, or Array  | DOM element, selector, or array of either. When an array is passed, resolves on the first match across all entries.                                      |
| `options`           | Object            | Options object:                                                                                                                                          |
| - `events`          | Array             | List of [events](#events) to observe (All events are observed by default)                                                                                |
| - `timeout`         | Number            | Duration (in ms) before rejecting the Promise with a `TimeoutError`. `0` disables the timeout. Must be `0` or a positive finite number — rejects with `InvalidTimeoutError` otherwise. |
| - `attributeFilter` | Array             | List of attribute names to observe (DOMObserverEvent.CHANGE event only)                                                                                       |
| - `signal`          | AbortSignal       | An `AbortSignal` to cancel the observation. If already aborted, the Promise rejects immediately with an `AbortError`.                                    |
| - `root`            | Element or String | DOM element or CSS selector to use as the observation root. Only mutations within this subtree are observed. Defaults to `document.documentElement`.     |
| - `filter`          | Function          | `(payload: EventPayload) => boolean`. Called before resolving the Promise. Return `false` to skip the event and keep waiting.                                 |

#### Resolved value

| Props             | Type                  | Description                                                                                          |
| ----------------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `node`            | Element               | The matching DOM element                                                                             |
| `event`           | String                | The event type that caused the Promise to settle                                                     |
| `target`          | Element, String, or undefined | The entry from the targets array that matched. `undefined` when a single target was passed. |
| `options`         | Object                | `ChangeOptions` for `CHANGE` events, absent (`never`) for all other events:                         |
| - `attributeName` | String                | Name of the attribute that changed                                                                   |
| - `oldValue`      | String or null        | Value of the attribute before the mutation                                                           |

#### Events

All observable event constants are exported from the `DOMObserverEvent` object.

| Props                | Description                                                                               |
|----------------------|-------------------------------------------------------------------------------------------|
| `DOMObserverEvent.EXIST`  | Observe whether the element is already present in the DOM at observation start            |
| `DOMObserverEvent.ADD`    | Observe when the element is added to the DOM                                              |
| `DOMObserverEvent.REMOVE` | Observe when the element is removed from the DOM                                          |
| `DOMObserverEvent.CHANGE` | Observe when an attribute has changed on the element                                      |
| `DOMObserverEvents` | Array of all four events                                                                  |

One or more events can be passed to the `events` option of `wait` or `watch`. By default, all events are observed.

```javascript
{ events: [DOMObserverEvent.ADD, DOMObserverEvent.REMOVE] }
{ events: DOMObserverEvents }
```

### Check observation state

The `isObserving` getter returns `true` when an observation is currently active:

```javascript
const instance = createDOMObserver()
instance.observe('#foo', ({ node, event }) => { /* ... */ })
console.log(instance.isObserving) // true
instance.disconnect()
console.log(instance.isObserving) // false
```

### TypeScript: typing observer instances

Use the exported `DOMObserverInstance` type to annotate variables that hold an observer:

```typescript
import { createDOMObserver, type DOMObserverInstance } from '@untemps/dom-observer'

let instance: DOMObserverInstance

function setup() {
    observer = createDOMObserver()
    instance.observe('#foo', ({ node }) => doSomething(node))
}
```

### Discard observation

Call the `disconnect()` method to stop the active observation. It returns `this`, allowing method chaining:

```javascript
instance.disconnect()

// Stop and immediately restart with a different target
instance.disconnect().observe('#bar', onEvent)
```

> **Note:** Calling `observeOnce()` or `observe()` on an instance that already has a pending `observeOnce()` Promise will automatically reject that Promise with an `ObservationAbortedError` before starting the new observation. Handle this rejection if necessary:
>
> ```javascript
> import { createDOMObserver, ObservationAbortedError } from '@untemps/dom-observer'
>
> const instance = createDOMObserver()
> instance.observeOnce('#foo').catch((err) => {
>     if (err instanceof ObservationAbortedError) return // replaced by a new observation
>     throw err
> })
> instance.observeOnce('#bar')  // previous promise is rejected with ObservationAbortedError
> instance.observe('#baz', onEvent)  // also rejects a pending observeOnce() promise with ObservationAbortedError
> ```

## Error classes

The library exports typed `Error` subclasses for reliable error handling with `instanceof` checks:

```typescript
import { createDOMObserver, DOMObserverEvent, TimeoutError, ObservationAbortedError } from '@untemps/dom-observer'

const instance = createDOMObserver()
try {
    await instance.observeOnce('#foo', { timeout: 500 })
} catch (e) {
    if (e instanceof TimeoutError) {
        console.log(`Timed out waiting for ${e.target} after ${e.timeout}ms`)
    } else if (e instanceof ObservationAbortedError) {
        // replaced by another observation
    }
}
```

| Class | Properties | Thrown by |
|---|---|---|
| `TimeoutError` | `target: DOMTarget \| DOMTarget[]`, `timeout: number` | `observeOnce()`, `observe()` when `timeout` elapses |
| `ObservationAbortedError` | — | `observeOnce()` when replaced by a new call |
| `InvalidEventsError` | — | `observeOnce()`, `observe()` when `events` array is empty |
| `InvalidTargetError` | `selector: string` | `observeOnce()`, `observe()` when `target` is an invalid CSS selector |
| `InvalidOptionsError` | — | Base class for all invalid-option errors; catch-all via `instanceof` |
| `InvalidTimeoutError` | — | `observeOnce()`, `observe()` when `timeout` is an invalid value (negative, `NaN`, `Infinity`); extends `InvalidOptionsError` |

## Example

```javascript
import { createDOMObserver, DOMObserverEvent } from '@untemps/dom-observer'

// Continuous observation with timeout
const onError = (err) => console.error(err.message)
const instance = createDOMObserver()
instance.observe(
    '.foo',
    ({ node, event, options }) => {
        switch (event) {
            case DOMObserverEvent.EXIST: {
                console.log('Element ' + node.id + ' exists already')
                break
            }
            case DOMObserverEvent.ADD: {
                console.log('Element ' + node.id + ' has been added')
                break
            }
            case DOMObserverEvent.REMOVE: {
                console.log('Element ' + node.id + ' has been removed')
                break
            }
            case DOMObserverEvent.CHANGE: {
                console.log('Element ' + node.id + ' has been changed (' + options?.attributeName + ')')
                break
            }
        }
    },
    {
        events: [DOMObserverEvent.EXIST, DOMObserverEvent.ADD, DOMObserverEvent.REMOVE, DOMObserverEvent.CHANGE],
        timeout: 2000,
        onError,
        attributeFilter: ['class'],
    }
)
```

## Development

A demo can be served for development purpose on `http://localhost:5173/` running:

```
yarn dev
```
