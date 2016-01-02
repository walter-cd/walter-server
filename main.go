package main

import (
	"flag"
	"html/template"
	"log"
	"net/http"
	"path/filepath"
	"regexp"

	_ "github.com/mattn/go-sqlite3"
	"github.com/walter-cd/walter-server/api"
	"github.com/walter-cd/walter-server/db"
)

type templateHandler struct {
	filename string
	templ    *template.Template
}

func (t *templateHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if t.templ == nil {
		t.templ = template.Must(template.ParseFiles(filepath.Join("templates", t.filename)))
	}

	data := map[string]interface{}{}

	t.templ.Execute(w, data)
}

var host = flag.String("host", "127.0.0.1:8080", "The host of the application.")

func main() {
	db.Init()

	flag.Parse() // parse the flags

	r := &RegexpHandler{}
	r.Handler(regexp.MustCompile(`^/api/v1/reports(/.*)?$`), &api.Reports{})
	r.Handler(regexp.MustCompile(`^/api/v1/jobs(/.*)?$`), &api.Jobs{})
	http.Handle("/", r)

	if err := http.ListenAndServe(*host, nil); err != nil {
		log.Fatal("ListenAndServe:", err)
	}
}
