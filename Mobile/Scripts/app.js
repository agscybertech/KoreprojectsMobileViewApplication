//'use strict';
//window.START = function () {
//    //debugger;
//    if (STYLE) {
//        window.STYLE = undefined;
//        window.START = undefined;
//    }
//};

// If browser (old browser) not support Array.indexOf – make it
(function () {
    if (!Array.indexOf) {
        Array.prototype.indexOf = function (obj) {
            for (var i = 0; i < this.length; i = i + 1) {
                if (this[i] === obj) { return i; }
            }
            return -1;
        };
    }
})();



//--------------------------------------------------------------------------------------------------
// Global Config object
// Use for store static value such as URLs or max/min value or some parametars for server or etc.
//--------------------------------------------------------------------------------------------------
window.CONFIG = {
    getTemplateURL: function () { return 'Templates.ashx'; },
    gatMasterURL: function () { return 'master.ashx'; },
    gatMobileServiceURL: function () { return 'MobileService.asmx'; },
    gatMessagesURL: function () { return 'messages.txt'; },
    gatSendingURL: function () { return 'msg-sending.php'; },
    gatSendingHoursOfDay: function () { return 'MobileService.asmx/Greetings'; },
    gatSyncTime: function () { return 10000; },
    gatTransitionDuration: function () { return 300; }	// Depends on the CSS duration
};



//--------------------------------------------------------------------------------------------------
// Create Angular application
//--------------------------------------------------------------------------------------------------
var App = angular.module('App', []);
App.factory('ProjectJobService', function () {
    return {
        JobId: 0
    };
});


//--------------------------------------------------------------------------------------------------
// $ TEMPLATE CACHE SERVICE
// This is a srvice for loading all views/pages templates as one file
//--------------------------------------------------------------------------------------------------
App.factory('$templateCache', ['$cacheFactory', '$http', '$injector', function ($cacheFactory, $http, $injector) {
    var cache = $cacheFactory('templates');
    var allTplPromise;

    return {
        get: function (url) {
            var fromCache = cache.get(url);
            if (fromCache) {
                return fromCache;
            }
            if (!allTplPromise) {
                allTplPromise = $http.get(CONFIG.getTemplateURL()).then(function (response) {
                    $injector.get('$compile')(response.data);
                    return response;
                });
            }
            return allTplPromise.then(function (response) {
                return {
                    status: response.status,
                    data: cache.get(url)
                };
            });
        },
        put: function (key, value) {
            cache.put(key, value);
        }
    };
}]);



//--------------------------------------------------------------------------------------------------
// $ TIME SHEET
//--------------------------------------------------------------------------------------------------
App.factory('$timesheet', [function () {
    var dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
		weeks = [],
		closed = [],
		selectedWeek = 0,
		selectedDay = 0;

    // Set data
    function update(d) {
        weeks = d.weeks;
        closed = [];
        selectedWeek = weeks.length - 1;
        for (var i = 0; i < weeks.length; i += 1) {
            if (i == 3) {
                closed.push('false');
            }
            else {
                closed.push(weeks[i].pop());
            }
            //closed.push(weeks[i].pop());
        }
    }

    // Get week and set as a current week
    function getWeek(n) {
        n = n || 0;
        selectedWeek += n;
        selectedWeek = selectedWeek < 0 ? weeks.length - 1 : selectedWeek;
        selectedWeek = selectedWeek >= weeks.length ? 0 : selectedWeek;
        return weeks[selectedWeek];
    }

    // Get flag of closed status for current week
    function isClosed() {
        return closed[selectedWeek];
    }

    // Get dada of day
    function getDay(n) {
        n = n || 0;
        selectedDay = n;
        return weeks[selectedWeek][selectedDay];
    }

    // Set dada of day
    function setDay(h) {
        weeks[selectedWeek][selectedDay].value = h.total;
        weeks[selectedWeek][selectedDay].hours.s = h.start;
        weeks[selectedWeek][selectedDay].hours.f = h.finish;
        weeks[selectedWeek][selectedDay].hours.sl = h.startLunch;
        weeks[selectedWeek][selectedDay].hours.fl = h.finishLunch;
    }

    function convertTime(s) {
        //var space = s.indexOf(" ");
        //if (space > 0) {
        //    var apt = s.toString().split(' ');
        //    if (apt.length === 2) {
        //        var ap = apt[1];
        //        var t = apt[0].toString().split(':'),
        //	    r = 0,
        //	    h = 0,
        //	    m = 0;
        //        if (t.length === 1) { t.push('0'); }
        //        h = parseInt(t[0]);
        //        if (ap === 'am') {
        //            if (h === 12) {
        //                h = 0;
        //            }
        //        } else {
        //            if (h=12){

        //            }else{
        //                h = h + 12;
        //            }  
        //        }
        //        m = parseInt(t[1]);
        //        h = h < 0 ? 0 : h;
        //        h = h > 23 ? 23 : h;
        //        m = m < 0 ? 0 : m;
        //        m = m > 59 ? 59 : m;
        //        r = m / 60;
        //        r = h + r;
        //        return r;
        //    } else {
        //        t.push('0');
        //    } 
        //} else {
        var t = s.toString().split(':'),
        r = 0,
        h = 0,
        m = 0;
        if (t.length === 1) { t.push('0'); }
        h = parseInt(t[0]);
        m = parseInt(t[1]);
        h = h < 0 ? 0 : h;
        h = h > 23 ? 23 : h;
        m = m < 0 ? 0 : m;
        m = m > 59 ? 59 : m;
        r = m / 60;
        r = h + r;
        return r;
        //}
    };

    function roundTime(t) {
        var h = 0, m = 0;
        t = parseFloat(t);
        t = t.toFixed(2);
        h = parseInt(t);
        m = parseInt((t - h) * 60);
        m = m < 0 ? '0' + m : '' + m;
        return h + ':' + m;
    };

    // Public:
    return {
        convertTime: convertTime,
        roundTime: roundTime,
        update: update,
        getWeek: getWeek,
        isClosed: isClosed,
        getDay: getDay,
        setDay: setDay
    };
}]);



