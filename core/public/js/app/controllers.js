var app = angular.module('MobYourLife.Controllers', []);

app.controller('MySitesController', function($scope, $http) {
    $http.get('/api/my-sites').success(function(data) {
        $scope.data = data;
    });
});

app.controller('ManagementController', function($scope, $http, $routeParams, $rootScope) {
    $rootScope.fanpageId = null;
    $rootScope.fanpageName = null;
    
    $http.get('/api/manage-site/' + $routeParams.pageid).success(function(data) {
        $scope.data = data;
        $rootScope.fanpageId = $scope.data._id;
        $rootScope.fanpageName = $scope.data.facebook.name;
        console.log(data);
    });
});

app.controller('DomainsController', function($scope, $http) {
    $scope.checkDomain = function() {
        $scope.loaded = false;
        $http.get('https://whois.apitruck.com/' + $scope.domainName).success(function(data) {
            $scope.loaded = true;
            $scope.available = (data.error == 200 && data.response.status == null);
        });
    }
});

app.controller('BillingController', function($scope, $http) {
    //
});
