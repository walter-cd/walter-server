package api

import (
	"bufio"
	"encoding/json"
	"io"
	"net/http"
)

type Reports struct{}

type Report struct {
	Project     string
	Status      string
	Repo        string
	Branch      string
	Commits     []Commit
	Stages      []Stage
	CompareUrl  string
	Duration    int
	TriggeredBy string
}

type Commit struct {
	Revision string
	Author   string
	Message  string
}

type Stage struct {
	Name     string
	Status   string
	Out      string
	Err      string
	Stages   []Stage
	Duration int
}

func (t *Reports) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		createReport(w, r)
	}
}

func createReport(w http.ResponseWriter, r *http.Request) {
	rb := bufio.NewReader(r.Body)
	var body string
	for {
		s, err := rb.ReadString('\n')
		body = body + s
		if err == io.EOF {
			break
		}
	}
	var report Report
	err := json.Unmarshal([]byte(body), &report)
	if err != nil {
		panic(err)
	}

	w.Write([]byte(res))
}
