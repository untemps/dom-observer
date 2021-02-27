# @untemps/dom-observer

Class to observe addition or removal of a specific element to/from the DOM with timeout support.

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

Call the `wait` async method with the selector of the element you want to target, and an optional timeout value (default: 1000ms) to initiate the observation:
Once the element is added or removed to/from the DOM, the promise is resolved with the element.

```javascript
const el = await observer.wait('.content')
```

Call the `unwait` method to discard observation:

```javascript
await observer.unwait()
```

## Example

```javascript
import { DOMObserver } from '@untemps/dom-observer'

const domObserver = new DOMObserver()
domObserver
    .wait('#foo')
    .then((el) => {
    	console.log('Element ' + el.id + ' [added|removed]')
    })
    .catch((err) => console.log(err))
```

## Development

A demo can be served for development purpose on `http://localhost:10001/` running:

```
yarn dev
```