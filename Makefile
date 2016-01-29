COMMIT = $$(git describe --always)

deps:
	go get -d -t ./...
	go get github.com/jteeuwen/go-bindata/...
	go get github.com/tools/godep

test: deps
	go test ./...

build: deps
	godep restore
	go-bindata -pkg=assets -o=assets/assets.go ./web/...
	go build -ldflags "-X main.GitCommit=\"$(COMMIT)\"" -o bin/walter-server

install: deps
	go install -ldflags "-X main.GitCommit=\"$(COMMIT)\""

clean:
	rm $(GOPATH)/bin/walter-server
	rm bin/walter-server
