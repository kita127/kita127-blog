# Go でコード整形(Beautifire)ツールを作る
前回の記事では作成した Go の識別子ケース変換ツール [goconvcase][1] の紹介を取り上げました.
その際に使用したパッケージや手法などはそれ以外の所謂 Beautifire や Formatter のような Go 向けの
コード整形ツールを作成する際に使用できるイディオムかと思いました.
本記事では Go で Go のコード整形ツールを作成した際の手順をまとめます.

## 整形ツール作成の流れ
コードを整形するツールの処理フローは以下になるかと思います.
1. ソースをパースしデータ(AST)化する
1. パースしたデータを更新する
1. 更新したデータをソースに戻す

* DFD で説明する

![DFD](https://github.com/kita127/kita127-blog/blob/master/20200708_creating_beautifire_in_go/images/go_bautifire.png)

## 作成するツールの仕様

* ソースのスネークケースをキャメルケースに変換する

## ソースをパースする

* go/parser を使用する
* AST の簡単な説明

## AST を更新する

* go/ast を使用する
* トラバース関数で更新する

## AST をソースに戻す

* go/format でソースに戻す

[1]:https://kita127.hatenablog.com/entry/2020/06/27/141442
