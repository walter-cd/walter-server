package main

import (
	"regexp"
	"time"

	_ "github.com/mattn/go-sqlite3"
	"github.com/naoina/genmai"
)

type Db struct{}

type Project struct {
	Id        int64  `db:"pk"`
	Name      string `size:"255"`
	Repo      string `db:"unique" size:"255"`
	CreatedAt *time.Time
}

type Report struct {
	Id          int64  `db:"pk"`
	Status      string `size:"255"`
	ProjectId   int64
	Branch      string `size:"255"`
	CompareUrl  string
	Duration    int64
	TriggeredBy string `size:"255"`
	CreatedAt   *time.Time
}

type Commit struct {
	Id        int64 `db:"pk"`
	ReportId  int64
	Reivision string `size:"255"`
	Author    string `size:"255"`
	Message   string
	CreatedAt *time.Time
}

type Stage struct {
	Id            int64 `db:"pk"`
	ReportId      int64
	ParentStageId int64
	Name          string `size:"255"`
	Status        string `size:"255"`
	Out           string
	Err           string
	Duration      int64
	CreatedAt     *time.Time
}

func (d *Db) Init() {
	db, err := genmai.New(&genmai.SQLite3Dialect{}, "walter.sqlite3")
	if err != nil {
		panic(err)
	}
	defer db.Close()

	tables := [...]interface{}{
		&Project{},
		&Report{},
		&Commit{},
		&Stage{},
	}

	for _, t := range tables {
		if err := db.CreateTable(t); err != nil {
			if !regexp.MustCompile(`already exists`).Match([]byte(err.Error())) {
				panic(err)
			}
		}
	}

}
