package api

import "net/http"

type Reports struct{}

func (t *Reports) ServeHTTP(w http.ResponseWriter, r *http.Request) {
}
