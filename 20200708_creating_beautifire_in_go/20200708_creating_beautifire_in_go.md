# Go でコード整形(Beautifire)ツールを作る
前回の記事では作成した Go の識別子ケース変換ツール [goconvcase][1] の紹介を取り上げました.
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
package main

import (
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
		return "", err
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
}
```

スネークケースか判定する関数 `isSnakeCase()` と スネークケースからキャメルケースに変換する関数 `convertSnakeToCamel()`
の実装の詳細は省きます.

@@@@@次回、Inspect 関数の詳細から@@@@@@

* 全て ast.Node インタフェースの実装であること



## ソースを出力する

* go/format でソースに戻す

[1]:https://kita127.hatenablog.com/entry/2020/06/27/141442
[2]:https://github.com/kita127/kita127-blog/blob/master/20200708_creating_beautifire_in_go/images/go_bautifire.png
