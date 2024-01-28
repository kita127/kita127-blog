# Laravelで自作の認証を作成する

Laravelデフォルトの`users`プロバイダーではなく、自作で認証機構を作成する方法をまとめる。

## 環境

- PHPのバージョン
    - 8.1.27
- Laravelのバージョン
    - v9.52.16

## 参照ドキュメント

- Laravelの認証カスタマイズに関するメモ
    - https://qiita.com/gunso/items/3ee57e5b011109164870
- Laravel 9.x 認証 
    - https://readouble.com/laravel/9.x/ja/authentication.html

## Laravelでの認証方法の概要

Laravelで認証機構を自作する場合は自作のユーザープロパイダーを作成する必要がある。
また、そのユーザープロバイダーの一部のメソッドで返すクラスは`Authenticatable`インタフェースを実装する必要がある。
ユーザープロバイダーを作成したら、認証で使用しているガードにそのプロバイダーを設定する。

## 自作で認証機構を作る方法

大まかな手順は以下の通り。

1. `Authenticatable`インタフェースを実装した認証済ユーザーの情報を持つクラスを作成する
1. 自作のユーザープロバイダーを作成する
1. サービスプロバイダーに自作のユーザープロバイダーを登録する
1. 認証で使用しているガードに作成したユーザープロバイダーを設定する

## 作成手順

### `Authenticatable`を実装したクラスを作成する

`Illuminate\Contracts\Auth\Authenticatable`インタフェースを実装したクラスを作成する。
implementsするには以下のメソッドの実装が必要。
具体的な実装例はEloquentモデルの`User`クラスなどを参考にするとよい。

- getAuthIdentifierName
    - ユーザをユニークに識別できるIDのキー名を返す
    - RDBMSなどではテーブルのカラム名にだいたいはなる
- getAuthIdentifier
    - ユーザのIDの値を返す
- getAuthPassword
    - ユーザのパスワードを返す
- getRememberToken
    - remember tokenの値を返す
- setRememberToken
    - remember tokenを設定する
- getRememberTokenName
    - remember tokenが格納されるカラム名を返す

### 自作のユーザープロバイダーを作成する

`Illuminate\Contracts\Auth\UserProvider`インタフェースを実装した自作のユーザープロバイダーを作成する。
既存の`EloquentUserProvider`クラスなどを参考に実装する。実装が必要なメソッドは以下。

- retrieveById($identifier);
    - IDから該当するユーザを取得する
    - 返すクラスは先程実装した`Authenticatable`を実装した自作ユーザクラスを返す
- retrieveByToken($identifier, $token);
    - IDとremember me tokenからユーザを取得する
    - こちらも戻り値として自作ユーザクラスを返す
- updateRememberToken(Authenticatable $user, $token);
    - 自作ユーザクラスとremember me tokenを引数で受け取りremember me tokenを更新する
- retrieveByCredentials(array $credentials);
    - 引数でemailやパスワードなどの認証情報を受け取り自作ユーザを取得する
    - 戻り値は自作ユーザ
- validateCredentials(Authenticatable $user, array $credentials);
    - 引数で自作ユーザと認証情報を受け取り合致するか検証し結果を返す

### サービスプロバイダーに自作のユーザープロバイダーを登録する

`config/auth.php`で自作プロバイダーを使用できるよう`AuthServiceProvider`に設定を追加する。
`\Auth::provider`メソッドの第一引数に`config/auth.php`で使用する名前を任意で指定する。
第二引数で自作プロバイダーを生成するメソッドを指定する。

```php
    public function boot()
    {
        $this->registerPolicies();

        //カスタムプロバイダの名前を定義
        \Auth::provider(
            // config/auth.php には、この名称で設定を行う。
            'my_user',
            function ($app, array $config) {
                // MyUserProviderは自作プロバイダー
                return new MyUserProvider($app['hash']);
            }
        );
    }

```
