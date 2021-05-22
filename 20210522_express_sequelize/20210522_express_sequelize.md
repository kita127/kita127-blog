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

`.bashrc` 等の設定ファイルの `PATH` の設定に nodebrew のパスを追加する
```bash
$ export PATH=$HOME/.nodebrew/current/bin:$PATH
```

設定ファイルをリロードする
```
$ source ~/.bashrc
```

nodebrew のコマンドが使用できることを確認する
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


### Node.js の説明

### Express の導入
### Express の説明

### Sequelize の導入
### Sequelize の説明

### Mocha の導入
### Mocha の説明



