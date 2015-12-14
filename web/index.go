package web

import (
	"html/template"
	"net/http"
	"path/filepath"
	"sync"
)

type Index struct {
	once     sync.Once
	filename string
	templ    *template.Template
}

func (t *Index) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	t.filename = "index.html"
	t.once.Do(func() {
		t.templ = template.Must(template.ParseFiles(filepath.Join("templates", t.filename)))
	})
	t.templ.Execute(w, nil)
}
