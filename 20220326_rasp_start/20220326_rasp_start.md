# Raspberry Pi 環境構築

## 記事の内容

犬の様子を動画で記録して, 出先のスマホから確認したい. 

犬の様子を動画で記録した, スマホなどからリアルタイムの様子を動画で確認できるシステムを作成. 

全2回に分けて記事を作成. 

今回は Raspberry Pi の環境構築までの覚書. 


## モノ

* Mラズベリーパイ4B
* RasTech Raspberry Pi カメラモジュール
* PC
    * MacBook Pro
* ディスプレイ
    * HDMI で繋がるテレビ
* USB-A 有線キーボード
* USB-A 有線マウス

## 環境構築手順

### Raspberry Pi を単体で起動

* SD カードを装着する
* Raspberry Pi に ディスプレイ, マウス, キーボードを接続
* Raspberry Pi に USB-C AC アダプタを接続し電力を供給

Raspberry Pi のデフォルトのユーザー名は `pi`

### VNC でリモートデスクトップ設定

#### Raspberry Pi 側の設定

Raspberry Pi にはデフォルトでリモートデスクトップソフトであるVNC(Virtual Network Computing)が搭載されている. 
そのため, VNC の設定を有効にして, リモートデスクトップ接続の準備をする. 

1. スタートメニューをクリック
1. 「設定」を選択
1. 「Raspberry Pi の設定」を選択
1. 「インターフェース」タブを選択
1. VNC を有効にする

VNC のセキュリティ設定を変更しておかないと Mac の VNCクライアントから接続できないため, 設定変更する. 

以下を参考にさせていただきました. 
https://qiita.com/karaage0703/items/9650e7aeceb6e1b81612#comment-467f53a421bea472cf81

1. ラズパイ画面右上に表示されている `V2` をクリック
1. ハンバーガーメニューをクリックし Option を選択する
1. Security を選択し以下の設定にする
    * Encryption
        * Prefer off
    * Authenticatior
        * VNC password
1. Users & Permissionsで、Standard userをダブルクリック
1. パスワードを設定する


Raspberry Pi の IP アドレスを確認する. 
terminal から `ip addr` などで Raspberry Pi の IP アドレスを調べておく. 

#### PC(Mac) から VNC リモート接続

以下で Mac から Raspberry Pi にリモートデスクトップ接続できる. 

* Finder を起動
* 「移動」タブを選択
* 「サーバーへ接続」をクリック
* `vnc://raspberrypi.local` を入力
* 「接続」を押下


### SSH でリモート接続

SSH でもリモート接続できることを確認しておく. 

terminal から `ssh pi@raspberrypi.local` で接続. 
`pi` はユーザー名. 


### HDMI接続なしでもデスクトップ起動に設定

このままだと, Raspberry Pi がディスプレイに接続された状態でないと VNC 接続できないため, 
ディスプレイに接続されていない状態でも接続できるように設定を変更する. 

以下を参考にさせていただきました. 
https://algorithm.joho.info/raspberry-pi/cannot-currently-show-the-desktop-raspberry-pi/

1. 以下のコマンドを実行し設定ファイルを開く
    * `sudo nano /boot/config.txt`
        * エディタは `vi` とかもある
1. `#hdmi_force_hotplug=1` のコメントアウトをはずし `hdmi_force_hotplug=1` に変更する

以上で Raspberry Pi をディスプレイに接続していない状態でも VNC 接続できるようになる. 


### 解像度の設定をする

このままだと, 解像度があっていないため変更する. 

1. terminal を起動
1. `raspi-cofig` を入力
1. Diaplay Option
1. Resoltion
1. DMT Mode 82 1920x1080
1. `sudo nano /boot/config.txt`
1. 以下の設定となっていることを確認する
```
# uncomment if hdmi display is not detected and composite is being output
hdmi_force_hotplug=1

# uncomment to force a specific HDMI mode (this will force VGA)
hdmi_group=2
hdmi_mode=82
```
1. 解像度の変更
    1. Raspberry Pi のデスクトップ画面で
    1. メニュー ｰ> 設定 ｰ> `Screen Configuration`
    1. `Configure` -> Screens -> `HDMI-1` -> `解像度` -> `1920x1080`
    1. `Configure` -> 適用

以上
