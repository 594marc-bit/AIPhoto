declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    VUE_ROUTER_MODE: 'hash' | 'history' | 'abstract' | undefined;
    VUE_ROUTER_BASE: string | undefined;
  }
}

// Declare Quasar app-vite module types
declare module '#q-app/wrappers' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function defineConfig<T = unknown>(callback: (ctx: any) => T): T;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function defineBoot(callback: (...args: any[]) => any): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function defineRouter(callback: (...args: any[]) => any): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function defineStore(callback: (...args: any[]) => any): any;
}

declare module '#q-app' {
  export * from '#q-app/wrappers';
}
