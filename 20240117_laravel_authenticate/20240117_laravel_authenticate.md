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

CSRFトークンについての補足<br>
ログインからフロント側で実装する場合はCSRFトークンの初期化が必要だが、
本記事の手順では最初のSSRによるログイン画面取得で`XSRF-TOKEN`が取得できており、
その後はaxiosが自動でリクエストに付与してくれるため特にこのあたりは設定不要。
ログインからフロントで実行する場合はCSRFトークンの初期化が必要になる。

## 構成

今回はログイン画面はSSRで実装しログイン後はSPAとなる構成としている。

[[画像]]

## 実装手順

1. ログインの実装
    1. ログイン画面はSSRで実装する
2. ログアウトの実装
3. ルートを認証で保護する
4. フロントでログイン/ログアウトの実装
    1. ログインはSSR
    2. ログアウトはAPI
    3. Sanctumの準備

### ログインの実装

#### ログインAPIの実装

ログイン用のコントローラを実装する。実装コードはほぼ以下URLの「ユーザーを手作業で認証する」の通り実装。コード中の詳細についてもリンク先を参照。

https://readouble.com/laravel/9.x/ja/authentication.html

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

class LoginController extends Controller
{
    /**
     * 認証の試行を処理
     */
    public function authenticate(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();

            return redirect()->intended('/');
        }

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ])->onlyInput('email');
    }
}
```

`web.php`にルーティングを追加する。

```php
Route::post('/login', [LoginController::class, 'authenticate']);
```

#### ログイン画面の実装

ログイン画面はSSRで実現するためLaravelのBladeを使用する。

`resources/views/login.blade.php`を作成する

```blade
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />

    <title>Login</title>
</head>

<body>
    <section>
        <h1>Login</h1>

        <div>
            <form action="{{ url('/login') }}" method="POST">
                {{ csrf_field() }}
                <div>
                    <p>email</p>
                    <input type="email" name="email" value="{{ old('email') }}" required autofocus>

                    @error('email')
                        <div>
                            {{ $message }}
                        </div>
                    @enderror

                </div>
                <div>
                    <p>password</p>
                    <input type="text" name="password">
                </div>
                <div>
                    <!-- 送信ボタン -->
                    <input type="submit" value="送信">
                </div>
            </form>
        </div>

    </section>

</body>

</html>
```

- `form`タグで先ほど作成した認証ルートにCSRFトークン付きでPOST
- 認証がエラーした場合はフラッシュメッセージとして`@error('email')`部分を表示

ログイン画面のコントローラを作る。`LoginController.php`に以下のメソッドを追加する。

```php
    public function index(): View
    {
        return view('login');
    }
```

`web.php`にルーティングを追加する。
```php
Route::get('/login', [LoginController::class, 'index'])->name('login');
```
#### ログイン先の画面を作る

ログイン成功時の遷移先の画面を作る。`resources/views/index.blade.php`を作る。後ほどSPAログインに変更する際にまた書きかえるので一旦は遷移したことがわかる程度の内容にする。

```blade
<! DOCTYPE html>
<html>
<head></head>
<body>
    <div>ログインしました</div>
</body>
</html>
```

`web.php`にルーティングを追加する。

```php
Route::get('/login', [LoginController::class, 'index'])->name('login');
```

### ログアウトの実装

#### ログアウトのコントローラを作成する

これも基本的には

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

class LogoutController extends Controller
{
    /**
     * ユーザーをアプリケーションからログアウトさせる
     */
    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/login');
    }
}
```

```


