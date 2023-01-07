# Laravel : Docker + VSCode でデバッガ環境構築

## 目的

Docker コンテナ上で動作してる Laravel を xdebug でデバッグできる環境を構築する.

## 環境

* macOS
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


## 手順

Docker コンテナを使用した環境構築は完了している前提で記事を書きます. 
Docker を使ったサーバー構築手順は以下の記事にまとめています. 

https://kita127.hatenablog.com/entry/2022/10/02/145614

編集するファイルは以下の4ファイル. 

* `Dockerfile`
* `php.ini`
* `docker-compose.yaml`
* `.vscode/launch.json`

### Dockerfile

サーバー用のコンテナの Dockerfile に xdebug をインストールする記述を追加する. <br>
`pecl install xdebug` で xdebug をインストールする. <br>
`docker-php-ext-enable xdebug` で xdebug を有効化する. <br>

```Dockerfile
# xdebug のインストール
RUN pecl install xdebug \
  && docker-php-ext-enable xdebug
```

### php.ini

コンテナサーバーに配置する php.ini に以下を追加する. 
9012 は xdebug のポート

```
[xdebug]
xdebug.mode = debug
xdebug.start_with_request = yes
xdebug.client_host = "host.docker.internal"
xdebug.client_port = 9012
xdebug.log = "/var/log/xdebug.log"
```

### docker-compose.yaml

サーバーコンテナの volumes に xdebug のログをマウントするよう`- ./log:/var/log` を追加する. 
左側はローカルのログ置き場のパス, 右側は php.ini で設定した xdebug のログのディレクトリ. 

```yaml

    volumes:
      - ./webapp:/var/www/html
      - ./docker/apache/php.ini:/usr/local/etc/php/php.ini
      - ./log:/var/log
```

### launch.json

`port` は xdebug のポート 9012 を設定する<br>
`pathMappings` は左に Docker コンテナ上に配置している Laravel アプリケーションのパス<br>
右にローカルで作業している Laravel アプリケーションのパスを設定する.

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Listen for XDebug",
            "type": "php",
            "request": "launch",
            "port": 9012,
            "pathMappings": {
                "/var/www/html": "${workspaceFolder}/webapp"
            }
        }
    ]
}
```

## 試す

以上で xdebug を使用する環境構築は完了. 
任意の箇所にブレイクポイントを設定し, start debugging をすればステップ実行や変数の状態の確認などができるようになる. 

<img width="50%" src="https://github.com/kita127/kita127-blog/blob/master/20220107_laravel_docker_xdebug/images/breakpoint.png?raw=true">

## 参考記事

以下の記事を参考にさせていただきました.

 https://maasaablog.com/development/backend/php/laravel/2308/
