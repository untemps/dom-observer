# @untemps/dom-observer

Class to observe when a specific element is added to or removed from the DOM.  
It can also watch for attribute modifications on a specific element.

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

### Wait for an element to be added to or removed from the DOM

Call the `wait` async method with the selector of the element you want to target, and an optional timeout value (default: 1000ms) to initiate the observation.

Once the element is added to or removed from the DOM, the promise is resolved with the element that has been added or removed.

#### Example

```javascript
import { DOMObserver } from '@untemps/dom-observer'

const domObserver = new DOMObserver()
domObserver
	.wait('#foo', 2000)
	.then((el) => {
		console.log('Element ' + el.id + ' [added|removed]')
	})
	.catch((err) => console.log(err))
```

### Watch for attribute modifications on a specific element

Call the `watch` async method with the selector of the element you want to target, an optional options object (see below) and an optional timeout value to initiate the observation.

If the timeout value is set to 0, observation will keep running until a change is made or the `clear` method is explicitly called.

Once a modification occurs, the promise is resolved with an object containing the following properties:

| Props           | Type   | Description                                       |
| --------------- | ------ | ------------------------------------------------- |
| `target`        | Node   | Node whose children changed                       |
| `attributeName` | String | Local name of the modified attribute              |
| `oldValue`      | String | Value of the modified attribute before the change |

#### Options object

| Props            | Type  | Description                                                                                                    |
| ---------------- | ----- | -------------------------------------------------------------------------------------------------------------- |
| `attributeNames` | Array | List of the attributes you want to watch for modifications (all other attribute changes will be ignored)       |

#### Example

```javascript
import { DOMObserver } from '@untemps/dom-observer'

const domObserver = new DOMObserver()
domObserver
	.watch(`#foo`, { attributeNames: ['class'] }, 2000)
	.then(({ target, attributeName, oldValue }) => {
		const newValue = target.getAttribute(attributeName)
		console.log(`${attributeName} attribute of ${target.id} has been changed from ${oldValue} to ${newValue}`)
	})
	.catch((err) => console.log(err))
```

### Discard waiting or watching

Call the `clear` method to discard observation:

```javascript
await observer.clear()
```

## Development

A demo can be served for development purpose on `http://localhost:10001/` running:

```
yarn dev
```
