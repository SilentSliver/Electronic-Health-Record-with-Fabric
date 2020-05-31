var app = angular.module('app').config(['$controllerProvider', '$compileProvider', '$filterProvider', '$provide', function ($controllerProvider, $compileProvider, $filterProvider, $provide) {

    // lazy controller, directive and service
    app.controller = $controllerProvider.register;
    app.directive = $compileProvider.directive;
    app.filter = $filterProvider.register;
    app.factory = $provide.factory;
    app.service = $provide.service;
    app.constant = $provide.constant;
    app.value = $provide.value;
}
]);
//     $httpProvider.interceptors.push('myInterceptor');
// }]);

angular.module('app').factory('myInterceptor', ["$rootScope", function ($rootScope) {
    var timestampMarker = {
        request: function (config) {
            $rootScope.loading = true;
            return config;
        },
        response: function (response) {
            $rootScope.loading = false;
            return response;
        }
    };
    return timestampMarker;
}]);