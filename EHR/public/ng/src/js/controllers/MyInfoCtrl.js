
app.controller('MyInfoCtrl', ['$scope', '$rootScope', '$http', '$state', 'REST_URL', 'HttpService', '$localStorage', function ($scope, $rootScope, $http, $state, REST_URL, HttpService, $localStorage) {
	$scope.item = $localStorage.loginuser;
	// $scope.item.id = $localStorage.loginuser.id;
	// $scope.item.pin = $localStorage.loginuser.pin;
	// $scope.item.username = $localStorage.loginuser.username;
	// $scope.item.position = $localStorage.loginuser.position;
	// $scope.item.department = $localStorage.loginuser.department;
	// $scope.item.orgname = $localStorage.loginuser.orgname;
	// $scope.item.identity = $localStorage.loginuser.identity;
	// $scope.item.address = $localStorage.loginuser.address;
	$scope.upInfo = function () {
		let updateuser = {
			"id": $localStorage.loginuser.id,
			"pin": $localStorage.loginuser.pin,
			"password": $scope.item.password,
			"address": $scope.item.address
		};
		let isneedupdatepasswd = updateuser.password != null ? true : false;
		// Try to update
		HttpService.post(REST_URL.upmif, { user: updateuser, inup: isneedupdatepasswd }).then(response => {
			if (response.data.success) {
				if (isneedupdatepasswd) {
					$localStorage.loginuser = null;
					$scope.$emit('signinToAppCtrlForUser', $localStorage.loginuser);
					sessionStorage.removeItem("token");
					$state.go('access.signin');
				}
				$localStorage.loginuser.department = $scope.item.department;
				$localStorage.loginuser.address = $scope.item.address;
				$scope.$emit('signinToAppCtrlForUser', $localStorage.loginuser);
				$state.go('app.table.myRecord');
			}
		}, function (response) {
			$scope.authError = response.data.message;
		}).catch(function (error) {
			$scope.authError = '服务器错误';
		});
	};
	$scope.cancel = function () {
		$state.go('app.table.myRecord');
	};
}]);