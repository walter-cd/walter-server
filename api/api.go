package api

import (
	"encoding/json"
	"fmt"
	"net/http"
)

func returnError(w http.ResponseWriter, err string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusBadRequest)

	data := struct{ Error string }{Error: err}
	b, _ := json.Marshal(data)
	fmt.Fprint(w, string(b))
}
