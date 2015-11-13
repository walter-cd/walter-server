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
	Duration    int64
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
	Duration int64
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
	var data Report
	err := json.Unmarshal([]byte(body), &data)
	if err != nil {
		panic(err)
	}

	dh := db.GetHandler()
	var projects []db.Project
	if err := dh.Select(&projects, dh.Where("repo", "=", data.Repo)); err != nil {
		panic(err)
	}

	var projectId int64
	if len(projects) == 0 {
		project := &db.Project{Name: data.Project, Repo: data.Repo}
		dh.Insert(project)
		projectId, _ = dh.LastInsertId()
	} else {
		projectId = projects[0].Id
	}

	var users []db.User
	if err := dh.Select(&users, dh.Where("url", "=", data.TriggeredBy.Url)); err != nil {
		panic(err)
	}

	var userId int64
	if len(users) == 0 {
		user := &db.User{
			Name:      data.TriggeredBy.Name,
			Url:       data.TriggeredBy.Url,
			AvatarUrl: data.TriggeredBy.AvatarUrl,
		}
		dh.Insert(user)
		userId, _ = dh.LastInsertId()
	} else {
		userId = users[0].Id
	}

	report := &db.Report{
		Status:      data.Status,
		ProjectId:   projectId,
		Branch:      data.Branch,
		CompareUrl:  data.CompareUrl,
		Duration:    data.Duration,
		TriggeredBy: userId,
	}

	dh.Insert(report)

	reportId, _ := dh.LastInsertId()

	for _, commit := range data.Commits {
		c := &db.Commit{
			ReportId:  reportId,
			Reivision: commit.Revision,
			Author:    commit.Author,
			Message:   commit.Message,
		}
		dh.Insert(c)
	}

	for _, stage := range data.Stages {
		s := &db.Stage{
			ReportId: reportId,
			Name:     stage.Name,
			Status:   stage.Status,
			Out:      stage.Out,
			Err:      stage.Err,
			Duration: stage.Duration,
		}
		dh.Insert(s)
		stageId, _ := dh.LastInsertId()

		for _, childStage := range stage.Stages {
			s := &db.Stage{
				ReportId:      reportId,
				ParentStageId: stageId,
				Name:          childStage.Name,
				Status:        childStage.Status,
				Out:           childStage.Out,
				Err:           childStage.Err,
				Duration:      childStage.Duration,
			}
			dh.Insert(s)
		}
	}

	fmt.Printf("%i\n", projectId)
	fmt.Printf("%i\n", userId)
}
