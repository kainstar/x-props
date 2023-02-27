import React from 'react';
import set from 'set-value';
import merge from 'deepmerge';
import traverse from 'traverse';
import { FunctionXEngine, IXEngine } from './x-engine.js';

function useDefaultXValue(props: any) {
  return {
    $props: props,
  };
}

export interface IXOptions {
  engine?: IXEngine;
  propsMerge?: (propsRaw: any, propsEvaluated: any) => any;
  useXValue?: (props: any) => any;
}

export interface XExtendsProps {
  'x-props'?: any;
}

export function xProps(options?: IXOptions) {
  const { useXValue = useDefaultXValue, engine = FunctionXEngine, propsMerge = merge } = options ?? {};

  function createXPropsComp<P>(Comp: React.ComponentType<P>): React.NamedExoticComponent<Partial<P> & XExtendsProps>;
  function createXPropsComp<E extends keyof JSX.IntrinsicElements>(
    Comp: E
  ): React.NamedExoticComponent<Partial<JSX.IntrinsicElements[E]> & XExtendsProps>;
  // eslint-disable-next-line @typescript-eslint/ban-types
  function createXPropsComp<P>(Comp: React.ComponentType<P> | keyof JSX.IntrinsicElements) {
    const XPropsComp = React.memo<Partial<P> & XExtendsProps>((props) => {
      const { 'x-props': xProps, ...rest } = props;
      const xValue = useXValue(props);

      const xEvaluatedProps: Partial<P> = {};
      traverse(xProps).forEach(function (value) {
        const paths = this.path;

        if (typeof value === 'string') {
          const matched = engine.match(value);
          if (matched) {
            set(xEvaluatedProps, paths, engine.run(matched, xValue));
            return;
          }
        }

        // fallback: use raw value for props
        set(xEvaluatedProps, paths, value);
      });

      const realProps = propsMerge(rest, xEvaluatedProps);

      return <Comp {...realProps} />;
    });

    XPropsComp.displayName = `XPropsComp(${typeof Comp === 'string' ? Comp : Comp.displayName})`;
    return XPropsComp;
  }

  return createXPropsComp;
}

export default xProps;
