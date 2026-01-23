import { HttpContext } from '@angular/common/http';
import { EnvironmentProviders, inject, Injectable, provideAppInitializer, Provider } from '@angular/core';
import { catchError, combineLatest, EMPTY, map, mergeMap, Observable, of } from 'rxjs';

import { mergeYunzaiConfig, YunzaiConfigService } from '@yelon/connector/config';
import { YunzaiHttpI18NService } from '@yelon/connector/i18n';
import { useLocalStorageCurrent, useLocalStorageDefaultRoute, useLocalStorageHeader, useLocalStorageProjectInfo, useLocalStorageTenant, useLocalStorageUser } from '@yelon/connector/store';
import { YunzaiMenu, YunzaiMenuAttribute } from '@yelon/connector/types';

import { ACLService } from '@delon/acl';
import { ALLOW_ANONYMOUS, DA_SERVICE_TOKEN, ITokenModel } from '@delon/auth';
import { _HttpClient, ALAIN_I18N_TOKEN, Menu, MenuService, SettingsService, TitleService } from '@delon/theme';
import { AlainConfigService, deepCopy, WINDOW } from '@delon/util';
import { NzSafeAny } from 'ng-zorro-antd/core/types';

export function provideYunzaiStartup(): Array<Provider | EnvironmentProviders> {
  return [
    YunzaiStartupService,
    provideAppInitializer(() => {
      const initializerFn = (
        (startupService: YunzaiStartupService) => () =>
          startupService.load()
      )(inject(YunzaiStartupService));
      return initializerFn();
    })
  ];
}

@Injectable()
export class YunzaiStartupService {
  private readonly config = mergeYunzaiConfig(inject(YunzaiConfigService));
  private readonly menuService = inject(MenuService);
  private readonly aclService = inject(ACLService);
  private readonly titleService = inject(TitleService);
  private readonly tokenService = inject(DA_SERVICE_TOKEN);
  private readonly httpClient = inject(_HttpClient);
  private readonly settingService = inject(SettingsService);
  private readonly i18n = inject<YunzaiHttpI18NService>(ALAIN_I18N_TOKEN);
  private readonly win = inject(WINDOW);
  private readonly configService = inject(AlainConfigService);
  constructor() {}

  load(): Observable<void> {
    let defaultLang: string = this.settingService.layout.lang || this.i18n.defaultLang || 'zh-CN';
    const [setTenant] = useLocalStorageTenant();
    const [setUser, getUser] = useLocalStorageUser();
    const [setHeader] = useLocalStorageHeader();
    const [setProject] = useLocalStorageProjectInfo();
    const [setDefaultRoute] = useLocalStorageDefaultRoute();
    const [setCurrent] = useLocalStorageCurrent();
    return this.token().pipe(
      mergeMap((token: NzSafeAny) => {
        if (token === false) {
          return this.i18n.loadLangData(defaultLang).pipe(
            map((langData: NzSafeAny) => {
              this.i18n.use(defaultLang, langData);
              this.settingService.setLayout('lang', defaultLang);
            }),
            mergeMap(() => EMPTY)
          );
        }
        this.configService.set('auth', {
          token_send_key: 'Authorization',
          token_send_template: `${token.token_type} \${access_token}`,
          token_send_place: 'header'
        });
        this.tokenService.set(token);
        return of(void 0);
      }),
      mergeMap(() => {
        return combineLatest([this.httpClient.get(`/auth/user`), this.httpClient.get(`/auth/allheader/v2`), this.httpClient.get(`/app-manager/project/info`)]).pipe(
          map(([user, header, project]: NzSafeAny) => {
            setUser(user.principal);
            setTenant(user.tenantId);
            setHeader(header.data);
            setProject(project.data);
            return void 0;
          })
        );
      }),
      mergeMap(() => {
        return this.i18n.loadLangData(defaultLang).pipe(
          map((langData: NzSafeAny) => {
            this.i18n.use(defaultLang, langData);
            return void 0;
          })
        );
      }),
      mergeMap(() => {
        const yunzaiUser = getUser()!;
        const yunzaiMenus: YunzaiMenu[] = deepCopy(yunzaiUser.menu).filter(m => m.systemCode && m.systemCode === this.config.connector!.systemCode);
        const currentMenu = yunzaiMenus.pop();
        if (currentMenu) {
          this.settingService.setApp({ name: currentMenu.text, description: currentMenu.intro });
          this.settingService.setUser({
            name: yunzaiUser.realname,
            avatar: this.config.connector?.backstage && yunzaiUser.avatarId ? `${this.config.connector.backstage}/filecenter/file/${yunzaiUser.avatarId}` : '',
            email: yunzaiUser.email
          });
          this.titleService.default = currentMenu && currentMenu.text ? currentMenu.text : 'default application name';
          this.titleService.setTitle(currentMenu && currentMenu.text ? currentMenu.text : 'no title');
          const abilities: string[] = [];
          generateAbility([currentMenu], abilities, '');
          this.aclService.attachRole(
            yunzaiUser?.roles
              .map((role: NzSafeAny) => {
                return role.roleValue;
              })
              .filter((a: NzSafeAny) => !!a) || []
          );
          this.aclService.attachAbility(abilities);
          this.menuService.add([currentMenu as Menu]);
          setCurrent({
            name: currentMenu.text,
            intro: currentMenu.intro || '',
            icon: currentMenu.appIconUrl || './assets/tmp/img/avatar.jpg'
          });
          const attributes = currentMenu.attribute;
          if (attributes) {
            const attr: YunzaiMenuAttribute = JSON.parse(attributes);
            if (attr && attr.defaultRoute) {
              setDefaultRoute(attr.defaultRoute);
            } else {
              setDefaultRoute('/displayIndex');
            }
          } else {
            setDefaultRoute('/displayIndex');
          }
        }
        return of(void 0);
      }),
      catchError((error: NzSafeAny) => {
        console.error('Error occurred:', error);
        return of(void 0);
      })
    );
  }

