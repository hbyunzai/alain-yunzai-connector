import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { default as ngLang } from '@angular/common/locales/zh';
import { ApplicationConfig, EnvironmentProviders, Provider } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling, withHashLocation, RouterFeatures, withViewTransitions } from '@angular/router';

import { CELL_WIDGETS, SF_WIDGETS, ST_WIDGETS } from '@shared';
import { provideYunzaiBindAuthRefresh, provideYunzaiStartup, yunzaiDefaultInterceptor } from '@yelon/connector/auth';
import { provideYunzaiConfig } from '@yelon/connector/config';
import { YunzaiHttpI18NService } from '@yelon/connector/i18n';
import { zhCN as dateLang } from 'date-fns/locale';

import { provideCellWidgets } from '@delon/abc/cell';
import { provideSTWidgets } from '@delon/abc/st';
import { authSimpleInterceptor, provideAuth } from '@delon/auth';
import { provideSFConfig } from '@delon/form';
import { AlainProvideLang, provideAlain, zh_CN as delonLang } from '@delon/theme';
import { AlainConfig } from '@delon/util/config';
import { NzConfig, provideNzConfig } from 'ng-zorro-antd/core/config';
import { zh_CN as zorroLang } from 'ng-zorro-antd/i18n';

import { environment } from '@env/environment';

import { ICONS } from '../style-icons';
import { ICONS_AUTO } from '../style-icons-auto';
import { routes } from './routes/routes';

const defaultLang: AlainProvideLang = {
  abbr: 'zh-CN',
  ng: ngLang,
  zorro: zorroLang,
  date: dateLang,
  delon: delonLang
};

const alainConfig: AlainConfig = {
  st: { modal: { size: 'lg' } },
  pageHeader: { homeI18n: 'home' },
  lodop: {
    license: `A59B099A586B3851E0F0D7FDBF37B603`,
    licenseA: `C94CEE276DB2187AE6B65D56B3FC2848`
  },
  auth: {
    store_key: `_yz_token`,
    token_invalid_redirect: true,
    token_exp_offset: 10,
    token_send_key: `Authorization`,
    token_send_template: 'Bearer ${access_token}',
    token_send_place: 'header',
    login_url: '/passport/login',
    ignores: [/\/login/, /\/assets\//, /passport\//, /\/auth\/oauth\/getOrCreateToken\/webapp/, /\/auth\/oauth\/token/],
    refreshTime: 3000,
    refreshOffset: 6000
  }
};

const ngZorroConfig: NzConfig = {};

const routerFeatures: RouterFeatures[] = [withComponentInputBinding(), withViewTransitions(), withInMemoryScrolling({ scrollPositionRestoration: 'top' })];
if (environment.useHash) routerFeatures.push(withHashLocation());

const providers: Array<Provider | EnvironmentProviders> = [
  provideYunzaiConfig({
    connector: environment.api['connector'],
    socket: environment.api['socket']
  }),
  provideYunzaiStartup(),
  provideYunzaiBindAuthRefresh(),
  provideHttpClient(withInterceptors([...(environment.interceptorFns ?? []), authSimpleInterceptor, yunzaiDefaultInterceptor])),
  provideRouter(routes, ...routerFeatures),
  provideAlain({ config: alainConfig, defaultLang, i18nClass: YunzaiHttpI18NService, icons: [...ICONS_AUTO, ...ICONS] }),
  provideNzConfig(ngZorroConfig),
  provideAuth(),
  provideCellWidgets(...CELL_WIDGETS),
  provideSTWidgets(...ST_WIDGETS),
  provideSFConfig({ widgets: SF_WIDGETS }),
  ...(environment.providers || [])
];

export const appConfig: ApplicationConfig = {
  providers: providers
};