//--------------------------------------------------------------------------------------------------
// $ MESSAGING SERVICE
// The service is intended to maintain the messaging operation (loading, sending, update messages, etc.).
// This service works non-stop, even when the message is not show. 
//--------------------------------------------------------------------------------------------------
App.factory('$messaging', ['$http', '$timeout', function ($http, $timeout) {
    var data = [''],
		updateFun = null;

    // Load message as JSON and call callback function (optional)
    function load(callback) {
        $http.get(CONFIG.gatMessagesURL()).
		success(function (d) {
		    data = d;

		    if (typeof updateFun === 'function') {
		        updateFun(d);
		    }

		    if (typeof callback === 'function') {
		        callback();
		    }
		});
    };

    // Start the synchronization
    function sync() {
        $timeout(function () {
            load(sync);
        }, CONFIG.gatSyncTime());
    };

    function update(f) {
        updateFun = f;
        return data;
    };

    // Load messages for the first time
    load();


    // Public:
    return {
        getData: update,
        setData: data,
        startSync: function () {
            load(sync);
        }
    };
}]);



//--------------------------------------------------------------------------------------------------
// Messages DIRECTIVE
// This is as a component for messages (showing, reading, etc)
//--------------------------------------------------------------------------------------------------
App.directive('messages', function ($q, $http, $timeout, $messaging) {
    return {
        replace: true,
        restrict: 'A',
        link: function (scope, element, attrs) {
            var msgs = {
                data: [''],
                len: 0,
                curr: 0
            };

            function update(d) {
                msgs.data = d;
                msgs.len = d.length;
            };

            msgs.data = $messaging.getData(update);
            msgs.len = msgs.data.length;

            // Get current message 
            scope.getMsg = function () {
                if (msgs.len === 0) {
                    scope.toggle = false;
                    return '';
                }
                return msgs.data[msgs.curr].msg;
            };

            // Get current message sender
            scope.getMsgFrom = function () {
                if (msgs.len === 0) { return ''; }
                return msgs.data[msgs.curr].from;
            };

            // Delete current messege
            scope.deleteMsg = function () {
                if (msgs.len === 0) { return; }
                msgs.data.splice(msgs.curr, 1);
                msgs.len -= 1;
                scope.toggle = msgs.len === 0 ? false : scope.toggle;
                msgs.curr = msgs.curr === msgs.len ? msgs.curr - 1 : msgs.curr;
                msgs.curr = msgs.curr < 0 ? 0 : msgs.curr;
            };

            // Get previous message
            scope.prev = function () {
                var n = msgs.curr,
					l = msgs.len;
                msgs.curr = n <= 0 ? l - 1 : n - 1;
            };

            // Get next message
            scope.next = function () {
                var n = msgs.curr,
					l = msgs.len;
                msgs.curr = n >= l - 1 ? 0 : n + 1;
            };

            // Go to write messages page
            scope.writeMsg = function () {
                scope.goTo('sending/');
            };

            // Go to write messages page for reply
            scope.replyMsg = function () {
                scope.goTo('sending/' + msgs.data[msgs.curr].from);
            };
        },
        templateUrl: 'messages.html'
    };
});



//--------------------------------------------------------------------------------------------------
// Touch Button DIRECTIVE
// This is a fix for touch action on buttons. Work only on elements with btn class
//--------------------------------------------------------------------------------------------------
App.directive('btn', function () {
    return {
        replace: false,
        restrict: 'C',
        link: function (scope, element) {
            element.bind('touchstart', function () {
                element.addClass('touch');
            });
            element.bind('touchend', function () {
                element.removeClass('touch');
            });
        }
    };
});



//--------------------------------------------------------------------------------------------------
// R O U T I N G
//--------------------------------------------------------------------------------------------------
App.config(function ($routeProvider, $locationProvider) {
    $locationProvider.hashPrefix("!");
    $locationProvider.html5Mode(false);
    $routeProvider.
		when('/', { templateUrl: 'mainmenu.html' }).
		when('/sending/:to', { templateUrl: 'sending.html' }).
		when('/timesheet', { templateUrl: 'timesheet.html' }).
		when('/timesheet-edit/:jobid/:day', { templateUrl: 'timesheet-edit.html', activetab: 'timesheet-edit' }).
		when('/jobs', { templateUrl: 'jobs.html' }).
        when('/jobSheet', { templateUrl: 'jobSheet.html' }).
		when('/photos', { templateUrl: 'photos.html' }).
		when('/reorder', { templateUrl: 'reorder.html' }).
		when('/servererror', { template: '<section class="open"><h1 class="appmsg">Error:<br>No server connection</h1></section>' }).
        otherwise({ redirectTo: '/' });
});



