# mbed + AQM0802A で自作文字の表示

## 参考

* AQM0802A のデータシート
    * http://akizukidenshi.com/download/ds/xiamen/AQM0802.pdf
* コントロールIC ST7032i のデータシート
    * http://akizukidenshi.com/download/ds/sitronix/st7032.pdf


## なぐりがき

* キャラクタを書き込んだ後は自動でカーソル移動するようだ
* RS と R/W の状態により Operation を分ける
    * RS=L, RW=L 命令コードを IR(Instruction Register) に書き込む
    * RS=H, RW=L データを DR(Data Register) に書き込む
* Slave のアドレスは 0111110 限定
* Co
    * 連続で送信する場合最後のデータはは Co=0 とする(他は Co=1)
    * 単発送信の場合はすなわちそれ自身が最終データになるので Co=0 となる
    * AQM0802A データシートの以下は恐らく誤記
        * `データを複数送る場合Ｃｏ＝１で、最終データはＣｏ＝１`
* Address Conunter(AC)
    * DDRAM/CGRAM/ICON RAM のアドレスを記憶する
    * DDRAM/CGRAM/ICON RAM を書き込んだ後、AC は自動的に 1 加算される
* Display Data RAM(DDRAM)
    * display data を 8bitキャラコードとして保持する RAM
    * DDRAMアドレスカウンターは AC に16進数として設定される
* 通常の文字を書き込む手順
    * Set DDRAM address で書き込み位置を指定
    * Write data to RAM で書き込む文字を指定
* Character Generator RAM(CGRAM)
    * DDRAM のキャラクター一覧の空いている箇所を CGRAM で作成した文字に割り当てる
* オリジナルキャラクタ作成手順
    1. Set CGRAM で 登録する DDRAM のアドレスと書き込み行を指定する
        * CGRAM アドレスの上位 3bit がオリジナル文字が格納される DDRAM のアドレスを決める
            * 001 の場合は DDRAM Address 0b00000001 に該当
        * CGRAM のアドレス下位 3bit がオリジナルパターンの行を決める
    2. CGRAM にドットデータを送る(Write Data to RAM)
    3. 1, 2 を繰り返しオリジナルキャラクタを作っていく
        * この際も AC は自動で加算されるため、初回に AC を指定した後はドットデータを送るだけでOK
    4. オリジナルキャラクタの登録が完了したら表示したいキャラクタが登録されている DDRAM を指定する
        * この際、ちゃんと表示位置を Set DDRAM address で指定する必要がある

