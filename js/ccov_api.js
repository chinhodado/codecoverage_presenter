importScript("../modevlib/rest/Rest.js");

/**
*
* This is the interface for all types of queries. It is used in JsonCcov
* to perform any given query using the performQuery() method.
*
* The default for performing a query is to simply return an empty object
* if the performQuery() method was not redefined.
*
*/


class Query {
    constructor (testParams) {
        this.testParameters = testParams
    }
    
    performQuery (){ 
        var x = {};
        return x;
    }
}

/**
*
* API to perform queries on Active Data JSON code coverage.
*
* Use setQuery() to give an object that inherits from Query that
* represents the query that needs to be performed.
*
* Use setQuries() if multiple queries are to be done. getQueriesResults()
* must be used after using this if all the queries are to be executed
* at once.
*
* Use getQueryResults to execute the query given through setQuery.
* By default, if setQuery() was not called beforehand with a query type,
* it will return nothing. Otherwise, it will return a json formatted
* object that will contain the results.
*
* Use getQueriesResults() to execute all the queries given through setQueries().
* This function cannot be used in 'queries' has not initialized through setQueries().
* If 'queries' is not initialized, an empty object is returned. Otherwise,
* an object containing the JSON formatted responses to each query will be
* returned.
*
*/

class JsonCcov {
    constructor () {
        this.queryType = new Query();
        this.queries = [];
        this.result = {};
    }

    setQuery (queryTypeToDo) {
        this.queryType = queryTypeToDo;
    }

    setQueries (queriesToDo) {
        this.queries = queriesToDo;
    }

    storeResults (callback){
        console.log("This next line is output once the query is finished. It has values in the object.")
        console.log(this.result);
        return callback;
    }

    _callBack (source){
        console.log("Ended the query.");
        return source;
    }

    getQueryResults (callback) {
        console.log(this.queryType);
        if (this.queries && !this.queryType) {
            return {};
        }

        var queryDone = this.queryType;

        queryDone.performQuery(callback);
    }

    getQueriesResults () {
        if (!this.queries) {
            return {};
        }
        var results = [];

        this.queries.forEach(function (element, index) {
            results.add(element.performQuery());
        });

        return results;
    }
}


/**
*
* Add one class for each type of query. They must implement perform query
* and they must also inherit from Query.
*
*/



var search = function* (query){
    var output = yield (Rest.post({
            url: "https://activedata.allizom.org/query",
            json: query
        }));
        yield (output);
};

var search = function(query, callback){
    $.ajax("https://activedata.allizom.org/query", {
        type: "POST",
        data: JSON.stringify(query),
        success: callback
    });
};

function* queryFilesOfTest(testParams){
    var testToDo = testParams;
    
    var sourceFiles = yield (search({
         "limit": 10000,
         "where": {"eq": testToDo},
         "groupby": ["source.file.name"],
         "from": "coverage"
     }));
 
     yield (sourceFiles);
}

/**
* This query can be used to find all the source files that were accessed by
* the given test.
*/
class QueryFilesOfTest extends Query {
    constructor (testParams) {
        super(testParams);
    }
    
    performQuery (callback) {
        var testToDo = this.testParameters;

        search(
          {
              "limit": 10000,
              "where": testToDo,
              "groupby": ["source.file.name"],
              "from": "coverage"
          },
          callback
        );
    }
}

function* queryTestsOfSource(testParams){
    var testToDo = testParams;
    
    var sourceFiles = yield (search({
              "limit": 10000,
              "where": { "eq": testToDo},
              "groupby": ["test.url"],
              "from": "coverage"
     }));
 
     yield (sourceFiles);
}

/**
* This query can be used to find all the test files that access
* a given source files.
*/
class QueryTestsOfSource extends Query {
    constructor (testParams) {
        super(testParams);
    }
    
    performQuery(callback){
        var testToDo = this.testParameters;

        search(
          {
              "limit": 10000,
              "where": testToDo,
              "groupby": ["test.url"],
              "from": "coverage"
          },
          callback
        );
    }
}

