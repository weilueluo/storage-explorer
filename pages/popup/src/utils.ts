import { ClassNameValue, twMerge } from 'tailwind-merge';

export function m(...inputs: ClassNameValue[]) {
  return twMerge(inputs);
}
