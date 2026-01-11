declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    VUE_ROUTER_MODE: 'hash' | 'history' | 'abstract' | undefined;
    VUE_ROUTER_BASE: string | undefined;
  }
}

// Declare Quasar app-vite module types
declare module '#q-app/wrappers' {
  export function defineConfig(callback: any): any;
  export function defineBoot(callback: any): any;
  export function defineRouter(callback: any): any;
  export function defineStore(callback: any): any;
}

declare module '#q-app' {
  export * from '#q-app/wrappers';
}
