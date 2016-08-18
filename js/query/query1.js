/**
 * Given a test, which files does it touch and what is the relevancy?
 */
function prepareQuery1(param) {
    addTests(param);
}

function executeQuery1Manual() {
    var select2 = $("#select2");
    var test = select2.val();
    if (!test) return;
    var buildRevision = $("#selectBuildRevision").val();

    executeQuery1({
        "eq": {
            "test.url": test,
            "build.revision": buildRevision
        }
    });
}

function executeQuery1(filter) {
    showBuildInfo(filter.eq["build.revision"]);

    var query = {
        "from": "coverage-summary",
        "where": {
            "and": [
                filter,
                {"missing": "source.method.name"}
            ]
        },
        "limit": 10000,
        "select": {
            "name": "max_score",
            "value": "source.file.score",
            "aggregate": "maximum"
        },
        "groupby": ["source.file.name"]
    };

    Thread.run(function*(){
        // disable inputs while query is running
        disableAll(true);

        var sourceFiles = yield (search(query));

        sourceFiles.data.sort(function(a, b) {
            return a[0].localeCompare(b[0]);
        });

        var table = "<table id='resultTable' class='table table-condensed tablesorter'><thead><tr><th>Source file</th><th>Relevancy</th></tr></thead><tbody>";
        sourceFiles.data.forEach(function(element, index, array) {
            if (!isTest(element[0])) {
                var tokens = element[0].split("/");
                var sourceName = tokens[tokens.length - 1];
                var dxrLink = getDxrLink(sourceName);
                var rowClass = element[1] >= 0.7? "style='font-weight:bold'" : "";
                table += (`<tr ${rowClass}><td><a target='_blank' href='${dxrLink}'>${element[0]}</a></td><td>${element[1]}</td></tr>`);
            }
        });
        table += "</tbody></table>";
        $("#resultDiv").html(table);

        $("#resultTable").tablesorter({sortList: [[1,1]]});

        showPermalink();
        $("#resultDesc").text("Source files touched by selected test:");

        // re-enable the inputs
        disableAll(false);
    });
}
