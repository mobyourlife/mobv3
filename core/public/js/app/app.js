var app = angular.module('MobYourLife', ['MobYourLife.Controllers', 'MobYourLife.Filters', 'ngRoute', 'angulartics', 'angulartics.google.analytics', 'angular-loading-bar', 'ngAnimate']);

app.config(function($routeProvider, $locationProvider, $interpolateProvider) {
    $routeProvider.
        when('/', {
            templateUrl: '/admin/partials/my-sites/index',
            controller: 'MySitesController'
        }).when('/new-website', {
            templateUrl: '/admin/partials/my-sites/new-website',
            controller: 'NewWebsiteController'
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
            templateUrl: '/admin/partials/domains/index',
            controller: 'DomainsController'
        }).when('/domains/register/:domain', {
            templateUrl: '/admin/partials/domains/register',
            controller: 'DomainRegisterController'
        }).when('/billing', {
            templateUrl: '/admin/partials/billing/index',
            controller: 'BillingController'
        }).when('/billing/payment', {
            templateUrl: '/admin/partials/billing/payment',
            controller: 'BillingPaymentController'
        }).when('/all-sites', {
            templateUrl: '/admin/partials/all-sites',
            controller: 'AllSitesController'
        }).when('/stats', {
            templateUrl: '/admin/partials/stats',
            controller: 'StatsController'
        }).when('/faq', {
            templateUrl: '/admin/partials/faq',
            controller: 'FaqController'
        }).when('/support', {
            templateUrl: '/admin/partials/support',
            controller: 'SupportController'
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
