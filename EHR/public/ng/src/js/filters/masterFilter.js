'use strict';
angular.module('app').filter('masterFilter', function ($localStorage) {
	return function (input, arrayType) {
		// inner function
		var _getItermKeyFromArray = function (key, array) {
			for (var i = 0; i < array.length; i++) {
				if (array[i]['itermKey'] == key) {
					return array[i]['itermValue'];
				}
			}
			return key;
		};

		return _getItermKeyFromArray(input, $localStorage.master[arrayType]);

		//      switch(arrayType){
		//    	  case 'approvalStatusList':
		//    		  return _getItermKeyFromArray(input, $localStorage.master.approvalStatusList);
		//    		  break;
		//    	  default:
		//    		  return input;
		//    		  break;
		//      }
	};
});


angular.module('app').filter('modalTypeFilter', function () {
	return function (input) {
		if (input == 'add') {
			return '添加';
		} else {
			return '编辑';
		}
	};
});

angular.module('app').filter('validFilter', function () {
	return function (input) {
		if (input == 0) {
			return '有效';
		} else if (input == 1) {
			return '无效';
		} else {
			return input;
		}
	};
});

angular.module('app').filter("trustHtml", function ($sce) {
	return function (input) {
		return $sce.trustAsHtml(input);
	};
});

