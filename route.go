package main

import (
	"fmt"
	"net/http"
	"regexp"

	"github.com/walter-cd/walter/log"
)

type route struct {
	pattern *regexp.Regexp
	handler http.Handler
}

type RegexpHandler struct {
	routes []*route
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
	// no pattern matched; serve file statically
	http.FileServer(http.Dir("web")).ServeHTTP(w, r)
}