//--------------------------------------------------------------------------------------------------
// App CONTROLLER
// Controller for application or main controller. In this controller, we start the application and
// control animation for replacing views/pages.
//--------------------------------------------------------------------------------------------------
App.controller('AppCtrl', function ($scope, $location, $rootScope, $timeout, $http, $messaging, $timesheet, $route) {
    //START();
    $rootScope.loaded = true;		// This hide loader and show header, footer, pages...
    $rootScope.state = '';		// State of view/page (open, close)
    $rootScope.navigation = true;	// Showing navigation
    $scope.history = [''];		// Need only for back function
    $scope.$route = $route;
    //$scope.company_id='kore';	// Company id
    //$scope.user_id='chris';		// user id

    $rootScope.userData = {};		// Compleat user data

    // Load user data
    function getMaster() {
        $http({ method: 'GET', url: CONFIG.gatMasterURL() + '?company=' + $scope.company_id + '&user=' + $scope.user_id }).
		success(function (data) {
		    // debugger;
		    $rootScope.userData = data;
		    if (data.user.length > 10) {
		        $scope.user_name = data.user.substring(0, 10) + '...';
		    } else {
		        $scope.user_name = data.user;
		    }
		    $scope.user_id = data.userid;
		    if (data.company.length > 10) {
		        $scope.company_name = data.company.substring(0, 10) + '...';
		    } else {
		        $scope.company_name = data.company;
		    }
		    $scope.company_id = data.companyid;
		    $timesheet.setData = data.messages;
		    $messaging.startSync();		// Start messaging synchronization
		    $timesheet.update(data);
		}).
		error(function () {
		    $scope.goTo('servererror');
		});
    };
    getMaster();

    // Open new view/page
    $scope.goTo = function (src) {
        if (src === $scope.history[$scope.history.length - 1]) { return; }

        // Closing dropdown menu in header
        $scope.toggleC = $scope.toggleW = false;

        $rootScope.state = 'close';
        $timeout(function () {
            $rootScope.state = '';

            if (src === 'back') {
                $scope.history.pop();
                src = $scope.history.pop();
            }

            $scope.history.push(src);
            $location.path(src).replace();
            $rootScope.$apply();
        }, CONFIG.gatTransitionDuration());
        $rootScope.navigation = true;
    };

    // Opening page when page is ready
    $scope.ready = function () {
        $rootScope.state = '';
        $timeout(function () {
            $rootScope.state = 'open';
            $rootScope.$apply();
        }, 50);
    };

    $scope.logout = function () {
        //$location.path("/logout");
        window.location.replace("/login.aspx?act=Xl/LUMvkln8=");
    };
});



//--------------------------------------------------------------------------------------------------
// Main Menu CONTROLLER
// Home page
//--------------------------------------------------------------------------------------------------
App.controller('MainMenuCtrl', function ($scope, $rootScope) {
    $scope.ready();
    $rootScope.navigation = false;
});



//--------------------------------------------------------------------------------------------------
// Sending Message CONTROLLER
// When called this view/page (via URL) you send a address of the sender (eg sending/chris)
// and this page go to "Reply mode". If you call this without address (eg sending/),
// page go to "New message mode"
//--------------------------------------------------------------------------------------------------
App.controller('SendingCtrl', function ($scope, $rootScope, $routeParams, $http, $timeout) {
    $scope.ready();
    $rootScope.navigation = false;

    $scope.msg = '';
    $scope.finish = false;
    $scope.sendingTo = $routeParams.to;
    $scope.reply = $routeParams.to === '' ? false : true;

    // Sending messagess
    $scope.sendMsg = function () {
        $scope.sendingTo;	// Address of the sender
        $scope.textMsg;		// Message

        $scope.process = true;
        // Real sending process
        /*
		$http({method:'GET', url:CONFIG.gatSendingURL()+'?'+$scope.sendingTo+'&'+$scope.textMsg}).
		success(function(data) {
			$scope.msg=data;	// Back info of sending (eg 'Message has been sent' or some error message)

			// Show message and after 0.5 sec goto Home page
			$scope.finish=true;
			$timeout(function() {
				$scope.goTo('');
			}, 500);
		}).
		error(function() {
			$scope.msg='Sending error';

			// Show message and after 0.5 sec goto Home page
			$scope.finish=true;
			$timeout(function() {
				$scope.goTo('');
			}, 500);
		});
		*/

        // Simulation of sending messages
        $timeout(function () {
            $scope.msg = 'Message has been sent';

            // Show message and after 0.5 sec goto Home page
            $scope.finish = true;
            $timeout(function () {
                $scope.goTo('home');
            }, 500);
        }, 1500);
    };
});



