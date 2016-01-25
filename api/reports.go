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
	"github.com/walter-cd/walter/log"
)

type Reports struct {
	Reports   []*Report
	NextStart int64
}

type Report struct {
	Id          int64 `json:",omitempty"`
	Project     *Project
	Status      string
	Branch      string
	Commits     []*Commit
	Stages      []*Stage
	CompareUrl  string
	Start       int64
	End         int64
	TriggeredBy User
}

type Project struct {
	Id   int64 `json:",omitempty"`
	Name string
	Repo string
}

type Commit struct {
	Revision string
	Author   string
	Message  string
	Url      string
}

type Stage struct {
	Name   string
	Status string
	Out    string
	Err    string
	Stages []*Stage `json:",omitempty"`
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
	if r.FormValue("count") != "" {
		limit, _ = strconv.Atoi(r.FormValue("count"))
	}

	dh := db.GetHandler()
	defer dh.Close()

	order := dh.OrderBy("start", genmai.DESC).Limit(limit + 1)

	var cond [][]interface{}

	re := regexp.MustCompile(`^/api/v1/reports/(\d+)$`)

	reportId := ""
	if m := re.FindStringSubmatch(r.URL.Path); m != nil {
		reportId = m[1]
	}

	if reportId != "" {
		cond = append(cond, []interface{}{"id", "=", reportId})
	}

	if projectId := r.FormValue("projectId"); projectId != "" {
		cond = append(cond, []interface{}{"project_id", "=", projectId})
	}

	if until := r.FormValue("until"); until != "" {
		u, _ := strconv.ParseInt(until, 10, 64)
		cond = append(cond, []interface{}{"start", "<=", time.Unix(u, 0)})
	}

	if since := r.FormValue("since"); since != "" {
		s, _ := strconv.ParseInt(since, 10, 64)
		cond = append(cond, []interface{}{"start", ">=", time.Unix(s, 0)})
	}

	if status := r.FormValue("status"); status != "" {
		cond = append(cond, []interface{}{"status", "=", status})
	}

	where := &genmai.Condition{}
	for i, c := range cond {
		if i < 1 {
			where = dh.Where(c[0], c[1], c[2])
		} else {
			where = where.And(dh.Where(c[0], c[1], c[2]))
		}
	}

	var reports []db.Report

	dh.Select(&reports, where, order)

	if len(reports) > limit {
		res.NextStart = reports[limit].Start.Unix()
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

		r.Project = &Project{
			Id:   project.Id,
			Name: project.Name,
			Repo: project.Repo,
		}

		var commits []db.Commit
		dh.Select(&commits, dh.Where("report_id", "=", report.Id))
		for _, commit := range commits {
			r.Commits = append(r.Commits, &Commit{
				Revision: commit.Revision,
				Author:   commit.Author,
				Message:  commit.Message,
				Url:      commit.Url,
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

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	var b []byte
	if reportId != "" {
		b, _ = json.Marshal(&struct{ Report *Report }{Report: res.Reports[0]})
	} else {
		b, _ = json.Marshal(res)
	}

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
		log.Error(err.Error())
		returnError(w, err.Error())
		return
	}

	dh := db.GetHandler()
	defer dh.Close()

	var projects []db.Project
	if err := dh.Select(&projects, dh.Where("repo", "=", data.Project.Repo)); err != nil {
		log.Error(err.Error())
		returnError(w, err.Error())
		return
	}

	var projectId int64
	if len(projects) == 0 {
		project := &db.Project{Name: data.Project.Name, Repo: data.Project.Repo}
		dh.Insert(project)
		projectId, _ = dh.LastInsertId()
	} else {
		projectId = projects[0].Id
	}

	var users []db.User
	if err := dh.Select(&users, dh.Where("url", "=", data.TriggeredBy.Url)); err != nil {
		log.Error(err.Error())
		returnError(w, err.Error())
		return
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
			Url:      commit.Url,
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

	data.Id = reportId
	b, _ := json.Marshal(data)
	fmt.Fprint(w, string(b))
}
