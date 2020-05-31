/**
 * Created by felixjin on 2016/12/4.
 */
app.controller('AdminCtrl', ['$scope', '$localStorage', '$state', 'HttpService', 'REST_URL', '$modal', 'DialogService', '$q', ($scope, $localStorage, $state, HttpService, REST_URL, $modal, DialogService, $q) => {
    if ($localStorage.loginuser.position != "管理员") {
        $state.go('access.signin')
    }
    $scope.rowCollectionPage = [];


    //  pagination
    $scope.itemsByPage = 8;

    function render() {
        HttpService.post(REST_URL.query, { fcn: "queryRecord", args: [$localStorage.loginuser.orgname] }).then(response => {
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

            open();
        });
    }

    function open() {
        var modalInstance = $modal.open({
            templateUrl: 'adminRecordInfo.html',
            controller: 'AdminRecordModalInstanceCtrl',
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
                opena();
                return;
            } else if (selected.action == 'SU01') {
                actionStr = '更新记录';
                fcn = 'updateRecd';
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
            var actionStr = '重新发起签字请求';
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
}]);

app.controller('AdminRecordModalInstanceCtrl', ['$scope', '$localStorage', '$modalInstance', '$state', 'HttpService', 'REST_URL', '$q', 'item', ($scope, $localStorage, $modalInstance, $state, HttpService, REST_URL, $q, item) => {
    $scope.item = item;
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

app.controller('ResignCtrl', ['$scope', '$localStorage', '$modalInstance', 'HttpService', 'REST_URL', 'item', ($scope, $localStorage, $modalInstance, HttpService, REST_URL, item) => {
    $scope.item = item;
    $scope.selected = {
        item: $scope.item
    };
    let pin = $localStorage.loginuser.pin;
    let name = $localStorage.loginuser.username;
    
    $scope.selected.item.D_sign = "WaitForSign";
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