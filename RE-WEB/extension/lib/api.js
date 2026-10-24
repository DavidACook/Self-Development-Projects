// Firefox supplies the Promise-based browser namespace; modern Chrome has
// the same Promise APIs under chrome. No runtime polyfill is needed.
export const api = globalThis.browser ?? globalThis.chrome;
