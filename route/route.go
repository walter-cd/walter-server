package route

import (
	"fmt"
	"net/http"
	"path/filepath"

	"regexp"

	"github.com/walter-cd/walter-server/api"
	"github.com/walter-cd/walter-server/assets"
	"github.com/walter-cd/walter/log"
)

type route struct {
	pattern *regexp.Regexp
	handler http.Handler
}

type RegexpHandler struct {
	routes []*route
}

func GetRegexpHandler() *RegexpHandler {
	r := &RegexpHandler{}
	r.Handler(regexp.MustCompile(`^/api/v1/reports(/.*)?$`), &api.Reports{})
	r.Handler(regexp.MustCompile(`^/api/v1/jobs(/.*)?$`), &api.Jobs{})
	r.Handler(regexp.MustCompile(`^/api/v1/projects(/.*)?$`), &api.Projects{})
	return r
}

func (h *RegexpHandler) Handler(pattern *regexp.Regexp, handler http.Handler) {
	h.routes = append(h.routes, &route{pattern, handler})
}

func (h *RegexpHandler) HandlerFunc(pattern *regexp.Regexp, handler func(http.ResponseWriter, *http.Request)) {
	h.routes = append(h.routes, &route{pattern, http.HandlerFunc(handler)})
}

func (h *RegexpHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	line := fmt.Sprintf("%s %s", r.Method, r.URL.Path)
	if q := r.URL.RawQuery; q != "" {
		line = fmt.Sprintf("%s?%s", line, q)
	}
	log.Info(line)

	for _, route := range h.routes {
		if route.pattern.MatchString(r.URL.Path) {
			route.handler.ServeHTTP(w, r)
			return
		}
	}

	path := r.URL.Path
	if path == "/" {
		path = "/index.html"
	}

	b, err := assets.Asset("web" + path)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, err.Error())
		return
	}

	ext := filepath.Ext(path)
	switch ext {
	case ".css":
		w.Header().Set("Content-Type", "text/css")
	case ".js":
		w.Header().Set("Content-Type", "application/javascript")
	}

	w.Write(b)
}
