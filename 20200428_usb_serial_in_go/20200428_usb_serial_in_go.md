# Go と mbed で USB Serial 通信をする

## Go

* 使用パッケージ
 * https://github.com/jacobsa/go-serial

```go
package main

import (
    "fmt"
    "github.com/jacobsa/go-serial/serial"
    "log"
)

func main() {
    // Set up options.
    options := serial.OpenOptions{
        PortName:        "COM3",
        BaudRate:        9600,
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

    // Write 4 bytes to the port.
    s := "hoge\n"
    n, err := port.Write([]byte(s))
    if err != nil {
        log.Fatalf("port.Write: %v", err)
    }

    fmt.Println("Wrote", n, "bytes.")
}

```

## mbed

Go プログラムから受け取った文字列を AQM0802A に表示する<br>
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
