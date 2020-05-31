/**
 * Created by felixjin on 2016/12/4.
 */
app.controller('MyUnRecordCtrl', ['$scope', '$localStorage', '$state', 'HttpService', 'REST_URL', '$modal', 'DialogService', '$q', ($scope, $localStorage, $state, HttpService, REST_URL, $modal, DialogService, $q) => {
    if ($localStorage.loginuser.position == "护士"){
        
    } else if ($localStorage.loginuser.position == "医生") {
        $state.go('app.table.myRecord')
    } else {
        $state.go('access.signin')
    }
    $scope.rowCollectionPage = [];


    //  pagination
    $scope.itemsByPage = 5;

    function render() {
        HttpService.post(REST_URL.query, { fcn: "querySignRecord", args: [$localStorage.loginuser.orgname, $localStorage.loginuser.pin.toString()] }).then(response => {
            $scope.rowCollectionPage = JSON.parse(response.data.message).reverse();
            $scope.loginuser = $localStorage.loginuser;
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        });
    }

    render();

    $scope.view = record => {
        HttpService.post(REST_URL.query, { fcn: "queryByRid", args: [record.R_id] }).then(response => {
            var record = JSON.parse(response.data.message);
            $scope.item = record;

            $scope.item.historyList = record.Rhis;

            if (!$scope.$$phase) {
                $scope.$apply();
            }

            open(record);
        });
    }

    function open(record) {
        var modalInstance = $modal.open({
            templateUrl: 'myUnRecordInfo.html',
            controller: 'MyUnRecordModalInstanceCtrl',
            size: 'lg',
            resolve: {
                HttpService: () => {
                    return HttpService;
                },
                REST_URL: () => {
                    return REST_URL;
                },
                item: () => {
                    return $scope.item;
                }
            }
        });

        modalInstance.result.then((selected) => {
            // endr request
            var actionStr = '已';
            var fcn = '';
            var url = REST_URL.invoke;
            if (selected.action == 'SU00') {
                actionStr = '签名';
                if (record.P_bih) {
                    url = REST_URL.tkbedr;
                } else {
                    fcn = 'acceptSign';
                }
            } else if (selected.action == 'SU01') {
                actionStr = '更新记录';
                fcn = 'updateRecd';
            } else if (selected.action == 'SU02') {
                openr(selected);
                return;
            } else if (selected.action == 'SU03') {
                opent(selected);
                return;
            } else if (selected.action == 'SU04') {
                actionStr = '分配病房';
                url = REST_URL.gvbedr;
            }
            HttpService.post(url, { fcn: fcn, args: [JSON.stringify(selected.item)] }).then(response => {
                DialogService.open('infoDialog', {
                    scope: $scope,
                    title: "已" + actionStr,
                    message: actionStr + "成功",
                    onOk: function (value) {

                    },
                    onCancel: function (value) {
                        // do nothing
                    }
                });
            });
        }, () => {
        });
    }
    function openr(record) {
        var modalInstance = $modal.open({
            templateUrl: 'rejectSignInfo.html',
            controller: 'MyRejectSignCtrl',
            size: 'md',
            resolve: {
                item: () => {
                    return $scope.item;
                }
            }
        });

        modalInstance.result.then((selected) => {
            // endr request
            var actionStr = '拒签';
            var fcn = 'rejectSign';
            var url = REST_URL.invoke;
            if (selected.action == 'SU00') {
                HttpService.post(url, { fcn: fcn, args: [JSON.stringify(selected.item)] }).then(response => {
                    DialogService.open('infoDialog', {
                        scope: $scope,
                        title: "已" + actionStr,
                        message: actionStr + "成功",
                        onOk: function (value) {

                        },
                        onCancel: function (value) {
                            // do nothing
                        }
                    });
                });
            }
        }, () => {
        });
    }
    function opent(record) {
        var modalInstance = $modal.open({
            templateUrl: 'requireTranInfo.html',
            controller: 'MyRequireTranCtrl',
            size: 'md',
            resolve: {
                item: () => {
                    return $scope.item;
                }
            }
        });

        modalInstance.result.then((selected) => {
            // endr request
            var actionStr = '请求转院';
            var fcn = 'requireTrans';
            var url = REST_URL.invoke;
            if (selected.action == 'SU00') {
                HttpService.post(url, { fcn: fcn, args: [JSON.stringify(selected.item)] }).then(response => {
                    DialogService.open('infoDialog', {
                        scope: $scope,
                        title: "已" + actionStr,
                        message: actionStr + "成功",
                        onOk: (value) => {

                        },
                        onCancel: (value) => {
                            // do nothing
                        }
                    });
                });
            }
        }, () => {
        });
    }
}]);