//--------------------------------------------------------------------------------------------------
// Time Sheet CONTROLLER
//--------------------------------------------------------------------------------------------------
App.controller('TimeSheetCtrl', function ($http, $scope, $timesheet, $rootScope, ProjectJobService) {
    $scope.ready();
    $rootScope.loaded = false;

    var aDate = new Date();
    // UTC time in msec
    var utc = aDate.getTime() + (aDate.getTimezoneOffset() * 60000);
    // Date object for the requested city
    var newdate = new Date(utc + (3600000 * 12));

    $scope.date = newdate;
    $scope.currentDate = new Date($scope.date.getFullYear(), $scope.date.getMonth(), $scope.date.getDate());
    $scope.IsJobSelected = false;
    
    // Load user data
    // Load user data
    var requestJob = { UserId: $scope.user_id, ProjectID: 1, JobID: 1, param1: '', param2: '', param3: '', param4: '', param5: '', picFile: '', picText: '', Flag: 'GetJob' };//{ UserId: 'fname' };
    var config = {
        headers: {
            "Content-Type": "application/json; charset=utf-8"
        }
    }
    $http.post('Default.aspx/CRUDMobActivity', requestJob, config).success(function (data, status, headers, config) {
        $scope.Jobs = jQuery.parseJSON(data.d);

        var isJobIDExists = false;
        if ($scope.Jobs.length > 0) {
            if (ProjectJobService.JobId > 0) {
                for (var i = 0; i < $scope.Jobs.length; i++) {
                    if ($scope.Jobs[i].ID == ProjectJobService.JobId) {
                        $scope.ModJobs = $scope.Jobs[i].ID;
                        isJobIDExists = true;
                        break;
                    }
                }
            }

            if (!isJobIDExists) {
                $scope.ModJobs = $scope.Jobs[0].ID;
            }
            $scope.IsJobSelected = true;

            $http({ method: 'GET', url: CONFIG.gatMasterURL() + '?company=' + $scope.company_id + '&user=' + $scope.user_id + '&jobid=' + $scope.ModJobs }).success(function (data) {
                $timesheet.update(data);

                $scope.day = $timesheet.getWeek(0);
                $scope.closed = $timesheet.isClosed();

                $.each($scope.day, function (index, value) {
                    if ($scope.day[index].date != null) {
                        $scope.day[index].isValidDate = new Date(parseInt($scope.day[index].date.split("/")[2]), parseInt($scope.day[index].date.split("/")[1]) - 1, parseInt($scope.day[index].date.split("/")[0])) <= $scope.currentDate ? 'true' : 'false';
                    }
                });

                var a = $scope.day[0].date.split('/'),
                        d = new Date(a[2], parseInt(a[1]) - 1, parseInt(a[0]) + 7),
                        r = d.getDate() + '/' + (parseInt(d.getMonth()) + 1) + '/' + d.getFullYear();

                $scope.getNextPayday = r;
                $rootScope.loaded = true;
            }).error(function () {
                $rootScope.loaded = true;
                $scope.goTo('servererror');
            });
        }
    }).error(function (data, status, headers, config) {
        $rootScope.loaded = true;
        $scope.goTo('servererror');
    });


    $scope.OnJobChange = function () {
        $scope.IsJobSelected = false;
        if ($scope.ModJobs > 0) {
            ProjectJobService.JobId = $scope.ModJobs;
            $rootScope.loaded = false;
            $http({ method: 'GET', url: CONFIG.gatMasterURL() + '?company=' + $scope.company_id + '&user=' + $scope.user_id + '&jobid=' + $scope.ModJobs }).success(function (data) {
                $timesheet.update(data);

                $scope.day = $timesheet.getWeek(0);
                $scope.closed = $timesheet.isClosed();

                $.each($scope.day, function (index, value) {
                    if ($scope.day[index].date != null) {
                        $scope.day[index].isValidDate = new Date(parseInt($scope.day[index].date.split("/")[2]), parseInt($scope.day[index].date.split("/")[1]) - 1, parseInt($scope.day[index].date.split("/")[0])) <= $scope.currentDate ? 'true' : 'false';
                    }
                });

                var a = $scope.day[0].date.split('/'),
                        d = new Date(a[2], parseInt(a[1]) - 1, parseInt(a[0]) + 7),
                        r = d.getDate() + '/' + (parseInt(d.getMonth()) + 1) + '/' + d.getFullYear();

                $scope.getNextPayday = r;
                $scope.IsJobSelected = true;
                $rootScope.loaded = true;
            }).error(function () {
                $rootScope.loaded = true;
                $scope.goTo('servererror');
                $scope.IsJobSelected = true;
            });
        }
    };

    $scope.getTotal = function () {
        var r = 0;
        for (var i = 0; i < 7; i = i + 1) {
            if ($scope.day != null) {
                r += $timesheet.convertTime($scope.day[i].value);
            }
        }
        return $timesheet.roundTime(r);
    };


    $scope.getTotalHours = function () {
        var r = 0.00;
        for (var i = 0; i < 7; i = i + 1) {
            if ($scope.day != null) {
                r += parseFloat($scope.day[i].value);
            }
        }
        return r;
    };

    //$scope.getNextPayday = function () {
    //    //debugger;
    //    var a = $scope.day[0].date.split('/'),
    //		d = new Date(a[2], parseInt(a[1]) - 1, parseInt(a[0]) + 7),
    //		r = d.getDate() + '/' + (parseInt(d.getMonth()) + 1) + '/' + d.getFullYear();
    //    return r;
    //};

    $scope.getPrevWeek = function () {
        $scope.day = $timesheet.getWeek(-1);
        $scope.closed = $timesheet.isClosed();

        $.each($scope.day, function (index, value) {
            if ($scope.day[index].date != null) {
                $scope.day[index].isValidDate = new Date(parseInt($scope.day[index].date.split("/")[2]), parseInt($scope.day[index].date.split("/")[1]) - 1, parseInt($scope.day[index].date.split("/")[0])) <= $scope.currentDate ? 'true' : 'false';
            }
        });

        var x = $scope.day[0].date.split('/'),
			y = new Date(x[2], parseInt(x[1]) - 1, parseInt(x[0]) + 7),
			z = y.getDate() + '/' + (parseInt(y.getMonth()) + 1) + '/' + y.getFullYear();

        $scope.getNextPayday = z;

    };
    $scope.getNextWeek = function () {
        $scope.day = $timesheet.getWeek(1);
        $scope.closed = $timesheet.isClosed();

        $.each($scope.day, function (index, value) {
            if ($scope.day[index].date != null) {
                $scope.day[index].isValidDate = new Date(parseInt($scope.day[index].date.split("/")[2]), parseInt($scope.day[index].date.split("/")[1]) - 1, parseInt($scope.day[index].date.split("/")[0])) <= $scope.currentDate ? 'true' : 'false';
            }
        });

        var x = $scope.day[0].date.split('/'),
			y = new Date(x[2], parseInt(x[1]) - 1, parseInt(x[0]) + 7),
			z = y.getDate() + '/' + (parseInt(y.getMonth()) + 1) + '/' + y.getFullYear();

        $scope.getNextPayday = z;

    };
});



