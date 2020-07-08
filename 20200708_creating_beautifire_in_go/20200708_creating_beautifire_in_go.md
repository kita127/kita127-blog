# Go で Go のコード整形(Beautifire)ツールを作る
前回の記事では私が作成した Go の識別子ケース変換ツール [goconvcase][1] の紹介を取り上げました.
その際に使用したパッケージや手法などはそれ以外の所謂 Beautifire や Formatter のような Go 向けの
コード整形ツールを作成する際に使用できるイディオムかと思いました.
本記事では Go で Go のコード整形ツールを作成した際の手順をまとめます.

## 整形ツール作成の流れ
コードを整形するツールの処理フローは以下の通りです.
1. ソースをパースしデータ(AST)化する
1. パースしたデータを更新する
1. 更新したデータをソースに戻す

![DFD][2]

## 実際に作る
作成手順の詳細を goconvcase のような識別子を変換するツールの作成を元に説明します.

仕様は以下とします.
* ソース中のスネークケースの識別子をキャメルケースに変換する
    * 識別子とは変数名や関数名など

初めに完成したソースお見せし, 各手順を後に説明します.

```go
package main

import (
	"bytes"
	"go/ast"
	"go/format"
	"go/parser"
	"go/token"
	"io/ioutil"
	"log"
)

func main() {
	src, err := ioutil.ReadFile("src.go")
	if err != nil {
		log.Fatal(err)
	}

	// src.go をパースして node(AST) を得る
	fset := token.NewFileSet()
	node, err := parser.ParseFile(fset, "", src, parser.ParseComments)
	if err != nil {
		log.Fatal(err)
	}

	// node(AST) を走査しスネークケースの識別子をキャメルケースに変換する
	ast.Inspect(node, func(n ast.Node) bool {
		switch n.(type) {
		case *ast.Ident:
			ident := n.(*ast.Ident)
			if isSnakeCase(ident.Name) {
				ident.Name = convertSnakeToCamel(ident.Name)
			}
		}
		return true
	})

    // buf に更新したソース書いて標準出力
	var buf bytes.Buffer
	err = format.Node(&buf, fset, node)
	if err != nil {
		log.Fatal(err)
	}
    fmt.Println(buf)
}
```



## ソースをパースする
ソースを更新するためにはソースをデータ化した方が都合かいいためデータ化します.
ソースをパースしてデータ化したものを AST(Abstract Syntax Tree) といい, 日本語では抽象構文木と言います.

AST はプログラムを構成する様々な要素から成るツリー状のデータです.
簡単に説明すれば AST は文をいくつか持ち文は式や文から成り, 式は識別子やリテラルや演算式・・・
という感じでツリーを形成します.

Go ソースをパースし AST を得るには `go/parser` パッケージが便利です.

以下のように `parser.ParseFile()` にパースしたいソースのテキストを渡して node(AST) を取得します.
```go
package main

import (
	"bytes"
	"go/ast"
	"go/format"
	"go/parser"
	"go/token"
	"io/ioutil"
	"log"
)

func main() {
	src, err := ioutil.ReadFile("src.go")
	if err != nil {
		log.Fatal(err)
	}

    // src.go をパースして node(AST) を取得する
	fset := token.NewFileSet()
	node, err := parser.ParseFile(fset, "", src, parser.ParseComments)
	if err != nil {
		return "", err
	}
}
```

## AST を更新する
取得した AST を更新します.
やりたいこととしては AST を走査しスネークケースの識別子があればキャメルケースの識別子に変換することです.

AST を走査するための API は `go/ast` パッケージにあります.
今回は `ast.Inspec()` を使用して走査&更新を行います.

```go

    // node(AST) を走査しスネークケースの識別子をキャメルケースに変換する
	ast.Inspect(node, func(n ast.Node) bool {
		switch n.(type) {
		case *ast.Ident:
			ident := n.(*ast.Ident)
			if isSnakeCase(ident.Name) {
				ident.Name = convertSnakeToCamel(ident.Name)
			}
		}
		return true
	})
```

スネークケースか判定する関数 `isSnakeCase()` と スネークケースからキャメルケースに変換する関数 `convertSnakeToCamel()`
の実装の詳細は省きます.

`ast.Inspect()` の詳細ですが, 第一引数は処理したい node をとり, その node のトップから深さ優先で走査します.
第二引数で走査中の各ノードに対して行いたい処理が書かれた関数を引数に取ります.
関数が true を返す限り node の次の子へと nil になるまで走査を続けます.

AST はプログラムを表現する様々な型の要素からなりますが, すべて interface `ast.Node` を実装しているため,
全ての要素を走査することができ, 全ての要素に対して引数の関数を適用できます.

上記のコードでは node が 識別子(`*ast.Ident`)の場合でスネークケースであればキャメルケースに変換しています.

これで, AST のトップからスネークケースの識別子は全てキャメルケースに変換されました.

## ソースを出力する
AST の更新が完了したらソースに戻します. これも `go/format` パッケージを使えば一発です.

```go

    // buf に更新したソース書いて標準出力
	var buf bytes.Buffer
	err = format.Node(&buf, fset, node)
	if err != nil {
		log.Fatal(err)
	}
    fmt.Println(buf)
```

`format.Node()` に `io.Writer`(&buf) と パースの際に作成した `FileSet`(fset) と更新した `node` を渡せば
AST をソースにしたものを `io.Writer` に書き込みます.

## おわり
以上が Go のソース内にあるスネークケースをキャメルケースに変換するツールのイメージです.
色々端折っているので実際のケース変換ツールは [goconvcase][1] をご覧ください.


[1]:https://kita127.hatenablog.com/entry/2020/06/27/141442
[2]:https://github.com/kita127/kita127-blog/blob/master/20200708_creating_beautifire_in_go/images/go_bautifire.png
