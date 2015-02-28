/* global window, document, console, chrome, LStorage */
document.addEventListener("DOMContentLoaded", function(event) {
    var timer = new Timer();
    
    timer.setCurrentTask(timer.ls.getTaskValue());
    
    timer.initTimerElement();
    timer.updateTimeHistory();
    
    timer.restoreState();
    
    timer.detectCurrentTask();
});

var Timer = function () {
    this.initElements();
    this.hideAllButtons();
    this.ls = new LStorage();
};

Timer.prototype = {
    initElements: function () {
        var self = this;
        /* init dom elements */
        this.start = this.createBtnElement("start-button");
        this.stop = this.createBtnElement("stop-button");
        this.pause = this.createBtnElement("pause-button");
        
        this.currentTask = this.createTextElement(".time-main .time-task");
        this.task = this.createTextElement(".time-current");
        this.total = this.createTextElement(".time-main .time-total");
        
        this.createTimeHistory();
        
        /* attach event listeners */
        this.start.getEl().addEventListener("click", function () { self.clickStartButton(); });
        this.stop.getEl().addEventListener("click", function () { self.clickStopButton(); });
        this.pause.getEl().addEventListener("click", function () { self.clickPauseButton(); });
        this.history.addEventListener("click", function (e, data) {
            if (e.target.className === "time-p-task") {
                self.setTaskFromHistory(e.target.textContent);
            }
        });
    },
    
    initTimerElement: function () {
        this.timer = this.createTimerElement();
        this.updateTimeData();
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
    
    createTimeHistory: function () {
        var container = document.querySelector("#main .time-container .time-data .time-history"),
            self = this;
    
        this.history = container;
        /*for (var i = 0,iL = elems.length; i < iL;i++) {
            history.push(this.createTextElement(elems[i]));
        }*/
    },
    
    updateTimeHistory: function () {
        var self = this;
        chrome.runtime.sendMessage({"action": "history"}, function (response) {
            self.history.innerHTML = '';
            console.log("history");
            var elems = response.history, el, time, task;

            if (elems && elems.length > 0) {
                for (var i = 0,iL = elems.length; i < iL;i++) {
                    el = document.createElement("p");
                    task = document.createElement("span");
                    time = document.createElement("span");
                    
                    task.classList.add("time-p-task");
                    time.classList.add("time-p-time");
                    
                    time.textContent = self.formatTime(elems[i].time, true);
                    task.textContent = '#' + elems[i].task;
                    
                    el.appendChild(task);
                    el.appendChild(time);

                    self.history.appendChild(el);
                }
            } else {
                el = document.createElement("p");
                el.textContent = "No history";
                self.history.appendChild(el);
            }
        });  
    },
    
    updateTimeData: function () {
        var self = this;
        chrome.runtime.sendMessage({"action": "timer", "task": this.getCurrentTask()}, function (response) {
            var cTime = response.time > 0 ? self.formatTime(response.time) : "",
                aTime = response.alltime > 0 ? self.formatTime(response.alltime, true) : "";

            self.timer.setValue((aTime && response.time !== response.alltime) ? cTime + ' / ' + aTime : cTime);

            self.total.setValue(self.formatTime(response.total, true));

            if (response.total > 28800000) {
                self.total.setColor("green");
            } else if (response.total > 18000000) {
                self.total.setColor("blue");
            } else {
                self.total.setColor("red");
            }
        });
    },
    
    createTimerElement: function() {
        var elem = document.querySelector("#main .time-container .time-data .time-main .time-timer");
        var self = this;
        
        return {
            setValue: function (value) {
                elem.textContent = value || "";
            },
            
            getValue: function () {
                return elem.textContent;
            }
        };
    },
    
    formatTime: function (ts, nosecond) {
        var timeInSec = Math.round(ts/1000);
        
        var hours = Math.floor(timeInSec/3600);
        var othersSec = timeInSec % 3600;
        var mins = Math.floor(othersSec/60);
        var secs = othersSec % 60;
            
        var time = hours + ':' + (mins >= 10 ? mins : '0' + mins);
        
        if (!nosecond) {
            time += ':' + (secs >= 10 ? secs : '0' + secs);
        }
        
        return time;
    },
    
    detectCurrentTask: function () {
        var self = this;
        chrome.tabs.getSelected(null, function (tab) {
            var url = tab.url.match(/^https?\:\/\/rm\.innomdc\.com\/issues\/([\d]+)/);
            
            if (url && url.length === 2) {
                self.setTask(url[1]);
            } else {
                self.setTask("No task");
            }
        });
    },
    
    setTaskFromHistory: function (task) {
        this.setTask(task.replace(/[^\d]/g,''));
    },
        
    setTask: function (task) {
        this.task.setValue(task ? '#' + task : '');
    },
    
    getTask: function () {
        var val = this.task.getValue();
        return val.replace(/[^\d]/g,'');
    },
    
    getCurrentTask: function () {
        var val = this.currentTask.getValue();
        return val.replace(/[^\d]/g,'');
    },
    
    setCurrentTask: function (task) {
        if (task) {
            task = task.replace(/#/g,'');
            this.currentTask.setValue(task ? '#'+task : '');
            this.ls.setTaskValue(task);
        } else {
            this.ls.setTaskValue(null);
            this.currentTask.setValue();
        }
    },
    
    hideAllButtons: function () {
        this.start.hide();
        this.stop.hide();
        this.pause.hide();
    },
    
    setStatus: function (status, noEvent) {
        this.ls.setStatusValue(status);
        
        if (noEvent) {
            return true;
        }
        
        chrome.runtime.sendMessage({"action": "status", "status" : status, "task" : this.getCurrentTask()}, function (response) {
            console.log("sended");
        });
    },
    
    restoreState: function () {
        var state = this.ls.getStatusValue() || "idle";
        
        switch (state) {
            case "working" : this.clickStartButton(true); break;
            case "paused" : this.clickPauseButton(true); break;
            case "idle" : this.clickStopButton(true); break;
        }
    },
    
    clickStartButton: function (noEvent) {
        var task = this.getCurrentTask() || this.getTask();
        
        if (!task) {
            window.alert("No task to start!");
            return false;
        }
        
        this.start.hide();
        this.stop.show();
        this.pause.show();
        this.setCurrentTask(task);
        this.setStatus("working", noEvent);
    },
    
    clickPauseButton: function (noEvent) {
        this.pause.hide();
        this.start.show();
        this.stop.show();
        this.setStatus("paused", noEvent);
    },
    
    clickStopButton: function (noEvent) {
        this.pause.hide();
        this.stop.hide();
        this.start.show();
        this.setStatus("idle", noEvent);
        this.setCurrentTask();
        this.timer.setValue("");
        //this.createTimeHistory();
        this.updateTimeHistory();
    }
};