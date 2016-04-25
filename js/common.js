// global variables
var usePermalinkFlag = false;

function addTests(param) {
    var buildRevision = $("#selectBuildRevision").val();
    Thread.run(function*(){
        // disable inputs while query is running
        disableAll(true);

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

        disableAll(false);
    });
}

function addSources(param) {
    var buildRevision = $("#selectBuildRevision").val();
    Thread.run(function*(){
        // disable inputs while query is running
        disableAll(true);

        var sources = yield (search({
            "limit": 10000,
            "groupby": ["source.file.name"],
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
            if (!isTest(element[0])) {
                select2.append("<option value='" + element[0] + "'>" + getShortenedFilePath(element[0]) + "</option>");
            }
        });
        select2.filterByText($("#select2Filter"), false);

        if (param) {
            select2.val(param.select2);
        }

        disableAll(false);
    });
}

/**
 * Populate the list of build revisions
 * @param buildRevision If set (e.g. coming from permalink), this will be used as the value
 *                      of the select after populating it.
 */
function addBuild(buildRevision) {
    Thread.run(function*(){
        // disable inputs while query is running
        disableAll(true);

        var sources = yield (search({
            "limit": 10000,
            "format": "list",
            "groupby": ["build.revision", "build.created_timestamp"],
            "from": "coverage"
        }));

        sources.data.sort(function(a, b) {
            return b.build.created_timestamp - a.build.created_timestamp;
        });

        sources.data.forEach(function(element, index, array) {
            var date = new Date(element.build.created_timestamp * 1000);
            $("#selectBuildRevision").append("<option value='" + element.build.revision + "'>" + element.build.revision.substring(0, 12) + " (" + date + ")</option>");
        });

        if (buildRevision) {
            $("#selectBuildRevision").val(buildRevision);
        }

        disableAll(false);
    });
}

function showBuildInfo(buildRevision) {
    if (!buildRevision) return;

    Thread.run(function*(){
        var result = yield (search({
            "limit":1,
            "format":"list",
            "select":["build.revision","build.created_timestamp","build.taskId"],
            "from":"coverage",
            "where":{"eq":{"build.revision":buildRevision}}
        }));

        var taskId = result.data[0].build.taskId;
        var url = `https://tools.taskcluster.net/task-inspector/#${taskId}/`;
        $("#buildInfo").html(`Build taskId: <a href="${url}">${taskId}</a>`);
        $("#buildInfoDiv").show();
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
                    "source.file.name": param.select2,
                    "build.revision": param.buildRevision
                }
            });
        }
    }
    else if (queryId == "4") {
        alert("Not implemented yet!");
    }
    else if (queryId == "5") {
        prepareQuery5(param);
        if (executeDirectly) {
            executeQuery5({
                "eq":{
                    "source.file.name": param.select2,
                    "build.revision": param.buildRevision
                }
            });
        }
    }
}

function getDxrLink(fileName) {
    return "https://dxr.mozilla.org/mozilla-central/search?q=path%3A" + fileName + "&redirect=false&case=false";
}

/**
 * Heuristically get a dxr link for a file
 * @param fileName The file name to search on dxr
 * @param callbackDone Will be called when a direct dxr link is obtained, with the link passed in as a parameter
 * @param callbackNotUnique Will be called when there are more than one result when searching for fileName on dxr,
 * the results will be passed in as a parameter
 */
function getSingleDxrLink(fileName, callbackDone, callbackNotUnique) {
    // Trung: temporarily using my server since dxr doesn't support cross domain request
    // TODO: add handle for error, for no result, etc.
    var link = "http://bloodbrothers-chinhodado.rhcloud.com/getDxr/?file=" + fileName;
    $.ajax({
        url: link,
        type: "GET",
        crossDomain: true,
        success: function(data){
            data = JSON.parse(data);
            var results = data.results;
            if (results.length > 1) {
                callbackNotUnique(results);
            }

            // in the event that there are multiple results for the file, just take the first one
            var chosenLink = "https://dxr.mozilla.org/mozilla-central/source/" + results[0].path;
            callbackDone(chosenLink);
        }
    });
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

function isTest(filePath) {
    var testMasks = ["chrome://mochitests/",
                     "chrome://specialpowers/",
                     "chrome://mochikit/",
                     "resource://testing-common/"];

    for (var i = 0; i < testMasks.length; i++) {
        if (filePath.indexOf(testMasks[i]) !== -1) {
            return true;
        }
    }

    return false;
}

function submitForm() {
    $("#resultDiv").html("");
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
    else if (query == "5") {
        executeQuery5Manual();
    }
}