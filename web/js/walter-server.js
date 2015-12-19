function WalterServer() {

    this.walterServer = new WalterServerEmulator();
    this.getProjectHistory = function (projectId, callback) {
        var json = this.walterServer.getProjectJSON(projectId);
        // emulate server call
        if (callback) {
            callback(json);
        }
    }

}