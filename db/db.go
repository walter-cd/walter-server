package db

import (
	"fmt"
	"regexp"
	"time"

	_ "github.com/mattn/go-sqlite3"
	"github.com/naoina/genmai"
)

var DbFile string

type Project struct {
	Id        int64  `db:"pk"`
	Name      string `size:"255"`
	Repo      string `db:"unique" size:"255"`
	CreatedAt time.Time
}

type Report struct {
	Id          int64  `db:"pk"`
	Status      string `size:"255"`
	ProjectId   int64
	Branch      string `size:"255"`
	CompareUrl  string
	Start       time.Time
	End         time.Time
	TriggeredBy int64
	CreatedAt   time.Time
}

type Commit struct {
	Id        int64 `db:"pk"`
	ReportId  int64
	Revision  string `size:"255"`
	Author    string `size:"255"`
	Message   string
	Url       string
	CreatedAt time.Time
}

type Stage struct {
	Id            int64 `db:"pk"`
	ReportId      int64
	ParentStageId int64
	Name          string `size:"255"`
	Status        string `size:"255"`
	Log           string
	Start         time.Time
	End           time.Time
	CreatedAt     time.Time
}

type User struct {
	Id        int64 `db:"pk"`
	Name      string
	Url       string `db:"unique"`
	AvatarUrl string
	CreatedAt time.Time
}

func (t *Project) BeforeInsert() error {
	t.CreatedAt = time.Now()
	return nil
}

func (t *Report) BeforeInsert() error {
	t.CreatedAt = time.Now()
	return nil
}

func (t *Commit) BeforeInsert() error {
	t.CreatedAt = time.Now()
	return nil
}

func (t *Stage) BeforeInsert() error {
	t.CreatedAt = time.Now()
	return nil
}

func (t *User) BeforeInsert() error {
	t.CreatedAt = time.Now()
	return nil
}

func Init(dbDir string) {
	DbFile = fmt.Sprintf("%s/walter.sqlite3", dbDir)
	db, err := genmai.New(&genmai.SQLite3Dialect{}, DbFile)
	if err != nil {
		panic(err)
	}

	defer db.Close()

	tables := [...]interface{}{
		&Project{},
		&Report{},
		&Commit{},
		&Stage{},
		&User{},
	}

	for _, t := range tables {
		if err := db.CreateTable(t); err != nil {
			if !regexp.MustCompile(`already exists`).Match([]byte(err.Error())) {
				panic(err)
				return
			}
		}
	}

}

func GetHandler() *genmai.DB {
	db, err := genmai.New(&genmai.SQLite3Dialect{}, DbFile)
	if err != nil {
		panic(err)
	}

	return db
}
