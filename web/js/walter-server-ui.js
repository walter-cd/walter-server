/**
 * Create a walter server UI for the given project using the walter server reference. The UI
 * will be built in the container, or a new container created if container is null
 *
 * @param walterServer
 * @param projectId
 * @param container
 * @constructor
 */
function WalterServerUI(walterServer, projectId, container) {

    /* seconds between refreshes */
    var refreshSeconds = 5;

    /* tracks which projects are showing details */
    var showProjectDetails = {};
    /* tracks which projects are showDetails */
    var showProjectExpanded = {};

    /* div templates to reduce markup-in-code and put framework dependencies closer together */
    var divTemplates = {
        "div": {classes: []},
        "inline": {classes: ["inline"]},
        "row": {classes: ["row"]},
        "row-indented": {classes: ["row double-pad-left"]},
        "block": {classes: ["container"]},
        "url": {tag: "<a></a>"},
        "right": {classes: ["row align-right"]},
        "vertical-space": {tag: "<hr/>"},
        "indented": {classes: ["double-pad-left"]},
        "project-wrapper": {},
        "project-detail": {classes: ["row double-pad-bottom"]},
        "project-header": {classes: ["pad-bottom"]},
        "project-heading": {tag: "<h4/>", classes: ["walter-project-heading walter-pointer"]},
        "project-summary": {classes: ["walter-pointer "]},
        "project-summary-heading": {tag: "<h4/>", classes: ["walter-project-heading"]},
        "large": {tag: "<h4/>"},
        "stage": {classes: ["row"]},
        "clock-icon": {classes: ["icon-time inline", "walter-color-faded"]},
        "empty-time": {classes: ["inline"]},
        "branch-icon": {classes: ["icon-code-fork inline"]},
        "console": {tag: "<code/>", classes: ["box one whole square", "walter-console"]},
        "console-error": {tag: "<code/>", classes: ["box one whole square", "walter-console-error"]},
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
        "collapsible": {},
        "collapser": {classes: ["icon-chevron-right inline info walter-pointer"]}
    };

    // the inner block
    var block;

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
     * A div that wraps a summary and detail project display
     * @param project
     */
    function projectWrapper(project) {

        var w = div("project-wrapper", project.Id);

        if (showProjectExpanded[project.Id] == undefined) {
            showProjectExpanded[project.Id] = false;
        }

        var expanded = showProjectExpanded[project.Id] == true;

        $(w).append(projectSummary(project).toggle(!expanded));
        $(w).append(projectDetail(project, showProjectDetails[project.Id]).toggle(expanded));

        return w;
    }


    /**
     * Populate a project details div
     * @param project
     * @param [showDetails]
     */
    function projectDetail(project, showDetails) {
        var w = div("project-detail", project.Id);

        $(w).append(projectHeader(project));
        if (project.Stages && project.Stages.length) {
            $(w).append(div("right").append(collapser(project.Id, $(w), showDetails)));
            var stages = div("row-indented");
            for (var i = 0; i < project.Stages.length; i++) {
                $(stages).append(stageContainer(project.Stages[i], showDetails));
            }
            $(w).append(stages);
        }

        return w;
    }

    /**
     * Populate a project summary
     * @param project
     */
    function projectSummary(project) {

        var w = div("project-summary", project.Id).on("click", function () {
            toggleProject($(this).parent(), project.Id)
        });

        var timing = div("");
        if (project.End) {
            $(timing)
                .append(humanifyTime(now() - project.Start))
                .append(" ago");
        } else {
            $(timing).append(duration(project.Start, project.End));
        }

        $(w).append(
            group([
                {item: div("project-summary-heading").text(project.Project), width: "two sixths"},
                {
                    item: div().append(
                        status(project.Status,
                            div("inline")
                                .append(" #" + project.Id + ' ' + project.Status + ' on ')
                                .append(div("branch-icon"))
                                .append(" " + project.Branch))),
                    width: "two sixths"
                },
                {item: user(project.TriggeredBy), width: "one sixth"},
                {item: timing, width: "one sixth align-right"}

            ])
        );

        return w;
    }

    /**
     * Expand/collapse a project node
     * @parma projectId
     */
    function toggleProject(div, projectId) {
        showProjectExpanded[projectId] = showProjectExpanded[projectId] ? false : true;

        var summary = $(div).find("#" + divId("project-summary", projectId));
        var details = $(div).find("#" + divId("project-detail", projectId));
        $(summary).toggle(!showProjectExpanded[projectId]);
        $(details).toggle(showProjectExpanded[projectId]);
    }

    function toggleProjects(expand) {
        for (var projectId in showProjectExpanded) {
            if (showProjectExpanded[projectId] != expand) {
                var div = $(block).find("#" + divId("project-wrapper", projectId));
                toggleProject(div, projectId);
            }
        }
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
                            {item: div().text(commit.Revision), width: "one tenth"},
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
     * Create a project header
     * @param project
     */
    function projectHeader(project) {
        var w = div("project-header", project.Id);

        // build status
        $(w).append(
            group([
                {
                    item: div("project-heading")
                        .text(project.Project)
                        .on("click", function () {
                            toggleProject($(w).parent().parent(), project.Id)
                        }),
                    width: "two thirds"
                },
                {item: url(project.Repo), width: "one third align-right"}
            ])
        );


        // LHS
        var left = div()
            .append(div("large").append(
                status(project.Status,
                    div("inline")
                        .append(" #" + project.Id + ' ' + project.Status + ' on ')
                        .append(div("branch-icon"))
                        .append(" " + project.Branch)))
            )
            .append(div("url").attr("href", project.CompareUrl).text("show changes"))
            .append(commits(project.Commits));

        // RHS
        var right = div();
        if (project.End) {
            $(right).append(div("right").append(duration(project.Start, project.End)));
        }
        $(right).append(
            div("right")
                .append(humanifyTime(now() - project.Start))
                .append(" ago by ")
                .append(user(project.TriggeredBy))
        );

        $(w).append(
            group([
                    {item: left, width: "two thirds"},
                    {item: right, width: "one third"}
                ],
                "row-indented"
            ));

        return w;
    }

    /**
     * Create a project stage container
     * @param stage
     * @param [showDetails]
     */
    function stageContainer(stage, showDetails) {
        var w = div("stage", stage.Id);

        $(w).append(
            group([
                {
                    item: status(stage.Status, " " + stage.Status + " " + stage.Name),
                    width: "one half"
                },
                {item: div().append(duration(stage.Start, stage.End)), width: "one half align-right"}
            ]))
            .append(collapsible(
                div()
                    .append(div("row").append(stage.Out == "" ? "" : div("console").append(div("pre").text(stage.Out))))
                    .append(div("row").append(stage.Err == "" ? "" : div("console-error").append(div("pre").text(stage.Err)))),
                showDetails
            ));

        // add substages
        if (stage.Stages && stage.Stages.length) {
            var subStages = div("indented");
            $(w).append(subStages);
            for (var i = 0; i < stage.Stages.length; i++) {
                $(subStages).append(stageContainer(stage.Stages[i], showDetails));
            }
        }
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
     * a button that will toggle the visiblilty of all collapsible children
     */
    function collapser(projectID, parent, showDetails) {
        showProjectDetails[projectID] = showDetails == true;
        return div("collapser")
            .toggleClass("rotate-90", showDetails == true)
            .on("click", function () {
                showProjectDetails[projectID] = !showProjectDetails[projectID];
                var details = showProjectDetails[projectID];
                $(this).toggleClass("rotate-90", details);
                $(parent).find(".walter-collapsible").toggle(details);
            });
    }

    /**
     * Return a collapsible div with the given content
     * @param content
     * @param [showDetails]
     */
    function collapsible(content, showDetails) {
        var w = div("collapsible");
        $(w).append(content).toggle(showDetails == true);
        return w;
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


    function now() {
        return Math.floor(new Date().getTime() / 1000);
    }


    /**
     * Refresh data from the server
     */
    function refresh() {
        walterServer.getProjectHistory(projectId, function (history) {
            // iterate through projects
            for (var i = 0; i < history.length; i++) {

                var existingWrapper = $("#" + divId("project-wrapper", history[i].Id));
                var newWrapper = projectWrapper(history[i]);

                // if the wrapper already exists, merge the new content, else append it
                if ($(existingWrapper).length > 0) {
                    $(existingWrapper).replaceWith(newWrapper);
                }
                else {
                    $(block).append(newWrapper);
                }
            }
        });

        // trap missing images
        $('.walter-avatar-icon').error(function () {
            $(this).attr('src', 'img/walter-default-avatar.png');
        });

        setTimeout(refresh, refreshSeconds * 1000);
    }

    /**
     * Bind specific classes and ids to UI functions
     */
    function bindControls() {
        $(".walter-expand-all").on("click", function () {
            toggleProjects(true);
        });
        $(".walter-collapse-all").on("click", function () {
            toggleProjects(false);
        });
    }

    // intialize the container
    block = div("block");
    $(container).append(block);

    // bind controls
    bindControls();

    // refresh now
    refresh();

}