package main

import (
	"flag"
	"fmt"
	"net/http"
	"os"

	_ "github.com/mattn/go-sqlite3"
	"github.com/walter-cd/walter-server/db"
	"github.com/walter-cd/walter-server/route"
	"github.com/walter-cd/walter/log"
)

func main() {
	db.Init()

	var host string

	flags := flag.NewFlagSet("walter", flag.ExitOnError)
	flags.StringVar(&host, "host", "127.0.0.1:8080", "The host of the application.")

	if err := flags.Parse(os.Args[1:]); err != nil {
		panic(err)
	}

	r := route.GetRegexpHandler()
	http.Handle("/", r)

	log.Info(fmt.Sprintf("walter-server is listening on %s", host))

	if err := http.ListenAndServe(host, nil); err != nil {
		log.Error(fmt.Sprintf("ListenAndServe: %s", err))
	}
}
