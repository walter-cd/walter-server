COMMIT = $$(git describe --always)

deps:
	go get -d -t ./...
	go get github.com/jteeuwen/go-bindata/...

test: deps
	go test ./...

build: deps
	go-bindata -pkg=assets -o=assets/assets.go ./web/...
	go build -ldflags "-X main.GitCommit=\"$(COMMIT)\"" -o bin/walter-server

install: deps
	go install -ldflags "-X main.GitCommit=\"$(COMMIT)\""

clean:
	rm $(GOPATH)/bin/walter-server
	rm bin/walter-server