  token(): Observable<ITokenModel | boolean> {
    if (this.config.connector?.loginForm) {
      if (!this.tokenService.get()?.access_token) {
        return this.httpClient
          .post(`/auth/oauth/token?_allow_anonymous=true`, this.config.connector.loginForm, {
            context: new HttpContext().set(ALLOW_ANONYMOUS, true)
          })
          .pipe(
            map((response: NzSafeAny) => {
              return response;
            })
          );
      } else {
        return of(this.tokenService.get()!);
      }
    } else {
      const uri = encodeURIComponent(this.win.location.href);
      return this.httpClient
        .get(`/cas-proxy/app/validate_full?callback=${uri}&_allow_anonymous=true&timestamp=${new Date().getTime()}`, {
          context: new HttpContext().set(ALLOW_ANONYMOUS, true)
        })
        .pipe(
          map((response: NzSafeAny) => {
            switch (response.errcode) {
              case 2000:
                return response.data;
              case 2001:
                this.win.location.href = response.msg;
                throw Error("Cookie Error: Can't find Cas Cookie,So jump to login!");
              default:
                if (response.data) {
                  console.error(response.data);
                  throw Error(response.data);
                } else if (response.msg) {
                  console.error(response.msg);
                  throw Error(response.msg);
                } else {
                  console.error('cas unknown error');
                  throw Error('Unknown Error: Cas auth exception!');
                }
            }
          })
        );
    }
  }
}

export function mapYzSideToYelonMenu(menus: YunzaiMenu[]): void {
  menus.forEach((menu: NzSafeAny) => {
    if (menu.children && menu.hideChildren) {
      menu.children.forEach((c: NzSafeAny) => (c.hide = true));
    }
    menu.badgeDot = menu.badge_dot || null;
    menu.badgeStatus = menu.badge_status || null;
    menu.shortcutRoot = menu.shortcut_root || null;
    menu.reuse = true;
    if (menu.children) {
      mapYzSideToYelonMenu(menu.children);
    }
  });
}

export function generateAbility(menus: YunzaiMenu[], abilities: string[], prefix: string): void {
  menus.forEach(menu => {
    if (menu.link) {
      prefix += menu.link;
    } else {
      prefix += '';
    }
    if (menu.menuAuths) {
      menu.menuAuths.forEach((a: string) => {
        abilities.push(`${prefix}:${a}`);
        abilities.push(a);
      });
    }

    if (menu.children) {
      generateAbility(menu.children, abilities, prefix);
    }
  });
}
