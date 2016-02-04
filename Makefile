COMMIT = $$(git describe --always)

deps:
	go get github.com/jteeuwen/go-bindata/...
	go-bindata -pkg=assets -o=assets/assets.go ./web/...
	gofmt -w assets/assets.go
	go get -d -t ./...
	go get github.com/tools/godep

test: deps
	go test ./...
	test `gofmt -l . | wc -l` -eq 0

build: deps
	godep restore
	go build -ldflags "-X main.GitCommit=\"$(COMMIT)\"" -o bin/walter-server

install: deps
	go install -ldflags "-X main.GitCommit=\"$(COMMIT)\""

clean:
	rm $(GOPATH)/bin/walter-server
	rm bin/walter-server
