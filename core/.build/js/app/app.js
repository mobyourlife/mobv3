var app = angular.module('MobYourLife', ['MobYourLife.Controllers', 'ngRoute', 'angular-loading-bar', 'ngAnimate']);

app.config(function($routeProvider, $locationProvider, $interpolateProvider) {
    $routeProvider.
        when('/', {
            templateUrl: '/admin/partials/my-sites/index',
            controller: 'MySitesController'
        }).when('/:pageid/wizard', {
            templateUrl: '/admin/partials/my-sites/wizard',
            controller: 'WizardController'
        }).when('/:pageid/wizard/next', {
            templateUrl: '/admin/partials/blank',
            controller: 'WizardNextController'
        }).when('/:pageid/management', {
            templateUrl: '/admin/partials/my-sites/management',
            controller: 'ManagementController'
        }).when('/domains', {
            templateUrl: '/admin/partials/domains',
            controller: 'DomainsController'
        }).when('/billing', {
            templateUrl: '/admin/partials/billing',
            controller: 'BillingController'
        }).otherwise( {
            redirectTo: '/'
        });
    
    $interpolateProvider.startSymbol('##');
    $interpolateProvider.endSymbol('##');
});

app.run(function ($rootScope, $http) {
    $rootScope.$on('$routeChangeSuccess', function (ev, data) {
        $rootScope.activeController = data.controller;
    })
    
    $rootScope.language = function(locale) {
        $http.get('/language/' + locale + '/noredir').success(function(data) {
            location.reload();
        });
    }
});
