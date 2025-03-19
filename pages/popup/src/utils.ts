import type { ClassNameValue } from 'tailwind-merge';
import { twMerge } from 'tailwind-merge';

export function m(...inputs: ClassNameValue[]) {
  return twMerge(inputs);
}
