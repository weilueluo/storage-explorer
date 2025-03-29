import type React from 'react';
import { m } from './utils';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SeparatorProps {}

export const Separator: React.FC<SeparatorProps> = () => {
  return <div className={m('h-2 mb-2 border-b mx-2 border-slate-200')} />;
};
