# @untemps/dom-observer

Class to observe DOM mutations of a specific element.

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

### Wait for an element to be added, removed or changed in the DOM

Call the `wait` method with the selector of the element you want to target, a callback function and an optional object to initiate the observation.

Once the element is added to, removed from or changed in the DOM, the callback function is triggered with various number of arguments depending on the observed event.

#### Example

```javascript
import { DOMObserver } from '@untemps/dom-observer'

const observer = new DOMObserver()
const onEvent = (node, event, { attributeName, oldValue } = {}) => {
	switch (event) {
		case DOMObserver.ADD: {
			console.log('Element ' + el.id + 'has been added')
		}
		case DOMObserver.CHANGE: {
			console.log('Element ' + el.id + 'has been changed (' + attributeName + ')')
		}
	}
}
observer.wait('#foo', onEvent, {events: [DOMObserver.ADD, DOMObserver.CHANGE]})
```

#### `wait` method arguments

| Props                | Type       | Description                                                                                                                              |
| -------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `selector`           | String     | Selector of the element to observe. See [querySelector spec](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector)    |
| `onEvent`            | Function   | Callback triggered when an event occurred with the observed element (depending on the events listed in `events` option                   |
| `options        `    | Object     | Options object:                                                                                                                          |
| - `events`           | Array      | List of events to observe (All events are observed by default)                                                                           |
| - `timeout`          | Number     | Duration of observation before triggering the onError callback  (DOMObserver.ADD event only)                                             |
| - `onError`          | Function   | Callback triggered when timeout elapsed (DOMObserver.ADD event only)                                                                     |
| - `attributeFilter`  | Array      | List of attribute names to observe (DOMObserver.CHANGE event only)                                                                       |

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

const onEvent = (node, event, { attributeName, oldValue } = {}) => {
	switch (event) {
		case DOMObserver.ADD: {
			console.log('Element ' + el.id + 'has been added')
		}
		case DOMObserver.REMOVE: {
			console.log('Element ' + el.id + 'has been removed')
		}
		case DOMObserver.CHANGE: {
			console.log('Element ' + el.id + 'has been changed (' + attributeName + ')')
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
