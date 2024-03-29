'use strict';

/* Controllers */

angular.module('app').controller('AppCtrl', ['$scope', '$localStorage', '$window', '$state', function ($scope, $localStorage, $window, $state) {
	// add 'ie' classes to html
	var isIE = !!navigator.userAgent.match(/MSIE/i);
	isIE && angular.element($window.document.body).addClass('ie');
	isSmartDevice($window) && angular.element($window.document.body).addClass('smart');
	// config
	$scope.app = {
		user: $localStorage.loginuser,
		// loginname : $localStorage.loginuser.username,
		role : null,
		name: 'EHR',
		version: '1.0',
		// for chart colors
		color: {
			primary: '#7266ba',
			info: '#23b7e5',
			success: '#27c24c',
			warning: '#fad733',
			danger: '#f05050',
			light: '#e8eff0',
			dark: '#3a3f51',
			black: '#1c2b36'
		},
		settings: {
			themeID: 8,
			navbarHeaderColor: 'bg-info dker',//'bg-black',
			navbarCollapseColor: 'bg-info dker',//'bg-white-only',
			asideColor: 'bg-light dker b-r',
			headerFixed: true,
			asideFixed: false,
			asideFolded: false,
			asideDock: false,
			container: false
		}
	};

	$scope.$on('signinToAppCtrlForUser', function (event, user) {
		$scope.app.user = user;
	});
	$scope.$on('signinToAppCtrlForRole', function (event, role) {
		$scope.app.role = role;
	});

	// save settings to local storage
	if (angular.isDefined($localStorage.settings)) {
		$scope.app.settings = $localStorage.settings;
	} else {
		$localStorage.settings = $scope.app.settings;
	}
	$scope.$watch('app.settings', function () {
		if ($scope.app.settings.asideDock && $scope.app.settings.asideFixed) {
			// aside dock and fixed must set the header fixed.
			$scope.app.settings.headerFixed = true;
		}
		// save to local storage
		$localStorage.settings = $scope.app.settings;
	}, true);

	function isSmartDevice($window) {
		// Adapted from http://www.detectmobilebrowsers.com
		var ua = $window['navigator']['userAgent'] || $window['navigator']['vendor'] || $window['opera'];
		// Checks for iOs, Android, Blackberry, Opera Mini, and Windows mobile devices
		return (/iPhone|iPod|iPad|Silk|Android|BlackBerry|Opera Mini|IEMobile/).test(ua);
	}

}]);
