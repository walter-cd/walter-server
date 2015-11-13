# walter-server

## What is this ?

* Store and display results from walter.
* Provide webhook endpoint and enqueue jobs into walter-agent (walter-agent does not exist yet).

----

## API

### POST /api/v1/reports

Report a build result.

#### request

```json
POST /api/v1/reports
Content-Type: application/json

{
  "project": "walter-server",
  "status": "fail",
  "repo": "https://github.com/walter-cd/walter-server",
  "branch": "master",
  "commits": [
    {
      "revision": "xxxxxxxxx",
      "author": "mizzy",
      "message": "xxxxxxx"
    },
    {
      "revision": "xxxxxxxxx",
      "author": "mizzy",
      "message": "xxxxxx"
    }
  ],
  "stages": [
    {
      "name": "stage 1",
      "status": "success",
      "out": "foo",
      "err": "bar",
      "duration": 10
    },
    {
      "name": "stage 2",
      "status": "success",
      "out": "foo",
      "err": "bar",
      "duration": 20,
      "stages": [
        {
          "name": "child stage 1",
          "status": "fail",
          "out": "foo",
          "err": "bar",
          "duration": 10
        }
      ]
    }
  ],
  "compare_url": "https://xxxxxx/", # Optional
  "duration": 80,
  "triggered_by": {
    "user": "mizzy",
    "url":  "https://github.com/mizzy",
    "avatar_url": "https://avatars1.githubusercontent.com/u/3620",
  } # Optional
}
```

#### response

```json
Status: 201
Location:
```
