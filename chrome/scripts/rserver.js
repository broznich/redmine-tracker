/* globals window, XMLHttpRequest */
var RServer = function (config) {
    var self = this;
    
    this.key = config.key;
    this.url = config.url;

    this.getUserData(function (data) {
        self.user = data.user;
        self.ready = true;
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
            //"from"      : year + '-' + month + '-' + day
            "from"        : "2015-02-27"
        };
        
        this.request("GET", "time_entries.json", params, callback);
    },
    
    request: function (method, url, params, callback) {
        url = this.url + url;
        
        if (method === "GET") {
            url += '?';
            for (var param in params) {
                if (params.hasOwnProperty(param)) {
                    url += (param + "=" + params[param] + "&");
                }
            }
            url = url.substr(0,url.length-1); //if 0 will remove ?,else remove last &
        }
        
        var req = new XMLHttpRequest();
        req.open(method, url, true);
        req.setRequestHeader("X-Redmine-API-Key", this.key);
        
        req.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                var data = this.responseText;
                
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    data = {};
                }
                
                callback(data);
            }
        };
        
        req.send(null);
    }
};