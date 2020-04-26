# mbed(LPC11U35) で USB シリアル通信

mbed LPC11U35 で USB シリアル通信をしたのでメモ

USB CDC(Communications Device Class)と呼ばれる<br>
USB上でデバイス間のデータのやりとりを行うための通信規格を利用して実現している


## 環境

* Windows10
* mbed EA LPC11U35
* TeraTerm


## 準備

1. TeraTerm のインストール
    * Chocolatey を使用している場合は以下でインストール
        * `choco install teraterm`
    * それ以外は以下のサイトからインストーラをダウンロードしインストールする
        * https://ja.osdn.net/projects/ttssh2/releases/
1. mbed ワークスペースから USBDevice ライブラリをインポートする
1. コーディングし mbed に書き込む
    * コードは以下を参照
1. mbed をリセット
1. OS が USB ポートを認識することを確認する
1. TeraTerm を起動
1. 新しい接続は シリアル を選択
    * COMx ポートとかになっているはず
1. TeraTerm から文字列を送信できるようにする
    * 「設定」タブ
    * 端末
    * 「ローカルエコー」にチェック
    * 「OK」
1. TeraTerm から文字列を入力し、mbed からエコーバックされれば成功

## コード
端末から文字列を受け取ってエコーバックするプログラム

``` cpp
#include "mbed.h"
#include "USBSerial.h"
DigitalOut myled(LED1);
USBSerial serial;
int main() {
    uint8_t buf[128];
    while(1) {
        myled = 1; // LED is ON
        wait(0.5); // 200 ms
        myled = 0; // LED is OFF
        serial.scanf("%s", buf);
        serial.printf("recv: %s\n\r", buf);
        wait(0.5); // 1 sec
    }
}
```

