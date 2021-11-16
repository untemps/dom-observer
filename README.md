# @untemps/dom-observer

Class to observe DOM mutations of a specific element in one-shot or continuous mode.

![npm](https://img.shields.io/npm/v/@untemps/dom-observer?style=for-the-badge)
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/untemps/dom-observer/deploy?style=for-the-badge)
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

### Wait for an element to be added to, removed from or changed in the DOM

Two observation modes are available :

- One-shot: Get a promise from the `wait` method to observe a mutation once.
- Continuous: Register a callback in the `wait` method and be notified every time a mutation you declare to be observed occurs.

To switch from one mode to another, you just have to pass a callback as second parameter to turn continuous mode on or leave it null to get a promise.

##### Continuous mode
Call the `wait` method with the selector of the element you want to target, a callback function and an optional object to initiate the observation.

Once the element is added to, removed from or changed in the DOM, the callback function is triggered with various number of arguments depending on the observed event.

```javascript
import { DOMObserver } from '@untemps/dom-observer'

const observer = new DOMObserver()
const onEvent = (node, event, { attributeName } = {}) => {
	switch (event) {
		case DOMObserver.REMOVE: {
			console.log('Element ' + node.id + 'has been removed')
		}
		case DOMObserver.CHANGE: {
			console.log('Element ' + node.id + 'has been changed (' + attributeName + ')')
		}
	}
}
observer.wait('#foo', onEvent, {events: [DOMObserver.ADD, DOMObserver.REMOVE]})
```

##### One-shot mode

Call the `wait` method with the selector of the element you want to target, null as second parameter and an optional object to initiate the observation.

Once the element is added to, removed from or changed in the DOM, the promise is resolved with various number of arguments depending on the observed event.

In this method, if the element is not added before the timeout elapses, the promise will be rejected with an error object.

```javascript
import { DOMObserver } from '@untemps/dom-observer'

const observer = new DOMObserver()
const { node, event, options: { attributeName } } = observer.wait('#foo', null, {events: [DOMObserver.REMOVE, DOMObserver.CHANGE]})
switch (event) {
	case DOMObserver.REMOVE: {
		console.log('Element ' + node.id + 'has been removed')
	}
	case DOMObserver.CHANGE: {
		console.log('Element ' + node.id + 'has been changed (' + attributeName + ')')
	}
}
```

#### `wait` method arguments

| Props                | Type                 | Description                                                                                                                                                                                                  |
| -------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `selector`           | String               | Selector of the element to observe. See [querySelector spec](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector)                                                                        |
| `onEvent`            | Function or `null`   | Callback triggered when an event occurred with the observed element (depending on the events listed in `events` option. Pass `null` to activate one-shot mode and retrieve a promise from the method         |
| `options        `    | Object               | Options object:                                                                                                                                                                                              |
| - `events`           | Array                | List of events to observe (All events are observed by default)                                                                                                                                               |
| - `timeout`          | Number               | Duration of observation before triggering the onError callback  (DOMObserver.ADD event only)                                                                                                                 |
| - `onError`          | Function             | Callback triggered when timeout elapses (DOMObserver.ADD event only)                                                                                                                                         |
| - `attributeFilter`  | Array                | List of attribute names to observe (DOMObserver.CHANGE event only)                                                                                                                                           |

#### `onEvent` arguments

| Props              | Type     | Description                                                                                                                                  |
| ------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `node`             | Node     | Observed element node                                                                                                                        |
| `event`            | String   | Event that triggered the callback                                                                                                            |
| `options        `  | Object   | Options object:                                                                                                                              |
| - `attributeName`  | String   | Name of the attribute that has changed (DOMObserver.CHANGE event only)                                                                       |
| - `oldValue`       | Any      | Old value of the attribute that has changed (DOMObserver.CHANGE event only)                                                                  |

#### `onError` arguments

| Props              | Type     | Description                                                                                                                                  |
| ------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `error`            | Error    | Error thrown                                                                                                                                 |

#### Events

DOMObserver static properties list all observable events.

| Props                 | Description                                                                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DOMObserver.ADD`     | Observe when the element is added to the DOM                                                                                                         |
| `DOMObserver.REMOVE`  | Observe when the element is removed from the DOM                                                                                                     |
| `DOMObserver.CHANGE`  | Observe when an attribute has changed on the element                                                                                                 |
| `DOMObserver.EVENTS`  | Array of all three events                                                                                                                            |

One or more events can be passed to the `events` option of the  `wait` method. By default, all events are observed.

```javascript
{ events: [DOMObserver.ADD, DOMObserver.REMOVE] }
{ events: DOMObserver.EVENTS }
```

### Discard observation

Call the `clear` method to discard observation:

```javascript
await observer.clear()
```

## Example

```javascript
import { DOMObserver } from '@untemps/dom-observer'

const onEvent = (node, event, { attributeName } = {}) => {
	switch (event) {
		case DOMObserver.ADD: {
			console.log('Element ' + node.id + 'has been added')
		}
		case DOMObserver.REMOVE: {
			console.log('Element ' + node.id + 'has been removed')
		}
		case DOMObserver.CHANGE: {
			console.log('Element ' + node.id + 'has been changed (' + attributeName + ')')
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
    	events: [DOMObserver.ADD, DOMObserver.REMOVE, DOMObserver.CHANGE],
        timeout: 2000,
        onError,
        attributeFilter: ['class']
    }
)
```

## Development

A demo can be served for development purpose on `http://localhost:10001/` running:

```
yarn dev
```
