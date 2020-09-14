# Mac Catalina で 32bit GCC コンパイル

Mac Catalina で docker を使用して 32bit GCC クロススコンパイルをするための環境構築手順

## 背景

書籍「30日でできる！OS自作入門」を Mac(OS は Catalina) で構築する際に、 C 言語の 32bit GCC のコンパイル環境構築の時点でつまずいた。
まずつまずきの一つ目はもともと HomeBrew でインストールできた i386 向けの GCC コンパイラ `i386-elf-gcc` が 2020/09/14 現在インストールできないということ。
参考にさせていただいた Catalina 向けのOS自作入門の記事ではこのコンパイラをインストールする手順となっていることが多いが、自分がトライした時点では
このバージョンの GCC は HomeBrew ではなくなっており、代わりに `x86_64-elf-gcc` になっていた。
そして、この GCC で 32bit コンパイル用のオプションを指定してコンパイルを試みるも Bad CUP みいたなエラーが出てうまくいかなかった。

次に 32bit 用 GCC を自前でビルドしようとトライしましたが、これもビルドするためのライブラリなどがうまく入手できず諦めました。

色々調べてみたんですが、どうも Mac が 32bit 向けのツールやライブラリを非推奨にする流れっぽくそのあたりの影響もあるのかなと思います。

[32bitOS_macOS][1]


## 解決方法

あまり無茶なやり方をせずいい方法がないかなと考えました。

その結果 docker 上に ubuntu コンテンナを作成し、
そこに 32bit 向け GCC ビルド環境を構築しコンパイルすることで解決しました。

## やりかた

* Mac に docker をインストールする
    * この記事では説明を省きます
    * `mac docker` などで検索すればたくさん情報が見つかります
* DockerHub から ubuntu のリポジトリを取得する
    * 今回はバージョン 18.04 を取得する

```
docker pull ubunntu:18.04
```

* ubuntu のコンテナを生成する
    * コンテナ名を ubuntu で作成

```
docker run -it -d --name ubuntu ubuntu:18.04
```

* ubuntu コンテナ上で GCC をインストールする

```
# 作成した ubuntu の bash を起動。カレントディレクトリをホームディレクトリ(/root)にする
docker exe -it -w /root ubuntu /bin/bash
# GCC をインストールする
apt update && upgrade
apt install gcc
```

* コンパイルに必要なリンカスクリプトなどを ubuntu に渡す
    * 「30日でできる！OS自作入門」用の実行形式を作成するためのリンカスクリプトを ubuntu に渡す
    * リンカスクリプトは以下の「30日でできるOS自作入門メモ」にある「OS用リンカスクリプト」を参考にさせていただきました(ありがとうございます)
    * [30日でできるOS自作入門メモ][2]

```
# リンカスクリプト(os.ld) をコンテナ内の /root に渡す
docker cp os.ld work:/root
```

* 環境構築した ubuntu コンテナから新たにイメージファイルを作成する
    * ここまででクロスコンパイルするための環境が整ったため一旦このコンテナからイメージファイルを作成する
    * 再度同じ環境が欲しくなった時はこのイメージからコンテナを作成する

```
# ubuntu コンテナから ubuntu_for_xcomp というイメージファイルを作成する
docker commit ubuntu ubuntu_for_xcomp
```

* ubuntu で コンパイルする

```
# ubuntu の /root にコンパイル対象(hoge.c)を渡す
docker cp hoge.c work:/root
# コンパイル対象を 32bit 向けにコンパイル。リンカスクリプトは os.ld を指定する
docker exec -w /root work gcc -march=i486 -m32 -nostdlib -fno-pic -T os.ld -o output hoge.c
# コンパイル結果である実行形式(output)を取得する
docker cp work:/root/output output
```

* 完成
    * 以上の手順でOS自作入門用の実行形式ができました
    * 後は適宜コンテナを停止・削除してください

```
# コンテナを停止
docker stop ubuntu
# コンテナを削除
docker rm ubuntu
```

[1]:https://support.apple.com/ja-jp/HT208436
[2]:https://vanya.jp.net/os/haribote.html
