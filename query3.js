/**
 * Given a source file, which tests touch it?
 */
function query3() {
    addSources();

    $("#select2").on('change', function (e) {
        $("#resultTableBody").html("");
        var valueSelected = this.value;
        if (valueSelected === '') return;
        var build = $("#selectBuild").val();

        importScript(['modevlib/main.js'], function(){
            Thread.run(function*(){
                var testFiles = yield (search({
                    "limit": 10000,
                    "where": {
                        "eq":{
                            "source.file": valueSelected,
                            "build.revision": build
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
            });
        });
    });
}