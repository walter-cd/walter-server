package main

import (
	"flag"
	"fmt"
	"net/http"

	_ "github.com/mattn/go-sqlite3"
	"github.com/walter-cd/walter-server/db"
	"github.com/walter-cd/walter-server/route"
	"github.com/walter-cd/walter/log"
)

var host = flag.String("host", "127.0.0.1:8080", "The host of the application.")

func main() {
	db.Init()

	flag.Parse() // parse the flags

	r := route.GetRegexpHandler()
	http.Handle("/", r)

	log.Info(fmt.Sprintf("walter-server is listening on %s", *host))

	if err := http.ListenAndServe(*host, nil); err != nil {
		log.Error(fmt.Sprintf("ListenAndServe: %s", err))
	}
}
