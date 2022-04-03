# Raspberry Pi と VPN で監視カメラ制作

## 作ったモノ

自宅にいる犬の様子を外出先からでもリアルタイムで見てみたいと思い
システムを Raspberry Pi で構築してみました. 

Raspberry Pi に犬の様子の撮影と, 動画配信サーバーをやらせます. 

動画配信サーバーには MJPG-streamer, ネットワークの構築にはお手軽に VPN を構築できる Tailscale
を使用しました. 

犬監視システムの構築手順の覚書を全2回に分けて記事にします. 

1回目は Raspberry Pi の導入とリモート接続するまでをまとめました. 

2回目となる本記事では Raspberry Pi に動画ストリーミングサーバーの構築と Tailscale
を使用した VPN ネットワークの構築を説明します. 


## 技術要素とアイテム

* Mラズベリーパイ4B
* RasTech Raspberry Pi カメラモジュール
* PC
    * MacBook Pro
* 動画ストリーミングサーバー
    * MJPG-streamer
* ネットワーク構築
    * Tailscale

## 手順

### 動画ストリーミングサーバー構築

Raspberry Pi のカメラ設定はこの記事では扱いません. 
カメラ接続済みの状態から説明します. 

1. 必要なパッケージを Raspberry Pi にインストール. 

```
$ sudo apt install -y build-essential imagemagick libv4l-dev libjpeg-dev cmake
````

2. MJPG-streamer を GitHub から clone し, make する

```
$ git clone https://github.com/jacksonliam/mjpg-streamer.git
$ cd mjpg-streamer/mjpg-streamer-experimental
$ sudo make
$ sudo make install
```

3. make したディレクトリと同じ階層で以下のコマンドを実行し動画ストリーミングサーバーをポート 8080 で起動する

```
$ sudo ./mjpg_streamer -i "./input_uvc.so -f 10 -r 640x480 -d /dev/video0 -y -n" -o "./output_http.so -w ./www -p 8080" 
```

4. PC のブラウザから Raspberry Pi サーバーにアクセスする

```
http://raspberrypi.local:8080
```

5. MJPG-streamer の画面になったら動画は `Stream` で, 静止画は `Static` で閲覧可能

動画だけ閲覧する場合は以下の URL でアクセス. 

```
http://raspberrypi.local:8080/stream_simple.html
```

### Tailscale で VPN 構築

ここまでで, Raspberry Pi にブラウザからアクセスしてカメラの情報がリアルタイムで閲覧できるようになりました. 

しかし, これではプライベート IP からしかアクセスできないため, 外部からグローバルにアクセスできるようにします. 

いくつか方法がありますが, 今回は家族だけで共有したいため, VPN を構築しそこを経由して外部から閲覧できるようにします. 

Tailscale を使用すれば手軽に VPN を構築し外部から自宅にあるサーバーに簡単アクセスできます.<br>
しかも, VPN 接続のため, セキュリティ的にもポートフォワーディングよりも安心感があります. 


#### Tailscale のアカウントを取得する

Tailscale はアカウントを取得し, アカウントに登録した端末間で VPN を構築します. 
そのためまずは以下の Tailscale のウェブサイトにアクセスし, アカウントを取得します. 

google や GitHub のアカウントがあれば, そこから取得できます. 

http://city.takarazuka.hyogo.jp


#### PC にクライアントソフトをインストールする

1. Tailscale にログイン
1. `Download` を押下
1. 自分の PC 用のクライアントソフトをダウンロードし, インストールする

#### Raspberry Pi に Tailscale クライアントをインストールする

Raspberry Pi も VPN ネットワークに参加させるためにクライアントソフトをインストールします. 

公式の Raspberry Pi へのインストール手順はこちら.<br>
https://tailscale.com/download/linux/rpi

1. Tailscale のインストール

```
$ sudo apt-get install apt-transport-https
```

```
$ curl -fsSL https://pkgs.tailscale.com/stable/raspbian/buster.gpg | sudo apt-key add -
```

```
$ curl -fsSL https://pkgs.tailscale.com/stable/raspbian/buster.list | sudo tee /etc/apt/sources.list.d/tailscale.list
```

```
$ sudo apt-get update
```

```
$ sudo apt-get install tailscale
```

2. Tailscale に Raspberry Pi をコネクト

```
$ sudo tailscale up
```

URL が表示されるためコピーしてブラウザにアクセスする.<br>
Authorization successful が表示されれば OK.

3. Tailscale のマイページにアクセスし Raspberry Pi の IP アドレスを確認する

確認した IP アドレスで Raspberry Pi にアクセスできることを確認する. 

```
http://<Raspberry Pi の IP>:8080
```

## 終わり

以上で MJPG-streamer と Tailscale を使用した Raspberry Pi 監視カメラシステムが完成です. 
