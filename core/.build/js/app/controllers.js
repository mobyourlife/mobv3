var app = angular.module('MobYourLife.Controllers', []);

app.controller('MySitesController', function($scope, $http) {
    $scope.pageClass = 'page-mysites';
    
    $http.get('/api/my-sites').success(function(data) {
        $scope.data = data;
    });
});

app.controller('ManagementController', function($scope, $http, $routeParams, $rootScope, $location) {
    $scope.pageClass = 'page-management';
    
    $rootScope.fanpageId = null;
    $rootScope.fanpageName = null;
    
    $http.get('/api/manage-site/' + $routeParams.pageid).success(function(data) {
        if (data.wizard && data.wizard === true) {
            $scope.data = data;
            $rootScope.fanpageId = $scope.data._id;
            $rootScope.fanpageName = $scope.data.facebook.name;
        } else {
            $location.path('/' + $routeParams.pageid + '/wizard');
        }
    });
});

app.controller('WizardController', function($scope, $http, $routeParams, $rootScope, $location) {
    $scope.pageClass = 'page-wizard';
    
    $rootScope.fanpageId = null;
    $rootScope.fanpageName = null;
    
    $http.get('/api/manage-site/' + $routeParams.pageid).success(function(data) {
        $scope.data = data;
        $rootScope.fanpageId = $scope.data._id;
        $rootScope.fanpageName = $scope.data.facebook.name;
    });
    
    $scope.websiteCreated = function() {
        $http.get('/api/wizard/website-created/' + $routeParams.pageid).success(function(data) {
            $location.path('/' + $routeParams.pageid + '/wizard/next');
        });
    }
});

app.controller('WizardNextController', function($routeParams, $location) {
    $location.path('/' + $routeParams.pageid + '/wizard');
});

app.controller('DomainsController', function($scope, $http) {
    $scope.pageClass = 'page-domains';
    
    $scope.checkDomain = function() {
        $scope.loaded = false;
        $http.get('https://whois.apitruck.com/' + $scope.domainName).success(function(data) {
            $scope.loaded = true;
            $scope.available = (data.error == 200 && data.response.status == null);
        });
    }
});

app.controller('BillingController', function($scope, $http) {
    $scope.pageClass = 'page-billing';
});
