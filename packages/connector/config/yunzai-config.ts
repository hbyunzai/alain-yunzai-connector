import { EnvironmentProviders, inject, Injectable, InjectionToken, makeEnvironmentProviders } from '@angular/core';

import { RxStompConfig } from '@stomp/rx-stomp';

import { log } from '@delon/util';

export interface YunzaiConfig {
  connector?: { backstage?: string; systemCode?: string; loginForm?: FormData | null };
  socket?: RxStompConfig;
}

export const YUNZAI_CONFIG = new InjectionToken<YunzaiConfig>('yunzai-config', { providedIn: 'root', factory: YUNZAI_CONFIG_FACTORY });

export function YUNZAI_CONFIG_FACTORY(): YunzaiConfig {
  return {};
}

export function provideYunzaiConfig(config: YunzaiConfig): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: YUNZAI_CONFIG, useValue: config }]);
}

export const DEFAULT_CONFIG: YunzaiConfig = {
  connector: {
    backstage: '/backstage',
    systemCode: 'portal',
    loginForm: null
  },
  socket: {
    connectHeaders: {
      login: 'guest',
      passcode: 'guest'
    },
    brokerURL: '/websocket/ws/',
    heartbeatIncoming: 1000 * 60,
    heartbeatOutgoing: 1000 * 60,
    reconnectDelay: 30000000,
    debug: (msg: any) => {
      log(msg);
    }
  }
};

@Injectable({ providedIn: 'root' })
export class YunzaiConfigService {
  private readonly config = { ...inject(YUNZAI_CONFIG, { optional: true }) };

  mergeConfig(): YunzaiConfig {
    return {
      ...DEFAULT_CONFIG,
      ...this.config
    };
  }
}

export function mergeYunzaiConfig(srv: YunzaiConfigService): YunzaiConfig {
  return srv.mergeConfig();
}
