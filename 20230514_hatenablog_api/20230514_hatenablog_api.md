# はてなブログの WEB API を使う

## やりたいこと

はてなブログが公開している WEB API, Atom Pub API を使用した
記事の作成, 更新をするスクリプトを作成したため覚書記事を作成します. <br>

本記事では Atom Pub API を使用した記事の取得, 新規作成, 更新の方法についてまとめます. <br>

今回作成したスクリプト(TypeScript製)は以下にあります. こちらは GitHub で管理している記事をはてなブログ
側にアップロードするスクリプトになります. 詳細は README.md を参照してください. <br>

- https://github.com/kita127/kita127-blog
    - `autoUp.ts`

## 基本事項

API 使用のために以下の情報が必要になります. 

- user ID
- ルートエンドポイントのURL
    - `https://blog.hatena.ne.jp/userId/userId.hatenablog.com/atom` みたいなやつ
- API KEY

`user ID` ははてなブログの管理画面(ダッシュボード)のアカウントから確認できます. 
ルートエンドポイントと API KEY は「管理画面」→「設定」→「詳細設定」から確認できます.<br>

## 認証情報

認証に使用する手段は複数あるようですが, 今回は一番手っ取り早い Basic 認証を
用いた方法を使用します.<br>

ユーザー名を `user ID`, パスワードを `API KEY` としてコロンでつなげて
Base64 エンコードした文字列を使用します.<br>

TypeScript では以下のように `auth` オブジェクトに `username` と `password` を設定します.<br>

```typescript
axios.get(url, {
            headers: {
                'Content-Type': 'application/xml',
            },
            auth: {
                username: userId,
                password: apiKey,
            },
        })
```

もしくは自前でユーザーID, API KEYをコロンで連結した文字列を Base64 エンコード
し, `Authorization` ヘッダにBasic認証として設定します.<br>

```typescript
import { Buffer } from 'buffer';

const basicAuth = Buffer.from(`${userId}:${apiKey}`).toString('base64');

axios.get(url, {
            headers: {
                'Authorization': 'Basic ${basicAuth}',
                'Content-Type': 'application/xml',
            },
        })
```

curl なら以下のような感じです.<br>

```
curl -u userId:apiKey https://blog.hatena.ne.jp/userId/userId.hatenablog.com/atom/entry
```

## 記事一覧の取得

記事一覧の取得はルートの URL + `/entry` のエンドポイントに対して GET リクエスト
で取得できます. Basic認証も忘れずに.<br>

TypeScript では以下のような雰囲気になります.
(実際に動かしていないので動くかわからないです. あくまで雰囲気です.
以降のコードサンプルも動作確認はしていませんのでご了承ください.)<br>

```typescript
const url = 'https://blog.hatena.ne.jp/userId/userId.hatenablog.com/atom/entry';

response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/xml',
            },
            auth: {
                username: USER_ID,
                password: API_KEY,
            },
        })

console.log(response.data);
```

レスポンスは以下のような xml で返ってきます.

```xml
<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom"
      xmlns:app="http://www.w3.org/2007/app">

  <link rel="first" href="https://blog.hatena.ne.jp/userId/userId.hatenablog.com/atom/entry" />

  
  <link rel="next" href="https://blog.hatena.ne.jp/userId/userId.hatenablog.com/atom/entry?page=1658475002" />
  

  <title>userIdのブログ</title>
  
  <link rel="alternate" href="https://userId.hatenablog.com/"/>
  <updated>2023-05-12T00:56:57+09:00</updated>
  <author>
    <name>userId</name>
  </author>
  <generator uri="https://blog.hatena.ne.jp/" version="xxxxxxxxxxxxxxxxxxxxxx">Hatena::Blog</generator>
  <id>hatenablog://blog/yyyyyyyyyyyyyyyy</id>

```

一覧取得のエンドポイントはデフォルトで7件ほどしか記事情報を返しません. 
続きを取得する場合は `<link rel="next"` のタグの `href` 属性に
続きの記事を取得するための URL が設定されているため, そこにリクエストすれば続きを取得できます.<br>

こんな感じ
```xml
  <link rel="next" href="https://blog.hatena.ne.jp/userId/userId.hatenablog.com/atom/entry?page=nnnnnnnnnn" />
```

全件記事情報を取得する場合は, `<link rel="next"` がなくなるまで繰り返す感じになります.<br>


## 記事の新規作成

記事の新規作成はルートの URL + `/entry` に対して記事の情報を xml で作成したデータ
とともに POST メソッドリクエストで行います.<br>
TypeScript の例では以下のような感じになります. <br>

```typescript

function create(title: string, contents: string): void {
    const url = 'https://blog.hatena.ne.jp/userId/userId.hatenablog.com/atom/entry';
    const xmlData = `<?xml version="1.0" encoding="utf-8"?>
    <entry xmlns="http://www.w3.org/2005/Atom">
      <title>${title}</title>
      <content>${contents}</content>
      <updated>${new Date().toISOString()}</updated>
    </entry>`;

    // POSTリクエストを送信
    axios.post(url, xmlData, {
        headers: {
            'Content-Type': 'application/xml',
        },
        auth: {
            username: USER_ID,
            password: API_KEY,
        },
    }).then((response) => {
        if (response.status !== 201) {
            throw new Error(`HTTPステータスコード ${response.status}`)
        }
    }).catch((error) => {
        throw new Error(`${error}`);
    });
}
```

## 記事の更新

既存の記事の更新はルートの URL + `/entry/記事のID` に対して更新する記事の情報を xml で作成したデータ
とともに PUT メソッドリクエストで行います.<br>
ここで「記事のID」の取得方法についてですが, 記事一覧で取得した xml に含まれる `<link rel="edit"`
タグの `href` がそれに該当します.<br>

こんな感じ.
```xml
<link rel="edit" href="https://blog.hatena.ne.jp/userId/userId.hatenablog.com/atom/entry/3824838384928"/>
```
この URL に対して PUT します. <br>


TypeScript の例では以下のような感じになります. <br>


```typescript
function update(title: string, contents: string): void {
    const url = 'https://blog.hatena.ne.jp/userId/userId.hatenablog.com/atom/entry/3824838384928';
    const xmlData = `<?xml version="1.0" encoding="utf-8"?>
    <entry xmlns="http://www.w3.org/2005/Atom">
      <title>${title}</title>
      <content>${contents}</content>
      <updated>${new Date().toISOString()}</updated>
    </entry>`;

    // POSTリクエストを送信
    axios.put(url, xmlData, {
        headers: {
            'Content-Type': 'application/xml',
        },
        auth: {
            username: USER_ID,
            password: API_KEY,
        },
    }).then((response) => {
        if (response.status !== 201) {
            throw new Error(`HTTPステータスコード ${response.status}`)
        }
    }).catch((error) => {
        throw new Error(`${error}`);
    });
}

```