function* queryCommonFiles(testParams){
        var testToDo = this.testParams;
    
        var coverage = yield (search({
            "from":"coverage",
            "where":{"prefix": testToDo},
            "groupby":[
                {"name":"test", "value":"test.url"},
                {"name":"source", "value":"source.file.name"}
            ],
            "limit":10000,
            "format":"list"
        }));
    
        console.log(coverage);
        //MAP EACH TEST TO THE SET OF FILES COVERED
        var sources_by_test={};
        coverage.data.forall(function(d, i){
            sources_by_test[d.test] = coalesce(sources_by_test[d.test], {});
            sources_by_test[d.test][d.source]=true;  // USE THE KEYS OF THE OBJECT AS SET
        });
        //FIND THE INTERSECTION OF COVERED FILES
        var commonSources = null;
        Map.forall(sources_by_test, function(test, sourceList){
            if (commonSources==null) {
                commonSources = Map.keys(sourceList);
            }else{
                commonSources = commonSources.intersect(Map.keys(sourceList));
            }//endif
        });
    
        var coverage = yield (search({
            "from":"coverage",
            "where":{"prefix": testToDo},
            "edges":[
                {"name":"source", "value":"source.file.name"},
                {"name": "test", "value": "test.url", "allowNulls": false}
            ],
            "limit":10000,
            "format":"cube"
        }));
        console.log(coverage);
        //edges[0] DESCRIBES THE source DIMENSION, WE SELECT ALL PARTS OF THE DOMAIN
        var all_sources = coverage.edges[0].domain.partitions.select("value");
        //DATA IS IN {"count": [source][test]} PIVOT TABLE
        var commonSources=[];
        coverage.data.count.forall(function(tests, i){
            //VERIFY THIS source TOUCHES ALL TESTS (count>0)
            if (Array.AND(tests.map(function(v){return v>0;}))) {
                commonSources.append(all_sources[i]);
            }//endif
        });
    
        yield(commonSources);
}

class QueryCommonFiles extends Query {
    constructor (testParams) {
        super(testParams);
    }
    
    performQuery (callback) {
        var testToDo = this.testParameters;
        
        var coverage = null; 
        var sources_by_test={};
        var commonSources = null;
    
        search({
            "from":"coverage",
            "where": { prefix: testToDo },
            "groupby":[
                {"name":"test", "value":"test.url"},
                {"name":"source", "value":"source.file.name"}
            ],
            "limit":10000,
            "format":"list"
            },
            function(coverage) {
                //MAP EACH TEST TO THE SET OF FILES COVERED
                coverage.data.forEach(function(d, i){
                    sources_by_test[d.test] = coalesce(sources_by_test[d.test], {});
                    sources_by_test[d.test][d.source]=true;  // USE THE KEYS OF THE OBJECT AS SET
                });

                //FIND THE INTERSECTION OF COVERED FILES
                Map.forall(sources_by_test, function(test, sourceList){
                    if (commonSources==null) {
                        commonSources = Map.keys(sourceList);
                    }else{
                        commonSources = commonSources.intersect(Map.keys(sourceList));
                    }//endif
                }); 
              } 
            );
        
        
        
        var coverage;
        search(
            {
            "from":"coverage",
            "where": { prefix: testToDo },
            "edges":[
                {"name":"source", "value":"source.file.name"},
                {"name": "test", "value": "test.url", "allowNulls": false}
            ],
            "limit":10000,
            "format":"cube"
            },
            function(coverage) { 
                //edges[0] DESCRIBES THE source DIMENSION, WE SELECT ALL PARTS OF THE DOMAIN
                var all_sources = coverage.edges[0].domain.partitions.select("value");
                //DATA IS IN {"count": [source][test]} PIVOT TABLE
                var commonSources=[];
                coverage.data.count.forall(function(tests, i){
                    //VERIFY THIS source TOUCHES ALL TESTS (count>0)
                    if (Array.AND(tests.map(function(v){return v>0;}))) {
                        commonSources.append(all_sources[i]);
                    }//endif
                });
                callback(commonSources);
            }
        );
    }
}

