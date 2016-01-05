function WalterServer() {

    var apiReportsUrl = "/api/v1/reports/";
    var apiProjectsUrl = "/api/v1/projects/";

    var defaultQueryParameters = {
        count: 50,
        until: '',
        since: '',
        status: ''
    };

    this.getProjectHistory = function (projectId, queryParameters, callback) {

        var mergedParameters = $.extend({}, defaultQueryParameters, queryParameters);
        var url = apiReportsUrl + (projectId ? projectId : "");

        jQuery.getJSON(url,
            mergedParameters,
            function (data, status) {
                if (callback) {
                    callback(data && data.Reports ? data.Reports : null);
                }
            }
        );
    };

    this.getProjects = function (projectNamePattern, callback) {

        var url = apiReportsUrl; // apiProjectsUrl;

        jQuery.getJSON(url,
            {},
            function (data, status) {
                var projects = [];
                var knownProjects = {};
                if (data && data.Reports && callback) {
                    for (var i = 0; i < data.Reports.length; i++) {
                        var project = data.Reports[i].Project;
                        if (!projectNamePattern ||
                            (project.Name.toLowerCase().indexOf(projectNamePattern.toLowerCase()) != -1)) {
                            if (!knownProjects[project.Name]) {
                                projects.push(project);
                                knownProjects[project.Name] = true;
                            }
                        }
                    }
                }
                callback(projects);
            }
        );
    };

}