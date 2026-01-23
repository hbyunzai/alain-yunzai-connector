import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import { mergeYunzaiConfig, YunzaiConfig, YunzaiConfigService } from '@yelon/connector/config';
import { useLocalStorageProjectInfo, useLocalStorageUser } from '@yelon/connector/store';

import { DA_SERVICE_TOKEN } from '@delon/auth';
import { I18nPipe } from '@delon/theme';
import { WINDOW } from '@delon/util';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';

export interface UserLink {
  icon: string;
  name: string;
  url: string;
}

@Component({
  selector: `yunzai-header-user`,
  template: `
    <div class="yunzai-default__nav-item d-flex align-items-center px-sm" data-event-id="_nav_user" nz-dropdown nzPlacement="bottomRight" [nzDropdownMenu]="userMenu">
      <div class="yz-user-name">
        <nz-avatar [nzSrc]="icon" nzSize="small" class="mr-sm" />
        {{ username }}
      </div>
    </div>
    <nz-dropdown-menu #userMenu="nzDropdownMenu">
      <div nz-menu class="width-sm">
        @for (m of menus; track m) {
          <div data-event-id="_nav_user" [attr.data-name]="m.name | i18n" nz-menu-item (click)="to(m.url)">
            <nz-icon [nzType]="m.icon" class="mr-sm" />
            {{ m.name | i18n }}
          </div>
        }
        <li nz-menu-divider></li>
        <div data-event-id="_nav_user" data-name="注销登录" nz-menu-item (click)="logout()">
          <nz-icon nzType="logout" class="mr-sm" />
          {{ 'logout' | i18n }}
        </div>
      </div>
    </nz-dropdown-menu>
  `,
  imports: [NzDropdownModule, I18nPipe, NzIconModule, NzAvatarModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class YunzaiHeaderUserComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly tokenService = inject(DA_SERVICE_TOKEN);
  private readonly configService = inject(YunzaiConfigService);
  private readonly config: YunzaiConfig = mergeYunzaiConfig(this.configService);
  private readonly win = inject(WINDOW);

  icon: string = '';
  username: string = '';
  menus: UserLink[] = [];

  ngOnInit(): void {
    const [, getProjectInfo] = useLocalStorageProjectInfo();
    const [, getUser] = useLocalStorageUser();
    const projectInfo = getProjectInfo()!;
    const user = getUser()!;
    this.username = user.realname ? user.realname : '未命名';
    this.icon = user.avatarId ? `${this.config.connector?.backstage}/filecenter/file/${user.avatarId}` : `./assets/tmp/img/avatar.jpg`;
    this.menus = projectInfo.profileList as UserLink[];
  }

  logout(): void {
    localStorage.clear();
    this.tokenService.clear();
    this.win.location.href = `${this.config.connector?.backstage}/cas-proxy/app/logout?callback=${encodeURIComponent(this.win.location.href)}`;
  }

  to(href: string): void {
    if (href) {
      this.win.open(href);
    } else {
      this.msg.error('该菜单没有配置链接!');
    }
  }
}
