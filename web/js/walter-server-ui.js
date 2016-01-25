/**
 * Create a walter server UI for the given project using the walter server reference. The UI
 * will be built in the container, or a new container created if container is null
 *
 * @param walterServer
 * @param container
 * @constructor
 */
function WalterServerUI(walterServer, container) {

    /* seconds between refreshes */
    var refreshSeconds = 12;
    /* the navigation option for the active project */
    var projectNavigatorOption;
    /* the navigation option for the active report */
    var reportNavigatorOption;
    /* the permalink button */
    var permalinkNavigatorOption;
    /* current project being shown */
    var currentProject;
    /* a handle on the refresh timer */
    var refreshTimer = 0;

    /* div templates to reduce markup-in-code and put framework dependencies closer together */
    var divTemplates = {
        "div": {classes: []},
        "inline": {classes: ["inline"]},
        "row": {classes: ["row"]},
        "row-indented": {classes: ["row double-pad-left"]},
        "row-fixed-height": {classes: ["row", "walter-row-fixed-height"]},
        "block": {classes: ["container"]},
        "url": {tag: "<a></a>"},
        "right": {classes: ["row align-right"]},
        "line": {tag: "<hr/>"},
        "report-wrapper": {},
        "report-detail": {classes: ["row double-pad-bottom"]},
        "report-heading": {classes: ["double-pad-bottom"]},
        "report-heading-text": {tag: "<h3/>", classes: ["walter-report-heading-text walter-pointer"]},
        "report-summary": {classes: ["walter-pointer "]},
        "report-summary-heading": {tag: "<h4/>", classes: ["walter-report-heading-text"]},
        "project-info": {classes: ["walter-pointer "]},
        "project-info-heading": {tag: "<h4/>", classes: ["walter-report-heading-text"]},
        "large": {tag: "<h4/>"},
        "stage": {classes: ["row pad-bottom"]},
        "substage": {classes: ["row double-pad-left pad-top"]},
        "clock-icon": {classes: ["icon-time inline", "walter-color-faded"]},
        "empty-time": {classes: ["inline"]},
        "branch-icon": {classes: ["icon-code-fork inline"]},
        "console": {
            tag: "<code/>",
            classes: ["box one whole square double-pad-top double-pad-bottom", "walter-console"]
        },
        "console-error": {
            tag: "<code/>",
            classes: ["box one whole square double-pad-top double-pad-bottom", "walter-console-error"]
        },
        "pre": {tag: "<pre/>"},
        "commits": {classes: ["square"]},
        "commit": {classes: ["row"]},
        "avatar": {classes: ["walter-avatar", "inline"]},
        "avatar-icon": {tag: "<img/>", classes: ["walter-avatar-icon"]},
        "avatar-label": {classes: ["inline"]},
        "status-passed-icon": {classes: ["icon-ok-sign success inline"]},
        "status-failed-icon": {classes: ["icon-exclamation-sign error inline"]},
        "status-running-icon": {classes: ["icon-refresh icon-spin question inline"]},
        "status-pending-icon": {classes: ["icon-time walter-color-grey inline"]},
        "status-passed": {classes: ["success inline"]},
        "status-failed": {classes: ["error inline"]},
        "status-running": {classes: ["question inline"]},
        "status-pending": {classes: ["walter-color-grey inline"]},
        "navigator": {classes: ["double-pad-bottom", "walter-navigator"]},
        "navigator-option-activity": {tag: "<h3/>", classes: ["inline", "walter-pointer"]},
        "navigator-option-projects": {tag: "<h3/>", classes: ["inline double-pad-left", "walter-pointer"]},
        "navigator-option-project": {
            tag: "<h3/>",
            classes: ["inline double-pad-left animated pulse", "walter-pointer"]
        },
        "navigator-option-report": {tag: "<h3/>", classes: ["inline pad-left animated pulse", "walter-pointer"]},
        "navigator-option-permalink": {classes: ["inline pad-left align-right icon-external-link animated fadeInDown", "walter-permalink walter-color-permalink walter-pointer"]},
        "no-results": {
            tag: "<h3/>",
            classes: ["align-center one centered mobile third double-pad-top double-pad-bottom", "walter-color-faded walter-color-grey"]
        }
    };

    // the inner block
    var block = div("block");

    /**
     * Create and style a wrapper div using the named template
     * @param templateName
     * @param [idSuffix]
     * @returns {*|jQuery}
     */
    function div(templateName, idSuffix) {
        templateName = templateName ? templateName : "div";
        var template = divTemplates[templateName];

        var id = divId(templateName, idSuffix);
        var w = $(template && template.tag ? template.tag : "<div></div>")
            .addClass(id);

        if (idSuffix) {
            $(w).attr("id", id);
        }
        if (template) {
            if (template.classes) {
                for (var i = 0; i < template.classes.length; i++) {
                    $(w).addClass(template.classes[i]);
                }
            }
            if (template.css) {
                for (var cssName in template.css) {
                    $(w).css(cssName, template.css[cssName]);
                }
            }
        }

        return w;
    }

    /**
     * Return the id for a div with the given template and optional id
     * @param templateName
     * @param [idSuffix]
     * @returns {string}
     */
    function divId(templateName, idSuffix) {
        return "walter-" + templateName + (idSuffix ? "-" + idSuffix : "");
    }

    /**
     * Populate a group (a grid row)
     * @param template
     * @param id
     * @param items
     * @returns {*|jQuery}
     */
    function group(items, template, id) {
        var w = div(template ? template : "row", id);

        for (var i = 0; i < items.length; i++) {
            $(items[i].item).addClass(items[i].width ? items[i].width : "one fourth");
            $(w).append(items[i].item);
        }

        return w;
    }

    /**
     * Populate a report build details
     * @param report
     */
    function reportDetails(report) {
        var w = div("report-detail", report.Id);

        $(w).append(reportHeader(report));

        if (report.Stages && report.Stages.length) {
            var stages = div("row");
            for (var i = 0; i < report.Stages.length; i++) {
                $(stages).append(stageContainer(report.Stages[i]));
            }
            $(w).append(stages);
        }

        return w;
    }

    /**
     * Populate a project's build summary
     * @param report
     */
    function reportSummary(report) {

        var w = div("report-summary", report.Id).on("click", function () {
            showReport(report);
        });

        var timing = div("");
        if (report.End) {
            $(timing)
                .append(humanifyTime(now() - report.Start))
                .append(" ago");
        } else {
            $(timing).append(duration(report.Start, report.End));
        }

        $(w).append(
            group([
                    {item: div("report-summary-heading").text(report.Project.Name), width: "two sixths"},
                    {
                        item: div().append(
                            status(report.Status,
                                div("inline")
                                    .append(formatReportId(report.Id) + ' ' + report.Status + ' on ')
                                    .append(div("branch-icon"))
                                    .append(" " + report.Branch))),
                        width: "two sixths"
                    },
                    {item: user(report.TriggeredBy), width: "one sixth"},
                    {item: timing, width: "one sixth align-right"}

                ],
                "row-fixed-height")
        );

        return w;
    }

    /**
     * Create a permalink
     */
    function createPermalink(options) {
        $(permalinkNavigatorOption)
            .show()
            .unbind("click")
            .bind("click", function () {
                if (options.project) {
                    var parameters = "?project=" + options.project.Name + (options.report ? "&report=" + options.report.Id : "");
                    window.prompt("Here is a direct link to this Project" + (options.report?" and Report":""),
                        window.location.origin + parameters);
                    window.location.search = parameters;
                }
            });
    }

    /**
     * Populate a project info
     * @param project
     */
    function projectInfo(project) {

        var w = div("project-info", project.Id).on("click", function () {
            $(block).empty();
            showProject(project);
        });

        $(w).append(
            group([
                {item: div("project-info-heading").text(project.Name), width: "four sixths"},
                {item: url(project.Repo), width: "two sixths align-right"}
            ])
        );

        return w;
    }

    /**
     * generate a commit section
     * @param commits
     * @returns {*|jQuery}
     */
    function commits(commits) {
        var w = div("commits");
        if (commits && commits.length) {
            for (var i = 0; i < commits.length; i++) {
                var commit = commits[i];
                $(w).append(
                    group(
                        [
                            {item: div().text(commit.Revision.substr(0, 7)), width: "one tenth"},
                            {item: div().text(commit.Author), width: "two tenths"},
                            {item: div().text(commit.Message), width: "seven tenths"}
                        ],
                        "commit",
                        commit.Id
                    ));
            }
        }
        return w;
    }

    /**
     * A staus indicator
     * @param state
     * @param [contents]
     * @returns {*|jQuery}
     */
    function status(state, contents) {
        var status;
        switch (state) {
            case "Failed":
                status = "status-failed";
                break;
            case "Passed":
                status = "status-passed";
                break;
            case "Running":
                status = "status-running";
                break;
            default:
                status = "status-pending";
                break;
        }
        return div().append(div(status + "-icon")).append(div(status).append(contents));
    }

    /**
     * Create a project report header
     * @param report
     */
    function reportHeader(report) {
        var w = div("report-heading", report.Id);

        // build status
        $(w).append(
            group([
                    {
                        item: div("report-heading-text")
                            .text(report.Project.Name)
                            .on("click", function () {
                                showProject(report.Project);
                            }),
                        width: "two thirds"
                    },
                    {item: url(report.Project.Repo), width: "one third align-right"}
                ],
                "row-fixed-height")
        );

        // LHS
        var left = div()
            .append(div("large").append(
                status(report.Status,
                    div("inline")
                        .append(formatReportId(report.Id) + ' ' + report.Status + ' on ')
                        .append(div("branch-icon"))
                        .append(" " + report.Branch)))
            )
            .append(div("url").attr("href", report.CompareUrl).text("show changes"))
            .append(commits(report.Commits));

        // RHS
        var right = div();
        if (report.End) {
            $(right).append(div("right").append(duration(report.Start, report.End)));
        }
        $(right).append(
            div("right")
                .append(humanifyTime(now() - report.Start))
                .append(" ago by ")
                .append(user(report.TriggeredBy))
        );

        $(w).append(
            group([
                    {item: left, width: "two thirds"},
                    {item: right, width: "one third"}
                ],
                "row"
            ));

        return w;
    }

    /**
     * Create a project stage container
     * @param stage
     */
    function stageContainer(stage) {
        var w = div("stage", stage.Id);

        $(w).append(
            group([
                {
                    item: status(stage.Status, " " + stage.Status + " " + stage.Name),
                    width: "one half"
                },
                {item: div().append(duration(stage.Start, stage.End)), width: "one half align-right"}
            ]))
            .append(
                div()
                    .append(div("row").append(stage.Out == "" ? "" : div("console").append(div("pre").text(stage.Out))))
                    .append(div("row").append(stage.Err == "" ? "" : div("console-error").append(div("pre").text(stage.Err))))
            );

        // add substages
        if (stage.Stages && stage.Stages.length) {
            var subStages = div("substage");
            $(w).append(subStages);
            for (var i = 0; i < stage.Stages.length; i++) {
                $(subStages).append(stageContainer(stage.Stages[i]));
            }
        }
        return w;
    }

    function navigator() {
        var w = div("navigator");

        var selectNavigator = function (me) {
            $(me).siblings().removeClass("walter-navigator-selected");
            $(me).addClass("walter-navigator-selected");
            $(projectNavigatorOption).toggle((me == projectNavigatorOption) || (me == reportNavigatorOption));
            $(reportNavigatorOption).toggle(me == reportNavigatorOption);
            $(permalinkNavigatorOption).hide();
        };

        projectNavigatorOption = div("navigator-option-project")
            .text("")
            .bind("click", function () {
                cancelRefreshTimer();
                selectNavigator(projectNavigatorOption);
                $(block).empty();

                if (currentProject) {
                    walterServer.getProjectHistory(currentProject.Id, {}, function (history) {
                        if (history) {
                            for (var i = 0; i < history.length; i++) {
                                $(block).append(reportSummary(history[i]));
                            }
                        }
                        else {
                            $(block).empty().append(
                                div("no-results").text("No build activity for this project")
                            );
                        }
                    });

                    // trap missing images
                    $('.walter-avatar-icon').error(function () {
                        $(this).attr('src', 'img/walter-default-avatar.png');
                    });

                    createPermalink({project: currentProject});
                }
            })
            .hide();

        reportNavigatorOption = div("navigator-option-report")
            .text("")
            .bind("click", function () {
                selectNavigator(reportNavigatorOption);
            })
            .hide();

        permalinkNavigatorOption = div("navigator-option-permalink")
            .attr("title", "Link to this page")
            .hide();

        $(w)
            .append(
                div("navigator-option-activity")
                    .text("Activity")
                    .bind("click", function () {
                        selectNavigator(this);
                        showActivity();
                    })
            )
            .append(
                div("navigator-option-projects")
                    .text("Projects")
                    .bind("click", function () {
                        selectNavigator(this);
                        showProjects();
                    })
            )
            .append(projectNavigatorOption)
            .append(reportNavigatorOption)
            .append(permalinkNavigatorOption)
            .append(div("line"))
        ;

        return w;
    }

    /**
     * Create an url with optional link text
     * @param href
     * @param [linkText]
     */
    function url(href, linkText) {
        return div("url").attr("href", href).text(linkText ? linkText : href);
    }

    /**
     * Create a box with a user and their picture/link
     * @param userinfo
     * @returns {*|jQuery}
     */
    function user(userinfo) {
        return div('avatar')
            .append(div("avatar-icon").attr("src", userinfo.AvatarUrl))
            .append(div('avatar-label').text(userinfo.Name));
    }

    /**
     * Return the duration between the start and end times
     * @param start
     * @param end
     * @returns {XMLList|*}
     */
    function duration(start, end) {
        if (start) {
            var w = div("inline").append(div("clock-icon"));
            end = end ? end : now();
            var delta = end - start;
            $(w).append(delta <= 0
                ? " negligible"
                : " " + humanifyTime(delta)
            );
            return w;
        }
        return div("empty-time");
    }

    /**
     * humanify a number of seconds
     */
    function humanifyTime(seconds) {
        seconds = Math.max(0, seconds);
        var weeks = Math.floor(seconds / (7 * 24 * 3600));
        if (weeks > 2) {
            return weeks + " weeks";
        }
        var days = Math.floor(seconds / (24 * 3600));
        if (days >= 1) {
            return days + " day" + (days == 1 ? "" : "s");
        }
        var hours = Math.floor(seconds / 3600);
        if (hours >= 1) {
            return hours + " hour" + (hours == 1 ? "" : "s");
        }
        var mins = Math.floor(seconds / 60);
        if (mins >= 1) {
            return mins + " minute" + (mins == 1 ? "" : "s");
        }
        if (seconds <= 5) {
            return "a moment";
        }
        return seconds + " second" + (seconds == 1 ? "" : "s");
    }

    /**
     * Format a report id
     * @param reportId
     * @returns {string}
     */
    function formatReportId(reportId) {
        var s = "000000000" + reportId;
        return " #" + s.substr(s.length - 5);
    }

    /**
     * current time in seconds
     * @returns {number}
     */
    function now() {
        return Math.floor(new Date().getTime() / 1000);
    }


    /**
     * Show build info for a specific report
     *
     * @param report
     */
    function showReport(report) {
        currentProject = report.Project;
        cancelRefreshTimer();
        $(projectNavigatorOption).text(report.Project.Name);
        $(reportNavigatorOption).text(formatReportId(report.Id)).trigger("click");
        $(block).empty().append(reportDetails(report));
        // trap missing images
        $('.walter-avatar-icon').error(function () {
            $(this).attr('src', 'img/walter-default-avatar.png');
        });

        setRefreshTimer(function () {
            showReport(report);
        });

        createPermalink({project: report.Project, report: report});
    }

    /**
     * Show build info for a specific project
     *
     * @param project
     */
    function showProject(project) {
        currentProject = project;
        cancelRefreshTimer();
        $(projectNavigatorOption).text(project.Name).trigger("click");
        setRefreshTimer(function () {
            showProject(project);
        });
    }

    /**
     *  Show available projects filtered by the optional patter
     * @param [projectNamePattern]
     */
    function showProjects(projectNamePattern) {
        cancelRefreshTimer();
        $(block).empty();
        walterServer.getProjects(projectNamePattern, function (projects) {
            if (projects && projects.length) {
                for (var i = 0; i < projects.length; i++) {
                    $(block).append(projectInfo(projects[i]));
                }
            }
            else {
                $(block).append(
                    div("no-results")
                        .text("No " + (projectNamePattern ? "matching " : "") + "walter projects found")
                );
            }
        });
    }

    /**
     * Show projects currently being built, and recent jobs
     */
    function showActivity() {
        cancelRefreshTimer();

        var days = 5;
        walterServer.getProjectHistory(
            null,
            {
                //status: "Running",
                since: now() - (days * 24 * 3600)
            },
            function (history) {
                $(block).empty();
                if (history && history.length) {
                    var addReport = function (report) {
                        $(block).append(reportSummary(report));
                    };
                    for (var i = 0; i < history.length; i++) {
                        addReport(history[i]);
                    }
                }
                else {
                    $(block).append(
                        div("no-results")
                            .text("No activity in the last " + days + " day" + (days == 1 ? "" : "s"))
                    );
                }
            });

        setRefreshTimer(showActivity);
    }

    /**
     * set the refresh timer
     * @param func
     */
    function setRefreshTimer(func) {
        cancelRefreshTimer();
        refreshTimer = setTimeout(func, refreshSeconds * 1000);
    }

    /** cancel any pending refreshes */
    function cancelRefreshTimer() {
        if (refreshTimer) {
            clearTimeout(refreshTimer);
        }
        refreshTimer = 0;
    }

    function getParameters() {
        var namedValues = {};
        var splitPoint = window.location.href.indexOf('?');
        if (splitPoint != -1) {
            var params = window.location.href.slice(splitPoint + 1).split('&');
            for (var i = 0; i < params.length; i++) {
                var param = params[i].split('=');
                namedValues[param[0]] = param[1] ? param[1] : true;
            }
        }
        return namedValues;
    }

    $(container)
        .append(navigator())
        .append(block);

    // default action
    var params = getParameters();
    if (params["project"]) {
        var project = params["project"];
        walterServer.getProjects(project, function (matches) {
            if (matches && matches.length) {
                for (var i = 0; i < matches.length; i++) {
                    if (matches[i].Name == project) {
                        var matchedProject = matches[i];
                        var reportId = params["report"];
                        if (reportId) {
                            walterServer.getProjectHistory(matchedProject.Id, {count: 1000}, function (history) {
                                if (history) {
                                    for (var j = 0; j < history.length; j++) {
                                        if (history[j].Id == reportId) {
                                            showReport(history[j]);
                                            break;
                                        }
                                    }
                                }
                            });
                        }
                        else {
                            showProject(matchedProject);
                        }
                        break;
                    }
                }
            }
        });
    }
    else if (params["projects"]) {
        $(".walter-navigator-option-projects").trigger("click");
    }
    else {
        $(".walter-navigator-option-activity").trigger("click");
    }
}