# @untemps/dom-observer

Class to observe DOM mutations of a specific element in one-shot or continuous mode.

The class is a wrapper around the MutationObserver API to target an element in particular.  
That means you can observe an element to be added to the DOM and access to its properties, an attribute from that element to be changed and get the old and the new values, the element to be removed from the DOM and destroy all its dependencies.

![npm](https://img.shields.io/npm/v/@untemps/dom-observer?style=for-the-badge)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/untemps/dom-observer/publish.yml?style=for-the-badge)](https://github.com/untemps/dom-observer/actions)
![Codecov](https://img.shields.io/codecov/c/github/untemps/dom-observer?style=for-the-badge)

## Installation

```bash
yarn add @untemps/dom-observer
```

## Usage

Import `DOMObserver`:

```javascript
import { DOMObserver } from '@untemps/dom-observer'
```

Create an instance of `DOMObserver`:

```javascript
const observer = new DOMObserver()
```

### Watch for recurring mutations

Use the `watch` method when you want to be notified **every time** a mutation occurs — for instance, tracking all successive attribute changes on an element or reacting to every matching node added to the DOM.

```javascript
import { DOMObserver } from '@untemps/dom-observer'

// Track every attribute change on an element
const observer = new DOMObserver()
observer.watch('#foo', (node, event, { attributeName, oldValue } = {}) => {
	console.log(`${attributeName} changed from ${oldValue} to ${node.getAttribute(attributeName)}`)
}, { events: [DOMObserver.CHANGE] })

// React to every matching node added or removed
const listObserver = new DOMObserver()
listObserver.watch('.list-item', (node, event) => {
	if (event === DOMObserver.ADD) console.log(`Item added: ${node.textContent}`)
	if (event === DOMObserver.REMOVE) console.log(`Item removed: ${node.textContent}`)
}, { events: [DOMObserver.ADD, DOMObserver.REMOVE] })
```

Unlike `wait`, `watch` does not return a Promise and has no timeout. It returns `this`, allowing method chaining. Call `clear()` to stop the observation.

#### `watch` method arguments

| Props               | Type              | Description                                                                                                                                              |
| ------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `target`            | Element or String | DOM element or selector of the DOM element to observe. See [querySelector spec](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector) |
| `onEvent`           | Function          | Callback triggered each time an event occurs on the observed element                                                                                    |
| `options`           | Object            | Options object:                                                                                                                                          |
| - `events`          | Array             | List of [events](#events) to observe (All events are observed by default)                                                                                |
| - `attributeFilter` | Array             | List of attribute names to observe (DOMObserver.CHANGE event only)                                                                                       |
| - `signal`          | AbortSignal       | An `AbortSignal` to stop the observation. If already aborted, `watch()` returns immediately without observing. |

### Wait for a one-shot mutation

Two observation modes are available for `wait`:

- One-shot (default): Get a promise resolved on the first matching mutation.
- Continuous: Pass a callback to be notified on every matching mutation (same as `watch` with timeout support).

##### One-shot mode

Call the `wait` method with the element or the selector of the element you want to target, `null` as second parameter and an optional object to initiate the observation.

Once the element is added to, removed from or changed in the DOM, the promise is resolved. If the element is not found before the timeout elapses, the promise is rejected.

```javascript
import { DOMObserver } from '@untemps/dom-observer'

const observer = new DOMObserver()
const { node, event, options: { attributeName } } = await observer.wait('#foo', null, {events: [DOMObserver.REMOVE, DOMObserver.CHANGE]})
switch (event) {
	case DOMObserver.REMOVE: {
		console.log('Element ' + node.id + 'has been removed')
		break
	}
	case DOMObserver.CHANGE: {
		console.log('Element ' + node.id + 'has been changed (' + attributeName + ')')
		break
	}
}
```

##### Continuous mode

Call the `wait` method with a callback as second parameter. The callback is triggered on every matching mutation (equivalent to `watch` but with timeout support).

```javascript
import { DOMObserver } from '@untemps/dom-observer'

const observer = new DOMObserver()
const onEvent = (node, event, { attributeName } = {}) => {
	switch (event) {
		case DOMObserver.REMOVE: {
			console.log('Element ' + node.id + 'has been removed')
			break
		}
		case DOMObserver.CHANGE: {
			console.log('Element ' + node.id + 'has been changed (' + attributeName + ')')
			break
		}
	}
}
observer.wait('#foo', onEvent, {events: [DOMObserver.ADD, DOMObserver.REMOVE]})
```

#### `wait` method arguments

| Props                | Type                 | Description                                                                                                                                                                                          |
| -------------------- | -------------------- |------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `target`             | Element or String    | DOM element or selector of the DOM element to observe. See [querySelector spec](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector)                                             |
| `onEvent`            | Function or `null`   | Callback triggered when an event occurred with the observed element (depending on the events listed in `events` option. Pass `null` to activate one-shot mode and retrieve a promise from the method |
| `options        `    | Object               | Options object:                                                                                                                                                                                      |
| - `events`           | Array                | List of [events](#events) to observe (All events are observed by default)                                                                                                                            |
| - `timeout`          | Number               | Duration (in ms) of observation before triggering the onError callback. If elapsed with no matching mutation, the promise is rejected (one-shot mode) or `onError` is called (continuous mode)      |
| - `onError`          | Function             | Callback triggered when timeout elapses (continuous mode only)                                                                                                                                       |
| - `attributeFilter`  | Array                | List of attribute names to observe (DOMObserver.CHANGE event only)                                                                                                                                   |
| - `signal`           | AbortSignal          | An `AbortSignal` to cancel the observation. If already aborted, the Promise rejects immediately with an `AbortError`. |

#### `onEvent` arguments

| Props              | Type     | Description                                                                                                                                  |
| ------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `node`             | Node     | Observed element node                                                                                                                        |
| `event`            | String   | Event that triggered the callback                                                                                                            |
| `options        `  | Object   | Options object:                                                                                                                              |
| - `attributeName`  | String   | Name of the attribute that has changed (DOMObserver.CHANGE event only)                                                                       |
| - `oldValue`       | String or null | Old value of the attribute that has changed (DOMObserver.CHANGE event only)                                                           |

#### `onError` arguments

| Props              | Type     | Description                                                                                                                                  |
| ------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `error`            | Error    | Error thrown                                                                                                                                 |

#### Events

DOMObserver static properties list all observable events.

| Props                | Description                                                                               |
|----------------------|-------------------------------------------------------------------------------------------|
| `DOMObserver.EXIST`  | Observe whether the element is already present in the DOM at observation start           |
| `DOMObserver.ADD`    | Observe when the element is added to the DOM                                              |
| `DOMObserver.REMOVE` | Observe when the element is removed from the DOM                                          |
| `DOMObserver.CHANGE` | Observe when an attribute has changed on the element                                      |
| `DOMObserver.EVENTS` | Array of all four events                                                                  |

One or more events can be passed to the `events` option of the  `wait` method. By default, all events are observed.

```javascript
{ events: [DOMObserver.ADD, DOMObserver.REMOVE] }
{ events: DOMObserver.EVENTS }
```

### Check observation state

The `isObserving` getter returns `true` when an observation is currently active:

```javascript
const observer = new DOMObserver()
observer.watch('#foo', (node, event) => { /* ... */ })
console.log(observer.isObserving) // true
observer.clear()
console.log(observer.isObserving) // false
```

### Discard observation

Call the `clear` method to discard observation:

```javascript
observer.clear()
```

> **Note:** Calling `wait()` on an instance that already has a pending Promise (one-shot mode) will automatically reject the previous Promise with an `[ABORT]` error before starting the new observation. Handle this rejection if necessary:
>
> ```javascript
> const observer = new DOMObserver()
> observer.wait('#foo').catch((err) => {
>     if (err.message.startsWith('[ABORT]')) return // replaced by a new wait() call
>     throw err
> })
> observer.wait('#bar') // previous promise is rejected with [ABORT]
> ```

## Example

```javascript
import { DOMObserver } from '@untemps/dom-observer'

const onEvent = (node, event, { attributeName } = {}) => {
	switch (event) {
		case DOMObserver.EXIST: {
			console.log('Element ' + node.id + 'exists already')
			break
		}
		case DOMObserver.ADD: {
			console.log('Element ' + node.id + 'has been added')
			break
		}
		case DOMObserver.REMOVE: {
			console.log('Element ' + node.id + 'has been removed')
			break
		}
		case DOMObserver.CHANGE: {
			console.log('Element ' + node.id + 'has been changed (' + attributeName + ')')
			break
		}
	}
}
const onError = (err) => {
	console.error(err.message)
}
const observer = new DOMObserver()
observer.wait(
    '.foo',
    onEvent,
    {
    	events: [DOMObserver.EXIST, DOMObserver.ADD, DOMObserver.REMOVE, DOMObserver.CHANGE],
        timeout: 2000,
        onError,
        attributeFilter: ['class']
    }
)
```

## Development

A demo can be served for development purpose on `http://localhost:5173/` running:

```
yarn dev
```
