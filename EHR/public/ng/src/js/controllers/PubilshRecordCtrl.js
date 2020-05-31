// const e = require("express");

app.controller('PublishRecordCtrl', ['$scope', '$rootScope', '$http', '$modal', '$log', 'REST_URL', 'HttpService', 'DialogService', '$localStorage', '$state', '$stateParams', '$interval', function ($scope, $rootScope, $http, $modal, $log, REST_URL, HttpService, DialogService, $localStorage, $state, $stateParams, $interval) {
    if ($localStorage.loginuser.position == "医生"){
        
    } else if ($localStorage.loginuser.position == "护士") {
        $state.go('app.table.myUnRecord')
    } else {
        $state.go('access.signin')
    }
    HttpService.post(REST_URL.gusers, { position: "护士", orgname: $localStorage.loginuser.orgname }).then(response => {
        //alert("updateuser success");
        $scope.item = {};
        $scope.item.D_name = $localStorage.loginuser.username;
        $scope.item.D_pin = "" + $localStorage.loginuser.pin;
        $scope.item.O_name = $localStorage.loginuser.orgname;
        $scope.item.P_dpt = $localStorage.loginuser.department;
        // $scope.item.P_bih = false;
        // $scope.item.D_spin = null;
        // $scope.item.D_snam = null;
        // $scope.item.P_name = null;
        // $scope.item.P_id = null;
        $scope.item.P_sex = "男";
        // $scope.item.P_age = null;
        $scope.item.P_nat = "汉";
        // $scope.item.P_tel = null;
        // $scope.item.P_occ = null;
        // $scope.item.P_bthplace = null;
        // $scope.item.P_marstate = null;
        // $scope.item.RS_name = null;
        // $scope.item.RS_rels = null;
        // $scope.item.RS_tel = null;
        $scope.item.P_smoke = false;
        $scope.item.P_alchl = false;
        // $scope.item.P_dgn = null;
        $scope.avail = false;
        $scope.msg = '';
        $scope.select_nurselist = new Array();
        nurselist = JSON.parse(response.data.userlist);
        for (let i = 0; i < nurselist.length; i++) {
            let n = nurselist[i];
            var nurse = { key1: n.pin, key2: n.username, value: n.pin + "-" + n.department + "-" + n.username };
            $scope.select_nurselist.push(nurse);
        }
    });
    $scope.getAge = async () => {
        let id = $scope.item.P_id;
        let format = /^(([1][1-5])|([2][1-3])|([3][1-7])|([4][1-6])|([5][0-4])|([6][1-5])|([7][1])|([8][1-2]))\d{4}(([1][9]\d{2})|([2]\d{3}))(([0][1-9])|([1][0-2]))(([0][1-9])|([1-2][0-9])|([3][0-1]))\d{3}[0-9xX]$/;
        if (!format.test(id)) {
            $scope.msg += '身份证号码不合规';
        }
        let year = id.substr(6, 4),//身份证年
            month = id.substr(10, 2),//身份证月
            date = id.substr(12, 2),//身份证日
            time = Date.parse(month + '-' + date + '-' + year),//身份证日期时间戳date
            now_time = Date.parse(new Date()),//当前时间戳
            dates = (new Date(year, month, 0)).getDate();//身份证当月天数
        if (time > now_time || date > dates) {
            $scope.msg += '出生日期不合规 ';
        }
        let nowYear = new Date().getFullYear();
        $scope.item.P_age = nowYear - year;

    }

    $scope.save = async () => {
        if ($scope.select_nurse == undefined||$scope.select_nurse == null) {
            $scope.msg += "未选择签字护士 ";
            return;
        }
        $scope.item.D_spin = "" + $scope.select_nurse.key1;
        $scope.item.D_snam = $scope.select_nurse.key2;
        // console.log($scope.item);
        HttpService.post(REST_URL.invoke, { fcn: "issue", args: [JSON.stringify($scope.item)] }).then(response => {
            DialogService.open('infoDialog', {
                scope: $scope,
                title: '提交成功',
                message: '已上传记录',
                onOk: (value) => {
                    $state.go('app.table.myRecord');
                },
                onCancel: (value) => {
                    // do nothing
                }
            });
        }).catch(err => {
            DialogService.open('infoDialog', {
                scope: $scope,
                title: '提示',
                message: '发生错误',
                onOk: (value) => {

                },
                onCancel: (value) => {
                    // do nothing
                }
            });
        });
    };

    $scope.cancel = function () {
        $state.go('app.table.myRecord');
    };
}])