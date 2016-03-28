function addTests() {
    importScript(['modevlib/main.js'], function(){
        var build = $("#selectBuild").val();
        Thread.run(function*(){
            var tests = yield (search({
                "limit": 10000,
                "groupby": ["test.url"],
                "where" : {
                    "eq":{
                        "build.revision": build
                    }
                },
                "from": "coverage"
            }));

            $("#selectLabel2").text("Select a test:");
            $("#resultDesc").text("Source files touched by selected test:");
            $("#select2").empty();
            $("#select2").append("<option value=''></option>");

            tests.data.sort(function(a, b) {
                return a[0].localeCompare(b[0]);
            });
            tests.data.forEach(function(element, index, array) {
                $("#select2").append("<option value='" + element[0] + "'>" + element[0] + "</option>")
            });
        });
    });
}

function addSources() {
    importScript(['modevlib/main.js'], function(){
        var build = $("#selectBuild").val();
        Thread.run(function*(){
            var sources = yield (search({
                "limit": 10000,
                "groupby": ["source.file"],
                "where" : {
                    "eq":{
                        "build.revision": build
                    }
                },
                "from": "coverage"
            }));

            $("#selectLabel2").text("Select a source file:");
            $("#resultDesc").text("Tests that touch the selected source file:");
            $("#select2").empty();
            $("#select2").append("<option value=''></option>");

            sources.data.sort(function(a, b) {
                return a[0].localeCompare(b[0]);
            });
            sources.data.forEach(function(element, index, array) {
                $("#select2").append("<option value='" + element[0] + "'>" + element[0] + "</option>");
            });
        });
    });
}

function addBuild() {
    importScript(['modevlib/main.js'], function(){
        Thread.run(function*(){
            var sources = yield (search({
                "limit": 10000,
                "groupby": ["build.revision"],
                "from": "coverage"
            }));

            sources.data.sort(function(a, b) {
                return a[0].localeCompare(b[0]);
            });
            sources.data.forEach(function(element, index, array) {
                $("#selectBuild").append("<option value='" + element[0] + "'>" + element[0] + "</option>");
            });
        });
    });
}