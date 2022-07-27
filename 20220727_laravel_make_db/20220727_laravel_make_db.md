# Laravel : MySQL にテーブル作成


Laravel の機能を使用し MySQL データベースにテーブルを作成する方法について. <br>

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

## 概要

本記事の概要

* データベースの確認
* テーブルの作成
    * マイグレーション
* シーディングの生成
* ORマッパー Eloquent の使用
* Factory の作成


## データベースの確認

Sail 環境で使用する MySQL の確認. <br>

以下のコマンドで MySQL にログイン. <br>
```
$ sail mysql
```

ログイン後に以下のコマンドでデータベースの一覧を確認. <br>
```
show databases;
```

Laravel プロジェクトと同名のデータベースがある. これがそのプロジェクトで使用するデータベースとなる. <br>

以下のコマンドで MySQL からログアウト. <br>
```
exit;
```

## テーブルの生成

以下のコマンドでテーブル生成用のマイグレーションファイルを生成する. <br>
```
$ sail artisan make:migration create_hoges_table
```
hoges がテーブル名になる模様. <br> テーブル名は Artisan の他機能との連携を考慮すると
複数形にしたほうが無難そう. <br>

`database/migrations/yyyy_mm_dd_xxxx_create_hoges_table.php`  が作成される. <br>
up と down の2つのメソッドが定義されている。up は追加するテーブルや拡張するカラムを指定する. down は戻す際の処理を記述する. <br>

マイグレーションコマンドを実行しテーブルを作成する. <br>
```
$ sail artisan migrate
```

以上で, データベースに hoges テーブルが作成される. 

## シーディングの生成

シーディングとは開発用のデータを生成すること. <br>
以下の Artisan コマンドを実行. <br>

```
$ sail artisan make:seeder HogesSeeder
```

database/seeder ディレクトリに HogesSeeder クラスが作成される. <br>
作成されたクラスの run メソッドに追加データを記述する. 以下は追加例. <br>

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class HogesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        //
        DB::table('hoges')->insert([
            'hoge_content' => Str::random(100),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
```

DatabaseSeeder.php の run メソッドに作成したシーダーを追加. <br>
```php
    public function run()
    {
        // \App\Models\User::factory(10)->create();
        $this->call([HogesSeeder::class]);
```

Artisan コマンドでシーダーを実行
```
$ sail artisan db:seed
```

以上で, 対象のテーブルにデータが追加される. <br>

個別でシーダーを実行する場合は以下
```
$ sail artisan db:seed --class=TweetsSeeder
```

## ORマッパー Eloquent の使用

Laravel の ORマッパー である Eloquent を使用したモデルの作成. <br>
以下のコマンドを実行. <br>

```
$ sail artisan make:model Hoge
```

app/Models ディレクトリに Hoge クラスが作成される. <br>
作成されたクラスはクラス名のスネークケースかつ複数形のテーブルと自動でマッピングされる. <br>
これが hoges テーブルのモデルとなる. <br>

モデル名: Hoge -> テーブル名: hoges <br>

### マニュアルでの設定

モデルをデフォルトの設定から変えたい場合は以下のようにモデルにメンバを定義することにより変更可能. <br>

#### モデルがマッピングの命名規則に従っていない場合は以下のメンバ定義で紐付け

```php
protected $table = 'hoge_table';    // 紐付けるテーブル名
```

#### id 以外の id の場合

```php
protected $primaryKey = 'hoge_id';
```

#### 主キーが増分整数ではない場合

```php
public $incrementing = false;
```

#### 主キーが整数でない場合

```php
protected $keyType = 'string';
```

## Factory の作成

Factory とは開発用に使用するダミーデータをシーダーに与える機能. <br>

以下のコマンドを実行
```
$ sail artisan make:factory HogeFactory --model=Hoge
```

database/factories ディレクトリに HogeFactory ファイルが作成される. <br>

生成した Factory クラスの definition メソッド、return 内に生成したいデータを記述する. <br>

`$this->faker` を使用すればランダムでダミーのテキストを生成してくれる. <br>
```php
class HogeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition()
    {
        return [
            //
            'content' => $this->faker->realText(100)
        ];
    }
}
```

デフォルトでは英語で生成されるため日本語にしたい場合は `config/app.php` の `faker_locale` を `ja_JP` に変更する. 
```
'faker_locale' => 'ja_JP'
```

## Factory を使用してシーディングをする

`database/seeders/HogesSeeder.php` の run メソッドに対象のモデルの factory() メソッドを使用して作成する. <br>
以下例
```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Hoge;

class HogesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        //
        Hoge::factory()->count(10)->create();
    }
}
```

Artisan でシードを作成する
```
$ sail artisan db:seed
```

シードが生成されていることを MySQL で確認する. <br>
