# Go と mbed で USB Serial 通信をする

前回の記事で mbed(LPC11U35) と TeraTerm を使用して USB Serial 通信を実現できました.  やったー

* 前回ブログ
    * https://kita127.hatenablog.com/entry/2020/04/26/132949

次は適当なテキストの内容をまるっと mbed に USB Serial 送信したいなという気持ちになったんですが,
軽く調べた感じ TeraTerm からではやりかたがわからない, あるいはできない模様.

また, 単純なテキストの送受信をしたいだけに対して TeraTerm は少し大仰な気もするので...

テキストをまるっと送信するのと簡単な対話をするだけの軽量な CLI ツールが欲しい, ということでつくろー, となりました.

## 仕様

* 標準入力から受け取ったテキストを対象のポートに USB Serial 送信する
* 対象と対話的に USB Serial 通信するモードを備える
    * 改行区切りで入力を受け取り対象に送信する
    * 対象からのデータを受信して標準出力する

## 環境

* Windows10
* mbed EA LPC11U35

## プログラムを作成
そしてできたのが以下. Go 製です.
* https://github.com/kita127/katuobushi

一応、release ページに Windows 用のバイナリを置いてあるのでそちらをダウンロード&解凍すれば使用できるはずです.

Go 言語用の USB Serial 通信のパッケージはいくつかありますが今回は以下をチョイス.
* https://github.com/jacobsa/go-serial

もうコード量それほどないのですべて載せます.

```go
package main

import (
	"bufio"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"os"
	"time"

	"github.com/jacobsa/go-serial/serial"
	"gopkg.in/alecthomas/kingpin.v2"
)

var (
	portFlag    = kingpin.Flag("port", "port name (--port=COM3)").Required().String()
	baudRate    = kingpin.Flag("baud-rate", "baud rate (--baud-rate=9600)").Default("9600").Int()
	readTime    = kingpin.Flag("read-time", "read cycle time(ms)").Default("100").Int()
	interactive = kingpin.Flag("interactive", "interactive mode").Short('i').Bool()
)

func main() {
	kingpin.Parse()

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

	if *interactive {
		// interactive mode
		interactiveMode(port)
	} else {
		// one-shot mode
		text, err := ioutil.ReadAll(os.Stdin)
		if err != nil {
			log.Fatal(err)
		}
		_, err = port.Write([]byte(text))
		if err != nil {
			log.Fatalf("port.Write: %v", err)
		}
	}
}

func interactiveMode(port io.ReadWriteCloser) {

	fmt.Fprintln(os.Stdout, "This is Katuobushi interactive mode.")
	fmt.Fprintln(os.Stdout, "Please enter the sending texts...")

	go func() {
		t1 := time.NewTicker(time.Duration(*readTime) * time.Millisecond)
		defer t1.Stop()
		for {
			select {
			case <-t1.C:
				//Read
				buf := make([]byte, 128)
				n, err := port.Read(buf)
				if n != 0 {
					if err != nil {
						if err != io.EOF {
							fmt.Fprintln(os.Stdout, "Error reading from serial port: ", err)
						}
					} else {
						buf = buf[:n]
						//fmt.Println("n =", n)
						fmt.Fprintf(os.Stdout, "%s", buf)
					}
				}
			}
		}
	}()

	// Write
	go func() {
		f := bufio.NewScanner(os.Stdin)
		for f.Scan() {
			text := f.Text()
			text = text + "\n"
			_, err := port.Write([]byte(text))
			if err != nil {
				log.Fatalf("port.Write: %v", err)
			}
		}
	}()

	for {
		// loop
	}
}
```

ターミナルで実行してそのまま USB Serial 通信が可能です.
使い方の説明の前に mbed 側にプログラムを書き込みましょう.


## mbed のプログラム
前回ブログで取り上げたのと同様 USB Serial で受信したデータに "recv: " の文字列を頭に付与して送り返すプログラムです.
こちらを mbed に書き込みます.

```cpp
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

## COM ポートを調べる

mbed を USB で PC と接続します.
使用している COM ポートとボーレートを調べるためコマンドプロンプトで `MODE` コマンドを実行して確認します.
今回使用している仮想ポートは COM3、ボーレートは 9600 みたいです.


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

## 通信してみる
全ての準備が整ったのでGo製の簡易 USB Serial 通信ツール Katuobushi と mbed で通信してみます.

### 対話モード
mbed と PC を USB で接続し, mbed をリセットします.
Katuobushi.exe を実行します. まずは TeraTerm のように対話的に通信してみましょう.
以下のオプションを付与して実行します.

```cmd
$katuobushi.exe --port=COM3 -i
```

仮想ポートは先ほど調べた際に COM3 だったためそれをコマンドラインオプションで指定.
ボーレートはデフォルトで 9600 なので指定なしで OK です.
そして `-i` オプションを指定します.これは対話モードで実行するためのオプションで `--interactive` のショートフラグです.

`helloEmbed` と入力して `recv: helloEmbed` が返ってきました.どうやらうまくいったみたいです.

```cmd
$go run main.go --port=COM3 -i
This is Katuobushi interactive mode.
Please enter the sending texts...
helloEmbed
recv: helloEmbed
```

### ワンショットモード
それでは次に適当なファイルの内容をまるっと送信してみましょう.

適当な入力用のファイルを作成.
```cmd
$echo hoge > input.txt
$echo fuga >> input.txt
$echo piyo >> input.text
$type input.txt
hoge
fuga
piyo

```

標準入力から katuobushi.exe に入力して実行します.
```cmd
$type input.txt | katuobushi.exe --port=COM3
```

・・・すぐに実行終了しました.
`--interactive` オプションを使用しない場合はワンショットモードになり
標準入力の内容を丸っと送信したら実行を終了します.
これだと返信があったのかわかりませんが, 一応、mbed 側で内臓 LED を 3 回点滅しているので
まあ, 受信できているようです.気になる場合は外付けの LCD などで受信したデータを出力させてみても良いかもです.


## まとめ
といった感じで mbed と USB Serial 通信を実現したついでに軽量な USB Serial 通信ツールを作成しました.
題材に取り上げている mbed 自体は安価なものなんですが, PC と USB 通信できるようになっただけで色々広がりますね.
