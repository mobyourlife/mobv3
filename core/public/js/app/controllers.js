var app = angular.module('MobYourLife.Controllers', []);

app.controller('MySitesController', function($scope, $http) {
    $http.get('/api/my-sites').success(function(data) {
        $scope.data = data;
    });
});

app.controller('ManagementController', function($scope, $http, $routeParams) {
    $http.get('/api/manage-site/' + $routeParams.pageid).success(function(data) {
        $scope.data = data;
        console.log(data);
    });
});

app.controller('DomainsController', function($scope, $http) {
    //
});

app.controller('BillingController', function($scope, $http) {
    //
});
