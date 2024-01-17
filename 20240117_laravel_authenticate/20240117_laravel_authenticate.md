# LaravelでSPA認証を実装する

## 概要

LaravelでのSPA認証の実装方法の覚書。
使用技術は以下の通り。

- 手動による認証+SanctumによるSPA認証
- セッション+クッキー認証

## 環境

- Laravelのバージョン(9.x)
- Sanctumのバージョン
- Vue.jsのバージョン
- PHPのバージョン

## 参照ドキュメント

- Laravel 9.x Laravel Sanctum
  - https://readouble.com/laravel/9.x/ja/sanctum.html
 
## 認証の流れ

1. ログイン
2. APIを認証で保護する


    CSRFトークンについての補足









