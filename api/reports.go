package api

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"time"

	"github.com/naoina/genmai"
	"github.com/walter-cd/walter-server/db"
)

type Reports struct {
	Reports []*Report
	NextId  int64
}

type Report struct {
	Id          int64
	Project     string
	Status      string
	Repo        string
	Branch      string
	Commits     []*Commit
	Stages      []*Stage
	CompareUrl  string
	Start       int64
	End         int64
	TriggeredBy User
}

type Commit struct {
	Revision string
	Author   string
	Message  string
}

type Stage struct {
	Name   string
	Status string
	Out    string
	Err    string
	Stages []*Stage
	Start  int64
	End    int64
}

type User struct {
	Name      string
	Url       string
	AvatarUrl string
}

func (t *Reports) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		createReport(w, r)
	} else {
		getReport(w, r)
	}
}

func getReport(w http.ResponseWriter, r *http.Request) {
	res := &Reports{}

	limit := 20

	dh := db.GetHandler()
	//dh.SetLogOutput(os.Stdout)

	order := dh.OrderBy("id", genmai.DESC).Limit(limit + 1)

	where := &genmai.Condition{}
	re := regexp.MustCompile(`^/api/v1/reports/(\d+)$`)

	projectId := ""
	if m := re.FindStringSubmatch(r.URL.Path); m != nil {
		projectId = m[1]
	}

	if projectId != "" {
		where = dh.Where("project_id", "=", projectId)
	}

	maxId, _ := strconv.Atoi(r.FormValue("maxId"))
	if maxId > 0 {
		if projectId == "" {
			where = dh.Where("id", "<=", maxId)
		} else {
			where = where.And(dh.Where("id", "<=", maxId))
		}
	}

	var reports []db.Report

	dh.Select(&reports, where, order)

	if len(reports) > limit {
		res.NextId = reports[limit].Id
		reports = reports[:len(reports)-1]
	}

	for _, report := range reports {
		r := &Report{
			Id:         report.Id,
			Status:     report.Status,
			Branch:     report.Branch,
			CompareUrl: report.CompareUrl,
			Start:      report.Start.Unix(),
			End:        report.End.Unix(),
		}

		var projects []db.Project
		dh.Select(&projects, dh.Where("id", "=", report.ProjectId))
		project := projects[0]

		r.Project = project.Name
		r.Repo = project.Repo

		var commits []db.Commit
		dh.Select(&commits, dh.Where("report_id", "=", report.Id))
		for _, commit := range commits {
			r.Commits = append(r.Commits, &Commit{
				Revision: commit.Revision,
				Author:   commit.Author,
				Message:  commit.Message,
			})
		}

		var users []db.User
		dh.Select(&users, dh.Where("id", "=", report.TriggeredBy))
		user := users[0]
		r.TriggeredBy.Name = user.Name
		r.TriggeredBy.Url = user.Url
		r.TriggeredBy.AvatarUrl = user.AvatarUrl

		var stages []db.Stage
		dh.Select(&stages, dh.Where("report_id", "=", report.Id).And(dh.Where("parent_stage_id", "=", 0)))
		for _, stage := range stages {
			s := &Stage{
				Name:   stage.Name,
				Status: stage.Status,
				Out:    stage.Out,
				Err:    stage.Err,
				Start:  stage.Start.Unix(),
				End:    stage.End.Unix(),
			}

			var childStages []db.Stage
			dh.Select(&childStages, dh.Where("report_id", "=", report.Id).And(dh.Where("parent_stage_id", "=", stage.Id)))
			for _, childStage := range childStages {
				s.Stages = append(s.Stages, &Stage{
					Name:   childStage.Name,
					Status: childStage.Status,
					Out:    childStage.Out,
					Err:    childStage.Err,
					Start:  childStage.Start.Unix(),
					End:    childStage.End.Unix(),
				})
			}

			r.Stages = append(r.Stages, s)
		}

		res.Reports = append(res.Reports, r)
	}

	b, _ := json.Marshal(res)
	fmt.Fprint(w, string(b))
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
		Start:       time.Unix(data.Start, 0),
		End:         time.Unix(data.End, 0),
		TriggeredBy: userId,
	}

	dh.Insert(report)

	reportId, _ := dh.LastInsertId()

	for _, commit := range data.Commits {
		c := &db.Commit{
			ReportId: reportId,
			Revision: commit.Revision,
			Author:   commit.Author,
			Message:  commit.Message,
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
			Start:    time.Unix(stage.Start, 0),
			End:      time.Unix(stage.End, 0),
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
				Start:         time.Unix(childStage.Start, 0),
				End:           time.Unix(childStage.End, 0),
			}
			dh.Insert(s)
		}
	}
}