app.controller('MyUnRecordModalInstanceCtrl', ['$scope', '$localStorage', '$modalInstance', '$state', 'HttpService', 'REST_URL', '$q', 'item', ($scope, $localStorage, $modalInstance, $state, HttpService, REST_URL, $q, item) => {
    $scope.item = item;
    $scope.selected = {
        item: $scope.item
    };
    var bedlist;
    $scope.visable = $scope.item.P_ward == '' ? true : false;
    $scope.selectbedfloorlist = new Array();
    $scope.selectbedroomlist = new Array();
    $scope.selectbedlist = new Array();
    if ($scope.visable) {
        HttpService.post(REST_URL.gbeds, {}).then(response => {

            bedlist = JSON.parse(response.data.bedlist);
            for (let i = 0; i < bedlist.length; i++) {
                let bf = bedlist[i];
                let floor = bf.floor;
                if ($scope.selectbedlist.length = 0) {
                    $scope.selectbedfloorlist.push(floor);
                } else if (floor != $scope.selectbedfloorlist[$scope.selectbedfloorlist.length - 1]) {
                    $scope.selectbedfloorlist.push(floor);
                }
            }
            $scope.changeRoomlist(bedlist[0].floor);
            $scope.changeBedlist(bedlist[0].floor, bedlist[0].room);
            $scope.item.P_ward = bedlist[0].bedid;
            //console.log(bedlist[0].floor + bedlist[0].room)
        });
    }
    $scope.changeRoomlist = (floor) => {
        $scope.selectbedroomlist = new Array();
        for (let i = 0; i < bedlist.length; i++) {
            let br = bedlist[i];
            let room = br.room;
            if ($scope.selectbedroomlist.length == 0) {
                $scope.selectbedroomlist.push(room)
            } else if (br.floor == floor & room != $scope.selectbedroomlist[$scope.selectbedroomlist.length - 1]) {
                $scope.selectbedroomlist.push(room)
            }
        }
    };
    $scope.changeBedlist = (floor, room) => {
        $scope.selectbedlist = new Array();
        for (let i = 0; i < bedlist.length; i++) {
            let bd = bedlist[i];
            let bed = bd.bedid;
            if ($scope.selectbedlist.length == 0 && bd.floor == floor & bd.room == room) {
                $scope.selectbedlist.push(bed)
            } else if (bd.floor == floor & bd.room == room) {
                $scope.selectbedlist.push(bed)
            }
        }
    };
    $scope.saveBed = (bed) => {
        $scope.selected.item.P_ward = bed;
    };
    $scope.ok = (action) => {

        $scope.selected.action = action;

        $modalInstance.close($scope.selected);
    };

    $scope.cancel = () => {
        $modalInstance.dismiss('cancel');
    };
}]);

app.controller('MyRejectSignCtrl', ['$scope', '$modalInstance', 'item', function ($scope, $modalInstance, item) {
    $scope.item = item;
    $scope.selected = {
        item: $scope.item
    };

    $scope.ok = function (action) {

        $scope.selected.action = action;

        $modalInstance.close($scope.selected);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);

app.controller('MyRequireTranCtrl', ['$scope', '$modalInstance', 'item', function ($scope, $modalInstance, item) {
    $scope.item = item;
    $scope.selected = {
        item: $scope.item
    };

    $scope.ok = function (action) {
        //console.log($scope.selected.item.O_tnam)
        $scope.selected.item.P_ward = '';
        $scope.selected.action = action;

        $modalInstance.close($scope.selected);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);