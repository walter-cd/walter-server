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
      "start": 1449062903,
      "end": 1449062940,
    },
    {
      "name": "stage 2",
      "status": "success",
      "out": "foo",
      "err": "bar",
      "start": 1449062903,
      "end": 1449062940,
      "stages": [
        {
          "name": "child stage 1",
          "status": "fail",
          "out": "foo",
          "err": "bar",
          "start": 1449062903,
          "end": 1449062940,
        }
      ]
    }
  ],
  "compareUrl": "https://xxxxxx/", # Optional
  "start": 1449062903,
  "end": 1449062940,
  "triggeredBy": {
    "name": "mizzy",
    "url":  "https://github.com/mizzy",
    "avatarUrl": "https://avatars1.githubusercontent.com/u/3620",
  } # Optional
}
```

#### response

```json
Status: 201
Location:
```

----

### GET /api/v1/reports?maxId=XXX

#### Request

```
GET /api/v1/reports?maxId=XXX
```

#### Reponse

```json
{
  "Reports": [
    {
      "Id": 2,
      "Project": "walter-cd/walter",
      "Status": "Failed",
      "Repo": "https://github.com/walter-cd/walter",
      "Branch": "alpha",
      "Commits": [
        {
          "Revision": "8ecb42",
          "Author": "mizzy",
          "Message": "Some changes"
        },
      ],
      "Stages": [
        {
          "Name": "command_stage_1",
          "Status": "Passed",
          "Out": "12:24:00  INFO Pipeline file path: \"./pipeline.yml\"\\n12:24:00  WARN failed to read the configuration file\\n12:24:00  INFO kettle places on heating element\\n12:24:00  INFO a bit of steam visible\\n12:24:00  WARN getting a little hot now\\n12:24:00  WARN loud whistling sounds\\n12:24:00 ERROR open ./pipeline.yml: no such file or directory\\n12:24:00 ERROR failed to create Walter\\n",
          "Err": "",
          "Stages": null,
          "Start": 1450268347,
          "End": 1450269085
        },
      ],
      "CompareUrl": "http://compare.url/",
      "Start": 1450268347,
      "End": 1450269106,
      "TriggeredBy": {
        "Name": "gerryhocks",
        "Url": "https://github.com/gerryhocks",
        "AvatarUrl": "https://avatars3.githubusercontent.com/u/1311758?v=3&s=460"
      }
    },
    {
      "Id": 1,
      "Project": "walter-cd/walter-server",
      "Status": "Passed",
      "Repo": "https://github.com/walter-cd/walter-server",
      "Branch": "alpha",
      "Commits": [
        {
          "Revision": "6a3c35",
          "Author": "gerryhocks",
          "Message": "Updated documentation"
        },
      ],
      "Stages": [
        {
          "Name": "command_stage_1",
          "Status": "Passed",
          "Out": "12:24:00  INFO Pipeline file path: \"./pipeline.yml\"\\n12:24:00  WARN failed to read the configuration file\\n12:24:00  INFO kettle places on heating element\\n12:24:00  INFO a bit of steam visible\\n12:24:00  WARN getting a little hot now\\n12:24:00  WARN loud whistling sounds\\n12:24:00 ERROR open ./pipeline.yml: no such file or directory\\n12:24:00 ERROR failed to create Walter\\n",
          "Err": "",
          "Stages": null,
          "Start": 1450247583,
          "End": 1450248050
        },
      ],
      "CompareUrl": "http://compare.url/",
      "Start": 1450247583,
      "End": 1450248205,
      "TriggeredBy": {
        "Name": "mizzy",
        "Url": "https://github.com/mizzy",
        "AvatarUrl": "https://avatars0.githubusercontent.com/u/3620?v=3&s=460"
      }
    }
  ],
  "NextId": 0
}
```
