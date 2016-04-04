/**
 * Given a source file, which tests touch it?
 */
function query3() {
    addSources();

    $("#select2").on('change', function (e) {
        $("#resultTableBody").html("");
        
        var sourceFile = this.value;
        if (sourceFile === '') return;
        var buildRevision = $("#selectBuildRevision").val();

        executeQuery3({
            "eq":{
                "source.file": sourceFile,
                "build.revision": buildRevision
            }
        });
    });
}

function executeQuery3(where) {
    Thread.run(function*(){
        // disable inputs while query is running
        disableAll(true);

        var testFiles = yield (search({
            "limit": 10000,
            "where": where,
            "groupby": ["test.url"],
            "from": "coverage"
        }));

        testFiles.data.sort(function(a, b) {
            return a[0].localeCompare(b[0]);
        });
        testFiles.data.forEach(function(element, index, array) {
            var tokens = element[0].split("/");
            var testName = tokens[tokens.length - 1];
            var dxrLink = getDxrLink(testName);
            $("#resultTableBody").append("<tr><td><a href='" + dxrLink + "'>" + element[0] + "</a></td></tr>");
        });

        showPermalink();
        $("#resultDesc").text("Tests that touch the selected source file:");

        // re-enable the inputs
        disableAll(false);
    });
}