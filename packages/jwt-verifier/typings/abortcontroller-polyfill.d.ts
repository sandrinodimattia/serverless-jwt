declare module 'abortcontroller-polyfill/dist/cjs-ponyfill' {
  const abortableFetch: any;

  const AbortController: {
    new (): AbortController;
    prototype: AbortController;
  };
}
