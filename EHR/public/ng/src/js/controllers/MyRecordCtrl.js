app.controller('MyRecordCtrl', ['$scope', '$localStorage', '$state', 'HttpService', 'REST_URL', '$modal', 'DialogService', '$q', function ($scope, $localStorage, $state, HttpService, REST_URL, $modal, DialogService, $q) {
    $scope.rowCollectionPage = [];
    if ($localStorage.loginuser.position == "医生"){
        
    } else if ($localStorage.loginuser.position == "护士") {
        $state.go('app.table.myUnRecord')
    }else if ($localStorage.loginuser.position == "管理员"){
        $state.go('app.table.myUnRecord')
    } 
    else {
        $state.go('access.signin')
    }
    //  pagination
    $scope.itemsByPage = 8;

    function render() {
        HttpService.post(REST_URL.query, { fcn: "queryMyRecord", args: [$localStorage.loginuser.orgname, $localStorage.loginuser.pin.toString()] }).then(response => {
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
        $modal.open({
            templateUrl: 'myRecordInfo.html',
            controller: 'MyRecordModalInstanceCtrl',
            size: 'lg',
            resolve: {
                item: () => {
                    return $scope.item;
                }
            }
        });
    };
}]);

app.controller('MyRecordModalInstanceCtrl', ['$scope', '$modalInstance', 'item', ($scope, $modalInstance, item) => {
    $scope.item = item;

    // for test hardcode add endr info
    $scope.historyList = item.R_his;
    $scope.itemsByPage = 5;

    $scope.selected = {
        item: $scope.item
    };
}]);