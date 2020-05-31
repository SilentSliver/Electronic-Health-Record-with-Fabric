'use strict';
/* Controllers */
// signin controller
app.controller('SigninCtrl', ['$scope', '$rootScope', '$http', '$state', 'REST_URL', 'HttpService', 'DialogService', '$localStorage', function ($scope, $rootScope, $http, $state, REST_URL, HttpService, DialogService, $localStorage) {
	// if ($localStorage.loginuser != null) { 
	//   $state.go('app.table.myRecord');
	//   return;
	// }
	$scope.user = {};
	$scope.authError = null;
	$scope.login = function () {
		$scope.authError = null;
		// Try to login
		HttpService.post(REST_URL.login, { pin: $scope.user.pin, password: $scope.user.password, orgName: "Org1" }).then(response => {
			if (response.data.success) {
				$localStorage.loginuser = response.data.user;
				sessionStorage.setItem("token", response.data.token)
				$scope.$emit('signinToAppCtrlForUser', response.data.user);
				$scope.$emit('signinToAppCtrlForRole', response.data.user.position);
				$state.go('app.table.myRecord');
			}
			// }else{
			//   console.log(response.data.message);
			//   $scope.authError = response.data.message;
			//   return;
			// }
		}, response => {
			$scope.authError = response.data.message;
		}).catch(function (error) {
			$scope.authError = '服务器错误';
		});
	};

	$scope.logout = function () {
		HttpService.post(REST_URL.logout, { pin: $scope.user.pin }).then(function (response) {
			if (response.data.success) {
				$localStorage.loginuser = null;
				$scope.$emit('signinToAppCtrlForUser', null);
				$scope.$emit('signinToAppCtrlForRole', null);
				sessionStorage.removeItem("token");
			}
			$state.go('access.signin');
		}, function (err) {
			DialogService.open('infoDialog', {
				scope: $scope,
				title: '提示',
				message: '发生错误',
				onOk: function (value) {

				},
				onCancel: function (value) {
					// do nothing
				}
			});
		});
	};
}]);