function WalterServer() {

    this.getProjectHistory = function (projectId, callback) {
        jQuery.getJSON("/api/v1/reports",
            {
                projectId: projectId,
                maxId: 100000
            },
            function (data, status) {
                if (data && data.Reports && callback) {
                    callback(data.Reports);
                }
            }
        );
    }

}