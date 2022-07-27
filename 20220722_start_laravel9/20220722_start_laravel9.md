# Laravel : プロジェクトの作成

Laravel プロジェクトの作成方法についてまとめる. 


## 環境

* macOS Big Sur
    * 11.6.5
* Docker
    * 20.10.12
* Laravel
    * 9.21.5
* PHP
    * 8.1.8
* Composer
    * 2.3.10
* MySQL
    * 8.0.29


## 参考

* プロフェッショナルWebプログラミング Laravel
    * 書籍
    * ISBN:978-4-295-20283-7


## 前提

Docker コンテナ上に Laravel プロジェクトを作成する形で進める. <br>
Docker コンテナ上に作成した Laravel プロジェクトは Sail という Laravel に同梱されたコマンドを使用して操作, 連携する. <br>
Sail を使用することで, コンテナ上への各種環境(PHP, Composer, MySQL)を自動で構築してくれて楽. 

## 環境構築

Docker コンテナ上に Laravel プロジェクトを作成するため, ローカル環境には
Docker のインストールだけでよい. 


## Laravel プロジェクト作成

以下のコマンドで Laravel プロジェクトを作成する. プロジェクト名は `sample-project`. <br>

```sh
$ curl -s "https://laravel.build/sample-project?php=81" | bash
```

## コンテナを起動する

Sail を実行しコンテナ上のサーバーを起動する. 

1. 作成したプロジェクトに移動する
2. `$ ./vendor/bin/sail up` を実行する
3. ブラウザから `http://localhost` にアクセスする
4. Web サーバに繋がることを確認する

初回 Sail 実行時は Docker イメージのインストールなどで時間がかかる. <br>
以降は `$ ./vendor/bin/sail up` をすることでコンテナ上のサーバが起動しブラウザからアクセスできる. <br>

## Sail のエイリアスを設定する

いちいち `$ ./vendor/bin/sail up` を入力するのは手間なのでエイリアスを設定する. <br>
.bashrc などの rc ファイルに以下を追記する. <br>

```
alias sail='[ -f sail ] && bash sail || bash vendor/bin/sail'

# テストコマンドで sail ファイルがカレントにあるかチェックし， あれば `bash sail` を実行.
# なければ `vendor/bin/sail を実行する.
```

.bashrc 更新後は `$ source .bashrc` で更新内容を反映する. <br>
以降は `sail up` で実行可能. <br>

## Sail のデーモン起動と終了

* Sail のデーモン起動
    * `$ sail up -d`
* Sail の終了
    * `$ sail down`

## コンテナに入る

* コンテナに入る
    * `$ sail shell`
* コンテナから出る
    * `$ exit`

## コンテナ環境のカスタマイズ

コンテナ設定のための Dockerfile の更新方法について. 


### カスタマイズ用の Dockerfile の作成

以下のコマンドを実行する

```
$ sail artisan sail:publish
```

アプリケーションルート(プロジェクトのトップディレクトリ)に `docker/` ディレクトリが作成される. <br>
`docker/` ディレクトリ内には各バージョンごとのフォルダ(8.0, 8.1 など)が作られる. <br>
適用されるバージョンは `docker-compose.yml` の `services.laravel.test.build.context`
に設定されているバージョンのディレクトリ内 Dockerfile が使用される. <br>

この Dockerfile を変更することでコンテナ環境をカスタマイズできる.

### 更新した Dockerfile の反映

Dockerfile 更新後は以下のコマンドで Docker イメージを再ビルドする. 

```
$ sail build --no-cache
```

### タイムゾーンを変更する

デフォルトではコンテナのタイムゾーンが UTC となっているため日本時間に変更する. <br>
`docker/x.x/Dockerfile` を以下の通り変更する. 

* 変更前
    * `ENV TZ=UTC`
* 変更後
    * `ENV TZ='Asia/Tokyo'`

更新後は Docker イメージをビルドする. <br>

`sail shell` でコンテナ内に入り `date` コマンドで日本時間(JST)になっていることを確認する. 


### MySQL の文字コード変更

日本語での開発に合わせて文字コードの設定を変更する. <br>
`x.x` は使用しているバージョンに合わせて適宜読み替える. <br>

* `docker/x.x` ディレクトリに `my.cnf` ファイルを以下の通り作成する
```
[mysqld]
character-set-server = utf8mb4
collation-server = utf8mb4_bin

[client]
default-character-set = utf8mb4
```

* 作成した `my.cnf` ファイルを MySQL コンテナの `/etc/` に配置し設定が反映されるよう `docker-compose.yml` に以下を追記する
```
mysql:
    volumes:
        - './docker/x.x/my.cnf:/etc/my.cnf'
```

* `$ sail down` でコンテナを停止する
* `$ sail up -d` でコンテナを起動する
* MySQL にアクセスして文字コードが変更されたことを確認する
    * `$ sail mysql` を実行する
    * `show variables like '%char%';` を実行する
    * 各パラメータが utf8 系統になっていることを確認する
* `exit` で MySQL から出る

## git clone 後にやること

作成した Laravel プロジェクトを GitHub などで管理し, `git clone` で
ローカル環境に持ってきた後に実施する手順について. <br>

Sail を使えるようにするため以下を実施する. <br>

```
docker run --rm ¥
    -u "$(id -u):$(id -g)" ¥
    -v $(pwd):/var/www/html ¥
    -w /var/www/html ¥
    laravelsail/php81-composer:latest ¥
    composer install --ignore-platform-reqs
```


