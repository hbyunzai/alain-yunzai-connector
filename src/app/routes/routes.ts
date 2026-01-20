import { Routes } from '@angular/router';

import { authSimpleCanActivate, authSimpleCanActivateChild } from '@delon/auth';

import { startPageGuard } from '@core';

export const routes: Routes = [
  {
    path: '',
    canActivate: [startPageGuard, authSimpleCanActivate],
    canActivateChild: [authSimpleCanActivateChild],
    data: {},
    children: []
  },
  { path: 'exception', loadChildren: () => import('./exception/routes').then(m => m.routes) },
  { path: '**', redirectTo: 'exception/404' }
];
