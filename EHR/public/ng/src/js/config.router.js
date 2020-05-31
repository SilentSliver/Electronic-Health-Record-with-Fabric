'use strict';

/**
 * Config for the router
 */
angular.module('app').run(
    ['$rootScope', '$state', '$stateParams',
        function ($rootScope, $state, $stateParams) {
            $rootScope.$state = $state;
            $rootScope.$stateParams = $stateParams;
        }
    ]
).config(
    ['$stateProvider', '$urlRouterProvider',
        function ($stateProvider, $urlRouterProvider) {

            $urlRouterProvider
                .otherwise('/app/table/myRecord');
            $stateProvider
                .state('app', {
                    abstract: true,
                    url: '/app',
                    templateUrl: 'tpl/app.html'
                })
                // table
                .state('app.table', {
                    url: '/table',
                    template: '<div ui-view></div>'
                })

                .state('app.table.publishRecord', {
                    url: '/publishRecord',
                    templateUrl: 'tpl/page_publishRecord.html'
                })

                .state('app.table.myRecord', {
                    url: '/myRecord',
                    templateUrl: 'tpl/page_myRecord.html'
                })

                .state('app.table.myUnRecord', {
                    url: '/myUnRecord',
                    templateUrl: 'tpl/page_myUnRecord.html'
                })

                .state('app.table.myInfo', {
                    url: '/myInfo',
                    templateUrl: 'tpl/page_myInfo.html'
                })
                .state('app.table.getTransferRecord', {
                    url: '/getMyTR',
                    templateUrl: 'tpl/page_getTransfer.html'
                })
                .state('app.table.setTransferRecord', {
                    url: '/setMyTR',
                    templateUrl: 'tpl/page_setTransfer.html'
                })
                .state('app.table.admin', {
                    url: '/admin',
                    templateUrl: 'tpl/page_admin.html'
                })
                .state('app.page', {
                    url: '/page',
                    template: '<div ui-view></div>'
                })
                //access
                .state('access', {
                    url: '/access',
                    template: '<div ui-view class="fade-in-right-big smooth"></div>'
                })
                .state('access.signin', {
                    url: '/signin',
                    templateUrl: 'tpl/page_signin.html'
                })
                // .state('access.signup', {
                //     url: '/signup',
                //     templateUrl: 'tpl/page_signup.html'//,
                // })
                .state('access.404', {
                    url: '/404',
                    templateUrl: 'tpl/page_404.html'
                });

        }
    ]
);