import { DOCUMENT } from '@angular/common';
import { inject, Injectable, isDevMode, OnDestroy } from '@angular/core';
import { Observable, Subject, takeUntil } from 'rxjs';

import { IRxStompPublishParams, RxStomp } from '@stomp/rx-stomp';
import { IMessage, StompHeaders } from '@stomp/stompjs';

import { log, WINDOW } from '@delon/util';

import { NotificationService } from './notification.service';
import { mergeYunzaiConfig, YunzaiConfigService } from '@yelon/connector/config';
import { useLocalStorageUser } from '@yelon/connector/store';
import { YunzaiUser } from '@yelon/connector/types';

@Injectable({ providedIn: 'root' })
export class StompService implements OnDestroy {
  config = mergeYunzaiConfig(inject(YunzaiConfigService));
  rxStomp: RxStomp;
  user?: YunzaiUser;
  destroy$ = new Subject<unknown>();

  private notifyService: NotificationService = inject(NotificationService);
  private win: any = inject(WINDOW);
  private document: Document = inject(DOCUMENT);

  constructor() {
    const [, getUser] = useLocalStorageUser();
    if (!this.user) {
      this.user = getUser()!;
    }
    this.rxStomp = new RxStomp();
    if (isDevMode()) {
      log('stomp.service: is dev mode');
      log('stomp.service: ', `config is ${JSON.stringify(this.config)}`);
      this.rxStomp.configure(this.config.socket!);
      return;
    }
    const { location } = this.document;
    const { protocol, host } = location;
    log('stomp.service: ', `protocol is ${protocol},host is ${host}`);
    if (protocol.includes('http') && !protocol.includes('https')) {
      this.config.socket!.brokerURL = `ws://${host}${this.config.socket!.brokerURL}`;
    }
    if (protocol.includes('https')) {
      this.config.socket!.brokerURL = `wss://${host}${this.config.socket!.brokerURL}`;
    }
    log('stomp.service: ', `config is ${this.config}`);
    this.rxStomp.configure(this.config.socket!);
  }

  ngOnDestroy(): void {
    this.unListen();
  }

  listen(): void {
    this.userChannel().subscribe((message: IMessage) => {
      const body = JSON.parse(message.body);
      this.notifyService.notifyWithHtml(body);
    });

    this.logoutChannel().subscribe((message: IMessage) => {
      const body = JSON.parse(message.body);
      this.notifyService.notify(body);
      setTimeout(() => {
        localStorage.clear();
        this.win.location.href = `${this.config?.connector?.backstage}/cas-proxy/app/logout?callback=${encodeURIComponent(this.win.location.href)}`;
      }, 5000);
    });
  }

  logoutChannel(): Observable<IMessage> {
    return this.rxStomp!.watch(`/topic/layout_xx_${this.user?.username}`).pipe(takeUntil(this.destroy$));
  }

  userChannel(): Observable<IMessage> {
    return this.rxStomp!.watch(`/topic/layout_${this.user?.username}`).pipe(takeUntil(this.destroy$));
  }

  unListen(): void {
    this.destroy$.complete();
    this.rxStomp!.deactivate().then();
  }

  publish(parameters: IRxStompPublishParams): void {
    this.rxStomp!.publish(parameters);
  }

  watch(destination: string, headers?: StompHeaders): Observable<IMessage> {
    return this.rxStomp!.watch(destination, headers);
  }
}
