import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { ExecOptions } from 'child_process';
import { ObjectEncodingOptions } from 'fs';
import { firstValueFrom, retry } from 'rxjs';

import { APP_CONFIG } from '../../environments/environment';
import {
  ElectronService,
  SpinnerService,
  ToastService,
} from '../core/services';
import {
  compare,
  SortableHeaderDirective,
  SortEvent,
} from '../shared/directives';
import { Item, TitleData } from './model';
import { SettingComponent } from './setting/setting.component';
import {
  createElementFromHTML,
  encodeRegex,
  getKeyByValue,
} from '../shared/common';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  @ViewChildren(SortableHeaderDirective<Item>) headers!: QueryList<
    SortableHeaderDirective<Item>
  >;

  nsw2uData: {
    [key: string]: {
      id: number;
      content: { rendered: string };
      link: string;
      gameVersion?: string;
      dlc?: { title: string; size: string; type?: string }[];
    };
  } = {};

  displayedColumns: Array<keyof Item> = [
    'Title ID',
    'Title Name',
    'Display Version',
  ];

  prototypes: string[] = [
    'Title ID',
    'Base Title ID',
    'Title Name',
    'Display Version',
    'Version',
    'Latest Version',
    'System Update',
    'System Version',
    'Application Version',
    'Masterkey',
    'Title Key',
    'Publisher',
    'Languages',
    'Filename',
    'Filesize',
    'Type',
    'Distribution',
    'Structure',
    'Signature',
    'Permission',
    'Error',
  ];

  postIds: { [key: string]: number } = {};
  items: Item[] = [];
  itemBackups: Item[] = [];
  titleData: { [key: string]: TitleData } = {};

  webview!: Electron.WebviewTag | null;

  path = '';

  constructor(
    private electronService: ElectronService,
    private cdr: ChangeDetectorRef,
    private offcanvasService: NgbOffcanvas,
    private toastService: ToastService,
    private http: HttpClient,
    public spinnerService: SpinnerService
  ) {}

  ngOnInit(): void {
    console.log('HomeComponent INIT');

    void this.loadData();
  }

  async loadData(): Promise<void> {
    this.spinnerService.show();

    this.nsw2uData = {};
    this.postIds = {};
    this.items = [];
    this.itemBackups = [];

    this.path = await this.electronService.getStoreValue('path');

    if (!this.path) {
      this.spinnerService.hide();
      return;
    }

    const basicURL = !APP_CONFIG.production
      ? this.electronService.remote.app.getAppPath()
      : this.electronService.process.resourcesPath;

    let data = await this.runScript('nxgameinfo_cli', [this.path], {
      cwd: this.electronService.path.join(basicURL, 'lib', 'nxgameinfo_cli'),
      encoding: 'utf-8',
    });

    data = data.split('\r\n\r\n\n').slice(1).join('');

    if (!data) {
      this.spinnerService.hide();
    }

    const itemRaws = data.split('\r\n\n');
    const regex = new RegExp(
      `${this.prototypes
        .map((p) => `[├└] (${encodeRegex(p)}): ([^\\n]*)`)
        .join('\\n(.+\\n)*')}`
    );

    const itemTemps = itemRaws.map<Item>((itemRaw) => {
      const match = regex.exec(itemRaw);

      if (!match) {
        return {} as Item;
      }

      return match.reduce<Item>(
        (previousValue, currentValue, currentIndex, array) => {
          if (
            currentIndex !== 0 &&
            this.prototypes.includes(array[currentIndex - 1])
          ) {
            const property = array[currentIndex - 1] as keyof Item;
            if (property === 'Display Version' && !currentValue) {
              currentValue = '1.0.0';
            }
            if (property !== 'dlc') {
              previousValue[property] = currentValue;
            }
          }
          return previousValue;
        },
        {} as Item
      );
    });

    const baseItems = itemTemps.filter((item) => item?.Type === 'Base');

    // Fix patched id
    baseItems.forEach((item) => {
      item['Base Title ID'] = item['Base Title ID'].replace(/^\d{2}/, '01');
      item['Title ID'] = item['Title ID'].replace(/^\d{2}/, '01');
    });

    this.items = baseItems.map<Item>((basedItem) => {
      const update = itemTemps.find(
        (item) =>
          item.Type === 'Update' &&
          item['Base Title ID'] === basedItem['Base Title ID']
      );
      if (update) {
        basedItem['Display Version'] = update['Display Version'];
      }

      const dlc = itemTemps.filter(
        (item) =>
          item.Type === 'DLC' &&
          item['Base Title ID'] === basedItem['Base Title ID']
      );
      basedItem.dlc = dlc;

      return basedItem;
    });

    console.log('items', this.items);

    this.itemBackups = [...this.items];

    const titleIds = this.items.map((item) => item['Base Title ID']);
    void this.loadTitleData(titleIds);

    try {
      const cookies =
        await this.electronService.remote.session.defaultSession.cookies.get({
          domain: 'nsw2u.com',
        });

      if (cookies.length) {
        const expirationDate = new Date();
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);

        for (const cookie of cookies) {
          cookie.expirationDate = expirationDate.getTime() / 1000;
          await this.electronService.remote.session.defaultSession.cookies.remove(
            'https://nsw2u.com',
            cookie.name
          );
          await this.electronService.remote.session.defaultSession.cookies.set({
            url: 'https://nsw2u.com',
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path,
            secure: cookie.secure,
            httpOnly: cookie.httpOnly,
            expirationDate: cookie.expirationDate,
            sameSite: cookie.sameSite,
          });
        }
      }
    } catch (error) {
      console.error(error);
    }

    void this.loadNsw2uData(titleIds);

    this.spinnerService.hide();
    this.cdr.detectChanges();
  }

  async open(): Promise<void> {
    const result = await this.offcanvasService.open(SettingComponent, {
      position: 'end',
      backdrop: 'static',
    }).result;

    if (result) {
      void this.loadData();
    }
  }

  onSort({ column, direction }: SortEvent<any>) {
    // resetting other headers
    this.headers?.forEach((header) => {
      if (header.sortable !== column) {
        header.direction = '';
      }
    });

    // sorting countries
    if (direction === '' || column === '') {
      this.items = this.itemBackups;
    } else {
      this.items = [...this.itemBackups].sort((a, b) => {
        const res = compare(
          a[column as keyof Item] as string,
          b[column as keyof Item] as string
        );
        return direction === 'asc' ? res : -res;
      });
    }
  }

  runScript(
    command: string,
    args: ReadonlyArray<string>,
    options: (ObjectEncodingOptions & ExecOptions) | undefined | null
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.electronService.process.platform === 'win32') {
        command = 'cmd /c chcp 65001>nul && ' + command;
      }

      this.electronService.childProcess.exec(
        command + ' ' + args.join(' '),
        options,
        (error, stdout) => {
          if (error) {
            reject(error);
          } else {
            resolve(stdout as string);
          }
        }
      );
    });
  }

  openBrowser(url: string): void {
    void this.electronService.remote.shell.openExternal(url);
  }

  async loadNsw2uData(titleIds: string[]): Promise<void> {
    this.postIds = await this.electronService.getStoreValue<{
      [key: string]: number;
    }>('postIds', {});

    let postIdKeys = Object.keys(this.postIds);
    let nsw2uDataKeys = Object.keys(this.nsw2uData);
    if (nsw2uDataKeys.length) {
      titleIds = titleIds.filter((titleId) => !nsw2uDataKeys.includes(titleId));
    }

    for (const titleId of postIdKeys) {
      if (!nsw2uDataKeys.includes(titleId) && !titleIds.includes(titleId)) {
        delete this.postIds[titleId];
      }
    }

    console.log('titleIds', titleIds);
    for (const titleId of titleIds) {
      if (!this.postIds[titleId]) {
        const dataId: { id: number; modified: string }[] =
          await this.fetchNsw2u(
            `https://nsw2u.net/wp-json/wp/v2/posts?search=${titleId}&_fields=id,modified`
          );
        console.log(titleId, dataId);
        this.postIds[titleId] = dataId.reduce((a, b) =>
          new Date(a.modified) > new Date(b.modified) ? a : b
        ).id;
      }
    }

    console.log('postIds', this.postIds);
    await this.electronService.setStoreValue('postIds', this.postIds);

    const dataContent: {
      id: number;
      content: { rendered: string };
      link: string;
    }[] = await this.fetchNsw2u(
      `https://nsw2u.net/wp-json/wp/v2/posts?include=${Object.values(
        this.postIds
      ).join(',')}&_fields=id,content,link&per_page=100`
    );

    this.nsw2uData = dataContent.reduce<{
      [key: string]: {
        id: number;
        content: { rendered: string };
        link: string;
        gameVersion?: string;
        dlc?: { title: string; size: string; type?: string }[];
      };
    }>((previousValue, currentValue) => {
      const key = getKeyByValue(this.postIds, currentValue.id);
      if (key) {
        previousValue[key] = currentValue;
        previousValue[key].gameVersion =
          /Game Version[^\n]+\n[^>]+>([^<]+)/.exec(
            currentValue.content.rendered
          )?.[1];

        const tableHTML = new RegExp(
          `ID= [\\s\\S]*${encodeRegex(
            key
          )}[\\s\\S]+?(<table[^>]*>[\\s\\S]+?<\\/table>)`
        ).exec(currentValue.content.rendered)?.[1];

        if (tableHTML) {
          const table = createElementFromHTML(tableHTML)
            .firstElementChild as HTMLTableElement;

          const contents = Array.from(table.rows).map<{
            title: string;
            size: string;
            type?: string;
          }>((row) => {
            const columns = row.cells;
            if (columns.length === 3) {
              return {
                title: row.cells[0].innerText,
                size: row.cells[1].innerText,
              };
            } else {
              return {
                title: row.cells[0].innerText,
                size: row.cells[2].innerText,
                type: row.cells[1].innerText,
              };
            }
          });

          const dlc = contents.filter(
            (d) => d.title.includes('DLC') && !d.title.includes('Base')
          );

          previousValue[key].dlc = dlc;
        } else {
          previousValue[key].dlc = [];
        }
      }

      return previousValue;
    }, this.nsw2uData);

    console.log('nsw2uData', this.nsw2uData);

    postIdKeys = Object.keys(this.postIds);
    nsw2uDataKeys = Object.keys(this.nsw2uData);
    if (postIdKeys.length !== nsw2uDataKeys.length) {
      for (const titleId of postIdKeys) {
        if (!nsw2uDataKeys.includes(titleId)) {
          delete this.postIds[titleId];
        }
      }
      console.log('postIds', this.postIds);
      await this.electronService.setStoreValue('postIds', this.postIds);
      return this.loadNsw2uData(titleIds);
    }

    this.cdr.detectChanges();
    if (this.webview) {
      if (!APP_CONFIG.production) {
        this.webview.closeDevTools();
      }
      document.body.removeChild(this.webview);
      this.webview = null;
    }
  }

  async domReady<T = any>(resolve: (value: T) => void): Promise<void> {
    if (!APP_CONFIG.production && !this.webview?.isDevToolsOpened()) {
      this.webview?.openDevTools();
    }

    const text: string = await this.webview?.executeJavaScript(
      'document.body.innerText'
    );

    try {
      const data: T = JSON.parse(text);
      console.log('Load data from nsw2u: Done');
      this.toastService.showSuccess('Load data from nsw2u: Done');
      resolve(data);
    } catch (error) {
      if (text === 'Error establishing a database connection') {
        void this.webview?.loadURL(this.webview.getURL());
        console.error('Load data from nsw2u: ' + text);
        this.toastService.showDanger('Load data from nsw2u: ' + text);
      } else {
        console.error('Load data from nsw2u: Skip cloudflare');
        this.toastService.showDanger('Load data from nsw2u: Skip cloudflare');
      }
    }
  }

  async get<T = any | any[]>(url: string): Promise<T> {
    return await firstValueFrom(
      this.http.get<T>(url).pipe(retry({ count: 10, delay: 1000 }))
    );
  }

  async fetchNsw2u<T = any | any[]>(url: string): Promise<T> {
    return new Promise<T>((resolve) => {
      console.log('Load data from nsw2u: Start');
      this.toastService.showStandard('Load data from nsw2u: Start');

      if (!this.webview) {
        this.webview = document.createElement('webview');
        this.webview.style.display = 'none';

        this.webview.addEventListener('dom-ready', () => {
          void this.domReady<T>(resolve);
        });

        this.webview.src = url;
        document.body.appendChild(this.webview);
      } else {
        this.webview.removeAllListeners?.('dom-ready');
        this.webview.addEventListener('dom-ready', () => {
          void this.domReady<T>(resolve);
        });

        void this.webview.loadURL(url);
      }
    });
  }

  async loadTitleData(titleIds: string[]): Promise<void> {
    let titleData: { [key: string]: TitleData } =
      (await this.electronService.getStoreValue('titleData')) || {};
    const ids = Object.keys(titleData);
    const hasFetchData = titleIds.some((titleId) => !ids.includes(titleId));

    if (hasFetchData) {
      const titleDataRaw: object = await this.get(
        'https://raw.githubusercontent.com/blawar/titledb/master/US.en.json'
      );
      const data: TitleData[] = Object.values(titleDataRaw);

      titleData = data.reduce<{
        [key: string]: TitleData;
      }>((previousValue, currentValue) => {
        previousValue[currentValue.id] = currentValue;
        return previousValue;
      }, {});

      await this.electronService.setStoreValue('titleData', titleData);
    }

    this.titleData = titleData;
  }
}
