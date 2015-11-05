package main

import (
	"flag"
	"html/template"
	"log"
	"net/http"
	"path/filepath"
	"time"

	_ "github.com/mattn/go-sqlite3"
	"github.com/naoina/genmai"
)

type Project struct {
	Id        int64 `db:"pk"`
	Name      string
	Repo      string `db:"unique"`
	CreatedAt *time.Time
}
type Report struct {
	Id          int64 `db:"pk"`
	Status      string
	ProjectId   int64
	Branch      string
	CompareUrl  string
	Duration    int64
	TriggeredBy string
	CreatedAt   *time.Time
}

type Commit struct {
	Id        int64 `db:"pk"`
	ReportId  int64
	Reivision string
	Author    string
	Message   string
	CreatedAt *time.Time
}

type Stage struct {
	Id            int64 `db:"pk"`
	ReportId      int64
	ParentStageId int64
	Name          string
	Status        string
	Out           string
	Err           string
	Duration      int64
	CreatedAt     *time.Time
}

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

var host = flag.String("host", ":8080", "The host of the application.")

func main() {
	db, err := genmai.New(&genmai.SQLite3Dialect{}, "walter.sqlite3")
	if err != nil {
		panic(err)
	}
	defer db.Close()

	tables := [...]interface{}{
		&Project{},
		&Report{},
		&Commit{},
		&Stage{},
	}

	for _, t := range tables {
		if err := db.CreateTable(t); err != nil {
			panic(err)
		}
	}

	flag.Parse() // parse the flags

	http.Handle("/", &templateHandler{filename: "index.html"})

	if err := http.ListenAndServe(*host, nil); err != nil {
		log.Fatal("ListenAndServe:", err)
	}
}
