import { Injectable, inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';

import { mergeYunzaiConfig, YunzaiConfigService } from '@yelon/connector/config';
import { useLocalStorageUser } from '@yelon/connector/store';
import { YunzaiUser } from '@yelon/connector/types';
import { PathToRegexpService } from '@yelon/connector/utils';

import { Menu } from '@delon/theme';
import { deepCopy, log } from '@delon/util';
import { NzSafeAny } from 'ng-zorro-antd/core/types';

@Injectable({ providedIn: 'root' })
export class ActGuardService {
  private readonly config = mergeYunzaiConfig(inject(YunzaiConfigService));
  private menus: NzSafeAny[] = [];
  private links: string[] = [];

  private pathToRegexp: PathToRegexpService = inject(PathToRegexpService);
  private router: Router = inject(Router);

  constructor() {
    log('act: config ', this.config);
    const [, getUser] = useLocalStorageUser();
    const user: YunzaiUser = getUser()!;
    log('act: user ', user);
    this.menus = deepCopy((user.menu as NzSafeAny) || []).filter((m: Menu) => m.systemCode && m.systemCode === this.config.connector!.systemCode) as Menu[];
    log('act: menus ', this.menus);
    this.getAllLinks(this.menus, this.links);
    log('act: links ', this.links);
  }

  process(url: string): boolean {
    log('act: can activate ', url);
    if (this.preHandle(url)) {
      return true;
    }
    log('act: can activate child prehandle success');
    let canactivate = false;
    this.links.forEach((link: string) => {
      // path = /xxx
      if (link === url.split('?')[0]) {
        canactivate = true;
        log(`act: link value ${link} equals url value ${url}`);
        return;
      }
      // paht = /xxx/:xx
      const regexp: RegExp = this.pathToRegexp.stringToRegexp(link, null, null);
      log(`act: ${link} test ${url.split('?')[0]}`);
      if (regexp.test(url.split('?')[0])) {
        canactivate = true;
        log(`act: test value ${canactivate}`);
        return;
      }
    });
    if (canactivate) {
      log(`act: test sucess`);
      return true;
    } else {
      log(`act: test error`);
      this.router.navigate(['displayIndex']);
      return false;
    }
  }

  preHandle(url: string): boolean {
    return url.includes('error') || url.includes('exception') || url.includes('displayIndex') || url === '' || url === null || url === '/' || url.includes('iframePage');
  }

  getAllLinks(menu: Menu[], links: string[]): void {
    menu.forEach((sider: Menu) => {
      if (sider.link) {
        links.push(sider.link);
      }
      if (sider.children && sider.children.length > 0) {
        this.getAllLinks(sider.children, links);
      }
    });
  }
}

export const actGuardCanActive: CanActivateFn = (_, state) => inject(ActGuardService).process(state.url);
export const actGuardCanActiveChild: CanActivateChildFn = (_, state) => inject(ActGuardService).process(state.url);
