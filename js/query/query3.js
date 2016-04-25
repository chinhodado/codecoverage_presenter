/**
 * Given a source file, which tests touch it?
 */
function prepareQuery3(param) {
    addSources(param);    
}

function executeQuery3Manual() {
    var select2 = $("#select2");
    var sourceFile = select2.val();
    if (!sourceFile) return;
    var buildRevision = $("#selectBuildRevision").val();

    executeQuery3({
        "eq":{
            "source.file.name": sourceFile,
            "build.revision": buildRevision
        }
    });
}

function executeQuery3(filter) {
    showBuildInfo(filter.eq["build.revision"]);
    
    Thread.run(function*(){
        // disable inputs while query is running
        disableAll(true);

        var testFiles = yield (search({
            "limit": 10000,
            "where": filter,
            "groupby": ["test.url"],
            "from": "coverage"
        }));

        testFiles.data.sort(function(a, b) {
            return a[0].localeCompare(b[0]);
        });

        var table = "<table class='table table-condensed'><tbody>";
        testFiles.data.forEach(function(element, index, array) {
            var tokens = element[0].split("/");
            var testName = tokens[tokens.length - 1];
            var dxrLink = getDxrLink(testName);
            table += ("<tr><td><a target='_blank' href='" + dxrLink + "'>" +
                getShortenedFilePath(element[0]) + "</a></td></tr>");
        });
        table += "</tbody></table>";
        $("#resultDiv").html(table);

        showPermalink();
        $("#resultDesc").text("Tests that touch the selected source file:");

        // re-enable the inputs
        disableAll(false);
    });
}