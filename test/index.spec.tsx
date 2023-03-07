import React from 'react';
import mergeWith from 'lodash.mergewith';

import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { xProps } from '../src';

describe('Library', () => {
  afterEach(cleanup);

  it('safe on no x-props', () => {
    const XInput = xProps()('input');

    const result = render(<XInput data-testid="x-input" />);

    expect(result.getByTestId('x-input')).toBeDefined();
  });

  it('evaluate x-props and pass to for element', () => {
    const XInput = xProps()('input');

    const result = render(
      <XInput
        x-props={{
          className: '{{ $props["data-testid"] }}',
        }}
        data-testid="x-input"
      />
    );

    expect(result.getByTestId('x-input').getAttribute('class')).toBe('x-input');
  });

  it('evaluate x-props and pass to for component', () => {
    const Input: React.FC<{
      className: string;
    }> = (props) => {
      const { className, ...rest } = props;
      return <input className={'component-prefix-' + className} {...rest} />;
    };

    const XInput = xProps()(Input);

    const result = render(
      <XInput
        x-props={{
          className: '{{ $props["data-testid"] }}',
        }}
        data-testid="x-input"
      />
    );

    expect(result.getByTestId('x-input').getAttribute('class')).toBe('component-prefix-x-input');
  });

  it('passThrough non-evaluate value', () => {
    const XInput = xProps()('input');

    const result = render(
      <XInput
        x-props={{
          className: 'custom-className',
        }}
        data-testid="x-input"
      />
    );

    expect(result.getByTestId('x-input').getAttribute('class')).toBe('custom-className');
  });

  it('nesting prop evaluate and source value is not modified', () => {
    const Input: React.FC<
      React.InputHTMLAttributes<HTMLInputElement> & {
        source: {
          className: string;
          classNameArray: string[];
        };
      }
    > = (props) => {
      const { source, ...rest } = props;
      return <input className={source.className + ' ' + source.classNameArray.join(' ')} {...rest} />;
    };
    const XInput = xProps()(Input);

    const source = {
      source: {
        className: '{{ $props["data-testid"] }}',
        classNameArray: ['{{ $props["data-testid"] + "-1" }}', '{{ $props["data-testid"] + "-2" }}'],
      },
    };

    const result = render(<XInput x-props={source} data-testid="x-input" />);

    expect(result.getByTestId('x-input').getAttribute('class')).toBe('x-input x-input-1 x-input-2');
    expect(source.source.className).toBe('{{ $props["data-testid"] }}');
    expect(source.source.classNameArray).toEqual([
      '{{ $props["data-testid"] + "-1" }}',
      '{{ $props["data-testid"] + "-2" }}',
    ]);
  });

  it('replace when same prop in x-props and other props', () => {
    const XInput = xProps()('input');

    const func1 = vi.fn();
    const func2 = vi.fn();

    const result = render(
      <XInput
        x-props={{
          onClick: '{{ $props.onClick2 }}',
        }}
        onClick={func1}
        // @ts-ignore -- ignore props
        onClick2={func2}
        data-testid="x-input"
      />
    );

    fireEvent.click(result.getByTestId('x-input'));

    expect(func1).toBeCalledTimes(0);
    expect(func2).toBeCalled();
  });

  it('concat array when same prop in x-props and other props', () => {
    const Input: React.FC<
      React.InputHTMLAttributes<HTMLInputElement> & {
        classNameArray: string[];
      }
    > = (props) => {
      const { classNameArray, ...rest } = props;
      return <input {...rest} className={classNameArray.join(' ')} />;
    };
    const XInput = xProps()(Input);

    const result = render(
      <XInput
        x-props={{
          classNameArray: '{{ ["class-x-1", "class-x-2"] }}',
        }}
        classNameArray={['class-1', 'class-2']}
        data-testid="x-input"
      />
    );

    const className = result.getByTestId('x-input').getAttribute('class');
    expect(className?.includes('class-1')).toBeTruthy();
    expect(className?.includes('class-x-1')).toBeTruthy();
    expect(className?.includes('class-2')).toBeTruthy();
    expect(className?.includes('class-x-1')).toBeTruthy();
  });

  it('custom engine option', () => {
    const XInput = xProps({
      engine: {
        match(expression) {
          const XRE = /^\s*\[\[(.*)\]\]\s*$/;
          return expression.match(XRE)?.[1] ?? null;
        },
        run(matched, xValue) {
          return new Function('$root', `with($root) { return (${matched}); }`)(xValue);
        },
      },
    })('input');

    const result = render(
      <XInput
        x-props={{
          className: '[[ $props["data-testid"] ]]',
        }}
        data-testid="x-input"
      />
    );

    expect(result.getByTestId('x-input').getAttribute('class')).toBe('x-input');
  });

  it('custom useXValue option', () => {
    const XInput = xProps({
      useXValue: (props) => {
        const [state, setState] = React.useState('');
        return {
          $props: props,
          $state: {
            value: state,
            set: setState,
          },
        };
      },
    })('input');

    const result = render(
      <XInput
        x-props={{
          className: '{{ $state.value }}',
          onClick: '{{ () => $state.set($state.value + " addon-class") }}',
        }}
        data-testid="x-input"
      />
    );

    expect(result.getByTestId('x-input').getAttribute('class')).toBe('');

    fireEvent.click(result.getByTestId('x-input'));

    expect(result.getByTestId('x-input').getAttribute('class')).toBe(' addon-class');
  });

  it('custom propsMerge option', () => {
    function combineMultiFuncs<F extends (...args: any[]) => any>(...funcs: F[]) {
      return (...args: Parameters<F>) => {
        return funcs.forEach((func) => {
          func(...args);
        });
      };
    }

    const propsMerge = <P,>(propsX: Partial<P>, propsY: Partial<P>) =>
      mergeWith<P>({}, propsX, propsY, (value: any, srcValue: any, key: string) => {
        // combine onXXX handler function which prop always be designed in React
        if (typeof value === 'function' && typeof srcValue === 'function' && /^on[A-Z]/.test(key)) {
          return combineMultiFuncs(value, srcValue);
        }
      });

    const XInput = xProps({
      propsMerge: propsMerge,
    })('input');

    const func1 = vi.fn();
    const func2 = vi.fn();

    const result = render(
      <XInput
        x-props={{
          onClick: '{{ $props.onClick2 }}',
        }}
        onClick={func1}
        // @ts-ignore -- ignore props
        onClick2={func2}
        data-testid="x-input"
      />
    );

    fireEvent.click(result.getByTestId('x-input'));

    expect(func1).toBeCalled();
    expect(func2).toBeCalled();
  });
});
