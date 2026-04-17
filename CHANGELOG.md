## [4.0.3](https://github.com/untemps/dom-observer/compare/v4.0.2...v4.0.3) (2026-04-17)


### Bug Fixes

* Restrict CHANGE-only observer optimization to Element references ([#59](https://github.com/untemps/dom-observer/issues/59)) ([63d5369](https://github.com/untemps/dom-observer/commit/63d5369b31cda3f6cd441a0da4d33718ce707f9b))

## [4.0.2](https://github.com/untemps/dom-observer/compare/v4.0.1...v4.0.2) (2026-04-15)


### Bug Fixes

* Throw [TARGET] error on invalid CSS selector instead of propagating SyntaxError ([#58](https://github.com/untemps/dom-observer/issues/58)) ([60fed6f](https://github.com/untemps/dom-observer/commit/60fed6f9ee6b20ad3b2a0670b846e07e877921b0))

## [4.0.1](https://github.com/untemps/dom-observer/compare/v4.0.0...v4.0.1) (2026-04-15)


### Bug Fixes

* Disconnect observer and clear timeout after wait() resolves ([#57](https://github.com/untemps/dom-observer/issues/57)) ([08f9251](https://github.com/untemps/dom-observer/commit/08f925161ddfd1f4254cc0120777bd969ac27a67))

# [4.0.0](https://github.com/untemps/dom-observer/compare/v3.1.0...v4.0.0) (2026-04-03)


### Features

* Move timeout/onError to watch(), remove continuous mode from wait() ([#34](https://github.com/untemps/dom-observer/issues/34)) ([2eaef59](https://github.com/untemps/dom-observer/commit/2eaef59851d4e254cb99f7b226cab0cfd35c698f))


### BREAKING CHANGES

* wait() no longer accepts an onEvent callback. Use watch() instead.
* onError removed from WaitOptions; moved to WatchOptions.

# [3.1.0](https://github.com/untemps/dom-observer/compare/v3.0.0...v3.1.0) (2026-04-03)


### Features

* Migrate project to TypeScript ([#33](https://github.com/untemps/dom-observer/issues/33)) ([e14496a](https://github.com/untemps/dom-observer/commit/e14496a573a2fef51410b78702ab4a736ec4fbc1))

# [3.0.0](https://github.com/untemps/dom-observer/compare/v2.1.0...v3.0.0) (2026-04-02)


### Bug Fixes

* Trigger major version bump for breaking changes ([3836c92](https://github.com/untemps/dom-observer/commit/3836c9204306a365610fe9145afead26723e3aa4))


### BREAKING CHANGES

* watch() is a new dedicated method for recurring
mutations. wait() with a callback still works but watch() is the
preferred API going forward.
* AbortSignal support added to both wait() and watch().
Passing an already-aborted signal to wait() now rejects immediately
with an AbortError instead of starting observation.

# [2.1.0](https://github.com/untemps/dom-observer/compare/v2.0.6...v2.1.0) (2026-04-02)


### Features

* Add AbortSignal support to wait() and watch() ([#30](https://github.com/untemps/dom-observer/issues/30)) ([2e26fcb](https://github.com/untemps/dom-observer/commit/2e26fcbe95b0dcee644ae2a6385caa893ee3209f))
* Add watch() method for recurring mutation callbacks ([#29](https://github.com/untemps/dom-observer/issues/29)) ([2366741](https://github.com/untemps/dom-observer/commit/2366741ee318a42d834b99548b85bd4a02c478d9))

# [3.0.0-beta.2](https://github.com/untemps/dom-observer/compare/v3.0.0-beta.1...v3.0.0-beta.2) (2026-04-02)


### Features

* Add AbortSignal support to wait() and watch() ([#30](https://github.com/untemps/dom-observer/issues/30)) ([17406c2](https://github.com/untemps/dom-observer/commit/17406c2aecfe2f26673c0baff7afcbbd5624d4ed))

# [3.0.0-beta.1](https://github.com/untemps/dom-observer/compare/v2.1.0-beta.1...v3.0.0-beta.1) (2026-04-02)


### Bug Fixes

* Flag watch() as breaking change for correct semver bump ([4a74e47](https://github.com/untemps/dom-observer/commit/4a74e478aae44ef3d1078d50bf84f0c03f67577a))


### BREAKING CHANGES

* watch() shares the observer slot with wait().
Calling watch() rejects any pending wait() Promise with [ABORT]
and stops any ongoing observation.
Use separate instances for parallel observations.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>

# [2.1.0-beta.1](https://github.com/untemps/dom-observer/compare/v2.0.6...v2.1.0-beta.1) (2026-04-02)


### Features

* Add watch() method for recurring mutation callbacks ([#29](https://github.com/untemps/dom-observer/issues/29)) ([7376e8b](https://github.com/untemps/dom-observer/commit/7376e8bb7cd0de787a32d409b15c7b7f02e80542))

## [2.0.6](https://github.com/untemps/dom-observer/compare/v2.0.5...v2.0.6) (2026-04-02)


### Bug Fixes

* Reject pending Promise when wait() is called again ([#26](https://github.com/untemps/dom-observer/issues/26)) ([7c60776](https://github.com/untemps/dom-observer/commit/7c6077699f8fbbbde91f95c1a6481899ef7dcb91))

## [2.0.5](https://github.com/untemps/dom-observer/compare/v2.0.4...v2.0.5) (2026-04-02)


### Performance Improvements

* Observe element directly when only CHANGE events are watched ([#25](https://github.com/untemps/dom-observer/issues/25)) ([64ae8d6](https://github.com/untemps/dom-observer/commit/64ae8d63ceae14f58003207b49c8e88572c2d73e))

## [2.0.4](https://github.com/untemps/dom-observer/compare/v2.0.3...v2.0.4) (2026-04-02)


### Bug Fixes

* Remove redundant double negation on el ([#24](https://github.com/untemps/dom-observer/issues/24)) ([d6f0fbb](https://github.com/untemps/dom-observer/commit/d6f0fbb58fc451f2fd28f8b0167a041e38b2944e))

## [2.0.3](https://github.com/untemps/dom-observer/compare/v2.0.2...v2.0.3) (2026-04-02)


### Performance Improvements

* Eliminate redundant Array.from conversions in childList handler ([#22](https://github.com/untemps/dom-observer/issues/22)) ([4744c3c](https://github.com/untemps/dom-observer/commit/4744c3c445c61dca2192e84fc099818c7bb086ca))

## [2.0.2](https://github.com/untemps/dom-observer/compare/v2.0.1...v2.0.2) (2026-04-01)


### Performance Improvements

* Precompute event flag checks outside MutationObserver callback ([#21](https://github.com/untemps/dom-observer/issues/21)) ([ac0dc81](https://github.com/untemps/dom-observer/commit/ac0dc8150247862caf8a322fcccfe6189ae24d0a))

## [2.0.1](https://github.com/untemps/dom-observer/compare/v2.0.0...v2.0.1) (2026-04-01)


### Bug Fixes

* Validate events array is not empty with explicit error ([#20](https://github.com/untemps/dom-observer/issues/20)) ([7070d6b](https://github.com/untemps/dom-observer/commit/7070d6bcfbec2f4b5c0277aa72d618f3519854a4))

# [2.0.0](https://github.com/untemps/dom-observer/compare/v1.2.0...v2.0.0) (2022-01-10)


### Bug Fixes

* Change node with selector matching to be more consistent and fix issue with matches is not a function ([d02b839](https://github.com/untemps/dom-observer/commit/d02b83917fe82a18b21c945109c9602425ecb42a))
* Fix console error when target is a DOM element ([390d42f](https://github.com/untemps/dom-observer/commit/390d42f5181a3b77fd79724fb406dd59b9d23f58))
* Fix console error when target is a DOM element - new attempt ([8260eb4](https://github.com/untemps/dom-observer/commit/8260eb45abede1845eb14088d3ec6ab009752210))


### Code Refactoring

* Refactor wait method in-depth and merge into watch method ([ac2bc0a](https://github.com/untemps/dom-observer/commit/ac2bc0a06f5fe4537fd43371bcd651fcd3924f41))


### Features

* Add exist event ([#13](https://github.com/untemps/dom-observer/issues/13)) ([79faa5e](https://github.com/untemps/dom-observer/commit/79faa5e4b91f5fb9c59eae32afcc3914e939efcd))
* Allow to target a DOM element directly ([5467b6a](https://github.com/untemps/dom-observer/commit/5467b6a0647aad14971a5707f4a55b7a89a8fd4c))
* Allow to trigger observation event with promise resolution ([1f774be](https://github.com/untemps/dom-observer/commit/1f774be690ad49d855735d96750f2e2cee0be017))


### BREAKING CHANGES

* The signature of the wait method has changed and the watch method has been removed

# [2.0.0-beta.7](https://github.com/untemps/dom-observer/compare/v2.0.0-beta.6...v2.0.0-beta.7) (2022-01-07)


### Features

* Add exist event ([#13](https://github.com/untemps/dom-observer/issues/13)) ([a636cdf](https://github.com/untemps/dom-observer/commit/a636cdfdb8f372f3c551b6f9c42474c6da211f05))

# [2.0.0-beta.6](https://github.com/untemps/dom-observer/compare/v2.0.0-beta.5...v2.0.0-beta.6) (2021-12-02)


### Bug Fixes

* Fix console error when target is a DOM element - new attempt ([5e0eb6c](https://github.com/untemps/dom-observer/commit/5e0eb6c650d8c3f17ae11909c6d062a82795c062))

# [2.0.0-beta.5](https://github.com/untemps/dom-observer/compare/v2.0.0-beta.4...v2.0.0-beta.5) (2021-12-01)


### Bug Fixes

* Fix console error when target is a DOM element ([023fc60](https://github.com/untemps/dom-observer/commit/023fc60edb8ef224c8e650dfe6079a4c6092fa1a))

# [2.0.0-beta.4](https://github.com/untemps/dom-observer/compare/v2.0.0-beta.3...v2.0.0-beta.4) (2021-11-30)


### Features

* Allow to target a DOM element directly ([2b9c5b5](https://github.com/untemps/dom-observer/commit/2b9c5b5c1af74c96266d5779b4915e9c222377a4))

# [2.0.0-beta.3](https://github.com/untemps/dom-observer/compare/v2.0.0-beta.2...v2.0.0-beta.3) (2021-11-16)


### Features

* Allow to trigger observation event with promise resolution ([4e22343](https://github.com/untemps/dom-observer/commit/4e22343d2a90f23c8d362de2d5ea5a4efb3e1883))

# [2.0.0-beta.2](https://github.com/untemps/dom-observer/compare/v2.0.0-beta.1...v2.0.0-beta.2) (2021-11-04)


### Bug Fixes

* Change node with selector matching to be more consistent and fix issue with matches is not a function ([3dceec7](https://github.com/untemps/dom-observer/commit/3dceec73fafe13dc502a36ad94240ee743a4dbb0))

# [2.0.0-beta.1](https://github.com/untemps/dom-observer/compare/v1.2.0...v2.0.0-beta.1) (2021-11-03)


### Code Refactoring

* Refactor wait method in-depth and merge into watch method ([7213938](https://github.com/untemps/dom-observer/commit/72139380db9fcec0f5d622c59146db3d112d6795))


### BREAKING CHANGES

* The signature of the wait method has changed and the watch method has been removed

# [1.2.0](https://github.com/untemps/dom-observer/compare/v1.1.0...v1.2.0) (2021-03-14)


### Features

* Add element modification support ([#11](https://github.com/untemps/dom-observer/issues/11)) ([e06e05a](https://github.com/untemps/dom-observer/commit/e06e05a01922f64666ae59d33d02ec6d1943e9ab))

# [1.1.0](https://github.com/untemps/dom-observer/compare/v1.0.1...v1.1.0) (2021-02-27)


### Features

* Add support for element removal ([#7](https://github.com/untemps/dom-observer/issues/7)) ([58f9e13](https://github.com/untemps/dom-observer/commit/58f9e13a277f5b998cfe49cb68d05ad2fd30d6a1))

## [1.0.1](https://github.com/untemps/dom-observer/compare/v1.0.0...v1.0.1) (2021-02-19)

# 1.0.0 (2021-02-13)


### Features

* Initialize project ([530db1c](https://github.com/untemps/dom-observer/commit/530db1c1b78a36f60ea77b2bc3d660c1fbba6176))
