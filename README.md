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
  "project": {
    "name": "walter-server",
    "repo": "https://github.com/walter-cd/walter-server"
  },
  "status": "fail",
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

### GET /api/v1/reports?count=XXXXX&until=YYYYY

#### Request

```
GET /api/v1/reports?count=XXXXX&until=YYYYY
```

| Parameter | Description |
|-----------|-------------|
|count | API returns this number of reports at most.  |
|since|  API returns reports that start time of which are after this parameter (Unix time by seconds) . |
|until| API returns reports that start time of which are before this parameter (Unix time by seconds) . |
|status| API returns reports that the status of which are this parameter(Passed, Failed, Running or Pending) . |
|projectId | API returns reports of the project with this project id. |

#### Reponse

```json
{
  "Reports": [
    {
      "Id": 2,
      "Project": {
        "Name" => "walter-cd/walter",
        "Repo": "https://github.com/walter-cd/walter",
      },
      "Status": "Failed",

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
      "Project": {
        "Name": "walter-cd/walter-server",
        "Repo": "https://github.com/walter-cd/walter-server"
      },
      "Status": "Passed",
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
  "NextStart": 1440247583
}
```

---

### GET /api/v1/reports/:reportId:

#### Request

```
GET /api/v1/reports/1
```

#### Reponse

```json
{
  "Report": {
    "Id": 1,
    "Project": {
      "Id": 1,
      "Name": "walter-cd/walter",
      "Repo": "https://github.com/walter-cd/walter"
    },
    "Status": "Passed",
    "Branch": "alpha",
    "Commits": [
      {
        "Revision": "3f54ea",
        "Author": "cmoen",
        "Message": "Fixing previous errors",
        "Url": ""
      },
      {
        "Revision": "3308c8",
        "Author": "gerryhocks",
        "Message": "Fixing previous errors",
        "Url": ""
      }
    ],
    "Stages": [
      {
        "Name": "command_stage_1",
        "Status": "Passed",
        "Out": "12:24:00  INFO Pipeline file path: \"./pipeline.yml\"\\n12:24:00  WARN failed to read the configuration file\\n12:24:00  INFO kettle places on heating element\\n12:24:00  INFO a bit of steam visible\\n12:24:00  WARN getting a little hot now\\n12:24:00  WARN loud whistling sounds\\n12:24:00 ERROR open ./pipeline.yml: no such file or directory\\n12:24:00 ERROR failed to create Walter\\n",
        "Err": "",
        "Start": 1452688790,
        "End": 1452688960
      },
      {
        "Name": "build_thing",
        "Status": "Passed",
        "Out": "12:24:00  INFO this info message is to test the INFO message level\"\\n",
        "Err": "",
        "Stages": [
          {
            "Name": "build_thing_substage_1",
            "Status": "Passed",
            "Out": "",
            "Err": "bash: foobar: command not found...",
            "Start": 1452688960,
            "End": 1452689047
          }
        ],
        "Start": 1452688960,
        "End": 1452689047
      },
      {
        "Name": "package_product",
        "Status": "Pending",
        "Out": "",
        "Err": "",
        "Start": 0,
        "End": 0
      }
    ],
    "CompareUrl": "http://compare.url/",
    "Start": 1452688790,
    "End": 1452689047,
    "TriggeredBy": {
      "Name": "takahi-i",
      "Url": "https://github.com/takahi-i",
      "AvatarUrl": "https://avatars2.githubusercontent.com/u/339436?v=3&s=460"
    }
  }
}

```
