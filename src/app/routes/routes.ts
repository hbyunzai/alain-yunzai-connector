import { Routes } from '@angular/router';

import { YunzaiLayoutBasicComponent } from '@yelon/connector/layout';

import { authSimpleCanActivate, authSimpleCanActivateChild } from '@delon/auth';

import { startPageGuard } from '@core';

import { RoutesIndexComponent } from './index.component';

export const routes: Routes = [
  {
    path: '',
    component: YunzaiLayoutBasicComponent,
    canActivate: [startPageGuard, authSimpleCanActivate],
    canActivateChild: [authSimpleCanActivateChild],
    children: [
      {
        path: '',
        component: RoutesIndexComponent
      }
    ]
  },
  { path: 'exception', loadChildren: () => import('./exception/routes').then(m => m.routes) },
  { path: '**', redirectTo: 'exception/404' }
];
