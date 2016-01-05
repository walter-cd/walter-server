#!/usr/bin/env ruby

require 'net/http'

payload = <<-EOF
{
  "ref": "refs/heads/master",
  "before": "41f0ed655a1aa4d4f5b84adb59f22e83318210e4",
  "after": "f54f19d7053d7a766ea2a65fff31b4fc8ddd7cbf",
  "created": false,
  "deleted": false,
  "forced": false,
  "base_ref": null,
  "compare": "https://github.com/mizzy/walter-test/compare/41f0ed655a1a...f54f19d7053d",
  "commits": [
    {
      "id": "f54f19d7053d7a766ea2a65fff31b4fc8ddd7cbf",
      "distinct": true,
      "message": "test",
      "timestamp": "2016-01-02T22:43:20+09:00",
      "url": "https://github.com/mizzy/walter-test/commit/f54f19d7053d7a766ea2a65fff31b4fc8ddd7cbf",
      "author": {
        "name": "Gosuke Miyashita",
        "email": "gosukenator@gmail.com",
        "username": "mizzy"
      },
      "committer": {
        "name": "Gosuke Miyashita",
        "email": "gosukenator@gmail.com",
        "username": "mizzy"
      },
      "added": [
        "test.txt"
      ],
      "removed": [

      ],
      "modified": [

      ]
    }
  ],
  "head_commit": {
    "id": "f54f19d7053d7a766ea2a65fff31b4fc8ddd7cbf",
    "distinct": true,
    "message": "test",
    "timestamp": "2016-01-02T22:43:20+09:00",
    "url": "https://github.com/mizzy/walter-test/commit/f54f19d7053d7a766ea2a65fff31b4fc8ddd7cbf",
    "author": {
      "name": "Gosuke Miyashita",
      "email": "gosukenator@gmail.com",
      "username": "mizzy"
    },
    "committer": {
      "name": "Gosuke Miyashita",
      "email": "gosukenator@gmail.com",
      "username": "mizzy"
    },
    "added": [
      "test.txt"
    ],
    "removed": [

    ],
    "modified": [

    ]
  },
  "repository": {
    "id": 33969321,
    "name": "walter-test",
    "full_name": "mizzy/walter-test",
    "owner": {
      "name": "mizzy",
      "email": "gosukenator@gmail.com"
    },
    "private": false,
    "html_url": "https://github.com/mizzy/walter-test",
    "description": "",
    "fork": false,
    "url": "https://github.com/mizzy/walter-test",
    "forks_url": "https://api.github.com/repos/mizzy/walter-test/forks",
    "keys_url": "https://api.github.com/repos/mizzy/walter-test/keys{/key_id}",
    "collaborators_url": "https://api.github.com/repos/mizzy/walter-test/collaborators{/collaborator}",
    "teams_url": "https://api.github.com/repos/mizzy/walter-test/teams",
    "hooks_url": "https://api.github.com/repos/mizzy/walter-test/hooks",
    "issue_events_url": "https://api.github.com/repos/mizzy/walter-test/issues/events{/number}",
    "events_url": "https://api.github.com/repos/mizzy/walter-test/events",
    "assignees_url": "https://api.github.com/repos/mizzy/walter-test/assignees{/user}",
    "branches_url": "https://api.github.com/repos/mizzy/walter-test/branches{/branch}",
    "tags_url": "https://api.github.com/repos/mizzy/walter-test/tags",
    "blobs_url": "https://api.github.com/repos/mizzy/walter-test/git/blobs{/sha}",
    "git_tags_url": "https://api.github.com/repos/mizzy/walter-test/git/tags{/sha}",
    "git_refs_url": "https://api.github.com/repos/mizzy/walter-test/git/refs{/sha}",
    "trees_url": "https://api.github.com/repos/mizzy/walter-test/git/trees{/sha}",
    "statuses_url": "https://api.github.com/repos/mizzy/walter-test/statuses/{sha}",
    "languages_url": "https://api.github.com/repos/mizzy/walter-test/languages",
    "stargazers_url": "https://api.github.com/repos/mizzy/walter-test/stargazers",
    "contributors_url": "https://api.github.com/repos/mizzy/walter-test/contributors",
    "subscribers_url": "https://api.github.com/repos/mizzy/walter-test/subscribers",
    "subscription_url": "https://api.github.com/repos/mizzy/walter-test/subscription",
    "commits_url": "https://api.github.com/repos/mizzy/walter-test/commits{/sha}",
    "git_commits_url": "https://api.github.com/repos/mizzy/walter-test/git/commits{/sha}",
    "comments_url": "https://api.github.com/repos/mizzy/walter-test/comments{/number}",
    "issue_comment_url": "https://api.github.com/repos/mizzy/walter-test/issues/comments{/number}",
    "contents_url": "https://api.github.com/repos/mizzy/walter-test/contents/{+path}",
    "compare_url": "https://api.github.com/repos/mizzy/walter-test/compare/{base}...{head}",
    "merges_url": "https://api.github.com/repos/mizzy/walter-test/merges",
    "archive_url": "https://api.github.com/repos/mizzy/walter-test/{archive_format}{/ref}",
    "downloads_url": "https://api.github.com/repos/mizzy/walter-test/downloads",
    "issues_url": "https://api.github.com/repos/mizzy/walter-test/issues{/number}",
    "pulls_url": "https://api.github.com/repos/mizzy/walter-test/pulls{/number}",
    "milestones_url": "https://api.github.com/repos/mizzy/walter-test/milestones{/number}",
    "notifications_url": "https://api.github.com/repos/mizzy/walter-test/notifications{?since,all,participating}",
    "labels_url": "https://api.github.com/repos/mizzy/walter-test/labels{/name}",
    "releases_url": "https://api.github.com/repos/mizzy/walter-test/releases{/id}",
    "created_at": 1429065872,
    "updated_at": "2015-04-15T02:44:32Z",
    "pushed_at": 1451742214,
    "git_url": "git://github.com/mizzy/walter-test.git",
    "ssh_url": "git@github.com:mizzy/walter-test.git",
    "clone_url": "https://github.com/mizzy/walter-test.git",
    "svn_url": "https://github.com/mizzy/walter-test",
    "homepage": null,
    "size": 2,
    "stargazers_count": 0,
    "watchers_count": 0,
    "language": null,
    "has_issues": true,
    "has_downloads": true,
    "has_wiki": true,
    "has_pages": false,
    "forks_count": 0,
    "mirror_url": null,
    "open_issues_count": 3,
    "forks": 0,
    "open_issues": 3,
    "watchers": 0,
    "default_branch": "master",
    "stargazers": 0,
    "master_branch": "master"
  },
  "pusher": {
    "name": "mizzy",
    "email": "gosukenator@gmail.com"
  },
  "sender": {
    "login": "mizzy",
    "id": 3620,
    "avatar_url": "https://avatars.githubusercontent.com/u/3620?v=3",
    "gravatar_id": "",
    "url": "https://api.github.com/users/mizzy",
    "html_url": "https://github.com/mizzy",
    "followers_url": "https://api.github.com/users/mizzy/followers",
    "following_url": "https://api.github.com/users/mizzy/following{/other_user}",
    "gists_url": "https://api.github.com/users/mizzy/gists{/gist_id}",
    "starred_url": "https://api.github.com/users/mizzy/starred{/owner}{/repo}",
    "subscriptions_url": "https://api.github.com/users/mizzy/subscriptions",
    "organizations_url": "https://api.github.com/users/mizzy/orgs",
    "repos_url": "https://api.github.com/users/mizzy/repos",
    "events_url": "https://api.github.com/users/mizzy/events{/privacy}",
    "received_events_url": "https://api.github.com/users/mizzy/received_events",
    "type": "User",
    "site_admin": false
  }
}
EOF

req = Net::HTTP::Post.new(
  '/api/v1/jobs',
  initheader = {
    'Content-Type'   => 'application/json',
    'X-Github-Event' => 'push',
  },
)

req.body = payload

res = Net::HTTP.new('localhost', '8080').start {|h| h.request(req)}

