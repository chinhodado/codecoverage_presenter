/**
 * Given a test, which files does it touch?
 */
function query1() {
    addTests();

    $("#select2").on('change', function (e) {
        $("#resultTableBody").html("");
        var valueSelected = this.value;
        if (valueSelected === '') return;
        var build = $("#selectBuild").val();

        var query = {
            "limit": 10000,
            "where": {
                "eq":{
                    "test.url": valueSelected,
                    "build.revision": build
                }
            },
            "groupby": ["source.file"],
            "from": "coverage"
        };

        importScript(['modevlib/main.js'], function(){
            Thread.run(function*(){
                var sourceFiles = yield (search(query));

                sourceFiles.data.sort(function(a, b) {
                    return a[0].localeCompare(b[0]);
                });
                sourceFiles.data.forEach(function(element, index, array) {
                    $("#resultTableBody").append("<tr><td>" + element[0] + "</td></tr>")
                });
            });
        });
    });
}