# kita127-blog
My blog

ここにブログをまとめた上でブログサービスに掲載する.<br>
魚拓を兼ねている.<br>
今ははてなブログで公開している.<br>
https://kita127.hatenablog.com/


## サチコ でクローラーに伝える

サチコ(Google Search Console) でクローラーに記事を伝える方法.

1. 自分の Google Search Console にアクセス
1. URL 検査を押下
1. サーチマークの箇所にインデックス登録をリクエストしたいページの URL を入力
1. インデックス登録をリクエストをする
1. インデックス登録をリクエスト済みが表示されたら完了


## autoUp

GitHub で管理しているブログをはてなブログに自動アップロードするスクリプト.

### Enviroment

- TypeScript

### Usage

- コンパイル
    - `$ tsc`
- 実行
    - `$ node ./dist/autoUp.js`


`entries.json` に更新したい記事の情報を記載する.
`entries.json` は `entries.json.example` をコピーして `autoUp.ts` と同じディレクトリに置く.
はてなブログ側に該当する記事がない場合は記事を新規作成する.

```json
{
    "userId": "userId",
    "blogId": "hoge.hatenablog.com",
    "apiKey": "API Key の値",
    "entries": [
        {
            "title": "Go言語でつくるインタプリタを Haskell で書く",
            "srcPath": "./20191212_haskey/20191212_haskey.md"
        },
        {
            "title": "stdedit : 標準入力をエディタで編集し結果を標準出力するコマンド",
            "srcPath": "./20200329_stdedit/20200329_stdedit.md"
        }
    ]
}
```

- apiKey
    - はてなブログ API を使用する際に必要な API Key
    - マイページの設定から確認できる
- entries
    - title
        - 記事のタイトル
        - ここの文字列とはてなブログ側で一致する記事に対して更新をするためピッタリ合わせる必要がある
    - srcPath
        - はてなブログにあげる記事のパス
        - `autoUp.ts` からの相対パスで記述する
