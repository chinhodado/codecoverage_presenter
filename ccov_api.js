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



var search = function(query, callback){
    $.ajax("https://activedata.allizom.org/query", {
        type: "POST",
        data: JSON.stringify(query),
        success: callback
    });
};


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
              "groupby": ["source.file"],
              "from": "coverage"
          },
          callback
        );
    }
}


class QueryTestsOfSource extends Query {
    constructor (testParams) {
        super(testParams);
    }
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
                {"name":"source", "value":"source.file"}
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
                {"name":"source", "value":"source.file"},
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

class QueryCustom extends Query {
    constructor(testparams){
        super(testparams);
    }
    
    performQuery (callback) {
        var testToDo = this.testParameters
        
        search(testToDo, callback);
    }
}
