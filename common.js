// global variables
var usePermalinkFlag = false;

function addTests(param) {
    var buildRevision = $("#selectBuildRevision").val();
    Thread.run(function*(){
        var tests = yield (search({
            "limit": 10000,
            "groupby": ["test.url"],
            "where" : {
                "eq":{
                    "build.revision": buildRevision
                }
            },
            "from": "coverage"
        }));

        $("#selectLabel2").text("Select a test:");
        $("#resultDesc").text("");
        var select2 = $("#select2");
        select2.empty();

        tests.data.sort(function(a, b) {
            return a[0].localeCompare(b[0]);
        });
        tests.data.forEach(function(element, index, array) {
            select2.append("<option value='" + element[0] + "'>" + getShortenedFilePath(element[0]) + "</option>")
        });
        select2.filterByText($("#select2Filter"), false);

        if (param) {
            select2.val(param.select2);
        }
    });
}

function addSources(param) {
    var buildRevision = $("#selectBuildRevision").val();
    Thread.run(function*(){
        var sources = yield (search({
            "limit": 10000,
            "groupby": ["source.file"],
            "where" : {
                "eq":{
                    "build.revision": buildRevision
                }
            },
            "from": "coverage"
        }));

        $("#selectLabel2").text("Select a source file:");
        $("#resultDesc").text("");
        var select2 = $("#select2");
        select2.empty();

        sources.data.sort(function(a, b) {
            return a[0].localeCompare(b[0]);
        });
        sources.data.forEach(function(element, index, array) {
            select2.append("<option value='" + element[0] + "'>" + getShortenedFilePath(element[0]) + "</option>");
        });
        select2.filterByText($("#select2Filter"), false);

        if (param) {
            select2.val(param.select2);
        }
    });
}

/**
 * Populate the list of build revisions
 * @param buildRevision If set (e.g. coming from permalink), this will be used as the value
 *                      of the select after populating it.
 */
function addBuild(buildRevision) {
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
            $("#selectBuildRevision").append("<option value='" + element[0] + "'>" + element[0] + "</option>");
        });

        if (buildRevision) {
            $("#selectBuildRevision").val(buildRevision);
        }
    });
}

/**
 * Disable or enable all inputs
 * @param isDisabled true to disable all, false to enable all
 */
function disableAll(isDisabled) {
    $("#selectBuildRevision").prop('disabled', isDisabled);
    $("#querySelect").prop('disabled', isDisabled);
    $("#select2").prop('disabled', isDisabled);
    $("#submitButton").prop('disabled', isDisabled);
}

function showPermalink() {
    var permalink = window.location.href.split('?')[0] + "?" + getUrlQueryString();
    $("#permalink").text(permalink);
}

function getUrlQueryString() {
    if (usePermalinkFlag) {
        var buildRevision = getParameterByName("buildRevision");
        var query = getParameterByName("query");
        var select2 = getParameterByName("select2");
        usePermalinkFlag = false;
    }
    else {
        buildRevision = $("#selectBuildRevision").val();
        query = $("#querySelect").val();
        select2 = $("#select2").val();
    }

    var param = {
        "buildRevision": buildRevision,
        "query": query,
        "select2": select2
    };
    return encodeQueryData(param);
}

function encodeQueryData(data) {
    var ret = [];
    for (var d in data)
        ret.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));
    return ret.join("&");
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)", "i"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function processQuery(queryId, param, executeDirectly) {
    // TODO: clean up this ugly mess
    if (queryId == "1") {
        prepareQuery1(param);
        if (executeDirectly) {
            executeQuery1({
                "eq": {
                    "test.url": param.select2,
                    "build.revision": param.buildRevision
                }
            });
        }
    }
    else if (queryId == "2") {
        prepareQuery2(param);
        if (executeDirectly) {
            executeQuery2({
                "eq": {
                    "test.url": param.select2,
                    "build.revision": param.buildRevision
                }
            });
        }
    }
    else if (queryId == "3") {
        prepareQuery3(param);
        if (executeDirectly) {
            executeQuery3({
                "eq":{
                    "source.file": param.select2,
                    "build.revision": param.buildRevision
                }
            });
        }
    }
    else if (queryId == "4") {
        alert("Not implemented yet!");
    }
}

function getDxrLink(fileName) {
    return "https://dxr.mozilla.org/mozilla-central/search?q=path%3A" + fileName + "&redirect=false&case=false";
}

function getShortenedFilePath(filePath) {
    var prefix = "chrome://mochitests/content/browser/";

    if (filePath.indexOf(prefix) === -1) {
        return filePath;
    }
    else {
        var foo = filePath.split(prefix);
        return filePath.split(prefix)[1];
    }
}

function submitForm() {
    $("#resultTableBody").html("");
    var query = $("#querySelect").val();
    
    if (query == "1") {
        executeQuery1Manual();
    }
    else if (query == "2") {
        executeQuery2Manual();
    }
    else if (query == "3") {
        executeQuery3Manual();
    }
}