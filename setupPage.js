var search = function*(query){
    var output = yield (Rest.post({
        url: "https://activedata.allizom.org/query",
        json: query
    }));
    yield (output);
};

function setupPage() {
    // get query parameters
    var buildRevision = getParameterByName("buildRevision");
    var query = getParameterByName("query");
    var select2 = getParameterByName("select2");

    // add the list of builds
    addBuild(buildRevision);

    // populate the query select
    var queryList = {
        1: "Given a test, which files does it touch?",
        2: "Given a test, which unique files does it touch?",
        3: "Given a source file, which tests touch it?",
        4: "Given a patch (list of source files and methods adjusted) recommend which tests I should run."
    };

    var querySelect = $("#querySelect");
    for (var key in queryList) {
        if (!queryList.hasOwnProperty(key)) continue;
        querySelect.append("<option value='" + key + "'>" + queryList[key] + "</option>");
    }

    querySelect.on('change', function (e) {
        $("#step2").show();
        processQuery(this.value);
    });

    if (query) {
        querySelect.val(query);
    }

    // loaded from permalink, process query directly
    if (query && select2) {
        usePermalinkFlag = true;
        var param = {
            "buildRevision": buildRevision,
            "select2": select2
        };
        $("#step2").show();
        processQuery(query, param, true);
    }
}