//--------------------------------------------------------------------------------------------------
// Time Sheet Edit CONTROLLER
//--------------------------------------------------------------------------------------------------
App.controller('TimeSheetEditCtrl', function ($scope, $routeParams, $rootScope, $timeout, $http, $messaging, $timesheet) {
    $scope.ready();
    //debugger;
    // OnClickGreetings();


    var jobid = $routeParams.jobid;
    var day = $timesheet.getDay($routeParams.day),
		hours = day.hours;
    dateDay = day.date;
    dateName = day.name;
    $scope.start = hours.s;
    $scope.finish = hours.f;
    $scope.startLunch = hours.sl;
    $scope.finishLunch = hours.fl;
    $scope.dateDay = dateDay;
    $scope.dateName = dateName;
    //$scope.ViewSubTotal = 'true';
    $scope.ViewSubTotal = 'false';

    $scope.convertTime = $timesheet.convertTime;
    $scope.roundTime = $timesheet.roundTime;
    //debugger;
    $scope.appName = day.date;
    $scope.getTotal = function () {
        //var r = $timesheet.convertTime(day.value);
        var r = day.value;
        if (r <= 0 || r === 'NaN') {
            return '';
        }
        else {
            $scope.ViewSubTotal = 'false';
            //return $timesheet.roundTime(r);
            return r;
        }
    };


    $scope.OnClickGreetingsAJ = function () {
        var data = { JobId: jobid, TimeSheetDate: dateDay, UserID: $scope.user_id, CompanyID: $scope.company_id, WorkStartTime: $scope.start, LunchStartTime: $scope.startLunch, LunchEndTime: $scope.finishLunch, WorkEndTime: $scope.finish, m_Description: $scope.Description || '' };
        var config = {
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            }
        }

        $http.post('MobileService.asmx/AddTimeSheet', data, config)
            .success(function (data, status, headers, config) {
                $scope.goTo('timesheet');
            })
            .error(function (data, status, headers, config) {
                if (data.Message == "TIME_ALREADY_USED_IN_ANOTHER_JOB") {
                    alert('Selected time is used in another job.');
                    return false;
                } else {
                    alert("Unknown error ocurred.");
                }
                $scope.status = status;
            });
    }


    $scope.DeleteTimesheetEntry = function () {
        var data = { JobId: jobid, TimeSheetDate: dateDay, UserID: $scope.user_id, CompanyID: $scope.company_id};
        var config = {
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            }
        }

        $http.post('MobileService.asmx/DeleteTimeSheet', data, config)
            .success(function (data, status, headers, config) {
                $scope.goTo('timesheet');
            })
            .error(function (data, status, headers, config) {
                if (data.Message == "TIME_SHEET_IS_CLOSED") {
                    alert('You are not allowed to delete timesheet entry because it is closed by project owner.');
                    return false;
                } else if (data.Message == "TIMESHEET_ENTRY_DOES_NOT_EXISTS") {
                    alert('Timesheet entry does not exists.');
                    return false;
                } else {
                    alert("Unknown error ocurred.");
                }
                $scope.status = status;
            });
    }


    // Load user data
    function getMaster() {
        $http({ method: 'GET', url: CONFIG.gatMasterURL() + '?company=' + $scope.company_id + '&user=' + $scope.user_id }).
        success(function (data) {
            $rootScope.userData = data;
            $scope.user_name = data.user;
            $scope.user_id = data.userid;
            $scope.company_name = data.company;
            $scope.company_id = data.companyid;
            $timesheet.setData = data.messages;
            $messaging.startSync();		// Start messaging synchronization
            $timesheet.update(data);
        }).
        error(function () {
            $scope.goTo('servererror');
        });
    };

    $scope.done = function () {
        if ($scope.start === hours.s &&
			$scope.finish === hours.f &&
			$scope.startLunch === hours.sl &&
			$scope.finishLunch === hours.fl
		) {
            $scope.goTo('timesheet');
            return;
        }
        $timesheet.setDay({
            total: $scope.getTotal(),
            start: $scope.start,
            finish: $scope.finish,
            startLunch: $scope.startLunch,
            finishLunch: $scope.finishLunch
        });

        $timeout(function () {
            $scope.goTo('timesheet');
        }, 1000);
    };

    // Date Time Picker break the 'AngularJS magic', so need fix it
    function updateTime() {
        $scope.start = $('input[ng-model="start"]').val();
        $scope.finish = $('input[ng-model="finish"]').val();
        $scope.startLunch = $('input[ng-model="startLunch"]').val();
        $scope.finishLunch = $('input[ng-model="finishLunch"]').val();
        $scope.$apply();
    };

    $('.datetimepicker').scroller({
        preset: 'time',
        theme: 'android',
        display: 'modal',
        mode: 'scroller',
        width: 100,
        onSelect: updateTime
    });

    var WorkStart = $('#WorkStart');
    var LunchStart = $('#LunchStart');
    var LunchEnd = $('#LunchEnd');
    var WorkEnd = $('#WorkEnd');

    WorkStart.bind("change paste keyup", function () {
        if ($scope.ViewSubTotal == 'true') {
            LunchStart.val($(this).val());
            LunchEnd.val($(this).val());
            WorkEnd.val($(this).val());
        }
    });

    LunchStart.bind("change paste keyup", function () {
        if ($scope.ViewSubTotal == 'true') {
            LunchEnd.val($(this).val());
            WorkEnd.val($(this).val());
        }
    });

    LunchEnd.bind("change paste keyup", function () {
        if ($scope.ViewSubTotal == 'true') {
            WorkEnd.val($(this).val());
        }
    });
});



