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
            "where": where,
            "limit": 10000
        }));

        var data = testFiles.data;

        // get set of lines covered by at least one test
        var coveredSet = new Set();
        for (let i = 0; i < data["source.file.covered"].length; i++) {
            // avoid an array check
            let covered = [].concat(data["source.file.covered"][i]);
            for (let j = 0; j < covered.length; j++) {
                coveredSet.add(covered[j].line);
            }
        }

        // get set of lines isn't covered by any one test
        var uncoveredSet = new Set();
        for (let i = 0; i < data["source.file.uncovered"].length; i++) {
            // avoid an array check
            let uncovered = [].concat(data["source.file.uncovered"][i]);
            for (let j = 0; j < uncovered.length; j++) {
                if (!coveredSet.has(uncovered[j].line)) {
                    uncoveredSet.add(uncovered[j].line);
                }
            }
        }

        var total_percentage = (coveredSet.size / (coveredSet.size + uncoveredSet.size) * 100).toFixed(2);
        var total_pct_p = `<p>Total coverage percentage for all tests: ${total_percentage}%</p>`;

        // table for percentage covered broken down by tests
        var table = "<p>Broken down by tests: </p>" +
            "<table><thead><tr><th>Test</th><th>Coverage percentage by test</th></tr></thead><tbody>";
        for (let i = 0; i < data["test.url"].length; i++) {
            var tokens = data["test.url"][i].split("/");
            var testName = tokens[tokens.length - 1];
            var dxrLink = getDxrLink(testName);
            table += ("<tr>" +
            "<td><a target='_blank' href='" + dxrLink + "'>" + getShortenedFilePath(data["test.url"][i]) + "</a></td>" +
            "<td>" + (+data["source.file.percentage_covered"][i] * 100).toFixed(2) + "%</td>" + "</tr>");
        }
        table += "</tbody></table>";
        var html = total_pct_p + table;
        $("#resultDiv").html(html);

        showPermalink();
        $("#resultDesc").text("Coverage detail for selected source file:");

        // dxr
        var source = data["source.file.name"][0];
        tokens = source.split("/");
        var sourceName = tokens[tokens.length - 1];
        getSingleDxrLink(sourceName, function(link) {
            var postfix = Array.from(coveredSet).join(",");
            var finalLink = link + "#" + postfix;
            var p = `<p>View source on DXR with covered lines highlighted: <a href="${finalLink}">Link</a></p>`;
            $("#resultDiv").prepend(p);
        },
        function(results) {
            var warn = `<p>WARNING: there are multiple result when searching for ${source} on dxr. 
                        Using the first result, but it may not be accurate!</p>`;
            $("#resultDiv").prepend(warn);
        });

        // re-enable the inputs
        disableAll(false);
    });
}