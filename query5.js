/**
 * Given a source file, what is the coverage detail for it?
 */
function prepareQuery5(param) {
    addSources(param);
}

function executeQuery5Manual() {
    var select2 = $("#select2");
    var sourceFile = select2.val();
    if (!sourceFile) return;
    var buildRevision = $("#selectBuildRevision").val();

    executeQuery5({
        "and":[
            {"missing": "source.method.name"},
            {"eq":{
                "source.file.name": sourceFile,
                "build.revision": buildRevision
            }}
        ]
    });
}

function executeQuery5(where) {
    Thread.run(function*(){
        // disable inputs while query is running
        disableAll(true);

        var testFiles = yield (search({
            "select":[
                "test.url",
                "source.file.name",
                "source.file.covered",
                "source.file.uncovered",
                "source.file.total_covered",
                "source.file.total_uncovered",
                "source.file.percentage_covered"
            ],
            "from": "coverage",
            "where": where
        }));

        var data = testFiles.data;
        $("#resultTableBody").append("<tr><td>Test</td><td>Coverage percentage by test</td></tr>");
        for (var i = 0; i < data["test.url"].length; i++) {
            var tokens = data["test.url"][i].split("/");
            var testName = tokens[tokens.length - 1];
            var dxrLink = getDxrLink(testName);
            $("#resultTableBody").append("<tr>" +
                "<td><a target='_blank' href='" + dxrLink + "'>" + getShortenedFilePath(data["test.url"][i]) + "</a></td>" +
                "<td>" + (+data["source.file.percentage_covered"][i] * 100).toFixed(2) + "%</td>" + "</tr>");
        }

        showPermalink();
        $("#resultDesc").text("Coverage detail for selected source file:");

        // re-enable the inputs
        disableAll(false);
    });
}