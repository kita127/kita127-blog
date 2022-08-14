# Laravel : 画像のアップロードと表示

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


## 画像のアップロード

画像をアップロードし, DB に保存する. <br>
画像は別のストレージに保存し, DB には画像のファイル名のみを保存する. <br>

### 画像用テーブルを作成する

```
$ sail artisan make:migration createImagesTable
```

スキーマ設定に画像のファイルパスを文字列で保存する `name` を追加する. <br>

`20XX_XX_XX_XXXXX_create_images_table.php`
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('images', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
        });
    }

    ...省略

};
```

### マイグレーションを実行する

マイグレーションを実行し DB にテーブルを作成する. <br>

```
$ sail artisan migrate
```

### 画像用の Eloquent モデルを作成する

画像用の Eloquent モデルを生成. 中身はデフォルトのままで OK. 

```
$sail artisan make:model Image
```

### シンボリックリンクを作成する

画像は storage ディレクトリに保存される. storage ディレクトリは外部からアクセスできないため `storage/app/public` を
`public` から参照できるようシンボリックリンクを作成する. <br>

```
$ sail artisan storage:link
```

### 画像用のコントローラを作成

GET のコントローラ
```
$ sail artisan make:controller --invokable Image/IndexController
```

アップロード用 POST のコントローラ
```
$ sail artisan make:controller --invokable Image/UploadController
```


### ルーティングの追加

```php
<?php

...省略

Route::get('/', function () {
    return view('welcome');
});


Route::get('/image', \App\Http\Controllers\Image\IndexController::class)->name('image.index');
Route::post('/image/upload', \App\Http\Controllers\Image\UploadController::class)->name('image.upload');

...省略

```

### GET コントローラの編集

とりあえず Blade の表示だけ. 

`app/Http/Controllers/Image/IndexController.php`
```php
<?php

namespace App\Http\Controllers\Image;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class IndexController extends Controller
{
    /**
     * Handle the incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function __invoke(Request $request)
    {

        return view('image.index');
    }
}
```

### Blade の編集

フォームを作成する. <br>
画像アップロードには `enctype="multipart/form-date"` が必要. <br>

`resources/views/image/index.blade.php`
```blade
<x-layout title="TOP | 画像サンプル">
    <x-layout.single>
        <h2 class="text-center text-blue-500 text-4xl font-bold mt-8 mb-8">
            画像サンプル
        </h2>
    </x-layout.single>
    <div>
        <form action="{{ route('image.upload') }}" method="post" enctype="multipart/form-data">
            @csrf
            <input type="file" name="image">
            <input type="submit" value="画像アップ">
        </form>
    </div>
</x-layout>
```

### リクエストの作成(バリデーション・リクエスト取得)

バリデーションとリクエストの取得のためリクエストを作成する. <br>

```
$sail artisan make:request Image/CreateRequest.php
```

CreateRequest.php が生成されるので編集する. <br>
`authorize` はログインを要求するか否かの設定. システムに合わせて適宜編集. <br>
`rules` にバリデーションルールを追加. `name` が `image` の要素に対して
「必須」「画像」「拡張子」「サイズ」のルールを追加. <br>

加えて画像取得用のメソッド `image` を追加. ファイルの取得は `$this->file()` で行う. <br>

`app/Http/Requests/Image/CreateRequest.php`
```php
<?php

namespace App\Http\Requests\Image;

use Illuminate\Foundation\Http\FormRequest;

class CreateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules()
    {
        return [
            //
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048'
        ];
    }

    public function image()
    {
        return $this->file('image');
    }
}
```

### 画像保存処理作成

`app/Services/` に任意のサービスクラスを作成する. <br>
今回は `ImageService.php` で作成. <br>

ストレージへの保存と Model を使用した DB へのファイル名保存処理を実装する. <br>
DB に保存するファイル名はハッシュ. <br>

`app/Services/ImageService.php`
```php
<?php

namespace App\Services;

use App\Models\Image;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ImageService
{

    public function saveImage($image)
    {
        Storage::putFile('public/images', $image);
        $imageModel = new Image();
        $imageModel->name = $image->hashName();
        $imageModel->save();
    }
}
```

### POST コントローラの編集

POST 用のコントローラに画像のリクエスト取得処理と保存処理を実装. <br>

`app/Http/Controllers/Image/UploadController.php`
```php
<?php

namespace App\Http\Controllers\Image;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\ImageService;
use App\Http\Requests\Image\CreateRequest;

class UploadController extends Controller
{
    /**
     * Handle the incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function __invoke(CreateRequest $request, ImageService $imageService)
    {
        //
        $image = $request->image();
        $imageService->saveImage($image);
        return redirect()->route('image.index');
    }
}
```


以上でストレージと DB にアップロードした画像が保存される. 


## 画像の表示

アップした画像を表示する. <br>

### DB からファイル名取得

ファイル名を取得する処理を追加(`Image::all()`). <br>

`app/Services/ImageService.php`
```php
<?php

namespace App\Services;

use App\Models\Image;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ImageService
{

    public function saveImage($image)
    {
        Storage::putFile('public/images', $image);
        $imageModel = new Image();
        $imageModel->name = $image->hashName();
        $imageModel->save();
    }

    public function getImages()
    {
        return Image::all();
    }
}
```

### GET 用のコントローラに画像取得処理追加

GET 用のコントローラに DB から画像のファイル名を取得する処理を追加. <br>
取得した画像のファイル名を Blade に渡す. <br>

`app/Http/Controllers/Image/ImageController.php`
```php
<?php

namespace App\Http\Controllers\Image;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\Imageservice;

class IndexController extends Controller
{
    /**
     * Handle the incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function __invoke(Request $request, Imageservice $imageService)
    {
        //
        $images = $imageService->getImages();

        return view('image.index')->with('images', $images);
    }
}
```

### Blade に画像表示処理追加

`resources/views/image/index.blade.php`
```blade
<style>
    .image {
        width: 120px;
        height: 120px;
    }
</style>

<x-layout title="TOP | 画像サンプル">
    <x-layout.single>
        <h2 class="text-center text-blue-500 text-4xl font-bold mt-8 mb-8">
            画像サンプル
        </h2>
    </x-layout.single>
    <div>
        <form action="{{ route('image.upload') }}" method="post" enctype="multipart/form-data">
            @csrf
            <input type="file" name="image">
            <input type="submit" value="画像アップ">
        </form>
    </div>
    <div>
        <ul>
            @foreach ($images as $image)
                <li>
                    <div class="image">
                        <img src="{{ asset('storage/images/' . $image->name) }}">
                    </div>
                </li>
            @endforeach
        </ul>
    </div>
</x-layout>
```

以上で `http://localhost/image` にアクセスするとアップロードした画像が表示される. <br>


## 画像の削除

画像の消去は以下. <br>

```php

use App\Models\Image;
use Illuminate\Support\Facades\Storage;


...省略

// 対象画像のモデルを取得
$image = Image::where('id', $imageId)->firstOrFail();

$filePath = 'public/images' . $image->name;
// ファイルをストレージから削除
if (Storage::exists($filePath)) {
    Storage::delete($filePath);
}

// DB から対象の画像を削除
$image->delete();

```
