function WalterServerEmulator() {

    // pretend to get some project history
    this.getProjectJSON = function (projectId) {
        return projectHistory;
    };

    var outExample1 = '12:24:00  INFO Pipeline file path: "./pipeline.yml"\n' +
        '12:24:00  WARN failed to read the configuration file\n' +
        '12:24:00  INFO kettle places on heating element\n' +
        '12:24:00  INFO a bit of steam visible\n' +
        '12:24:00  WARN getting a little hot now\n' +
        '12:24:00  WARN loud whistling sounds\n' +
        '12:24:00 ERROR open ./pipeline.yml: no such file or directory\n' +
        '12:24:00 ERROR failed to create Walter\n' ;
    var outExample2 = '12:24:00  INFO this info message is to test the INFO message level"\n' ;

    // template of one build history element
    var jsonTemplate =
    {
        ID: 123,
        Project: "walter-cd/walter-server",
        Status: "Passed",
        Start: 1449062903,
        End: 1449062940,
        Repo: "github.com/walter-cd/walter-server",
        Branch: "master",
        Commits: [
            //{ID: 123, Revision: "203", Author: "gerryhocks", Message: "Some changes"},
        ],
        Stages: [
            {
                ID: 123,
                Name: "command_stage_1",
                Status: "Passed",
                Start: 1449062903,
                End: 1449062920,
                Out: outExample1,
                Err: "",
                Stages: []
            },
            {
                ID: 123,
                Name: "build_thing",
                Status: "Passed",
                Start: 1449062903,
                End: 1449062940,
                Out: outExample2,
                Err: "",
                Stages: [
                    {
                        ID: 123,
                        Name: "build_thing_substage_1",
                        Status: "Passed",
                        Start: 1449062903,
                        End: 1449062923,
                        Out: "",
                        Err: "bash: foobar: command not found...",
                        Stages: []
                    }
                ]
            },
            {
                ID: 123,
                Name: "package_product",
                Status: "Passed",
                Start: 1449062903,
                End: 1449062920,
                Out: "",
                Err: "",
                Stages: []
            },
        ],
        CompareUrl: "http://compare.url/",
        TriggeredBy: {
            Name: "gerryhocks",
            Url: "http://someplace.com/",
            AvatarUrl: ""
        }
    };

    // emulated project history
    var projectHistory = [];

    function pick(items) {
        return items[Math.floor(Math.random() * items.length)];
    }

    // randomize/pertubate some history
    var now = Math.floor(new Date().getTime() / 1000);
    var startTime = now - (5 * 24 * 60 * 60);

    var revision = 102;
    var id = 1000;

    var historyCount = 20;
    var timeDelta = (now - startTime) / (historyCount+1);

    var addHistoryItem = function (running) {
        var history = $.extend(true, {}, jsonTemplate, {});

        var commitCount = Math.floor(Math.random() * 3) + 1;
        for (var j = 0; j < commitCount; j++) {
            history.Commits.push({
                ID: id++,
                Revision: revision++,
                Author: pick(["mizzy", "takahi-i", "cmoen", "gerryhocks"]),
                Message: pick(["Some changes", "Fixing previous errors", "Added new feature", "Updated documentation"])
            });
            history.TriggeredBy.Name = pick(["mizzy", "takahi-i", "cmoen", "gerryhocks"]);
        }

        var passed = Math.random() > 0.45;

        var duration1 = Math.floor(Math.random() * 900);
        var duration2 = Math.floor(Math.random() * 800);

        history.ID = id++;
        history.Project = pick(["walter-cd/walter-server","walter-cd/walter","redpen-cc/redpen"]);
        history.Branch = pick(["master","next-gen","alpha"]);

        history.TriggeredBy.AvatarUrl = pick([
            "https://www.gravatar.com/avatar/0d5d8fb9cc4c06f581825f5a61d3f5f1?s=40&d=https%3A%2F%2Fcdn.travis-ci.org%2Fimages%2Fui%2Fdefault-avatar-8858bcb0a9092769e6a0f5345b1c1ef9.png",
            "notthere.com",
            "http://images2.fanpop.com/images/photos/6000000/Donald-Duck-donald-duck-6042600-500-533.jpg"
        ]);

        history.Status = running ? "Running" : ( passed ? "Passed" : "Failed");

        history.Start = startTime;
        history.End = running?now:startTime + duration1 + duration2;

        history.Stages[0].ID = id++;
        history.Stages[0].Start = startTime;
        history.Stages[0].End = startTime + duration1;
        history.Stages[1].Start = history.Stages[0].End;
        history.Stages[1].End = running ? 0 : history.End;
        history.Stages[1].Status = running ? "Running" : ( passed ? "Passed" : "Failed");
        history.Stages[2].Start = 0;
        history.Stages[2].End = 0;
        history.Stages[2].Status = "Pending";
        history.Stages[1].Stages[0].ID = id++;
        history.Stages[1].Stages[0].Start = history.Stages[1].Start;
        history.Stages[1].Stages[0].End = running ? 0 : history.Stages[1].End;
        history.Stages[1].Stages[0].Status = running ? "Running" : ( passed ? "Passed" : "Failed");

        startTime += timeDelta + Math.floor(Math.random() * 900);
        projectHistory.push(history);
    };
    for (var i = 0; i < 20; i++) {
        addHistoryItem(false);
    }
    addHistoryItem(true);
    projectHistory.reverse();
}