# Laravel : 入力のバリデーション

POST メソッドの実装と入力のバリデーションについて


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

以下についてまとめる. 

* POST メソッド
* バリデーション
* Route に名前をつける


## 実装

### バリデーションクラスの作成

バリデーション用の FormRequest クラスの作成. 

```
$ sail artisan make:request HogeDir/HogeRequest
```

`app/Http/Requests/HogeDir/HogeRequest.php` が作成される.

誰でもリクエストできるようにする場合は authorize メソッドの戻り値を true にする. 

```php
public function authorize()
{
    return true;
}
```

### バリデーションルールの設定

バリデーションのルールを設定する. 

以下は設定例. 

* 入力が必須(required)
* 140文字制限(max:140)

```php
public function rules()
{
    return [
        'hoge' => 'required|max:140'
    ];
}
```

バリデーションのルールについてより詳細は以下の公式ドキュメントを参照. <br>
[https://laravel.com/docs/9.x/validation#available-validation-rules](https://laravel.com/docs/9.x/validation#available-validation-rules)

バリデーション対象に設定する要素の指定は Blade テンプレートで name="hoge" とした要素がチェック対象となる. <br>

また, Laravel では  CSRF(クロスサイトリクエストフォージェリ)対策のため, 
form の場合 Blade テンプレートに @csrf ディレクティブを付与する. <br>

```html
<form action="{{ route('hoge.create') }}" method="post">
    @csrf
    <textarea id="hoge-content" type="text" name="hoge"></textarea>
    <button type="submit">確定</button>
</form>
```

### Route に名前をつける

Route に名前をつけることでコントローラや Blade テンプレートからパスではなく名前でアクセスできるようになる. <br>

```php
Route::post('/hoge/create', \App\Http\Controllers\Hoge\CreateController::class)->name('hoge.create');
```

作成した名前は以下のように Blade テンプレートなどからアクセスできる. <br>

```html
<form action="{{ route('hoge.create') }}" method="post">
    @csrf
    <textarea id="hoge-content" type="text" name="hoge"></textarea>
    <button type="submit">確定</button>
</form>
```

コントローラからアクセスする場合は以下. <br>

```php
    public function __invoke(CreateRequest $request)
    {
        //
        $hoge = new Hoge;
        $hoge->content = $request->hoge();    // データをモデルのメンバに設定
        $hoge->save();                        // DB のテーブルを更新
        return redirect()->route('hoge.index');    // hoge.index にリダイレクト. コントローラでも名前でアクセスができる
    }
```

### エラーメッセージの実装

以下の `@error` ディレクティブを設定する. <br>
バリデーションエラーがあった場合 `{{ $message }}` にエラーメッセージが表示される. <br>

```html
<textarea id="hoge-content" type="text" name="hoge"></textarea>
@error('hoge')
<p style="color: red;">{{ $message }}</p>
@enderror
```

複数項目のバリデーションをまとめる場合は `@error` に複数の名前を入れる. <br>

```html
@error('hoge', 'fuga')
```

### エラーメッセージを日本語に変更

`config/app.php` を以下の通り変更

```
'locale' => 'ja',

... 省略

'fallback_locale' => 'ja',
```

lang ディレクトリの en ディレクトリをコピーして ja とリネームする. <br>

ja ディレクトリ内の `validation.php` を日本語向けに編集する. <br>


### 翻訳済みのバリデーションメッセージを利用する

自分で `validation.php` ファイルを翻訳するのは大変なので, OSS の翻訳済みバリデーションファイルを流用することも可能.

以下のコマンドでパッケージを入手する

```
$ sail composer require laravel-lang/lang:~10.3
```

インストールした ja ディレクトリを lang/ja にコピーする

```
$ cp -R vendor/laravel-lang/langlocales/ja lang/
```

これでバリデーションメッセージが日本語化されるが, name が 英語のままとなる. <br>
`lang/ja/validation.php` の末尾に attributes を定義し name と表示名の対応を追加する. <br>

```
...省略

    'attributes' => [
        'hoge' => 'ほげ',
    ],
];
```

### 画面からデータを取得し DB に保存

以上の実装を踏まえ実際に画面からユーザーが入力した情報を取得し DB に保存する流れを説明する. <br>

RequestForm クラスに取得用メソッドを追加. <br>
form の入力内容は `$this->input()` で取得できる. <br>

```php
public function hoge(): string
{
    return $this->input('hoge');
}
```

POST 用のコントローラにデータの取得と DB のテーブル更新処理を追加する

```php
use App\Models\Hoge;

...省略

    public function __invoke(CreateRequest $request)
    {
        //
        $hoge = new Hoge;
        $hoge->content = $request->hoge();    // データをモデルのメンバに設定
        $hoge->save();                        // DB のテーブルを更新
        return redirect()->route('hoge.index');    // hoge.index にリダイレクト. コントローラでも名前でアクセスができる
    }
```
