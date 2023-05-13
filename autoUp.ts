import axios from 'axios';
//import xml2js from 'xml2js';
//import Base64 from 'Base64';
import { DOMParser } from 'xmldom';
//import { Buffer } from 'buffer';
import { format } from 'util';
import * as fs from 'fs';
import { exit } from 'process';

//const userId = 'kita127';
//const blogId = 'kita127.hatenablog.com';
const URL = `https://blog.hatena.ne.jp/%s/%s/atom/entry`;
//const apiKey = 'sgzt3btztd';
const entryId = '4207575160648581415';

interface Config {
    userId: string;
    blogId: string;
    apiKey: string;
    entries: {
        title: string;
        srcPath: string;
    }[];
}

interface EntryInfo { title: string, code: string }

// main 処理
main();

function main(): void {
    const config = readJsonFile("./entries.json");
    if (config === null) {
        console.error('entries.jsonのパースに失敗');
        exit(1);
    }

    getEntriesInfo(config)
        .then((info: EntryInfo[]) => {
            console.log(info);
        })
        .catch((error) => console.error(error));
}

// put()
//     .then((res) => console.log('更新が正常に終了'))
//     .catch((error) => console.error('エラー発生', error));

//post();

function readJsonFile(filePath: string): Config | null {
    try {
        const data = fs.readFileSync(filePath, "utf8");
        return JSON.parse(data) as Config;
    } catch (error) {
        console.error(`Failed to read JSON file: ${error}`);
        return null;
    }
}


// async function put(): Promise<void> {
//     // 更新するためのXMLデータを作成
//     const contents = `更新後コンテンツ`;
//     const xmlData = `<?xml version="1.0" encoding="utf-8"?>
//     <entry xmlns="http://www.w3.org/2005/Atom">
//       <id>${entryId}</id>
//       <title>更新後タイトル</title>
//       <content>${contents}</content>
//       <updated>${new Date().toISOString()}</updated>
//     </entry>`;

//     // 記事の更新
//     await axios.put(`${URL}/${entryId}`, xmlData, {
//         headers: {
//             'Content-Type': 'application/xml',
//         },
//         auth: {
//             username: userId,
//             password: apiKey,
//         },
//     });
// }

// async function post(): Promise<void> {
//     // リクエストのXMLデータを構築
//     const contents = `# タイトル
// ## その1

// 本文本文本文
// 本文本文本文

// ## その2

// 本文
// `

//     const xmlData = `<?xml version="1.0" encoding="utf-8"?>
//     <entry xmlns="http://www.w3.org/2005/Atom">
//       <title>新規タイトル</title>
//       <content>${contents}</content>
//       <updated>${new Date().toISOString()}</updated>
//     </entry>`;

//     // POSTリクエストを送信
//     const response = await axios.post(URL, xmlData, {
//         headers: {
//             'Content-Type': 'application/xml',
//         },
//         auth: {
//             username: userId,
//             password: apiKey,
//         },
//     });

//     // HTTPステータスコードが201 Createdであれば、正常に処理されたと判断
//     if (response.status === 201) {
//         console.log('投稿が正常に処理されました。');
//     } else {
//         console.error(`HTTPステータスコード ${response.status} が返されました。`);
//     }
// }

async function getEntriesInfo(config: Config): Promise<EntryInfo[]> {
    let titles: string[] = [];
    let cds: string[] = [];

    let url: string | null = format(URL, config.userId, config.blogId);
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
                            // entry_id を取得
                            const code: string = attrs[1].nodeValue;
                            cds.push(code);
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
        const o = { title: titles[i], code: cds[i] };
        info.push(o);
    }
    return info;
}

