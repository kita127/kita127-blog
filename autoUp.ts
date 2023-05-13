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

get();
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

async function get(): Promise<void> {

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
        console.log(xmlString);

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
        const title = xmlDoc.getElementsByTagName('title')[0].textContent;
        const content = xmlDoc.getElementsByTagName('content')[0].textContent;
        // console.log(`Title: ${title}`);
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

}

