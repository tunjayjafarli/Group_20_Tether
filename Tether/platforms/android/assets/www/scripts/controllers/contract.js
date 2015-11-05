/**
 * Created by Tunjay Jafarli on 2015-10-30.
 */

'use strict';

angular.module('tetherApp')
    .controller('contractCtrl',['$scope', '$location', function($scope, $location, $http,
                                                                $routeParams, $cordovaApplist,
                                                                $cordovaForegroundActivity){

        $scope.showButton = true;
        $scope.submitted = false;

        $scope.validHours = true;
        $scope.validAppSelection = true;


        $scope.contractHours;
        $scope.contractMinutes;
        $scope.contractSeconds;


        //Scope variables for monitoring
        $scope.blacklistedApps = [];
        $scope.foregroundApp = "";
        $scope.blacklistedAppUsed = "";


        $scope.createContract = function(){
            $location.path("/contract");
            $scope.showButton = false;

            var getInstalledAppEvent = new CustomEvent("getInstalledApps",{
                'bubbles': true,
                'cancelable': true
            });
            document.getElementById("startContract").dispatchEvent(getInstalledAppEvent);

        };


        document.addEventListener('getInstalledApps', function (){

            Applist.createEvent('','','','','',function(app_list){

                    document.getElementById('installedApps').innerHTML = '';

                    $.each(app_list, function () {
                        $("#installedApps").append($("<label>").text(this.name).prepend(
                            $("<input>").attr('type', 'checkbox').attr('id',(this.name))
                        ));
                    });

                    // try to format check boxes better?


                },

                function(app_list){
                    console.log("Fail:" + app_list);
                });

        });


        var contractJSON = '{"contract":{"apps":[],"durationInMins":0}}';

        $scope.submitContract = function(){

            var checkedBoxes = $(':checkbox:checked');

            $scope.blacklistedApps = [];

            var obj = JSON.parse(contractJSON);

            for (var i = 0; i < checkedBoxes.length; i++){

                obj["contract"]["apps"].push({"name":checkedBoxes[i].id});
                $scope.blacklistedApps.push(checkedBoxes[i].id);
                console.log(checkedBoxes.text());

            }

            // parse duration inputs
            var durationHrs = parseInt(document.getElementById("hrID").value);
            var durationMins = parseInt(document.getElementById("minID").value);
            var durationSecs = parseInt(document.getElementById("secID").value);

            //trying this -> test

            if ($scope.blacklistedApps.size < 1){
                console.log("User didn't choose any apps");
                $scope.validAppSelection = false;

            }

            if ((durationHrs * 60) + durationMins + (durationSecs / 60) == 0){
                // set new toast here requesting it is required
                //for testing
                console.log("Hour input denied");

                    $scope.validHours = false;

                return;
            } else {

                // convert to minutes and attach to contract JSON object
                var durationInMins = (durationHrs * 60) + durationMins + (durationSecs / 60);
                obj["contract"].durationInMins = durationInMins;
                $scope.validHours = true;
            }



            contractJSON = JSON.stringify(obj);
            console.log(JSON.stringify(contractJSON));

            $scope.submitted = true;
            $scope.ongoingContract = true;
            $scope.contractOver = false;

            $scope.startTimer();

        };


    $scope.startTimer = function() {

        var target_dateOld = new Date();

        var target_date = target_dateOld.setHours(target_dateOld.getHours() + $scope.contractHours);
        target_date = target_dateOld.setMinutes(target_dateOld.getMinutes() + $scope.contractMinutes);
        target_date = target_dateOld.setSeconds(target_dateOld.getSeconds() + $scope.contractSeconds);

        // variables for time units
        var days, hours, minutes, seconds, min, sec, ms, ms_step=1000;

        // get tag element
        var countdown = document.getElementById('countdown');

        $scope.refreshContractTimerIntervalId = setInterval(function () {
            var current_date = new Date().getTime();
            var seconds_left = (target_date - current_date) / 1000;
            days = parseInt(seconds_left / 86400);
            seconds_left = seconds_left % 86400;
            hours = parseInt(seconds_left / 3600);
            seconds_left = seconds_left % 3600;
            min = parseInt(seconds_left / 60);
            sec = parseInt(seconds_left % 60);
            ms = parseInt(target_date-current_date);

            // format countdown string + set tag value
            countdown.innerHTML = ''+
                '<span class="hours">'+hours+'<b>Hours</b></span><br>'+
                '<span class="minutes">'+min+'<b>Minutes</b></span><br>'+
                '<span class="seconds">'+sec+'<b>Seconds</b></span>';

            $scope.checkForegroundApp();

            // success when timer hits zero
            if (seconds_left <= 0) {
                clearInterval($scope.refreshContractTimerIntervalId);
                $scope.succeeded();
            }

        }, ms_step);


    };

        $scope.succeeded = function() {
            $scope.$apply(function(){
                $scope.ongoingContract = false;
                $scope.contractOver = true;
                $scope.contractSuccess = true;
                $scope.blacklistedApps = [];
            });

        };

        $scope.forfeit = function() {
            $scope.$apply(function(){
                $scope.ongoingContract = false;
                $scope.contractOver = true;
                $scope.contractSuccess = false;
                $scope.blacklistedApps = [];
            });
        };


        $scope.checkForegroundApp = function(){
          ForegroundActivity.createEvent('','','', function(foreground_app){
              $scope.foregroundApp = foreground_app;
              for (var i = 0; i < $scope.blacklistedApps.length; i++){
                  if ($scope.foregroundApp == $scope.blacklistedApps[i]){
                      clearInterval($scope.refreshContractTimerIntervalId);
                      $scope.$apply(function(){
                          $scope.blacklistedAppUsed = $scope.blacklistedApps[i];
                      });
                      $scope.forfeit();
                  }
              }
          }, function(foreground_app){
              console.log("Error" + foreground_app + "from GetForegound plugin")
          });
        };


        // add event listener for back button if ongoing contract is true pops up toast saying they can't use the app
        //since it will distract them


        /*
         $scope.contract = [contract: {apps:[ {name: "FB", img: xxx}, {name: "Google", img:yyy}], durationInMins:"30"}]
         */

    }]);

