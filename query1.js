function query1() {
    addTests();

    $("#select2").on('change', function (e) {
        $("#resultTableBody").html("");
        var valueSelected = this.value;
        if (valueSelected === '') return;
        importScript(['modevlib/main.js'], function(){
            Thread.run(function*(){
                var sourceFiles = yield (search({
                    "limit": 10000,
                    "where": {"eq":{"test.url": valueSelected}},
                    "groupby": ["source.file"],
                    "from": "coverage"
                }));

                sourceFiles.data.forEach(function(element, index, array) {
                    $("#resultTableBody").append("<tr><td>" + element[0] + "</td></tr>")
                });
            });
        });
    });
}