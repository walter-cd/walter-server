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
	var host, dbDir string

	flags := flag.NewFlagSet("walter", flag.ExitOnError)
	flags.StringVar(&host, "host", "0.0.0.0:8080", "The host of the application.")
	flags.StringVar(&dbDir, "db_dir", "/var/lib/walter", "The directory of the sqlite3 db file put on.")

	if err := flags.Parse(os.Args[1:]); err != nil {
		panic(err)
	}

	if err := os.MkdirAll(dbDir, 0755); err != nil {
		panic(err)
	}

	db.Init(dbDir)

	r := route.GetRegexpHandler()
	http.Handle("/", r)

	log.Info(fmt.Sprintf("walter-server is listening on %s", host))

	if err := http.ListenAndServe(host, nil); err != nil {
		log.Error(fmt.Sprintf("ListenAndServe: %s", err))
	}
}
