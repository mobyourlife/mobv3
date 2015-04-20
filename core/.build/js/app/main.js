var app = angular.module('MobYourLife', ['MobYourLife.Controllers', 'ngRoute']);

app.config(function($routeProvider, $interpolateProvider) {
    $routeProvider.
        when('/', {
            templateUrl: '/admin/partials/my-sites',
            controller: 'MySitesController'
        }).when('/domains', {
            templateUrl: '/admin/partials/domains',
            controller: 'DomainsController'
        }).when('/planos', {
            templateUrl: '/admin/partials/billing',
            controller: 'BillingController'
        }).otherwise( {
            redirectTo: '/'
        });
    
    $interpolateProvider.startSymbol('//');
    $interpolateProvider.endSymbol('//');
});

app.run(function ($rootScope) {
    $rootScope.$on('$routeChangeSuccess', function (ev, data) {
        $rootScope.activeController = data.controller;
    })
});
