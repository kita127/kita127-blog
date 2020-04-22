# mbed で USB シリアル通信

## 参考

* 1.2 とりあえず使ってみる
    * https://os.mbed.com/users/yueee_yt/notebook/use_USB/
* TeraTermを使ってPICとPC間でシリアル通信をする方法
    * http://www2.kaiyodai.ac.jp/~jtahar0/posts/activity20.html
* mbed(4) USBポートでシリアル通信
    * http://www.wsnak.com/wsnakblog/?p=3502

## 環境

* Windows10
* mbed EA LPC11U35


## 準備

1. TeraTerm のインストール
    * `choco install teraterm`
1. コーディングし mbed に書き込む
    * コードは以下を参照
1. mbed をリセット
1. OS が USB ポートを認識することを確認する
1. TeraTerm を起動
1. 新しい接続は シリアル を選択
    * COM3 ポートとかになっているはず
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
