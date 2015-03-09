/* global window, document, console, chrome, LStorage, TrackerUtils */
document.addEventListener("DOMContentLoaded", function(event) {
    var timer       = new Timer();
});

var Timer = function () {
    var self = this;
    
    this.utils = new TrackerUtils();

    this.initData();
    this.initElements();
    this.attachEvents();
    
    this.preloadData(function (data) {
        self.updateTimeHistoryView(data.history);
        self.updateCurrentTaskView(data.task);
        self.updateCurrentStatusView(data.status);
        
        self.data.status = data.status;
        self.data.task = data.task;
        
        self.detectCurrentTask(function (task) {
            self.data.pageTask = task;
            self.task.setValue(task ? '#' + task : "No task");
            self.render();
        });
    });
    
    /*setTimeout(function () {
        self.clickStopButton();
    }, 2000);*/
};

Timer.prototype = {
    initData: function () {
        this.data = {};  
    },
    
    initElements: function () {
        this.start = this.createBtnElement("start-button");
        this.stop = this.createBtnElement("stop-button");
        this.pause = this.createBtnElement("pause-button");
        
        this.currentTask = this.createTextElement(".time-main .time-task");
        this.task = this.createTextElement(".time-current");
        this.total = this.createTextElement(".time-main .time-total");
        
        this.history = document.querySelector("#main .time-container .time-data .time-history");
    },
    
    attachEvents: function () {
        var self = this;
        /* attach event listeners */
        this.start.getEl().addEventListener("click", function (e) { e.preventDefault(); self.clickStartButton(); });
        this.stop.getEl().addEventListener("click", function (e) { e.preventDefault(); self.clickStopButton(); });
        this.pause.getEl().addEventListener("click", function (e) { e.preventDefault(); self.clickPauseButton(); });
        this.history.addEventListener("click", function (e, data) {
            if (e.target.className === "time-p-task") {
                self.setTaskFromHistory(e.target.textContent);
            }
        });  
    },
    
    createBtnElement: function (name) {
        var btn = document.querySelector("#main .time-container .time-data .time-main .time-bb .button." + name);
        
        if (!btn) {
            throw Error("Unknown element");
        }
        
        return {
            show : function () {
                btn.style.display = "inline-block";
            },
            hide : function () {
                btn.style.display = "none";
            },
            getEl : function () {
                return btn;
            }
        };
    },
    
    createTextElement: function (selector) {
        var elem;
        if (selector instanceof Object) {
            elem = selector;
        } else {
            elem = document.querySelector("#main .time-container .time-data " + selector);
        }
        
        if (!elem) {
            throw Error("Unknown element \"" + selector + "\"");
        }
        
        return {
            setValue: function (value) {
                elem.textContent = value || "";
            },
            
            getValue: function () {
                return elem.textContent;
            },
            
            setColor: function (color) {
                switch (color) {
                    case "red"  : elem.style.color = "#b80000"; break;
                    case "green": elem.style.color = "#12a702"; break;
                    case "blue" : elem.style.color = "#41519b"; break;
                    default : elem.style.color = "#333333";
                }
            },
            
            show : function () {
                elem.style.display = "inline-block";
            },
            
            hide : function () {
                elem.style.display = "none";
            },
            
            getEl: function () {
                return elem;
            }
        };
    },
    
    hideAllButtons: function () {
        this.start.hide();
        this.stop.hide();
        this.pause.hide();
    },
    
    clickStartButton: function () {
        var task = this.getTaskId() || this.getPageTask();
        
        if (task) {
            this.setStatus("works", task);
        }
    },
    
    clickPauseButton: function () {
        var task = this.getTaskId();
        
        if (task) {
            this.setStatus("paused", task);
        }
    },
    
    clickStopButton: function () {
        this.setStatus("idle");
    },
    
    detectCurrentTask: function (callback) {
        var self = this;
        chrome.tabs.getSelected(null, function (tab) {
            var url = tab.url.match(/^https?\:\/\/rm\.innomdc\.com\/issues\/([\d]+)/);
            
            if (url && url.length === 2) {
                callback(url[1]);
            } else {
                callback(null);
            }
        });
    },
    
    getPageTask: function () {
        return this.data.pageTask;   
    },
    
    getTask: function () {
        return this.data.task;
    },
    
    getTaskId: function () {
        var task = this.data.task;        
        return (task && task.id) || null;
    },
    
    getCurrentStatus: function () {
        return this.data.status || "idle";
    },
    
    setStatus: function (status, task) {
        var self = this;
        this.requestStatus(status, task, function (response) {
            if (response.error) {
                throw Error(response.message);
            } else {
                task = response.task;
                status = response.status;
                
                self.data.status = status;
                self.data.task = task;
                self.updateCurrentTaskView({ id: task.id });
                self.updateCurrentStatusView(status);
            }
        });
    },
    
    changeButtons: function (status) {
        this.hideAllButtons();
        switch (status) {
            case "works" : 
                this.stop.show();
                this.pause.show();
                break;
            case "paused" :
                this.start.show();
                this.stop.show();
                break;
            case "idle" :
            default:
                this.start.show();
                break;
        }
    },

    preloadData: function (callback) {
        var self = this;
        this.requestAllData(function (data) {
            if (data.error) {
            throw Error(data.message);
            } else {
                self.data = data;
                callback(data);
            } 
        });
    },
    
    updateCurrentTaskView: function (task) {
        this.currentTask.setValue((task && task.id) ? '#' + task.id : "");
    },
    
    updateCurrentStatusView: function (status) {
        this.changeButtons(status);  
    },
    
    updateTimeHistoryView: function (elems) {
        console.log("history");
        var el, time, task;
        
        this.history.innerHTML = '';
        if (elems && elems.length > 0) {
            for (var i = 0,iL = elems.length; i < iL;i++) {
                el = document.createElement("p");
                task = document.createElement("span");
                time = document.createElement("span");

                task.classList.add("time-p-task");
                time.classList.add("time-p-time");

                time.textContent = elems[i].hours.toFixed(2);
                task.textContent = '#' + elems[i].task;

                el.appendChild(task);
                el.appendChild(time);

                this.history.appendChild(el);
            }
        } else {
            el = document.createElement("p");
            el.textContent = "No history";
            this.history.appendChild(el);
        }
    },
    
    render: function () {
        //this.changeButtons("idle");   //temp
        this.rendered = true;
    },
    
    requestAllData: function (callback) {
        this.request('all-data', null, callback);   
    },
    
    requestStatus: function (status, data, callback) {
        this.request("status", {
            status  : status,
            task    : data
        }, callback);
    },
    
    request: function (action, data, callback) {
        chrome.runtime.sendMessage({ "action": action, "data": data }, function (response) {
            callback(response || {});
        });
    }
};