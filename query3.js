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
            "sourceFile": sourceFile,
            "buildRevision": buildRevision
        });
    });
}

function executeQuery3(param) {
    var sourceFile = param.sourceFile;
    var buildRevision = param.buildRevision;
        
    importScript(['modevlib/main.js'], function(){
        Thread.run(function*(){
            // disable inputs while query is running
            disableAll(true);

            var testFiles = yield (search({
                "limit": 10000,
                "where": {
                    "eq":{
                        "source.file": sourceFile,
                        "build.revision": buildRevision
                    }
                },
                "groupby": ["test.url"],
                "from": "coverage"
            }));

            testFiles.data.sort(function(a, b) {
                return a[0].localeCompare(b[0]);
            });
            testFiles.data.forEach(function(element, index, array) {
                $("#resultTableBody").append("<tr><td>" + element[0] + "</td></tr>")
            });

            showPermalink();
            $("#resultDesc").text("Tests that touch the selected source file:");

            // re-enable the inputs
            disableAll(false);
        });
    });
}