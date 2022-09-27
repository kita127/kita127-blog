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
* Web サーバーは Apache を利用する
* データベースは MySQL を利用する
* Web アプリケーションは PHP のフレームワーク Laravel を使用し作成する


## 環境

各種アプリケーションのバージョンは以下. 開発は Mac PC で行う. 

* macOS Monterey
    * 12.5.1
    * Intel Mac
* PHP 8.1.10
    * サーバーサイドのプログラミング言語
* Composer 2.4.1
    * PHP のパッケージマネージャ
* docker desktop 4.5.0
    * Engine 20.10.12


サーバ PC は準備中. おそらく ubuntu を採用する見込み. 

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
                * 相対パスを記述する際はプロジェクトトップがカレントとなる
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
    * `APACHE_LOG_DIR` の環境変数は `/etc/apache2/envvars` に定義されている
* `CustomLog`
    * クライアントのアクセスログを記録するファイルとフォーマットを指定する
    * 第2引数の `combined` は `LogFormat` ディレクティブで名前つけされたフォーマット
        * `combined` は `apache2.conf` に以下の通り定義されている
        * `LogFormat "%h %l %u %t \"%r\" %>s %O \"%{Referer}i\" \"%{User-Agent}i\"" combined`
    * 本ディレクティブは `mod_log_config` モジュールの機能

#### php.ini の作成

PHP の設定ファイル `プロジェクトトップ/docker/apache/php.ini` を以下の通り作成. 
とりあえず, タイムゾーンと文字コードに関する設定だけ. 

```
[Date]
date.timezone = "Asia/Tokyo"

[mbstring]
mbstring.internal_encoding = "UTF-8"
mbstring.language = "Japanese"
```


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

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

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
    * Docker Hub の php イメージ, `8.1-apache-bullseye` タグを指定
        * [タグlink](https://hub.docker.com/layers/library/php/8.1-apache-bullseye/images/sha256-fcee566dcc5d4debf4bd46d11cddaf5eac3dc964eef465325bc4b073d0bf647c?context=explore)
    * `8.1-apache-bullseye` は Debian Apache に `mod_php` が含まれたタグ
        * bullseye は Debian の v11 に対するコードネームとのこと
        * https://hub.docker.com/_/php
* `RUN apt-get update ....`
    * コンテナ起動時にパッケージ情報のアップデートと必要なパッケージをインストール
    * `iputils-ping` と `net-tools`
        * `ping` を利用するためのインストール
    * `docker-php-ext-install zip`
        * PHP 拡張をインストールするためのヘルパスクリプトとのこと
        * 詳細は Docker Hub の PHP イメージページを参照
            * https://hub.docker.com/_/php
* `RUN a2enmod rewrite`
    * Apache に `rewrite` モジュールを追加する
    * Laravel でのルーティングにはこのモジュールの有効化が必要
* `RUN docker-php-ext-install pdo_mysql`
    * Docker の PHP コンテナには MySQL 用のドライバがインストールされていないため追加する
* `COPY --from=composer:latest /usr/bin/composer /usr/bin/composer`
    * composer:latest イメージをビルドし作成した `composer` の実行形式をコンテナの `/usr/bin/composer` にコピーしているぽい
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
    * 大元のコンフィグファイルである `apache2.conf` では `sites-enabled` のみ `IncludeOptional` ディレクティブにより有効化される
    * `sites-available` に置いたコンフィグファイルのシンボリックリンクを `sites-enabled` に置くことによりコンフィグを有効にする
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

### Laravel プロジェクトの作成

プロジェクトトップで以下のコマンドを実行し Laravel プロジェクトを作成する. 

```
$ composer create-project laravel/laravel webapp
```

作成した `webapp` に移動し, `$ php artisan serve` を実行し Laravel のサーバを起動. 
ブラウザから `http://localhost:8000` でアクセスし Laravel のデフォルトページが表示されるか確認する. 

#### マイグレーションファイル作成

テーブル生成用のマイグレーションファイルを作成する. 以下のコマンドを実行. 

`$ sail artisan make:migration create_hoges_table`

`database/migrations/yyyy_mm_dd_xxxx_create_hoges_table.php` が生成される. 



### Web サーバ(Apache)の確認

* `pdo_mysql` が有効化確認する

### DB(MySQL)の確認

### Laravel プロジェクトの作成
