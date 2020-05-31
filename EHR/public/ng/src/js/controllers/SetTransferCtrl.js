/**
 * Created by felixjin on 2016/12/4.
 */
app.controller('SetTransferCtrl', ['$scope', '$localStorage', '$state', 'HttpService', 'REST_URL', '$modal', 'DialogService', '$q', function ($scope, $localStorage, $state, HttpService, REST_URL, $modal, DialogService, $q) {
    if ($localStorage.loginuser.position == "护士"){
        
    } else if ($localStorage.loginuser.position == "医生") {
        $state.go('app.table.getMyTR')
    } else {
        $state.go('access.signin')
    }
    $scope.rowCollectionPage = [];


    //  pagination
    $scope.itemsByPage = 5;

    function render() {
        HttpService.post(REST_URL.query, { fcn: "queryTransferRecord", args: [$localStorage.loginuser.orgname, $localStorage.loginuser.pin + ""] }).then(response => {
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

            open(record);
        });
        // the following part is just for test
        // record = $scope.rowCollectionPage[3];
        // $scope.item = record;

        // $scope.item.historyList = record.History;

        // if (!$scope.$$phase) {
        //     $scope.$apply();
        // }
        // open(record);
    }

    function open(record) {
        var modalInstance = $modal.open({
            templateUrl: 'myRequireTRInfo.html',
            controller: 'MyRequireTRModalInstanceCtrl',
            size: 'lg',
            resolve: {
                item: function () {
                    return $scope.item;
                }
            }
        });

        modalInstance.result.then(function (selected) {
            // endr request

            var actionStr = '已';
            var fcn = '';
            if (selected.action == 'SU00') {
                actionStr = '批准转院';
                fcn = 'acceptTrans';
            } else if (selected.action == 'SU01') {
                actionStr = '拒绝';
                fcn = 'rejectTrans';
            }


            HttpService.post(REST_URL.invoke, { fcn: fcn, args: [record.R_id, $localStorage.loginuser.pin, $localStorage.loginuser.orgname] }).then(response => {
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

        }, function () {
        });
    };



}]);

app.controller('MyRequireTRModalInstanceCtrl', ['$scope', '$modalInstance', 'item', function ($scope, $modalInstance, item) {
    $scope.item = item;

    $scope.historyList = item.historyList;
    $scope.itemsByPage = 5;

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