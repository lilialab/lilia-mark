import type { Routes } from '@angular/router';

import { EditorPage } from './features/editor/editor.page';

/** 实质单页：仅主编辑路由。 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', component: EditorPage },
  { path: '**', redirectTo: '' },
];
