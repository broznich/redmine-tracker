/* globals window, XMLHttpRequest */
var RServer = function (config) {
    var self = this;
    
    this.key = config.apiKey;
    this.url = config.apiHost;

    this.getUserData(function (error, data) {
        if (!error) {
            self.user = data.user;
            self.ready = true;
        }
    });
};

RServer.prototype = {
    connect: function (callback) {
        var retry = 10,
            self = this;
        
        var interval = window.setInterval(function () {
            if (self.ready) {
                window.clearInterval(interval);
                callback();
            } else if (retry <= 0) {
                window.clearInterval(interval);
                throw Error("Connect to server was failed!");
            } else {
                retry--;
            }
        },3000);
    },
    
    getUserData: function (callback) {
        this.request("GET", "users/current.json", null, callback);
    },
    
    getCurrentUserId: function () {
        if (!this.ready) {
            throw Error("Server is not connected");
        }
        
        return this.user.id;
    },
    
    getTimeEntries: function (callback) {
        var date    = new Date(),
            year    = date.getFullYear(),
            day     = date.getDate(),
            month   = date.getMonth() + 1;
    
        if (month < 10) {
            month = "0" + month;
        }
        
        if (day < 10) {
            day = "0" + day;
        }
        
        var params = {
            "user_id"   : this.getCurrentUserId(),
            "from"      : year + '-' + month + '-' + day
            //"to"        : "2015-03-06",
            //"from"      : "2015-03-05"
        };
        
        this.request("GET", "time_entries.json", params, callback);
    },
    
    setTimeEntry: function (data, callback) {
        var params = {
            "issue_id"  : data.task,
            "hours"     : data.hours
        };
        
        this.request("POST", "time_entries.json", { "time_entry" : params } , callback);
    },
    
    request: function (method, url, params, callback) {
        var formData    = null,
            status      = 200,
            req         = new XMLHttpRequest();
        
        url = this.url + url;
        
        if (method === "GET") {
            url += '?';
            for (var param in params) {
                if (params.hasOwnProperty(param)) {
                    url += (param + "=" + params[param] + "&");
                }
            }
            url = url.substr(0,url.length-1); //if 0 will remove ?,else remove last &
        } else if (method === "POST") {
            status = 201;
            formData = JSON.stringify(params);
        }
        
        req.open(method, url, true);
        req.setRequestHeader("X-Redmine-API-Key", this.key);
        
        if (method !== "GET") {
            req.setRequestHeader("Content-Type", "application/json");
        }
        
        req.onreadystatechange = function () {
            if (this.readyState === 4) {
                if (this.status === status) {
                    var data = this.responseText;

                    try {
                        data = JSON.parse(data);
                    } catch (e) {
                        data = {};
                    }

                    callback(null, data);
                } else {
                    callback(Error(this.statusText));
                }
            }
        };
        
        req.send(formData);
    },
    
    _startCompatibilityTimer: function (issue) { //compatibility functions, will be depricated!
        
    },
    
    _stopCompatibilityTimer: function (issue) { //compatibility functions, will be depricated!
        //https://rm.innomdc.com/time_trackers/delete?id=9770
    }
};