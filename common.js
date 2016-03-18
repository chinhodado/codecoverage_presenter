function addTests() {
    importScript(['modevlib/main.js'], function(){
        Thread.run(function*(){
            var tests = yield (search({
                "limit": 10000,
                "groupby": ["test.url"],
                "from": "coverage"
            }));

            $("#selectLabel2").text("Select a test:");
            $("#resultDesc").text("Source files touched by selected test:");
            $("#select2").empty();
            $("#select2").append("<option value=''></option>");
            tests.data.forEach(function(element, index, array) {
                $("#select2").append("<option value='" + element[0] + "'>" + element[0] + "</option>")
            });
        });
    });
}

function addSources() {
    importScript(['modevlib/main.js'], function(){
        Thread.run(function*(){
            var sources = yield (search({
                "limit": 10000,
                "groupby": ["source.file"],
                "from": "coverage"
            }));

            $("#selectLabel2").text("Select a source file:");
            $("#resultDesc").text("Tests that touch the selected source file:");
            $("#select2").empty();
            $("#select2").append("<option value=''></option>");
            sources.data.forEach(function(element, index, array) {
                $("#select2").append("<option value='" + element[0] + "'>" + element[0] + "</option>");
            });
        });
    });
}