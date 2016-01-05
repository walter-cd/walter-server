package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"regexp"

	"github.com/walter-cd/walter-server/db"
)

type Projects struct {
}

func (p *Projects) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	dh := db.GetHandler()
	defer dh.Close()

	dh.SetLogOutput(os.Stdout)

	var projects []db.Project

	re := regexp.MustCompile(`^/api/v1/projects/(\d+)$`)

	projectId := ""
	if m := re.FindStringSubmatch(r.URL.Path); m != nil {
		projectId = m[1]
	}

	if projectId != "" {
		dh.Select(&projects, dh.Where("id", "=", projectId))
		if len(projects) > 0 {
			b, _ := json.Marshal(projects[0])
			fmt.Fprint(w, string(b))
		} else {
			w.WriteHeader(http.StatusNotFound)
		}
		return
	}

	var res []*Project

	name := r.FormValue("name")
	if name != "" {
		dh.Select(&projects, dh.Where("name").Like(fmt.Sprintf("%%%s%%", name)))
	} else {
		dh.Select(&projects)
	}

	if len(projects) == 0 {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	for _, project := range projects {
		res = append(res, &Project{
			Id:   project.Id,
			Name: project.Name,
			Repo: project.Repo,
		})
	}

	b, _ := json.Marshal(res)
	fmt.Fprint(w, string(b))
}
