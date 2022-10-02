# Docker + Apache + Laravel で Web アプリケーションつくる

## やりたいこと

Laravel 製の Web アプリケーションを作成し, 自宅サーバ PC にデプロイしたい. 
とりあえず, 自宅のプライベートネットワーク内だけの運用を想定しているがそのうち VPN などで外部からもアクセスできるようにしたいかも. 

デプロイ作業を楽にしたい&環境構築とかでカオスになりたくないため Web サーバーやデータベースは
Docker コンテナを利用し, 各コンテナを連携させる構成とする. 

Docker コンテナを利用した Laravel 開発には Sail があるが, Apache への載せ替え方がわからなかったのと, 
Docker の勉強も兼ねてコンテナ連携の構築から自前で作成する. 

また, 自身の勉強も兼ねているため各技術要素についてなるべく詳細に残していく予定. 

## 要件

* Web サーバーとデータベースはそれぞれ Docker コンテナ化し連携する
* Web サーバーは Apache を使用する
* データベースは MySQL を使用する
* Web アプリケーションは PHP のフレームワーク Laravel を使用し作成する

## 本記事の内容

本記事では[要件](#要件)のうち基盤づくりまで, つまり Docker で Apache と MySQL のコンテナ
を作成・連携, Apache コンテナ上に構築した Laravel から簡単なレスポンスをクライアント返すところまでを作る. 

また, 作成したプロジェクトのリポジトリは以下. 
https://github.com/kita127/docker-apache-example

## 環境

ホストPCで使用する各種ツールのバージョンは以下. 開発は Mac PC で行う. 

* macOS Monterey
    * 12.5.1
    * Intel Mac
* PHP 8.1.10
    * サーバーサイドのプログラミング言語
* Composer 2.4.1
    * PHP のパッケージマネージャ
* docker desktop 4.5.0
    * Engine 20.10.12
* コンテナ内環境
    * PHP 8.1
    * MySQL 8.0.30


サーバ PC は準備中. おそらく ubuntu を採用する見込み. 
現段階ではホストPCのみで開発をすすめる. 

## 環境構築

必要なアプリケーションを Homebrew を使ってインストールする. 

```
# brew install --cask docker
# brew install php
# brew install composer
```

## 構成

今回作成するプロジェクトの構成は以下の通り. 

```
プロジェクトトップ
├── docker/
│      ├── apache/
│      │      ├── Dockerfile
│      │      ├── config/
│      │      │      └── 000-default.conf
│      │      └── php.ini
│      └── db/
│              ├── Dockerfile
│              └── initdb.d/
│                      └── master.sql
├── docker-compose.yaml
└── webapp/
```

* docker/
    * 各コンテナの Dockerfile やコンフィグ系のファイルを格納する
* docker/apache/
    * Apache コンテナの設定や Dockerfile など
    * Web サーバの設定である `.conf` ファイルもここで管理する
    * `php.ini` もここで管理
* docker/db/
    * DB(MySQL) コンテナの Dockerfile や設定ファイル等を管理
    * コンテナ起動時に実行される SQL ファイル(master.sql)も管理
* docker-compose.yaml
    * コンテナの連携のための Docker Compose 設定ファイル
* webapp/
    * Web アプリケーション(Laravel プロジェクト)

## 手順

### Docker の構築

#### docker-compose.yaml の作成

Webサーバと DB のコンテナを作成する設定をつくる. [構成](#構成)に記載の `docker-compose.yaml` を以下の通り作成. 

```yaml
version: '3'

services:
  apache:
    container_name: apache
    build:
      context: .
      dockerfile: ./docker/apache/Dockerfile
    ports:
      - 80:80
    environment:
      COMPOSER_ALLOW_SUPERUSER: 1
    volumes:
      - ./webapp:/var/www/html
    depends_on:
      - db
    networks:
      - net1
  db:
    container_name: db
    build:
      context: .
      dockerfile: ./docker/db/Dockerfile
    environment:
      MYSQL_ROOT_PASSWORD: secret
      MYSQL_USER: docker
      MYSQL_PASSWORD: docker
      TZ: 'Asia/Tokyo'
    networks:
      - net1
    ports:
      - 3306:3306
networks:
  net1:
```

* `services` 以下に `apache` コンテナと `db` コンテナを作成
* `services.apache`
    * `Apache` のコンテナ
    * image の指定やコンテナ独自の設定は Dockerfile で行う
    * `container_name`
        * コンテナの名前
        * 各コンテナはこの名前で IP の名前解決がされるためコンテナ名での通信が互いに可能となる
            * 例えば `apache` コンテナ内で `$ ping db` で `db` コンテナに対して ping を投げたりもできる
    * `build`
        * ビルド時の設定
        * `context`
            * ビルドする際のビルドコンテキストをプロジェクトトップとする
            * コンテナがビルドされる際のカレントディレクトリを決める
            * Dockerfile にパスを記述する際の基準となるパス
                * この場合, 相対パスを記述する際はプロジェクトトップがカレントとなる
    * `dockerfile`
        * ビルド時の Dockerfile ファイルを指定
    * `ports`
        * ホストの TCP 80 番 ポートへコンテナの TCP 80 番ポートをフォワード
    * `environment`
        * コンテナに環境変数 `COMPOSER_ALLOW_SUPERUSER` を 1 で設定
            * root ユーザへの Composer インストールを許可するとのこと
            * Do not run xxx のような警告が出るらしくそれを抑えるため設定
    * `volumes`
        * Laravel プロジェクト(`webapp/`)を `apache` コンテナの `/var/www/html` にマウント
    * `depends_on`
        * Laravel から DB にアクセスするため `db` コンテナの起動後に `apache` コンテナを起動する
        * なくても大丈夫な気もする・・・
    * `net1`
        * `apache` コンテナと `db` コンテナは互いにやりとりする必要があるため同一ネットワーク `net1` に属させる
* `services.db`
    * DB のコンテナ
    * `environment`
        * `MYSQL_ROOT_PASSWORD`
            * root ユーザーのパスワード
    * `port`
        * ホストの TCP 3306 番 ポートへコンテナの TCP 3306 番ポートをフォワード
        * Sequel などの MySQL 用の GUI ツールを使用する際, ホストから 3306 ポートでコンテナの MySQL を操作できる
    * 他の設定値については `services.apache` の内容を参照
* `networks.net1`
    * `apache` コンテナと `db` コンテナで通信するためのネットワークを定義


#### apache コンテナの Dockerfile の作成

`プロジェクトトップ/docker/apache/` に以下の `apache` コンテナ用の Dockerfile を作成する. 

```Dockerfile
FROM php:8.1-apache-bullseye

# apt install iputils-ping net-tools で ping を導入
RUN apt-get update \
 && apt-get install -y zlib1g-dev libzip-dev unzip vim iputils-ping net-tools\
 && docker-php-ext-install zip

# a2emod rewrite をして apache に rewrite モジュールを追加
# これをしないと Laravel でルート以外にアクセスできない
RUN a2enmod rewrite

# docker php には mysql 用のドライバが未インストールのため追加する
RUN docker-php-ext-install pdo_mysql

COPY --from=composer:2.4.1 /usr/bin/composer /usr/bin/composer

ADD docker/apache/php.ini /usr/local/etc/php/

# Apache の conf は seites-available に作成し
# a2ensite コマンドでシンボリックリンクを sites-enabled に作成する
ADD docker/apache/config/000-default.conf /etc/apache2/sites-available/
RUN a2ensite 000-default

WORKDIR /var/www/html

COPY ./webapp /var/www/html

RUN chown www-data storage/ -R \
 && composer install
```

* `FROM`
    * 元となる Docker イメージの指定
    * ホスト環境と同じ PHP 8.1 系をセレクト
    * Docker Hub の php イメージ, `8.1-apache-bullseye` タグを指定
        * [タグlink](https://hub.docker.com/layers/library/php/8.1-apache-bullseye/images/sha256-fcee566dcc5d4debf4bd46d11cddaf5eac3dc964eef465325bc4b073d0bf647c?context=explore)
    * `8.1-apache-bullseye` は Debian Apache に `mod_php` が含まれたタグ
        * bullseye は Debian の v11 に対するコードネームとのこと
        * https://hub.docker.com/_/php
* `RUN apt-get update ....`
    * コンテナ起動時にパッケージ情報のアップデートと必要なパッケージをインストール
    * `iputils-ping` と `net-tools`
        * `ping` を利用するためインストール
        * コンテナ間の疎通確認とかで使用したいがデフォルトではインストールされていないため追加
    * `docker-php-ext-install zip`
        * PHP 拡張をインストールするためのヘルパスクリプトとのこと
        * 詳細は Docker Hub の PHP イメージページを参照
            * https://hub.docker.com/_/php
* `RUN a2enmod rewrite`
    * Apache に `rewrite` モジュールを追加する
    * Laravel でのルーティングにはこのモジュールの有効化が必要
* `RUN docker-php-ext-install pdo_mysql`
    * Docker の PHP コンテナには MySQL 用のドライバがインストールされていないため追加する
* `COPY --from=composer:2.4.1 /usr/bin/composer /usr/bin/composer`
    * composer:2.4.1 イメージをビルドし作成した `composer` の実行形式をコンテナの `/usr/bin/composer` にコピーしているぽい
    * Composer のバージョンはホスト環境と合わせる
    * `COPY --from=name src dest`
        * `FROM <image> as <name>` として名前をつけて構築したステージをコピー元として指定できる
        * `composer:latest` を指定しているので名前つけをしたステージ以外にも image を直接指定もできるぽい？
        * 詳細は Docker Hub の Composer イメージのページや Dockerfile リファレンスの `COPY` を参照
            * [COPYのリファレンス](https://docs.docker.jp/engine/reference/builder.html#copy)
            * [Composerイメージのページ](https://hub.docker.com/_/composer)
* `ADD docker/apache/php.ini /usr/local/etc/php/`
    * PHP の設定ファイル(`php.ini`)をコンテナの然るべき場所に置く
* `ADD docker/apache/config/000-default.conf /etc/apache2/sites-available/`
* `RUN a2ensite 000-default`
    * `docker/apache/config` にある Apache のコンフィグファイル(`000-default.conf`)を `sites-available` に置く
    * 大元のコンフィグファイルである `apache2.conf` では `sites-enabled/` のみ `IncludeOptional` ディレクティブにより有効化される. `sites-available/` は有効化されない
    * `sites-available` に置いたコンフィグファイルのシンボリックリンクを `sites-enabled` に置くことにより `sites-available/` 内の任意のコンフィグを有効にする
    * シンボリックリンクの作成は直接作成して `sites-enabled` においても構わないが, `a2ensite` コマンドで作成可能
    * https://nanbu.marune205.net/2021/12/debian-apache2-dir.html
* `WORKDIR /var/www/html`
    * 作業ディレクトリを `/var/www/html` に指定
    * `RUN` や `CMD` 実行時のディレクトリとなる
    * コンテナ内に入った時もここがワーキングディレクトリになる？
* `COPY ./webapp /var/www/html`
    * Web アプリケーション(Laravelプロジェクト)をコンテナの `/var/www/html` にコピーする
* `RUN chown www-data storage/ -R \`
    * `www-data` は Apache がデフォルトで通常操作に使用するユーザー
    * `www-data` がアクセスできるファイルに Apache もアクセスできる
    * Laravel プロジェクトの `storage` フォルダ以下の所有者を `www-data` に変更する
* `composer install`
    * `composer.lock` の内容でパッケージをインストール

#### Apache のコンフィグファイルの作成

Apache サーバのコンフィグファイル
`プロジェクトトップ/docker/apache/config/000-default.conf` を以下の通り作成する. 

```
<VirtualHost *:80>
        ServerAdmin webmaster@localhost
        DocumentRoot /var/www/html/public
        ErrorLog ${APACHE_LOG_DIR}/error.log
        CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
```

* `VirtualHost`
    * バーチャルホストを実現するディレクティブ
    * ひとつのサーバで複数のウェブサイトを提供する機能
    * IP ベース, 名前ベース, ポートベースといくつかの実現方法がある
    * 今回は複数のウェブサイトを提供したいわけではないため, 80 番ポートで受けるひとつの `VirtualHost` ディレクティブのみ
    * 詳細は以下あたりを参照
        * https://httpd.apache.org/docs/2.2/ja/vhosts/examples.html
        * https://httpd.apache.org/docs/2.4/mod/core.html#virtualhost
* `ServerAdmin`
    * サーバがクライアントに送るエラーメッセージに含めるアドレス
    * プライベートに使用するウェブサイトのため適当に設定
* `ErrorLog`
    * エラーログファイルの指定
    * `APACHE_LOG_DIR` の環境変数はコンテナの `/etc/apache2/envvars` に定義されている
* `CustomLog`
    * クライアントのアクセスログを記録するファイルとフォーマットを指定する
    * 第2引数の `combined` は `LogFormat` ディレクティブで名前つけされたフォーマット
        * `combined` は `apache2.conf` に以下の通り定義されている
        * `LogFormat "%h %l %u %t \"%r\" %>s %O \"%{Referer}i\" \"%{User-Agent}i\"" combined`
    * 本ディレクティブは `mod_log_config` モジュールの機能

#### php.ini の作成

PHP の設定ファイル `プロジェクトトップ/docker/apache/php.ini` を以下の通り作成. 
とりあえず, タイムゾーンと言語に関する設定だけ. 

```
[Date]
date.timezone = "Asia/Tokyo"

[mbstring]
mbstring.language = "Japanese"
```


#### db コンテナの Dockerfile の作成

`プロジェクトトップ/docker/db/` に以下の `db` コンテナ用の Dockerfile を作成する. 

```Dockerfile
FROM mysql:8.0.30

# docker-entrypoint-initdb.d にある SQL ファイルがコンテナ起動時に実行される
COPY ./docker/db/initdb.d /docker-entrypoint-initdb.d
```

* `FROM mysql:8.0.30`
    * MySQL イメージの `8.0.30` タグを使用する
* `COPY ./docker/db/initdb.d /docker-entrypoint-initdb.d`
    * `docker/db/initdb.d` フォルダをコンテナの `/docker-entrypoint-initdb.d` にコピーする
    * `/docker-entrypoint-initdb.d` フォルダにある SQL ファイルがコンテナ起動時に実行される

`プロジェクトトップ/docker/db/initdb.d/` に以下の `db` コンテナ起動時に実行される `master.sql` を格納する. 

キャラクタ設定をして `master` スキーマを作成している. 

```sql
SET CHARACTER_SET_CLIENT = utf8;
SET CHARACTER_SET_CONNECTION = utf8;

CREATE DATABASE `master`;
```

以上で Apache と MySQL のコンテナ作成のための準備は完了. 

### Laravel プロジェクトの作成

プロジェクトトップで以下のコマンドを実行し Laravel プロジェクトを作成する. 

```
$ composer create-project laravel/laravel webapp
```

作成した `webapp` に移動し, `$ php artisan serve` を実行し Laravel のサーバを起動. 
ブラウザから `http://localhost:8000` でアクセスし Laravel のデフォルトページが表示されるか確認する. 

#### Laravel から DB にアクセスする準備

とりあえず, db コンテナと連携できるかの確認のため捨てテーブルを作る. 
テーブル生成用のマイグレーションファイルを作成する. 以下のコマンドを実行. 

`$ php artisan make:migration create_hoges_table`

`database/migrations/yyyy_mm_dd_xxxx_create_hoges_table.php` が生成される. 

確認用なのでとりあえずデフォルトのままでOK. 

Eloqent モデルを作成する. 以下のコマンドを実行. 

`$ php artisan make:model Hoge`

`webapp/app/Models/Hoge.php` が作成される. 

次にコントローラを以下のコマンドで作成. 

`$ php artisan make:controller HogeDir/HogeController --invokable`

`webapp/app/Http/Controllers/HogeDir/HogeController.php` が作成される. 

とりあえず動作確認のため, hoges テーブルからレコードを取得し先頭要素の id をビューに渡すだけの処理を実装. 

```php
<?php

namespace App\Http\Controllers\HogeDir;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Hoge;

class HogeController extends Controller
{
    /**
     * Handle the incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function __invoke(Request $request)
    {
        $ls = Hoge::all();
        return view('hoge.index', ['hoge' => $ls[0]->id]);
    }
}
```

`webapp/resources/views/hoge/index.blade.php` を作成する. これも確認のためだけなので $hoge を表示する簡易な表示のみ. 

```blade
<!doctype html>
<html lang="ja">

<head>
    <meta charset="UTF-8">
    <meta name="viewport"
        content="width=device-width, user-scalable=no, initial-scale=1.0,
          maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>アプリタイトル</title>
</head>

<body>
    <h1>アプリボディ</h1>
    <p>{{ $hoge }}</p>
</body>

</html>
```

#### .env の変更

`.env` は DB に関する設定だけ以下の通り変更する. 
`DB_HOST` にはデータベースサーバの IP を設定するが, Docker のネットワーク内であれば
コンテナ名で名前解決されるため, `db` で OK. ただし, ホストからはコンテナ名では IP の名前解決はできないため
ホストで動かした Laravel からは DB にはアクセスできない. `docker-compose.yaml` で別途コンテナに IP アドレスを
付与してやり, そちらを `DB_HOST` に設定すればホストで動かした Laravel からでも DB にアクセスできる気がするが, 
基本的に apache コンテナで動かすつもりなので今の所やらない. 


```

...

DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=master
DB_USERNAME=root
DB_PASSWORD=secret

...

```

### Web サーバ(Apache)の確認

ここまでで準備が整ったのでそれぞれのコンテナの動作確認をする. 

まずはコンテナを生成するためプロジェクトトップで以下のコマンドを実行. 
`-d` でデーモン起動(detachの略らしいけど). 

```
$ docker-compose up -d
```

ブラウザで `http://localhost:80/` にアクセスし Laravel のページが表示されれば問題なく
`apache` コンテナが起動していることを確認できる. 

### DB(MySQL)の確認

Laravel から DB にアクセスできるか確認する. 

そのまえに, DB アクセスのための下準備が完了していないためそちらを終わらせる. 

まず, `master` スキーマが生成されていることを確認する. `db` コンテナに入る. 

```
$ docker-compose exec db bash
```

以下のコマンドを実行. `docker-compose.yaml` に設定している MySQL のパスワードを入力する. 

```
# mysql -u root -p
# パスワードを入力
```

`show databases;` で `master` スキーマが生成されていることを確認する. 

```
+--------------------+
| Database           |
+--------------------+
| information_schema |
| master             |
| mysql              |
| ......             |
| ......             |
```

`exit;` し mysql を終了, さらに `exit` しコンテナからも出る. 


次に `apache` コンテナに入る. 

```
$ docker-compose exec apache bash
```

まずは `apache` コンテナで MySQL 用のドライバがインストールされているか確認する. 
以下のコマンドを実行し `pdo_mysql` が確認できれば OK. 

```
$ php -m | grep mysql
mysqlnd
pdo_mysql
```

Laravel プロジェクトをマウントしたディレクトリ(/var/www/html)に移動する(おそらくコンテナに入った時点でそのディレクトリのはず). 

```
$ pwd
/var/www/html
```

マイグレーションを実行し `hoges` テーブルを作成する. 

```
$ php artisan migrate
```

`exit` し `apache` コンテナを出る. 再度, `db` コンテナに入る. 

```
$ docker-compose exec db bash
```

`hoges` テーブルが作成されていることを確認. 表示用のダミーデータを適当に追加する. 

```
$ mysql -u root -p
パスワード入力

mysql> use master;

mysql> show tables;
+--------------------+
| Tables_in_master   |
+--------------------+
| ......             |
| hoges              |
| ......             |
| ......             |
| ......             |


mysql> insert into hoges (id) values (1);

mysql> select * from hoges;
+----+------------+------------+
| id | created_at | updated_at |
+----+------------+------------+
| 1  | NULL       | NULL       |
+----+------------+------------+
```

`db` コンテナから抜ける. 

ブラウザから `http://localhost:80/hoge` にアクセスしテーブルに追加したレコードの id が表示されていることを確認できれば
問題なく `apache` コンテナ上の Laravel から `db` コンテナの MySQL にアクセスできている. 


以上で Docker + Apache + Laravel での最低限の環境が完成. 

## その他

* Docker コンテナの停止と削除は以下のコマンドで実施
    * `$ docker-compose down --rmi all --volumes --remove-orphans`
        * `--rmi all`
            * 使用したイメージも全て削除する
        * `--volumes`
            * volume を全削除
        * `--remove-orphans`
            * Compose ファイルで定義されていないコンテナも削除する
* `apache` コンテナ内での `php artisan migrate` はホストから `docker exec` コマンドでも OK
    * `$ docker exec apache php artisan migrate`
* データベースへのアクセスをコマンドでやるとめんどくさいので GUI アプリを使用すると吉
    * 自分は `Sequel Ace` を使用
    * localhost の ポートフォワードしているポートから使用できる

## 出典

作成にあたり以下の記事を参考にさせていただきました. 

* https://akamist.com/blog/archives/5470

