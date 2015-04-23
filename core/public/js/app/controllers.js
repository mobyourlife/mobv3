var app = angular.module('MobYourLife.Controllers', []);

/* my sites index */
app.controller('MySitesController', function($scope, $http) {
    $http.get('/api/my-sites').success(function(data) {
        $scope.data = data;
    });
});

/* create new website */
app.controller('NewWebsiteController', function($scope, $http, $routeParams, $location) {
    $http.get('/api/my-sites').success(function(data) {
        $scope.data = data;
    });
    
    $scope.createNewWebsite = function(pageid) {
        $http.get('/api/create-new-website/' + $routeParams.pageid).success(function(data) {
            $location.path('/' + $routeParams.pageid + '/wizard');
        }).error(function(data, status) {
            $scope.error = 'Error ' + status + ' while trying to create the new website! Please try again!';
        });
    }
});

/* website management */
app.controller('ManagementController', function($scope, $http, $routeParams, $rootScope, $location) {
    $rootScope.fanpageId = null;
    $rootScope.fanpageName = null;
    
    $http.get('/api/manage-site/' + $routeParams.pageid).success(function(data) {
        if (data.wizard && data.wizard.finished && data.wizard.finished === true) {
            $scope.data = data;
            $rootScope.fanpageId = $scope.data._id;
            $rootScope.fanpageName = $scope.data.facebook.name;
        } else {
            $location.path('/' + $routeParams.pageid + '/wizard');
        }
    });
});

/* website creation wizard */
app.controller('WizardController', function($scope, $http, $routeParams, $rootScope, $location) {
    $scope.colours = ['white', 'silver', 'black', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'purple'];
    $scope.activeColour = 'white';
    
    $rootScope.fanpageId = null;
    $rootScope.fanpageName = null;
    
    /* get website details */
    $http.get('/api/manage-site/' + $routeParams.pageid).success(function(data) {
        if (data.wizard && data.wizard.finished && data.wizard.finished === true) {
            $location.path('/' + $routeParams.pageid + '/management');
        } else {
            $scope.data = data;
            $rootScope.fanpageId = $scope.data._id;
            $rootScope.fanpageName = $scope.data.facebook.name;
        }
    });
    
    /* mark the website as created */
    $scope.websiteCreated = function() {
        $http.get('/api/wizard/website-created/' + $routeParams.pageid).success(function(data) {
            $location.path('/' + $routeParams.pageid + '/wizard/next');
        });
    }
    
    /* select a colour */
    $scope.pickColour = function(value) {
        $scope.activeColour = value;
    }
    
    /* mark the selected colour as website theme colour */
    $scope.colourPicked = function() {
        $http.get('/api/wizard/personal-touch/' + $routeParams.pageid + '/' + $scope.activeColour).success(function(data) {
            $location.path('/' + $routeParams.pageid + '/wizard/next');
        });
    }
    
    /* mark the website as shared */
    $scope.websiteShared = function() {
        $http.get('/api/wizard/website-shared/' + $routeParams.pageid).success(function(data) {
            $location.path('/' + $routeParams.pageid + '/wizard/next');
        });
    }
    
    /* mark the website as finished */
    $scope.websiteFinished = function() {
        $http.get('/api/wizard/website-finished/' + $routeParams.pageid).success(function(data) {
            $location.path('/' + $routeParams.pageid + '/management');
        });
    }
});

/* controller used only to animate transition between wizard steps */
app.controller('WizardNextController', function($routeParams, $location) {
    $location.path('/' + $routeParams.pageid + '/wizard');
});

/* list user websites domains */
app.controller('DomainsController', function($scope, $http) {
    $scope.checkDomain = function() {
        $scope.loaded = false;
        $http.get('https://whois.apitruck.com/' + $scope.domainName).success(function(data) {
            $scope.loaded = true;
            $scope.available = (data.error == 200 && data.response.status == null);
        });
    }
});

/* user websites billing */
app.controller('BillingController', function($scope, $http) {
    //
});
