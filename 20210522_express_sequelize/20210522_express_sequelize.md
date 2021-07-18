# Node.js + Express + Sequelize で Web アプリ作成手順

## 本記事の目的

Node.js + Express + Sequelize で Web アプリケーション作成のための環境構築から手順までをまとめる. 

本記事は以下の書籍「作りながら学ぶWebプログラミング実践入門」の内容を自分なりに消化, 改修した内容となっている. 

https://book.mynavi.jp/ec/products/detail/id=112778

今回作成したアプリケーションのリポジトリは以下

https://github.com/kita127/todo-app

## 各技術要素の概略

Sequelize と Mocha は「作りながら学ぶWebプログラミング実践入門」には登場しない要素. 

* Node.js
    * Node.js はスケーラブルなネットワークアプリケーションを構築するために設計された非同期型のイベント駆動の JavaScript 環境
        * 以下より引用
        * https://nodejs.org/ja/about/
    * サーバーサイドのプログラミング言語として使用する
* Express
    * Node.js で Web アプリケーションを作成する代表的なフレームワーク
* Sequelize
    * Node.js の O/R マッピングライブラリ
* Mocha
    * Node.js のユニットテストライブラリ
* SQLite
    * 今回作成するアプリケーションで採用するデータベース

## 環境構築

* OS
    * macOS Big Sur


### Node.js の導入

まずはメイン言語となる Node.js の導入. 

#### nodebrew の導入

Node.js はバージョンの更新が目まぐるしいため, 通常は直接インストールせずバージョンマネージャをインストールして
任意のバージョンに切り替えつつ使用するのが一般的らしい. 

Mac 環境では `nodebrew` というバージョンマネージャがよく使われるらしいのでそちらを導入する. 

https://github.com/hokaccha/nodebrew

curl でインストールする
```bash
$ curl -L git.io/nodebrew | perl - setup
```

`.bashrc` 等の設定ファイルの `PATH` の設定に nodebrew のパスを追加する. 
```bash
$ export PATH=$HOME/.nodebrew/current/bin:$PATH
```

設定ファイルをリロードする. 
```
$ source ~/.bashrc
```

nodebrew のコマンドが使用できることを確認する. 
```bash
$ nodebrew help
nodebrew 1.1.0

Usage:
    nodebrew help                         Show this message
    nodebrew install <version>            Download and install <version> (from binary)
    nodebrew compile <version>            Download and install <version> (from source)
    nodebrew install-binary <version>     Alias of `install` (For backward compatibility)
    nodebrew uninstall <version>          Uninstall <version>
    nodebrew use <version>                Use <version>
    nodebrew list                         List installed versions
    nodebrew ls                           Alias for `list`
```

#### nodebrew から Node.js のインストール

今回は最新のバージョンを導入する. 
```bash
$ nodebrew install latest
```

意図したバージョンの Node.js がインストールされたことを確認する. 
```bash
$ node -v
v16.0.0
```

### Express の導入

Express はプロジェクトの雛形を生成するツール express-generator をグローバル環境に導入する. 
```bash
$ npm install express-generator -g
```

プロジェクトの雛形を作成する. 
以下のコマンドでテンプレートファイルに ejs を指定し, `project-name` で Express プロジェクトの雛形を作成する. 
```bash
$ express -v ejs project-name
```

作成したプロジェクトフォルダに移動すし, 依存パッケージをインストールする. 
```bash
$ cd ./project-name
$ npm install
```

作成したプロジェクトを試しに動かしてみる. 
```bash
$ npm start
```

ブラウザから `http://localhost:3000` にアクセスする. 
以下が表示されることを確認する. 

    Express
    Welcom to Express

### Express の説明

#### Express の使い方

routes/ フォルダに任意の url にアクセスした際の制御を記述する. 

以下はrouter/hoge.js を作成し `http://localhost:3000/hoge` にアクセスした際の制御. 
res.render() の第一引数にレンダリングする ejs ファイルを指定する. 
第二引数には ejs ファイルに渡すオブジェクトを指定する. 

```js
var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.render('hoge', { title: 'hoge' });
});

module.exports = router;
```

