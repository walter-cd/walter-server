function WalterServer() {

    var apiReportsUrl = "/api/v1/reports/";
    var apiProjectsUrl = "/api/v1/projects/";

    var defaultQueryParameters = {
        count: 50,
        until: '',
        since: '',
        status: '',
        projectId: ''
    };

    /**
     * Return the project build history for one or all projects
     * @param projectId
     * @param queryParameters
     * @param callback
     */
    this.getProjectHistory = function (projectId, queryParameters, callback) {

        var mergedParameters = $.extend({}, defaultQueryParameters, queryParameters, {projectId: projectId});
        var url = apiReportsUrl

        jQuery.getJSON(url,
            mergedParameters,
            function (data, status) {
                if (callback) {
                    callback(data && data.Reports ? data.Reports : null);
                }
            }
        );
    };

    /**
     * Return known projects
     *
     * @param projectNamePattern
     * @param callback
     */
    this.getProjects = function (projectNamePattern, callback) {

        var url = apiProjectsUrl;

        jQuery.getJSON(url,
            {},
            function (projects, status) {
                // sort by name
                projects.sort(function (a,b) {
                    return a.Name.localeCompare(b.Name);
                });
                callback(projects);
            }
        );
    };

}
