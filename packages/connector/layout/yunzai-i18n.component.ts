import { CommonModule, DOCUMENT } from '@angular/common';
import { booleanAttribute, ChangeDetectionStrategy, Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { ALAIN_I18N_TOKEN, I18nPipe, SettingsService } from '@delon/theme';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';

import { YunzaiHttpI18NService } from '@yelon/connector/i18n';

export interface YunzaiI18NType {
  code: string;
  text: string;
  abbr: string;
  icon?: string;
}

@Component({
  selector: `yunzai-header-i18n`,
  template: `
    @if (showLangText) {
      <div nz-dropdown [nzDropdownMenu]="langMenu" nzPlacement="bottomRight">
        <nz-icon nzType="global" nzTheme="outline" />
        {{ 'lang.nav' | i18n }}
        <nz-icon nzType="down" nzTheme="outline" />
      </div>
    } @else {
      <i nz-dropdown [nzDropdownMenu]="langMenu" nzPlacement="bottomRight" nz-icon nzType="global" nzTheme="outline"></i>
    }
    <nz-dropdown-menu data-event-id="_nav_lang" #langMenu="nzDropdownMenu">
      <ul nz-menu>
        @for (item of langs; track item) {
          <li data-event-id="_nav_lang" [attr.data-text]="item.text" nz-menu-item [nzSelected]="item.code === curLangCode" (click)="change(item.code)">
            @if (!item.icon) {
              <span role="img" [attr.aria-label]="item.text" class="pr-xs">{{ item.abbr }}</span>
            } @else {
              <img style="margin-right:4px" width="50px" height="30px" [src]="'data:image/png;base64,' + item.icon" [alt]="item.abbr" class="pr-xs" />
            }
            {{ item.text }}
          </li>
        }
      </ul>
    </nz-dropdown-menu>
  `,
  host: {
    '[class.flex-1]': 'true'
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NzDropdownModule, NzIconModule, I18nPipe, CommonModule]
})
export class YunzaiHeaderI18nComponent implements OnInit, OnDestroy {
  private readonly settings = inject(SettingsService);
  private readonly i18n = inject<YunzaiHttpI18NService>(ALAIN_I18N_TOKEN);
  private readonly doc = inject(DOCUMENT);
  langs: YunzaiI18NType[] = [];
  private destroy$: Subject<any> = new Subject<any>();
  /** Whether to display language text */
  @Input({ transform: booleanAttribute }) showLangText = true;

  get curLangCode(): string {
    return this.settings.layout.lang;
  }
  ngOnInit(): void {
    this.i18n
      .getHttpLangs()
      .pipe(takeUntil(this.destroy$))
      .subscribe(langs => {
        this.langs = langs;
      });
  }

  change(lang: string): void {
    const spinEl = this.doc.createElement('div');
    spinEl.setAttribute('class', `page-loading ant-spin ant-spin-lg ant-spin-spinning`);
    spinEl.innerHTML = `<span class="ant-spin-dot ant-spin-dot-spin"><i></i><i></i><i></i><i></i></span>`;
    this.doc.body.appendChild(spinEl);

    this.i18n.loadLangData(lang).subscribe(res => {
      this.i18n.use(lang, res);
      this.settings.setLayout('lang', lang);
      setTimeout(() => this.doc.location.reload());
    });
  }
  ngOnDestroy(): void {
    this.destroy$.complete();
  }
}
