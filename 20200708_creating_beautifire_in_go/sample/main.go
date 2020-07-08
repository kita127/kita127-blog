package main

import (
	"go/ast"
	"go/format"
	"go/parser"
	"go/token"
	"io/ioutil"
	"log"
	"os"
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

	// buf に更新したソースを書く
	err = format.Node(os.Stdout, fset, node)
	if err != nil {
		log.Fatal(err)
	}
}

func isSnakeCase(n string) bool {
	return true
}

func convertSnakeToCamel(n string) string {
	return n
}
