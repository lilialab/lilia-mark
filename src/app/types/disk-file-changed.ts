export type DiskChangeKind = 'modify' | 'remove';

export interface DiskFileChanged {
  path: string;
  kind: DiskChangeKind;
}
