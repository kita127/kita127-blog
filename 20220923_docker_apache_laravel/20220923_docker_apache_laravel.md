# Docker + Apache + Laravel で Web アプリケーションつくる

## やりたいこと

Laravel 製の Web アプリケーションを作成し, 自宅サーバ PC にデプロイしたい. 
とりあえず, 自宅のプライベートネットワーク内だけの運用を想定しているがそのうち VPN などで外部からもアクセスできるようにしたいかも. 

デプロイ作業を楽にしたい&環境構築とかでカオスになりたくないため Web サーバーやデータベースは
Docker コンテナを利用し, 各コンテナを連携させる構成とする. 

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
ADD docker/apache/config/000-default.conf /etc/apache2/sites-enabled/

WORKDIR /var/www/html

COPY ./webapp /var/www/html

RUN chown www-data storage/ -R \
 && composer install
```

* `FROM`
    * 元となる Docker イメージの指定
    * Docker Hub の php イメージ, `8.1-apache-bullseye` タグを指定
        * https://hub.docker.com/layers/library/php/8.1-apache-bullseye/images/sha256-fcee566dcc5d4debf4bd46d11cddaf5eac3dc964eef465325bc4b073d0bf647c?context=explore

### Web サーバ(Apache)の確認

### DB(MySQL)の確認

### Laravel プロジェクトの作成

