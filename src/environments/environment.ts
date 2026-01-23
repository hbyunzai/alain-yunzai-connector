// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import * as MOCKDATA from '@_mock';

import { mockInterceptor, provideMockConfig } from '@delon/mock';
import { Environment } from '@delon/theme';

import { brokerURL, form } from '../env';

export const environment = {
  production: false,
  useHash: true,
  api: {
    baseUrl: '/',
    refreshTokenEnabled: true,
    refreshTokenType: 're-request',
    // yunzai
    connector: {
      backstage: '/backstage',
      systemCode: 'portal',
      loginForm: form
    },
    socket: {
      connectHeaders: {
        login: 'guest',
        passcode: 'guest'
      },
      brokerURL: brokerURL,
      heartbeatIncoming: 1000 * 60,
      heartbeatOutgoing: 1000 * 60,
      reconnectDelay: 5
    }
  },
  providers: [provideMockConfig({ data: MOCKDATA })],
  interceptorFns: [mockInterceptor]
} as Environment;
