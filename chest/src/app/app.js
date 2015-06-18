var app = angular.module('MobYourLife.Chest', [
    'ngRoute'
]);

/* constants */
app.value('partialsUrl', '/partials');

/* config app */
app.config(function ($routeProvider, partialsUrl) {
    $routeProvider
        .when('/home', {
            templateUrl: partialsUrl + '/home.html',
            controller: 'HomeCtrl'
        })
        .when('/blog', {
            templateUrl: partialsUrl + '/blog.html',
            controller: 'BlogCtrl'
        })
        .when('/sobre', {
            templateUrl: partialsUrl + '/sobre.html',
            controller: 'SobreCtrl'
        })
        .when('/fotos', {
            templateUrl: partialsUrl + '/fotos.html',
            controller: 'FotosCtrl'
        })
        .when('/videos', {
            templateUrl: partialsUrl + '/videos.html',
            controller: 'VideosCtrl'
        })
        .when('/contato', {
            templateUrl: partialsUrl + '/contato.html',
            controller: 'ContatoCtrl'
        })
        .when('/:paginaEstatica', {
            templateUrl: partialsUrl + '/static.html',
            controller: 'StaticCtrl'
        })
        .otherwise({
            redirectTo: '/home'
        });
});

/* app events */
app.run(function ($rootScope, CommonLib) {
    $rootScope.$on('$routeChangeSuccess', function (ev, data) {
        $rootScope.controller = data.controller;
    });
});