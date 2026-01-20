// 请参考：https://ng-alain.com/docs/i18n
import { Platform } from '@angular/cdk/platform';
import { registerLocaleData } from '@angular/common';
import ngEn from '@angular/common/locales/en';
import ngZh from '@angular/common/locales/zh';
import ngZhTw from '@angular/common/locales/zh-Hant';
import { Injectable, inject } from '@angular/core';
import { catchError, map, Observable, of, Subject, takeUntil } from 'rxjs';

import { enUS as dfEn, zhCN as dfZhCn, zhTW as dfZhTw } from 'date-fns/locale';

import { DA_SERVICE_TOKEN, ITokenService } from '@delon/auth';
import { DelonLocaleService, en_US as delonEnUS, SettingsService, zh_CN as delonZhCn, zh_TW as delonZhTw, _HttpClient, AlainI18nBaseService } from '@delon/theme';
import { NzSafeAny } from 'ng-zorro-antd/core/types';
import { en_US as zorroEnUS, NzI18nService, zh_CN as zorroZhCN, zh_TW as zorroZhTW } from 'ng-zorro-antd/i18n';

interface LangConfigData {
  abbr: string;
  text: string;
  ng: NzSafeAny;
  zorro: NzSafeAny;
  date: NzSafeAny;
  delon: NzSafeAny;
}

const DEFAULT = 'zh-CN';
const LANGS: Record<string, LangConfigData> = {
  'zh-CN': {
    text: '简体中文',
    ng: ngZh,
    zorro: zorroZhCN,
    date: dfZhCn,
    delon: delonZhCn,
    abbr: '🇨🇳'
  },
  'zh-TW': {
    text: '繁体中文',
    ng: ngZhTw,
    zorro: zorroZhTW,
    date: dfZhTw,
    delon: delonZhTw,
    abbr: '🇭🇰'
  },
  'en-US': {
    text: 'English',
    ng: ngEn,
    zorro: zorroEnUS,
    date: dfEn,
    delon: delonEnUS,
    abbr: '🇬🇧'
  }
};

@Injectable({ providedIn: 'root' })
export class YunzaiHttpI18NService extends AlainI18nBaseService {
  private $destroy = new Subject();
  private readonly http = inject(_HttpClient);
  private readonly settings = inject(SettingsService);
  private readonly nzI18nService = inject(NzI18nService);
  private readonly delonLocaleService = inject(DelonLocaleService);
  private readonly platform = inject(Platform);
  protected override _defaultLang = DEFAULT;
  private tokenService: ITokenService = inject(DA_SERVICE_TOKEN);

  constructor() {
    super();
    if (this.tokenService.get()?.access_token) {
      const defaultLang = this.getDefaultLang();
      this.getHttpLangs()
        .pipe(takeUntil(this.$destroy))
        .subscribe(langs => {
          this._defaultLang = langs.findIndex(w => w.code === defaultLang) === -1 ? DEFAULT : defaultLang;
        });
    }
  }

  private getDefaultLang(): string {
    if (!this.platform.isBrowser) {
      return DEFAULT;
    }
    if (this.settings.layout.lang) {
      return this.settings.layout.lang;
    }
    let res = (navigator.languages ? navigator.languages[0] : null) || navigator.language;
    const arr = res.split('-');
    return arr.length <= 1 ? res : `${arr[0]}-${arr[1].toUpperCase()}`;
  }

  loadLangData(lang: string): Observable<any> {
    if (ngDevMode) {
      return this.http.get(`./assets/tmp/i18n/${lang}.json`);
    } else {
      return this.http.get(`/i18n/api/v2/language/${lang}`).pipe(catchError(() => this.http.get(`./assets/tmp/i18n/${lang}.json`)));
    }
  }

  use(lang: string, data: Record<string, unknown>): void {
    if (this._currentLang === lang) return;

    this._data = this.flatData(data, []);

    const item = LANGS[lang];
    registerLocaleData(item.ng);
    this.nzI18nService.setLocale(item.zorro);
    this.nzI18nService.setDateLocale(item.date);
    this.delonLocaleService.setLocale(item.delon);
    this._currentLang = lang;

    this._change$.next(lang);
  }

  getLangs(): Array<{ code: string; text: string; abbr: string }> {
    throw new Error('please use getHttpLangs function');
  }

  getHttpLangs(): Observable<Array<{ code: string; text: string; abbr: string }>> {
    const langs = Object.keys(LANGS).map(code => {
      const item = LANGS[code];
      return { code, text: item.text, abbr: item.abbr, image: undefined };
    });
    if (ngDevMode) {
      return of(langs);
    } else {
      return this.http.get(`/i18n/api/v2/language`).pipe(
        map((response: any) => {
          return response.data;
        }),
        catchError(() => of(langs))
      );
    }
  }
}
