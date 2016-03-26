/**
*
* This is the interface for all types of queries. It is used in JsonCcov
* to perform any given query using the performQuery() method.
*
* The default for performing a query is to simply return an empty object
* if the performQuery() method was not redefined.
*
*/


function Query() {
    "use strict";
}

Query.prototype.performQuery = function () {
    "use strict";
    var x = {};
    return x;
};

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

function JsonCcov() {
    this.queryType = new Query();
    this.queries = [];
    this.result = {};
}

JsonCcov.prototype.setQuery = function (queryTypeToDo) {
    this.queryType = queryTypeToDo;
};

JsonCcov.prototype.setQueries = function (queriesToDo) {
    "use strict";
    this.queries = queriesToDo;
};

JsonCcov.prototype.storeResults = function(source, callback){
    this.result = source;
    console.log(this.result);
    return callback();
};

JsonCcov.prototype._callBack = function(source){
    console.log("ended");
    return source;
};

JsonCcov.prototype.getQueryResults = function () {
    console.log(this.queryType);
    if (this.queries && !this.queryType) {
        return {};
    }
    
    var queryDone = this.queryType;
    
    console.log(queryDone);
    return queryDone.performQuery(this.storeResults, this._callBack);
    console.log(this.result);
    
    return this.result;
};

JsonCcov.prototype.getQueriesResults = function () {
    "use strict";
    if (!this.queries) {
        return {};
    }
    var results = [];
    
    this.queries.forEach(function (element, index) {
        results.add(element.performQuery());
    });
    
    return results;
};


/**
*
* Add one class for each type of query. They must implement perform query
* and they must also inherit from Query.
*
*/


    
var search = function*(query){
        var output = yield (Rest.post({
            url: "https://activedata.allizom.org/query",
            json: query
        }));
        yield (output);
    };



/**
* This query can be used to find all the source files that were accessed by
* the given test.
*/
function QueryFilesOfTest(test) {
    Query.call(this);
    this.testName = test;
}
QueryFilesOfTest.prototype = Object.create(Query.prototype);

QueryFilesOfTest.prototype.performQuery = function (fn, callback) {
    var testToDo = this.testName;
    var results; 
    
    importScript(['modevlib/main.js'], function () {
        
            Thread.run(function*(){
                var sourceFiles = yield (search({
                    "limit": 10000,
                    "where": {"eq":{"test.url": testToDo}},
                    "groupby": ["source.file"],
                    "from": "coverage"
                }));
                /**
                sourceFiles.data.forEach(function(element,index,array) {
                   console.log(element); 
                });**/
                return fn(sourceFiles, callback);
                fn(sourceFiles);
            });
    });
};


function QueryCustom() {
    "use strict";
}
QueryCustom.prototype = Object.create(Query.prototype);

QueryCustom.prototype.performQuery = function () {
    "use strict";
};