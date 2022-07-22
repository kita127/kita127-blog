# Laravel プロジェクトの作成
 
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


## やりかた

Docker コンテナ上に Laravel プロジェクトを作成する形で進める. <br>
Docker コンテナ上に作成した Laravel プロジェクトは Sail という Laravel に同梱されたコマンドを使用して操作, 連携する. <br>
Sail を使用することで, コンテナ上への各種環境(PHP, Composer, MySQL)を自動で構築してくれて楽. 

### 環境構築

Docker コンテナ上に Laravel プロジェクトを作成するため, ローカル環境には
Docker のインストールだけでよい. 


### Laravel プロジェクト作成

以下のコマンドで Laravel プロジェクトを作成する. プロジェクト名は `sample-project`. <br>

```sh
$ curl -s "https://laravel.build/sample-project?php=81" | bash
```

### コンテナを起動する

Sail を実行しコンテナ上のサーバーを起動する. 

1. 作成したプロジェクトに移動する
2. `$ ./vendor/bin/sail up` を実行する
3. ブラウザから `http://localhost` にアクセスする
4. Web サーバに繋がることを確認する

初回 Sail 実行時は Docker イメージのインストールなどで時間がかかる. <br>
以降は `$ ./vendor/bin/sail up` をすることでコンテナ上のサーバが起動しブラウザからアクセスできる. <br>

### Sail のエイリアスを設定する

いちいち `$ ./vendor/bin/sail up` を入力するのは手間なのでエイリアスを設定する. <br>
.bashrc などの rc ファイルに以下を追記する. <br>

```
alias sail='[ -f sail ] && bash sail || bash vendor/bin/sail'

# テストコマンドで sail ファイルがカレントにあるかチェックし， あれば `bash sail` を実行.
# なければ `vendor/bin/sail を実行する.
```

.bashrc 更新後は `$ source .bashrc` で更新内容を反映する. <br>
以降は `sail up` で実行可能. <br>


