import axios from 'axios';
//import xml2js from 'xml2js';
//import Base64 from 'Base64';
import { DOMParser } from 'xmldom';
import { Buffer } from 'buffer';

const userId = 'kita127';
const blogId = 'kita127.hatenablog.com';
const URL = `https://blog.hatena.ne.jp/${userId}/${blogId}/atom/entry`;
const username = 'kita127';
const apiKey = 'sgzt3btztd';
const basicAuth = 'Basic ' + btoa(userId + ':' + apiKey);

//GET https://blog.hatena.ne.jp/{はてなID}/{ブログID}/atom/entry

//const entryId = '取得する記事のID';
//const apiUrl = `https://blog.hatena.ne.jp/${userId}/${blogId}/atom/entry/${entryId}`;

get().then((info: { title: string, code: string }[]) => {
    console.log(info);
}).catch((error) => {
    console.error('エラー発生', error);
});

//post();

async function post(): Promise<void> {
    // リクエストのXMLデータを構築
    const contents = `# タイトル
## その1

本文本文本文
本文本文本文

## その2

本文
`

    const xmlData = `<?xml version="1.0" encoding="utf-8"?>
    <entry xmlns="http://www.w3.org/2005/Atom">
      <title>新規タイトル</title>
      <content>${contents}</content>
      <updated>${new Date().toISOString()}</updated>
    </entry>`;

    // Authorizationヘッダに含める認証情報をBase64エンコード
    const encodedApiKey = Buffer.from(`${userId}:${apiKey}`).toString('base64');

    // POSTリクエストを送信
    const response = await axios.post(URL, xmlData, {
        headers: {
            'Authorization': `Basic ${encodedApiKey}`,
            'Content-Type': 'application/xml',
        },
    });

    // HTTPステータスコードが201 Createdであれば、正常に処理されたと判断
    if (response.status === 201) {
        console.log('投稿が正常に処理されました。');
    } else {
        console.error(`HTTPステータスコード ${response.status} が返されました。`);
    }
}

async function get(): Promise<Array<{ title: string, code: string }>> {
    let titles: string[] = [];
    let cds: string[] = [];

    let url: string | null = URL;
    while (url) {
        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/xml',
            },
            auth: {
                username: username,
                password: apiKey,
            },
        })
        const xmlString = response.data;
        //        console.log(xmlString);

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
                            const code: string = attrs[1].nodeValue;
                            cds.push(code);
                        }
                    }
                }
            }
        }

        // const content = xmlDoc.getElementsByTagName('content')[0].textContent;
        //        console.log(`Title: ${title}`);
        // console.log(`Content: ${content}`);

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

    let info: {
        title: string;
        code: string;
    }[] = [];

    for (let i = 0; i < titles.length; i++) {
        const o = { title: titles[i], code: cds[i] };
        info.push(o);
    }
    return info;
}