//--------------------------------------------------------------------------------------------------
// Jobs CONTROLLER
//--------------------------------------------------------------------------------------------------

App.controller('JobsCtrl', function ($scope, $routeParams, $rootScope, $timeout, $http, $messaging, ProjectJobService) {
    $scope.ready();
    $scope.appName = 'Jobs';
    $scope.ModProjects = undefined;

    $http({ method: 'GET', url: CONFIG.gatMasterURL() + '?company=' + $scope.company_id + '&user=' + $scope.user_id }).
            success(function (data) {
                $scope.user_id = data.userid;
                $scope.company_id = data.companyid;
            }).
        error(function () {
            $scope.goTo('servererror');
        });

    // New logic

    $scope.isVisible = false;
    $scope.isJobSheetVisible = true;
    $scope.isSubmitVisible = false;
    //End

    //$scope.GetJob = function () {
    //debugger;
    if ($scope.ModProjects != undefined) {
        alert('Select project...');
    }
    else {
        $scope.isVisible = false;
        $scope.isJobSheetVisible = true;
        $scope.isJobSheetDeailVisible = false;


        // var requestJob = { UserId: $scope.user_id, ProjectID: $scope.ModProjects, JobID: 1, param1: '', param2: '', param3: '', param4: '', param5: '', picFile: '', picText: '', Flag: 'GetJob' };//{ UserId: 'fname' };
        var requestJob = { UserId: $scope.user_id, ProjectID: 1, JobID: 1, param1: '', param2: '', param3: '', param4: '', param5: '', picFile: '', picText: '', Flag: 'GetJob' };//{ UserId: 'fname' };
        var config = {
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            }
        }


        $http.post('Default.aspx/CRUDMobActivity', requestJob, config)
            .success(function (data, status, headers, config) {
                //  $scope.retData.result = data.d;
                $scope.Jobs = jQuery.parseJSON(data.d);
                //debugger;
                var s = jQuery.parseJSON(data.d);
                $.each(s, function (index, value) {
                    $scope.projectCode = value.ProjectCode;
                    //debugger;
                });

                // debugger;
            })
            .error(function (data, status, headers, config) {
                $scope.status = status;
            });

    }

    //}


    $scope.OnClickGetJob = function () {
        ProjectJobService.JobId = $scope.ModJobs;
        $scope.isSubmitVisible = true;
        $scope.isJobSheetDeailVisible = true;
        //$scope.goTo('jobSheet');
        // debugger;
        //var k = $scope.ModProjectGroups;
        // debugger;



        //var requestJobStatus = { UserId: $scope.user_id, ProjectID: $scope.ModProjects, JobID: 1, param1: '', param2: '', param3: '', param4: '', param5: '', picFile: '', picText: '', Flag: 'GetJobStatus' };//{ UserId: 'fname' };
        var requestJobStatus = { UserId: $scope.user_id, ProjectID: 1, JobID: 1, param1: '', param2: '', param3: '', param4: '', param5: '', picFile: '', picText: '', Flag: 'GetJobStatus' };//{ UserId: 'fname' };
        var config = {
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            }
        }


        $http.post('Default.aspx/CRUDMobActivity', requestJobStatus, config)
            .success(function (data, status, headers, config) {
                //  $scope.retData.result = data.d;
                $scope.JobStatus = jQuery.parseJSON(data.d);



                // debugger;
            })
            .error(function (data, status, headers, config) {
                $scope.status = status;
            });


        //        var requestJobSheet = { UserId: $scope.user_id, ProjectID: $scope.ModProjects, JobID: $scope.ModJobs, param1: '', param2: '', param3: '', param4: '', param5: '', picFile: '', picText: '', Flag: 'JobSheet' };//{ UserId: 'fname' };
        var requestJobSheet = { UserId: $scope.user_id, ProjectID: 1, JobID: $scope.ModJobs, param1: '', param2: '', param3: '', param4: '', param5: '', picFile: '', picText: '', Flag: 'JobSheet' };//{ UserId: 'fname' };
        var config = {
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            }
        }


        $http.post('Default.aspx/CRUDMobActivity', requestJobSheet, config)
            .success(function (data, status, headers, config) {
                //  $scope.retData.result = data.d;
                $scope.jobSheet = jQuery.parseJSON(data.d);
                var s = jQuery.parseJSON(data.d);

                $.each(s, function (index, value) {

                    $scope.ModJobStatus = value.Status;
                    $scope.JobNote = value.Note

                });


            })
            .error(function (data, status, headers, config) {
                $scope.status = status;

            });


    }


    $scope.UpdateJobStatus = function () {

        // debugger;
        var k = $scope.JobNote;
        //var requestUpdateJobStatus = { UserId: $scope.user_id, ProjectID: $scope.ModProjects, JobID: $scope.ModJobs, param1: $scope.ModJobStatus, param2: '$scope.JobNote', param3: '', param4: '', param5: '', picFile: '', picText: '', Flag: 'UpdateJobStatus' };//{ UserId: 'fname' };
        var requestUpdateJobStatus = { UserId: $scope.user_id, ProjectID: 1, JobID: $scope.ModJobs, param1: $scope.ModJobStatus, param2: $scope.JobNote, param3: '', param4: '', param5: '', picFile: '', picText: '', Flag: 'UpdateJobStatus' };//{ UserId: 'fname' };
        var config = {
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            }
        }

        $http.post('Default.aspx/CRUDMobActivity', requestUpdateJobStatus, config)
            .success(function (data, status, headers, config) {
                //  $scope.retData.result = data.d;
                $scope.resultUpdateJobStatus = jQuery.parseJSON(data.d);
                $scope.goTo('');
                //debugger;
            })
            .error(function (data, status, headers, config) {
                $scope.status = status;
            });
    }

});



