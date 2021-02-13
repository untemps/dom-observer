# @untemps/dom-observer

Class to observe DOM mutations with timeout support.

![npm](https://img.shields.io/npm/v/@untemps/dom-observer?style=for-the-badge)
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/untemps/dom-observer/deploy?style=for-the-badge)
![Codecov](https://img.shields.io/codecov/c/github/untemps/dom-observer?style=for-the-badge)

## Installation

```bash
yarn add @untemps/dom-observer
```

## Usage

Import `DomObserver`:

```javascript
import { DomObserver } from '@untemps/dom-observer'
```

Create an instance of `DomObserver`:

```javascript
const observer = new DomObserver()
```

Call the `wait` async method with a selector and a optional timeout value (default: 1000ms) to initiate the observation:

```javascript
await observer.wait('.content')
```

Call the `unwait` method to discard observation:

```javascript
await observer.unwait()
```