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

    /* div templates to reduce markup-in-code and put framework dependencies closer together */
    var divTemplates = {
        "div": {classes: []},
        "inline": {classes: ["inline"]},
        "row": {classes: ["row"]},
        "block": {classes: ["container"]},
        "url": {tag: "<a></a>"},
        "right": {classes: ["row align-right"]},
        "vertical-space": {tag: "<hr/>"},
        "indented": {classes: ["double-pad-left"]},
        "project": {classes: ["row pad-top double-pad-bottom"]},
        "project-header": {classes: ["pad-bottom"]},
        "project-heading": {tag: "<h2/>", classes: ["walter-project-heading"]},
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
        "status-pending-icon": {classes: ["icon-time alert inline"]},
        "status-passed": {classes: ["success inline"]},
        "status-failed": {classes: ["error inline"]},
        "status-running": {classes: ["question inline"]},
        "status-pending": {classes: ["alert inline"]},
        "collapsible": {},
        "collapser": {classes: ["icon-chevron-right inline info"]}
    };

    // the inner block
    var block;

    /**
     * Create and style a wrapper div using the named template
     * @param templateName
     * @param idSuffix
     * @returns {*|jQuery}
     */
    function div(templateName, idSuffix) {
        templateName = templateName ? templateName : "div";
        var template = divTemplates[templateName];
        var w = $(template && template.tag ? template.tag : "<div></div>")
            .addClass("walter-" + templateName + (idSuffix ? "-" + idSuffix : ""));
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
     * Populate a project container
     * @param project
     */
    function projectContainer(project) {
        var w = div("project", project.ID);
        $(w).append(projectHeaderContainer(project));

        if (project.Stages && project.Stages.length) {
            $(w).append(div("right").append(collapser($(w))))
            for (var i = 0; i < project.Stages.length; i++) {
                $(w).append(stageContainer(project.Stages[i]));
            }
        }
        $(w).append(div('vertical-space'));

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
                            {item: div().text(commit.Revision), width: "one tenth"},
                            {item: div().text(commit.Author), width: "two tenths"},
                            {item: div().text(commit.Message), width: "seven tenths"}
                        ],
                        "commit",
                        commit.ID
                    ));
            }
        }
        return w;
    }

    /**
     * A staus indicator
     * @param state
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
    function projectHeaderContainer(project) {
        var w = div("project-header", project.ID);

        // build status
        $(w).append(
            group([
                {item: div("project-heading").text(project.Project), width: "two thirds"},
                {item: url(project.Repo), width: "one third align-right"}
            ])
        );


        // LHS
        var left = div()
            .append(div("large").append(
                status(project.Status,
                    div("inline")
                        .append(" #" + project.ID + ' ' + project.Status + ' on ')
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
                ]
            ));

        return w;
    }

    /**
     * Create a project stage container
     * @param stage
     */
    function stageContainer(stage) {
        var w = div("stage", stage.ID);

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
                    .append(div("row").append(stage.Err == "" ? "" : div("console-error").append(div("pre").text(stage.Err))))
            ));

        // add substages
        if (stage.Stages && stage.Stages.length) {
            var subStages = div("indented");
            $(w).append(subStages);
            for (var i = 0; i < stage.Stages.length; i++) {
                $(subStages).append(stageContainer(stage.Stages[i]));
            }
        }
        return w;
    }

    /**
     * Create an url with optional link text
     * @param href
     * @param linkText
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
    function collapser(parent) {
        return div("collapser").on("click", function () {
            $(this).toggleClass("rotate-90");
            $(parent).find(".walter-collapsible").toggle();
        });
    }

    /**
     * Return a collapsible div with the given content
     * @param content
     */
    function collapsible(content) {
        var w = div("collapsible");
        $(w).append(content).hide();
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
                $(block).append(projectContainer(history[i]));
            }
        });
    }

    // intialize the container
    block = div("block");
    $(container).append(block);

    // refresh now
    refresh();

    // trap missing images
    $('.walter-avatar-icon').error(function () {
       $(this).attr('src', 'img/walter-default-avatar.png');
    });
}