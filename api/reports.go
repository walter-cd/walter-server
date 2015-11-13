package api

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/walter-cd/walter-server/db"
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
	TriggeredBy User
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

type User struct {
	Name      string
	Url       string
	AvatarUrl string
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

	dh := db.GetHandler()
	var projects []db.Project
	if err := dh.Select(&projects, dh.Where("repo", "=", report.Repo)); err != nil {
		panic(err)
	}

	var projectId int64
	if len(projects) == 0 {
		project := &db.Project{Name: report.Project, Repo: report.Repo}
		dh.Insert(project)
		projectId, _ = dh.LastInsertId()
	} else {
		projectId = projects[0].Id
	}

	var users []db.User
	if err := dh.Select(&users, dh.Where("url", "=", report.TriggeredBy.Url)); err != nil {
		panic(err)
	}

	var userId int64
	if len(users) == 0 {
		user := &db.User{
			Name:      report.TriggeredBy.Name,
			Url:       report.TriggeredBy.Url,
			AvatarUrl: report.TriggeredBy.AvatarUrl,
		}
		dh.Insert(user)
		userId, _ = dh.LastInsertId()
	} else {
		userId = users[0].Id
	}

	fmt.Printf("%i\n", projectId)
	fmt.Printf("%i\n", userId)
}
