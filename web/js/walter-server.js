function WalterServer() {

    this.getProjectHistory = function (projectId, callback) {
        // emulate server call
        if (callback) {
            callback(new WalterServerEmulator().getProjectJSON(projectId));
        }
    }

}