//--------------------------------------------------------------------------------------------------
// Photos CONTROLLER
//--------------------------------------------------------------------------------------------------
App.controller('PhotosCtrl', function ($scope, $routeParams, $rootScope, $timeout, $http, $messaging, ProjectJobService) {
    $scope.IsJobSelected = false;
    $scope.formdata = new FormData();
    $scope.getTheFiles = function ($files) {
        angular.forEach($files, function (value, key) {
            $scope.formdata.append(key, value);
        });
    };

    function updateTime() {
        $scope.start = $('input[ng-model="start"]').val();
        $scope.$apply();
    };

    $('.datetimepicker').scroller({
        preset: 'date',
        theme: 'android',
        display: 'modal',
        mode: 'scroller',
        width: 100,
        onSelect: updateTime
    });

    var WorkStart = $('#WorkStart');
    WorkStart.bind("change paste keyup", function () {
        if ($scope.ViewSubTotal == 'true') {
            LunchStart.val($(this).val());
        }
    });

    var requestJob = { UserId: $scope.user_id, ProjectID: 1, JobID: 1, param1: '', param2: '', param3: '', param4: '', param5: '', picFile: '', picText: '', Flag: 'GetJob' };//{ UserId: 'fname' };
    var config = {
        headers: {
            "Content-Type": "application/json; charset=utf-8"
        }
    }

    $http({ method: 'GET', url: CONFIG.gatMasterURL() + '?company=' + $scope.company_id + '&user=' + $scope.user_id }).
           success(function (data) {
               $scope.user_id = data.userid;
               $scope.company_id = data.companyid;
           }).
       error(function () {
           $scope.goTo('servererror');
       });

    $http.post('Default.aspx/CRUDMobActivity', requestJob, config).success(function (data, status, headers, config) {
        $scope.Jobs = jQuery.parseJSON(data.d);

        var isJobIDExists = false;
        if ($scope.Jobs.length > 0) {
            if (ProjectJobService.JobId > 0) {
                for (var i = 0; i < $scope.Jobs.length; i++) {
                    if ($scope.Jobs[i].ID == ProjectJobService.JobId) {
                        $scope.ModJobs = $scope.Jobs[i].ID;
                        isJobIDExists = true;
                        break;
                    }
                }
            }

            if (!isJobIDExists) {
                $scope.ModJobs = $scope.Jobs[0].ID;
            }
            $scope.IsJobSelected = true;

            
        }
    }).error(function (data, status, headers, config) {
        $rootScope.loaded = true;
        $scope.goTo('servererror');
    });

    $scope.OnJobChange = function () {
        $scope.IsJobSelected = false;
        if ($scope.ModJobs > 0) {
            ProjectJobService.JobId = $scope.ModJobs;
            $scope.IsJobSelected = true;
        }
    }


    $scope.UploadPhoto = function () {


        var requestProjectGroups = { UserId: $scope.user_id, ProjectID: 0, JobID: 0, param1: $scope.start, param2: $scope.Description, param3: '', param4: '', param5: '', picFile: '', picText: '', Flag: 'PhotoUpload' };//{ UserId: 'fname' };
        var config = {
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            }
        }

        if ($scope.start != undefined) {
            $http.post('Default.aspx/CRUDMobActivity', requestProjectGroups, config)
                .success(function (data, status, headers, config) {
                    $scope.ProjectGroups = jQuery.parseJSON(data.d);

                })
                .error(function (data, status, headers, config) {
                    $scope.status = status;
                });
        }
        else {
            alert('Select date...');

        }
    }


    $scope.NewUploadPhotos = function () {
        $(".overlay").show();

        if ($scope.start == undefined) {
            $(".overlay").hide();
            alert('Select date.');
            return;
        } else if ($scope.ModJobs <= 0) {
            $(".overlay").hide();
            alert('Select project job.');
            return;
        } else {
            $scope.formdata.append("UserId", $scope.user_id);
            $scope.formdata.append("Description", $scope.Description || '');
            $scope.formdata.append("Date", $scope.start);
            $scope.formdata.append("JobId", $scope.ModJobs);

            $.ajax({
                url: "PhotoUploadHandler.ashx",
                type: "POST",
                data: $scope.formdata,
                contentType: false,
                processData: false,
                //async: false,
                success: function (result) { $(".overlay").hide(); $scope.goTo(''); },
                error: function (jqXHR, exception) {
                    $(".overlay").hide();
                    var msg = '';
                    if (jqXHR.status === 0) {
                        msg = 'Not connect.\n Verify Network.';
                    } else if (jqXHR.status == 404) {
                        msg = 'Requested page not found. [404]';
                    } else if (jqXHR.status == 500) {
                        msg = 'Internal Server Error [500].';
                    } else if (exception === 'parsererror') {
                        msg = 'Requested JSON parse failed.';
                    } else if (exception === 'timeout') {
                        msg = 'Time out error.';
                    } else if (exception === 'abort') {
                        msg = 'Ajax request aborted.';
                    } else {
                        msg = 'Uncaught Error.\n' + jqXHR.responseText;
                    }
                    $('#post').html(msg);
                }
            });
            evt.preventDefault();
        }
    }

    $scope.ready();
    $scope.appName = 'Photos';
    $scope.start = undefined;



    $scope.name = undefined;
    $scope.preview = function () {
        alert($scope.name);
    };
    $scope.update = function () {
        alert("Updated");
    }

});