レンダリングする ejs ファイルを view フォルダに作成する. 

view/hoge.ejs を以下の通り作成. 
```html
<!DOCTYPE html>
<html>
  <head>
    <title><%= title %></title>
    <link rel='stylesheet' href='/stylesheets/style.css' />
  </head>
  <body>
    <h1><%= title %></h1>
    <p>Welcome to <%= title %></p>
  </body>
</html>
```

app.js に以下の設定を追加する. 
以下の設定で作成した hoge.js が URL /hoge と紐づく. 
以下の設定により /hoge が hoge.js におけるルートとなるため `router.get('/', ....)` の記述で
`http://localhost:3000/hoge` にアクセスした場合の処理の記述となる. 

```js
// 作成したルータ hoge.js を require する
var hogeRouter = require('./routes/hoge');

    .
    .
    .

// 作成した hogeRouter に URL を紐付ける
app.use('/hoge', hogeRouter);
```

### Sequelize

Sequelize を導入する. Sequelize は Node.js 用の OR マッパー. 

#### 導入

    $ npm install sequelize

#### sequelize-cli の導入

sequelize を便利に使用するための CLI ツールを導入する. 

    $ npm install sequelize-cli

#### sequelize を初期化する

    $ npx sequelize-cli init

以下のフォルダが作成されることを確認する. 

* config
    * 設定情報管理
* models
    * データベースアクセスに使う「モデル」というオブジェクトを定義する

#### config.json に設定をする

SQLite3 を使用する場合は以下のような感じで設定する. 

``` json
{
  "development": {
    "database": "db-development",
    "dialect": "sqlite",
    "storage": "seq-todo.sqlite3"
  },
  "test": {
    "database": "db-test",
    "dialect": "sqlite",
    "storage": "seq-todo.sqlite3"
  },
  "production": {
    "database": "db-product",
    "dialect": "sqlite",
    "storage": "seq-todo.sqlite3"
  }
}
```

#### モデルを作成する

データベースのテーブルにアクセスするためのオブジェクトであるモデルを作成する. 
モデルの作成は sequelize-cli のコマンドで行う. 

以下は users というテーブルを作成, account, password, name, role といったカラムを持つ. 

    $ npx sequelize-cli model:generate --name users --attributes account:string,password:string,name:string,role:string

以下が生成されることを確認する. 

* models/users.js
* migrations/yyyymmddxxxxxxxx-create-users.js

#### マイグレーションを実行する

データベースの内容を変更した場合にその差分をデータベースに適用することをマイグレーションと呼ぶ. 

今回は新たにモデルを作成したため、その変更をデータベースに反映する. 
これによりモデルを作成した users テーブルが seq-todo.db に作成される. 

    $ npx sequelize-cli db:migrate --env development

#### シーディングによりレコードを作成する

seq-todo.db に users テーブルを作成したが, レコードは何もない. 
そのため, あらかじめレコードを作成する. こうしたはじめに用意しておくデータをシードと呼ぶ. 

シーディング作成用のスクリプトファイルを生成する. 

    $ npx sequelize-cli seed:generate --name sample-users

seeders/yyyymmddxxxxxxxx-sample-users.js が生成されているためその `up` に生成するレコードの情報を記述する. 

``` javascript
up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('users', [
        {
            account: 'admin.com',
            password: 'admin',
            name: 'admin',
            role: 'admin',
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ]);
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
},
```

シーディングを実行する. 

    $ npx sequelize-cli db:seed:all




### Mocha

ユニットテスト用のフレームワークとして Mocha を導入する. 

    # mocha をインストール
    $ npm install mocha --save-dev

    # プロジェクト直下の test ディレクトリ内にある .js ファイルを対象に mocha はテストする
    $ mkdir test

    # テストモジュール作成
    $ touch ./test/test-sample.js

テストモジュールに以下のようにテストを記述する. 

```javascript
describe('TEST SAMPLE', () => {
    it('test 1', (done) => {
        if ('aaa' === 'aaa') {
            done();
        }
        else {
            done('失敗');
        }
    });
});
```

テスト実行

    $ npx mocha


