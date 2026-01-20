import { Environment } from '@delon/theme';

export const environment = {
  production: true,
  useHash: true,
  api: {
    baseUrl: '/',
    refreshTokenEnabled: true,
    refreshTokenType: 're-request',
    // yunzai
    connector: {
      backstage: '/backstage',
      systemCode: 'analysis',
      loginForm: undefined
    },
    socket: {
      connectHeaders: {
        login: 'guest',
        passcode: 'guest'
      },
      brokerURL: '/websocket/ws',
      heartbeatIncoming: 1000 * 60,
      heartbeatOutgoing: 1000 * 60,
      reconnectDelay: 30000000
    }
  }
} as Environment;
