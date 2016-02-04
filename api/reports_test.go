package api

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/walter-cd/walter-server/db"
)

func TestMain(m *testing.M) {
	db.DbFile = "test.sqlite3"
	db.Init("/tmp")
	os.Exit(m.Run())
	os.Remove(db.DbFile)
}

func TestGetReport(t *testing.T) {
	ts := httptest.NewServer(&Reports{})
	defer ts.Close()

	res, err := http.Get(ts.URL)
	if err != nil {
		t.Error("unexpected")
		return
	}

	if res.StatusCode != 200 {
		t.Error("Status code error")
		return
	}
}
