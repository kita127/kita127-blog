# Go と mbed で USB Serial 通信をする

前回の記事で mbed(LPC11U35) と TeraTerm を使用して USB Serial 通信を実現したので
次は mbed と USB Serial 通信を行うプログラムを作成します.

* 前回ブログ
    * https://kita127.hatenablog.com/entry/2020/04/26/132949

プログラム言語は Go を選択します.
好きな言語というのとワンバイナリで実行できる手軽さがナイスなため.

## 環境

* Windows10
* mbed EA LPC11U35
* TeraTerm

## プログラムを書く

Go 言語用の USB Serial 通信のパッケージはいくつかありますが今回は以下をチョイス.
* https://github.com/jacobsa/go-serial

プログラムの仕様は以下とします.
* 入力されたテキストを USB Serial 通信により送信する
* 入力テキストは標準入力から受け取る
* COM ポート番号はコマンドラインオプションで指定する
* Baudrate はコマンドラインオプションで指定する

そして出来上がったプログラムが以下.
コマンドライン引数は kingpin というパッケージで処理します.
それではビルドしてバイナリを生成.

```go
package main

import (
	_ "fmt"
	"github.com/jacobsa/go-serial/serial"
	"gopkg.in/alecthomas/kingpin.v2"
	"io/ioutil"
	"log"
	"os"
)

var (
	portFlag = kingpin.Flag("port", "port name (--port=COM3)").Required().String()
	baudRate = kingpin.Flag("baud-rate", "baud rate (--baud-rate=9600)").Default("9600").Int()
)

func main() {
	kingpin.Parse()

	text, err := ioutil.ReadAll(os.Stdin)
	if err != nil {
		log.Fatal(err)
	}

	// Set up options.
	options := serial.OpenOptions{
		PortName:        *portFlag,
		BaudRate:        uint(*baudRate),
		DataBits:        8,
		StopBits:        1,
		MinimumReadSize: 4,
	}

	// Open the port.
	port, err := serial.Open(options)
	if err != nil {
		log.Fatalf("serial.Open: %v", err)
	}

	// Make sure to close it later.
	defer port.Close()

	_, err = port.Write([]byte(text))
	if err != nil {
		log.Fatalf("port.Write: %v", err)
	}

	// fmt.Println("Wrote", n, "bytes.")
}

```

## mbed のプログラム

Go プログラムから受け取った文字列を適当な LCD で表示します.
scanf で受け取るには最後が改行の必要あり<br>

```cpp

#include "mbed.h"
#include "USBSerial.h"
#include <AQM0802A.h>

DigitalOut myled(LED1);
USBSerial serial;
AQM0802A lcd(p26, p25); // <-- this !

void show(uint8_t buf[128]) {
   lcd.cls();
   lcd.printf("%s", buf);
}

int main() {
    uint8_t buf[128];

    while(1) {
        myled = 1; // LED is ON
        wait(0.5); // 200 ms
        myled = 0; // LED is OFF
        serial.scanf("%s", buf);
        show(buf);        
//        serial.printf("recv: %s\n\r", buf);
        wait(0.5); // 1 sec
    }
}
```

## COM ポートを調べる

mbed を USB で PC と接続します.
使用している COM ポートを調べるためコマンドプロンプト `MODE` コマンドを以下を実行.
使用仮想ポートは COM3、ボーレートは 9600 なので先ほどのバイナリを `--port=COM3` のオプションで実行.


    $ MODE

```
デバイス状態 COM3:
------------
    ボー レート:        9600
    パリティ:           None
    データ ビット:      8
    ストップ ビット:    1
    タイムアウト:       ON
    XON/XOFF:           OFF
    CTS ハンドシェイク: OFF
    DSR ハンドシェイク: OFF
    DSR の検知:         OFF
    DTR サーキット:     ON
    RTS サーキット:     OFF

```


