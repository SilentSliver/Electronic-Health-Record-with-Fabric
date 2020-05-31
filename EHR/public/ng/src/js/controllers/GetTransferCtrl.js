app.controller('GetTransferCtrl', ['$scope', '$localStorage', '$state', 'HttpService', 'REST_URL', '$modal', 'DialogService', '$q', function ($scope, $localStorage, $state, HttpService, REST_URL, $modal, DialogService, $q) {
    if ($localStorage.loginuser.position == "医生"){
        
    } else if ($localStorage.loginuser.position == "护士") {
        $state.go('app.table.setMyTR')
    } else {
        $state.go('access.signin')
    }
    $scope.rowCollectionPage = [];

    //  pagination
    $scope.itemsByPage = 8;

    function render() {
        HttpService.post(REST_URL.query, { fcn: "queryBeTransferedRecord", args: [$localStorage.loginuser.orgname, $localStorage.loginuser.department] }).then(response => {
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
            $scope.item.historyList = record.R_his;
            if (!$scope.$$phase) {
                $scope.$apply();
            }
            open();
        });
    }

    function open() {
        var modalInstance = $modal.open({
            templateUrl: 'requireTRInfo.html',
            controller: 'RequireTRModalInstanceCtrl',
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
            if (selected.action == 'SU00') {
                opena();
                return;
            } else if (selected.action == 'SU01') {
                openr();
                return;
            }
        }, () => {
        });
    }
    function opena() {
        var modalInstance = $modal.open({
            templateUrl: 'acceptTRInfo.html',
            controller: 'AcceptTRCtrl',
            size: 'md',
            resolve: {
                item: () => {
                    return $scope.item;
                }
            }
        });

        modalInstance.result.then((selected) => {
            // endr request
            var actionStr = '接受';
            var fcn = 'acceptTrans';
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
    function openr() {
        var modalInstance = $modal.open({
            templateUrl: 'rejectTRInfo.html',
            controller: 'RejectTRCtrl',
            size: 'md',
            resolve: {
                item: () => {
                    return $scope.item;
                }
            }
        });

        modalInstance.result.then((selected) => {
            // endr request
            var actionStr = '拒绝';
            var fcn = 'rejectTrans';
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

app.controller('RequireTRModalInstanceCtrl', ['$scope', '$modalInstance', 'item', ($scope, $modalInstance, item) => {
    $scope.item = item;

    // for test hardcode add endr info
    $scope.historyList = item.historyList;
    $scope.itemsByPage = 5;

    $scope.selected = {
        item: $scope.item
    };
    $scope.ok = (action) => {

        $scope.selected.action = action;

        $modalInstance.close($scope.selected);
    };

    $scope.cancel = () => {
        $modalInstance.dismiss('cancel');
    };
}]);

app.controller('AcceptTRCtrl', ['$scope', '$localStorage', '$modalInstance', 'HttpService', 'REST_URL', 'item', ($scope, $localStorage, $modalInstance, HttpService, REST_URL, item) => {
    $scope.item = item;
    $scope.selected = {
        item: $scope.item
    };
    let pin = $localStorage.loginuser.pin;
    let name = $localStorage.loginuser.username;
    $scope.selected.item.O_adpn = pin.toString();
    $scope.selected.item.O_adnm = name;
    $scope.selected.item.D_pin = pin.toString();
    $scope.selected.item.D_name = name;
    HttpService.post(REST_URL.gusers, { position: "护士", orgname: $localStorage.loginuser.orgname }).then(response => {
        $scope.select_nurselist = new Array();
        nurselist = JSON.parse(response.data.userlist);
        for (let i = 0; i < nurselist.length; i++) {
            let n = nurselist[i];
            var nurse = { key1: n.pin, key2: n.username, value: n.pin + "-" + n.department + "-" + n.username };
            $scope.select_nurselist.push(nurse);
        }
    });
    $scope.ok = function (action) {
        $scope.selected.item.D_spin = "" + $scope.selected.select_nurse.key1;
        $scope.selected.item.D_snam = $scope.selected.select_nurse.key2;
        $scope.selected.action = action;

        $modalInstance.close($scope.selected);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);

app.controller('RejectTRCtrl', ['$scope', '$modalInstance', 'item', ($scope, $modalInstance, item) => {
    $scope.item = item;
    $scope.selected = {
        item: $scope.item
    };

    $scope.ok = function (action) {
        $scope.selected.item.P_ward = '';
        $scope.selected.action = action;

        $modalInstance.close($scope.selected);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);