import axios from 'axios';
import { DOMParser } from 'xmldom';
import { format } from 'util';
import * as fs from 'fs';
import { exit } from 'process';
import * as he from 'he';

const URL_TEMPLATE = `https://blog.hatena.ne.jp/%s/%s/atom/entry`;

interface Config {
    userId: string;
    blogId: string;
    apiKey: string;
    entries: {
        title: string;
        srcPath: string;
    }[];
}

interface EntryInfo { title: string, url: string }

// main 処理
main();

async function main(): Promise<void> {
    // コンフィグ情報取得
    const config = readJsonFile("./entries.json");
    if (config === null) {
        console.error('entries.jsonのパースに失敗');
        exit(1);
    }

    // はてな API で記事の情報を取得
    const info = await getEntriesInfo(config);

    for (const entry of config.entries) {
        const entryUrl = fetchEntryUrl(entry.title, info);
        const contents = fs.readFileSync(entry.srcPath, "utf8");
        if (entryUrl) {
            update(entry, config, entryUrl, contents);
            console.log('記事を更新');
        } else {
            create(entry, config, contents);
            console.log('記事を新規作成');
        }
    }

}

function fetchEntryUrl(title: string, info: EntryInfo[]): string | null {
    const filterd = info.filter((i: EntryInfo) => i.title === title);
    if (filterd.length === 1) {
        return filterd[0].url;
    } else if (filterd.length === 0) {
        return null;
    } else {
        throw new Error('同じタイトルの記事が複数存在する');
    }
}

function readJsonFile(filePath: string): Config | null {
    try {
        const data = fs.readFileSync(filePath, "utf8");
        return JSON.parse(data) as Config;
    } catch (error) {
        console.error(`Failed to read JSON file: ${error}`);
        return null;
    }
}

function update(entry: { title: string; srcPath: string; }, config: Config, url: string, contents: string): void {
    const escaped = he.escape(contents);

    // 更新するためのXMLデータを作成
    const xmlData = `<?xml version="1.0" encoding="utf-8"?>
    <entry xmlns="http://www.w3.org/2005/Atom">
      <title>${entry.title}</title>
      <content>${escaped}</content>
      <updated>${new Date().toISOString()}</updated>
    </entry>`;

    // 記事の更新
    axios.put(url, xmlData, {
        headers: {
            'Content-Type': 'application/xml',
        },
        auth: {
            username: config.userId,
            password: config.apiKey,
        },
    }).catch((error) => { throw new Error(`${error}`) })
}

function create(entry: { title: string; srcPath: string; }, config: Config, contents: string): void {
    const url: string = format(URL_TEMPLATE, config.userId, config.blogId);
    const escaped = he.escape(contents);
    const xmlData = `<?xml version="1.0" encoding="utf-8"?>
    <entry xmlns="http://www.w3.org/2005/Atom">
      <title>${entry.title}</title>
      <content>${escaped}</content>
      <updated>${new Date().toISOString()}</updated>
    </entry>`;

    // POSTリクエストを送信
    axios.post(url, xmlData, {
        headers: {
            'Content-Type': 'application/xml',
        },
        auth: {
            username: config.userId,
            password: config.apiKey,
        },
    }).then((response) => {
        if (response.status !== 201) {
            throw new Error(`HTTPステータスコード ${response.status}`)
        }
    }).catch((error) => {
        throw new Error(`${error}`);
    });
}

async function getEntriesInfo(config: Config): Promise<EntryInfo[]> {
    let titles: string[] = [];
    let urlLs: string[] = [];

    let url: string | null = format(URL_TEMPLATE, config.userId, config.blogId);
    while (url) {
        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/xml',
            },
            auth: {
                username: config.userId,
                password: config.apiKey,
            },
        })

        // タイトルと entry_id を取得する処理
        const xmlString = response.data;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

        const entries = Array.from(xmlDoc.getElementsByTagName('entry'));
        for (const entry of entries) {
            const children = Array.from(entry.childNodes);
            for (const c of children) {
                if (c.constructor.name === 'Element') {
                    if (c.nodeName === 'title' && c.textContent) {
                        titles.push(c.textContent);
                        continue;
                    } else if (c.nodeName === 'link') {
                        const x: any = c;
                        const attrs = x.attributes;
                        if (attrs.length >= 2
                            && attrs[0].nodeName === 'rel'
                            && attrs[0].nodeValue === 'edit'
                            && attrs[1].nodeName === 'href') {
                            // 記事のurl取得
                            const entryUrl: string = attrs[1].nodeValue;
                            urlLs.push(entryUrl);
                        }
                        continue;
                    }
                }
            }
        }

        // 残りのページ取得のためのリンク取得
        let nextLink: string | null = null;
        const linkElements = xmlDoc.getElementsByTagName('link');
        for (let i = 0; i < linkElements.length; i++) {
            const relAttr = linkElements[i].getAttribute('rel');
            if (relAttr && relAttr === 'next') {
                nextLink = linkElements[i].getAttribute('href');
                break;
            }
        }
        url = nextLink;
    }

    let info: EntryInfo[] = [];

    for (let i = 0; i < titles.length; i++) {
        const o = { title: titles[i], url: urlLs[i] };
        info.push(o);
    }
    return info;
}