//--------------------------------------------------------------------------------------------------
// Reorder CONTROLLER
//--------------------------------------------------------------------------------------------------
App.controller('ReorderCtrl', function ($scope, $routeParams, $rootScope, $timeout, $http, $messaging, ProjectJobService) {
    $scope.ready();
    $scope.appName = 'Reorder';
    $scope.IsJobSelected = false;

    var requestJob = { UserId: $scope.user_id, ProjectID: 1, JobID: 1, param1: '', param2: '', param3: '', param4: '', param5: '', picFile: '', picText: '', Flag: 'GetJob' };//{ UserId: 'fname' };
    var config = {
        headers: {
            "Content-Type": "application/json; charset=utf-8"
        }
    }

    $http.post('Default.aspx/CRUDMobActivity', requestJob, config).success(function (data, status, headers, config) {
        $scope.Jobs = jQuery.parseJSON(data.d);

        var isJobIDExists = false;
        if ($scope.Jobs.length > 0) {
            if (ProjectJobService.JobId > 0) {
                for (var i = 0; i < $scope.Jobs.length; i++) {
                    if ($scope.Jobs[i].ID == ProjectJobService.JobId) {
                        $scope.ModJobs = $scope.Jobs[i].ID;
                        isJobIDExists = true;
                        break;
                    }
                }
            }

            if (!isJobIDExists) {
                $scope.ModJobs = $scope.Jobs[0].ID;
            }
            $scope.IsJobSelected = true;


        }
    }).error(function (data, status, headers, config) {
        $rootScope.loaded = true;
        $scope.goTo('servererror');
    });

    $scope.OnJobChange = function () {
        $scope.IsJobSelected = false;
        if ($scope.ModJobs > 0) {
            ProjectJobService.JobId = $scope.ModJobs;
            $scope.IsJobSelected = true;
        }
    }

    $scope.Reorder = undefined;

    $scope.OnClickReorder = function () {
        if ($scope.ModJobs <= 0) {
            alert('Select project job.');
            return;
        } else if ($scope.Reorder != undefined) {
            CreateMobReorder($scope.user_id, $scope.ModJobs, $scope.Reorder, $scope.company_id)
            $scope.goTo('reorder');
        }
    }
});


App.directive('ngFiles', ['$parse', function ($parse) {

    function fn_link(scope, element, attrs) {
        var onChange = $parse(attrs.ngFiles);
        element.on('change', function (event) {
            onChange(scope, { $files: event.target.files });
        });
    };

    return {
        link: fn_link
    }
}]);


