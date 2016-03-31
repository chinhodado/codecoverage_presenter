/**
 * Given a test, which unique files does it touch?
 */
function query2() {
    addTests();

    $("#select2").on('change', function (e) {
        $("#resultTableBody").html("");

        var test = this.value;
        if (test === '') return;
        var buildRevision = $("#selectBuildRevision").val();

        executeQuery2({
            "test": test,
            "buildRevision": buildRevision
        });
    });
}

function executeQuery2(param) {
    var test = param.test;
    var buildRevision = param.buildRevision; 
    importScript(['modevlib/main.js'], function(){
        Thread.run(function*(){
            // disable inputs while query is running
            disableAll(true);

            // get source files covered by test
            var sources = yield (search({
                "from": "coverage",
                "where": {
                    "eq": {
                        "test.url": test,
                        "build.revision": buildRevision
                    }
                },
                "groupby": [
                    {"name": "source", "value": "source.file"}
                ],
                "limit": 100000,
                "format": "list"
            }));

            // for each file, find number of other tests
            var siblings = yield (search({
                // find test that cover the same
                "from": "coverage",
                "select": {"name": "tests", "value": "test.url", "aggregate": "union"},
                "where": {
                    "in": {
                        "source.file": sources.data.select("source")
                    }
                    // TODO: do we need to specify build revision here?
                },
                "groupby": [
                    {"name": "source", "value": "source.file"}
                ],
                "limit": 100000,
                "format": "list"
            }));
            siblings.data = qb.sort(siblings.data, "tests.length");

            // remove self
            siblings.data.forall(function(v){
                v.tests.remove(test);
            });

            showPermalink();
            $("#resultDesc").text("Unique source files touched by selected test:");

            siblings.data.forEach(function(element, index, array) {
                if (element.tests.length > 0) return;
                $("#resultTableBody").append("<tr><td>" + element.source + "</td></tr>")
            });

            // re-enable the inputs
            disableAll(false);
        });
    });
}
