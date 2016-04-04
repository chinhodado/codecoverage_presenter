/**
 * Given a test, which files does it touch?
 */
function query1() {
    addTests();

    $("#select2").on('change', function (e) {
        $("#resultTableBody").html("");
        
        var test = this.value;
        if (test === '') return;
        var buildRevision = $("#selectBuildRevision").val();

        executeQuery1({
            "eq": {
                "test.url": test,
                "build.revision": buildRevision
            }
        });
    });
}

function executeQuery1(where) {
    var query = {
        "limit": 10000,
        "where": where,
        "groupby": ["source.file"],
        "from": "coverage"
    };

    Thread.run(function*(){
        // disable inputs while query is running
        disableAll(true);

        var sourceFiles = yield (search(query));

        sourceFiles.data.sort(function(a, b) {
            return a[0].localeCompare(b[0]);
        });
        sourceFiles.data.forEach(function(element, index, array) {
            var tokens = element[0].split("/");
            var sourceName = tokens[tokens.length - 1];
            var dxrLink = getDxrLink(sourceName);
            $("#resultTableBody").append("<tr><td><a target='_blank' href='" + dxrLink + "'>" + element[0] + "</a></td></tr>");
        });

        showPermalink();
        $("#resultDesc").text("Source files touched by selected test:");

        // re-enable the inputs
        disableAll(false);
    });
}