/**
* This query can take a DXR link such as "https://dxr.mozilla.org/mozilla-central/source/browser/base/content/test/chat/browser_focus.js#13"
* and parse it for the source file and return the lines that are covered within it. It works based on the ASSUMPTION that there are always
* two fields after "dxr.mozilla.org" and before the source file name. Currently though, it only checks the source file name and excludes the path.
* This query returns an object containing the test url, the source file name, and the lines that are covered using that test.
*
* TODO: Make it work in such a way that all substrings are checked.
**/
class QueryDXRFile extends Query{
    constructor (testParams) {
        super(testParams);
    }
    
    performQuery(callback){
        var testToDo = this.testParameters;
        
        var tempArray = testToDo.split("/");
        
        var fileTemp = tempArray[tempArray.length-1];
        var fileArr = fileTemp.split("#");
            
        search(
            {
                "from": "coverage.source.file.covered",
                "limit": 10000,
                "where": {
                     "contains": { "source.file.name": fileArr[0] } 
                },
                "groupby": ["test.url", "source.file.name", "line"]
               
            },
            callback
        );
    }
}


/**
* Returns a list of tests that should be run for the patch that is given to this class in a JSON format.
* i.e. "http://hg.mozilla.org/mozilla-central/json-diff/14eb89c4134db16845dedf5fddd2fb0a7f70497f/tools/profiler/core/platform.h"
*
* To deal with multiple files of the same name, we search for only the name of the actual file and disregard the path.
* TODO: Add path testing. Solution: Start from the longest substring and move to the shortest until we have a non-empty result.
*
* To get the json-diff first go to the diff for the given file of a patch on "hg.mozilla.org".
* Then, you should have a link like:
* "http://hg.mozilla.org/mozilla-central/diff/14eb89c4134db16845dedf5fddd2fb0a7f70497f/tools/profiler/core/platform.h".
* Replace 'diff' with 'json-diff' and the result should be the diff in the form of a json that can be parsed with this
* query.
*
* TODO: Relevancy of the tests.
* TODO: Use lines covered in each test to determine tests to run.
**/
class QueryTestsForPatch extends Query {
    constructor (testParams) {
        super(testParams);
    }
    
    performQuery(callback){
        var testToDo = this.testParameters;
        
        $.getJSON(testToDo, function(jsonData){
            var temp = jsonData['path'];
            var temp2 = temp.split('/');
            var tests = null;
            
            search(
                {
                    "from":"coverage",
                    "where":{"contains":{"source.file.name":temp2[temp2.length-1]}},
                    "limit":10000,
                    "groupby":["test.url","source.file.name"]
                }, function(tests){
                    callback(tests);
                });
        });
    }
}

/**
* Query for a set of patches. It depends upon QueryTestsForPatch. TODO: Testing.
*/
class QuerySetTestForPatch extends Query {
    constructor (testParams) {
        super(testParams);
    }
    
    performQuery(callback){
        var testSet = this.testParameters;
        var ccov2 = new JsonCcov();
        var resultSet = [];
        
        (function(){
            testSet.forEach(function(testToDo){
                var patch = new QueryTestsForPatch(testToDo);
                ccov2.setQuery(patch);

                var results = ccov2.performQuery(function(result){
                    result.forEach(function(test){
                        resultSet.append(test);
                    });
                });
            });
        })();
        callback(resultSet);
    }
}

/**
* Query for the relevancy of source files with respect to a given test file.
**/
class QueryRelevancyOfSources extends Query {
    constructor(testparams){
        super(testparams);
    }
    
    performQuery (callback) {
        var testToDo = this.testParameters;
        search(
            {  
                "from":"coverage",
                "where":{"and":[
                    {"eq":testToDo},
                    {"missing":"source.method.name"}
                ]},
                "limit":10000,
                "select":{
                    "name":"max_score",
                    "value":"source.file.score",
                    "aggregate":"maximum"
                },
                "groupby":["source.file.name"]
            }, function(relevance){
                callback(relevance);
            });
    }
}

class QueryCustom extends Query {
    constructor(testparams){
        super(testparams);
    }
    
    performQuery (callback) {
        var testToDo = this.testParameters
        
        search(testToDo, callback);
    }
}
