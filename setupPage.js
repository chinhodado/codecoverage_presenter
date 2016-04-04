var search = function*(query){
    var output = yield (Rest.post({
        url: "https://activedata.allizom.org/query",
        json: query
    }));
    yield (output);
};

function setupPage() {
    // add the list of builds
    addBuild();

    // populate the query select
    var queryList = {
        0: "",
        1: "Given a test, which files does it touch?",
        2: "Given a test, which unique files does it touch?",
        3: "Given a source file, which tests touch it?",
        4: "Given a patch (list of source files and methods adjusted) recommend which tests I should run."
    };

    for (var key in queryList) {
        if (!queryList.hasOwnProperty(key)) continue;
        $("#querySelect").append("<option value='" + key + "'>" + queryList[key] + "</option>");
    }

    $("#querySelect").on('change', function (e) {
        if (this.value == "0") {
            $("#step2").hide();
        }
        else {
            $("#step2").show();
            processQuery(this.value);
        }
    });

    // use the query parameters if needed
    var buildRevision = getParameterByName("buildRevision");
    var query = getParameterByName("query");
    var select2 = getParameterByName("select2");

    if (buildRevision) {
        $("#selectBuildRevision").val(buildRevision);
    }

    if (query) {
        $("#querySelect").val(query);
    }

    if (select2) {
        $("#select2").val(select2);
    }

    if (query && select2) {
        var param = {
            "buildRevision": buildRevision,
            "select2": select2
        };
        $("#step2").show();
        processQuery(query, param, true);
    }
}