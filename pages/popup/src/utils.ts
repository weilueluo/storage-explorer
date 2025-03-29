import type { ClassNameValue } from 'tailwind-merge';
// eslint-disable-next-line import-x/no-named-as-default
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export function m(...inputs: ClassNameValue[]) {
  return twMerge(clsx(...inputs));
}

export function varName(obj: unknown) {
  return Object.keys({ obj })[0];
}
