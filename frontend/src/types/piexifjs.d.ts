declare module 'piexifjs' {
  export interface ExifObject extends Record<string, unknown> {
    [key: string]: unknown;
    [key: number]: unknown;
  }

  export function load(data: string): ExifObject;
  export function dump(obj: ExifObject): string;
  export function insert(exif: string, file: string): string;
  export const version: string;
}
