app.controller('NavBarCtrl', ['$scope', '$rootScope', '$http', '$state', 'REST_URL', 'HttpService', '$localStorage', ($scope, $rootScope, $http, $state, REST_URL, HttpService, $localStorage) => {
    if($localStorage.loginuser == '' || $localStorage.loginuser == undefined){
        $state.go('access.signin')
    }
    $scope.role = $localStorage.loginuser.position;
}]);