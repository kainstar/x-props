import React from 'react';
import clone from 'clone-deep';
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

function getCompName(Comp: React.ComponentType<any> | keyof JSX.IntrinsicElements) {
  if (typeof Comp === 'string') {
    return Comp;
  }

  return Comp.displayName ?? Comp.name;
}

export function xProps(options?: IXOptions) {
  const { useXValue = useDefaultXValue, engine = FunctionXEngine, propsMerge = merge } = options ?? {};

  function createXPropsComp<P>(Comp: React.ComponentType<P>): React.NamedExoticComponent<Partial<P> & XExtendsProps>;
  function createXPropsComp<E extends keyof JSX.IntrinsicElements>(
    Comp: E
  ): React.NamedExoticComponent<Partial<JSX.IntrinsicElements[E]> & XExtendsProps>;
  function createXPropsComp<P>(Comp: React.ComponentType<P> | keyof JSX.IntrinsicElements) {
    const XPropsComp = React.memo<Partial<P> & XExtendsProps>((props) => {
      const { 'x-props': xProps, ...rest } = props;
      const xScopeValue = useXValue(props);

      const xEvaluatedProps: Partial<P> = clone(xProps) ?? {};
      traverse(xEvaluatedProps).forEach(function (value) {
        if (this.isLeaf && typeof value === 'string') {
          const matched = engine.match(value);
          if (matched) {
            this.update(engine.run(matched, xScopeValue), true);
            return;
          }
        }
      });

      const realProps = propsMerge(rest, xEvaluatedProps);

      return <Comp {...realProps} />;
    });

    XPropsComp.displayName = `XPropsComp(${getCompName(Comp)})`;
    return XPropsComp;
  }

  return createXPropsComp;
}

export default xProps;
