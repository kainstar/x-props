export interface IXEngine {
  match(expression: string): string | null;
  run(matched: string, xValue: object): any;
}

const XRE = /^\s*\{\{([\s\S]*)\}\}\s*$/;

export const FunctionXEngine: IXEngine = {
  match: (expression) => expression.match(XRE)?.[1] ?? null,
  run(matched: string, xValue: object) {
    return new Function('$root', `with($root) { return (${matched}); }`)(xValue);
  },
};
