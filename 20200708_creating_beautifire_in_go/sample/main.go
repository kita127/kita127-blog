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
