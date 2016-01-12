package api

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
)

type Jobs struct {
	jobs  []*Job
	mutex sync.Mutex
}

type Job struct {
	Project        string
	Revision       string
	HtmlUrl        string
	CloneUrl       string
	CompareUrl     string
	StatusesUrl    string
	PullRequestUrl string
	Branch         string
	Commits        []*commit
	TriggeredBy    *triggeredBy
}

type commit struct {
	Revision string
	Author   string
	Message  string
	Url      string
}

type triggeredBy struct {
	Name      string
	Url       string
	AvatarUrl string
}

type payloadPushEvent struct {
	Ref        string
	After      string
	Repository payloadRepository
	Compare    string
	Commits    []payloadCommit
	Sender     payloadSender
}

type payloadPullRequestEvent struct {
	Number      int64
	PullRequest payloadPullRequest `json:"pull_request"`
	Repository  payloadRepository
	Sender      payloadSender
}

type payloadPullRequest struct {
	HtmlUrl     string `json:"html_url"`
	Title       string
	StatusesUrl string `json:"statuses_url"`
	Head        payloadPullRequestHead
	User        payloadPullRequestUser
}

type payloadPullRequestUser struct {
	Login string
}

type payloadPullRequestHead struct {
	Repo payloadPullRequestHeadRepo
	Ref  string
	Sha  string
}

type payloadPullRequestHeadRepo struct {
	CloneUrl string `json:"clone_url"`
}

type payloadRepository struct {
	Name     string
	FullName string `json:"full_name"`
	HtmlUrl  string `json:"html_url"`
	CloneUrl string `json:"clone_url"`
}

type payloadCommit struct {
	Id      string
	Author  payloadAuthor
	Message string
	Url     string
}

type payloadAuthor struct {
	Name     string
	Email    string
	Username string
}

type payloadSender struct {
	Login     string
	AvatarUrl string `json:"avatar_url"`
	HtmlUrl   string `json:"html_url"`
}

func (j *Jobs) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		j.createJob(w, r)
		return
	}

	if p := strings.Split(r.URL.Path, "/"); p[len(p)-1] == "pop" {
		j.popJob(w, r)
	} else {
		j.getJob(w, r)
	}
}

func (j *Jobs) createJob(w http.ResponseWriter, r *http.Request) {
	rb := bufio.NewReader(r.Body)
	var body string
	for {
		s, err := rb.ReadString('\n')
		body = body + s
		if err == io.EOF {
			break
		}
	}

	event_type := r.Header.Get("X-Github-Event")
	if event_type == "push" {
		j.handlePushEvent(body)
	} else if event_type == "pull_request" {
		j.handlePullRequestEvent(body)
	}
}

func (j *Jobs) handlePushEvent(body string) {
	var data payloadPushEvent
	err := json.Unmarshal([]byte(body), &data)
	if err != nil {
		panic(err)
	}

	job := &Job{}

	job.Project = data.Repository.FullName
	job.Revision = data.After
	job.HtmlUrl = data.Repository.HtmlUrl
	job.CloneUrl = data.Repository.CloneUrl
	job.CompareUrl = data.Compare

	ref := strings.Split(data.Ref, "/")
	job.Branch = ref[len(ref)-1]

	for _, c := range data.Commits {
		job.Commits = append(job.Commits, &commit{
			Revision: c.Id,
			Author:   c.Author.Username,
			Message:  c.Message,
			Url:      c.Url,
		})
	}

	job.TriggeredBy = &triggeredBy{
		Name:      data.Sender.Login,
		Url:       data.Sender.HtmlUrl,
		AvatarUrl: data.Sender.AvatarUrl,
	}

	j.jobs = append(j.jobs, job)
}

func (j *Jobs) handlePullRequestEvent(body string) {
	var data payloadPullRequestEvent
	err := json.Unmarshal([]byte(body), &data)
	if err != nil {
		panic(err)
	}

	job := &Job{}

	job.Project = data.Repository.Name
	job.Revision = data.PullRequest.Head.Sha
	job.HtmlUrl = data.Repository.HtmlUrl
	job.CloneUrl = data.PullRequest.Head.Repo.CloneUrl
	job.Branch = data.PullRequest.Head.Ref
	job.PullRequestUrl = data.PullRequest.HtmlUrl
	job.StatusesUrl = data.PullRequest.StatusesUrl

	job.TriggeredBy = &triggeredBy{
		Name:      data.Sender.Login,
		Url:       data.Sender.HtmlUrl,
		AvatarUrl: data.Sender.AvatarUrl,
	}

	c := &commit{
		Revision: data.PullRequest.Head.Sha,
		Author:   data.PullRequest.User.Login,
		Message:  fmt.Sprintf("Pull request #%d \"%s\"", data.Number, data.PullRequest.Title),
	}

	job.Commits = append(job.Commits, c)

	j.jobs = append(j.jobs, job)
}

func (j *Jobs) getJob(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("get"))
}

func (j *Jobs) popJob(w http.ResponseWriter, r *http.Request) {
	j.mutex.Lock()
	defer j.mutex.Unlock()

	if len(j.jobs) == 0 {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	job, rest := j.jobs[0], j.jobs[1:]
	j.jobs = rest

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	b, _ := json.Marshal(job)
	fmt.Fprint(w, string(b))
}
