# @untemps/dom-observer

Class to observe addition of a specific element to the DOM with timeout support.

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
Once the element is added to the DOM, the promise is resolved with the element.

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

const init = async () => {
    try {
        const observer = new DOMObserver()
        const el = await observer.wait('.content', 500)
        console.log(el.textContent) // Element was found, you get access to its API
    } catch(error) {
        console.log(err.message) // Element was not found after timeout
    }
}
init()
```