# Go でスネークケースやっちまった人のための識別子変換ツール

## 何を作った?
Go ソース内のスネークケースの識別子をキャメルケースに変換するツールを作りました.

GitHub : https://github.com/kita127/goconvcase

## なぜ作った？
Go ではキャメルケースが推奨です.(http://go.shibu.jp/effective_go.html)
しかし、定数などはさすがにいいだろうと思い以下のようなソースを書くと...

```go
package sample

// SNAKE_CASE identifires
const (
	HOGE_CONST = iota
	FUGA_CONST
	PIYO_CONST
)
```

lint が許しません（＾＾）
```shell
$golint .\sample.go
sample.go:5:2: don't use ALL_CAPS in Go names; use CamelCase
sample.go:6:2: don't use ALL_CAPS in Go names; use CamelCase
sample.go:7:2: don't use ALL_CAPS in Go names; use CamelCase
```

なんとなく Go ではキャメルだと知っていても定数までダメとは思わずついつい書いてしまう人もいるのではないでしょうか.

私は書きました.

こまめに lint をかければ気づくのでしょうがズボラなのでコーディングも後半になってから lint をかけて,
そのころには大量のスネークで作られた定数が...という人もいるのではないでしょうか.

私はそうでした.

もしかすると正規表現力が高ければ一括で置換できるかもしれませんが,
正規表現に精通していない人もいるでしょう.

私にはできませんでした.

そんな人のために goconvcase を作りました.

## インストール方法
利用対象の方は基本的に Go をお使いと思いますので `go get` でインストールお願いします.

    go get github.com/kita127/goconvcase/cmd/goconvcase

## 使用方法
先ほどの例に出てきた以下のファイル(sample.go)に対して,
```go
package sample

// SNAKE_CASE identifires
const (
        HOGE_CONST = iota
        FUGA_CONST
        PIYO_CONST
)
```

以下のコマンド実行でスネークケースの識別子がキャメルケースに変換されたソースが標準出力されます.
```shell
$goconvcase --from us --to uc .\sample.go
package sample

// SNAKE_CASE identifires
const (
        HogeConst = iota
        FugaConst
        PiyoConst
)
```

解説すると `--from` で変換対象となる識別子のケースを指定します. `us` は Upper Snake Case の略で大文字のスネークケースです.
そして `--to` で変換後のケースを指定します. `uc` は Upper Camel Case の略で大文字のキャメルケースです.
最後に変換対象のファイルを指定します.

変換対象は識別子だけです.
コメントの `// SNAKE_CASE identifires` はスネークケースのままです.

ファイルを上書きする場合は, `gofmt` や `goimports` と同じように `-w` を指定します.
```shell
$goconvcase -w --from us --to uc .\sample.go
```

指定可能な全てのケースを知りたい場合は `--list` を指定してください.

```shell
$goconvcase --list
us : UPPER_SNAKE_CASE like this.
uc : UpperCamelCase like this.
ls : lower_snake_case like this.
lc : lowerCamelCase like this.
```

現在以上の4種類のケースが相互に変換可能です.
(キャメルからスネークに変換する必要性はないと思いますが...)

## 終わり
基本的には「命名ルールをしっかり把握する」「lint をこまめにかける」が大事かと思いますが,
もし私と同じようにやらかしてしまった方いればよければ使ってみてください.

