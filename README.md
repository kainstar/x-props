# x-props

A expression props evaluate component generator.

You can use it in your low-code renderer or other scenes.

[![npm package][npm-img]][npm-url] [![Build Status][build-img]][build-url] [![Downloads][downloads-img]][downloads-url] [![Issues][issues-img]][issues-url] [![Code Coverage][codecov-img]][codecov-url] [![Commitizen Friendly][commitizen-img]][commitizen-url] [![Semantic Release][semantic-release-img]][semantic-release-url]

## Install

```bash
npm install x-props
yarn add x-props
pnpm add x-props
```

## Usage

```tsx
import { xProps } from 'x-props';

const XYourComp = xProps()(YourComp);

<XYourComp
  x-props={{
    className: '{{ $props["data-classname"] }}',
  }}
  data-classname="x-props-comp"
/>

// render to:
<YourComp
  className="x-props-comp"
  data-classname="x-props-comp"
>
```

## Options

### engine

Engine is used to analysis and excute expression. x-props use built-in `{{ }}` template syntax and `new Function` to analysis and excute expression. If you have more security needs, you can use your own engine.

### propsMerge

Props merge function. You can use it to custom merge category

### useXValue

Custom context value provider hooks, return a object which will be used by engine. By default, it only pass component raw props (expect `x-props` prop) as `$props` object.

## Add custom avaliable value

If you want add component self's state and other value in your component, use `useXValue` option.

```tsx
const XInput = xProps({
  useXValue: (props) => {
    const [state, setState] = React.useState({});
    // other your react hooks
    return {
      $props: props,
      $state: {
        value: state,
        set: setState,
      },
    };
  },
})('input');
```

Now you can access `$state` in your expression string:

```tsx
const result = render(
  <XInput
    x-props={{
      className: '{{ $state.value.className }}',
      onChange: '{{ (e) => $state.set({ className: e.target.value }) }}',
    }}
  />
);
```

[build-img]: https://github.com/kainstar/x-props/actions/workflows/release.yml/badge.svg
[build-url]: https://github.com/kainstar/x-props/actions/workflows/release.yml
[downloads-img]: https://img.shields.io/npm/dt/@kainstar/x-props
[downloads-url]: https://www.npmtrends.com/@kainstar/x-props
[npm-img]: https://img.shields.io/npm/v/@kainstar/x-props
[npm-url]: https://www.npmjs.com/package/@kainstar/x-props
[issues-img]: https://img.shields.io/github/issues/kainstar/x-props
[issues-url]: https://github.com/kainstar/x-props/issues
[codecov-img]: https://codecov.io/gh/kainstar/x-props/branch/main/graph/badge.svg
[codecov-url]: https://codecov.io/gh/kainstar/x-props
[semantic-release-img]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-release-url]: https://github.com/semantic-release/semantic-release
[commitizen-img]: https://img.shields.io/badge/commitizen-friendly-brightgreen.svg
[commitizen-url]: http://commitizen.github.io/cz-cli/
