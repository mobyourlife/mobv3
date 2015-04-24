var app = angular.module('MobYourLife.Controllers', ['validator']);

app.config(function($validatorProvider) {
    $validatorProvider.register('required', {
        invoke: 'blur',
        validator: /.+/,
        error: 'Campo obrigatório.'
    });
    
    $validatorProvider.register('email', {
        invoke: 'watch',
        validator: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        error: 'Endereço de email inválido.'
    });
});

/* my sites index */
app.controller('MySitesController', function($scope, $http) {
    $http.get('/api/my-sites').success(function(data) {
        if (data && data.sites && data.sites.length && data.sites.length != 0) {
            $scope.data = data;
        }
    }).error(function(data, status) {
        if (status == 401) {
            location.href = '/account/logout';
        }
    });
});

/* create new website */
app.controller('NewWebsiteController', function($scope, $http, $routeParams, $location) {
    $http.get('/api/remaining-fanpages').success(function(data) {
        $scope.data = data;
    });
    
    $scope.createNewWebsite = function(pageid) {
        $scope.error = null;
        
        $http.get('/api/create-new-website/' + pageid).success(function(data) {
            $location.path('/' + pageid + '/wizard');
        }).error(function(data, status) {
            if (status == 401) {
                location.href = '/account/logout';
            }
            
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
    }).error(function(data, status) {
        if (status == 401) {
            location.href = '/account/logout';
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
    }).error(function(data, status) {
        if (status == 401) {
            location.href = '/account/logout';
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
            //$location.path('/' + $routeParams.pageid + '/management');
            $location.path('/');
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
    $http.get('/api/billing').success(function(data) {
        $scope.data = data;
    });
});

/* all sites index */
app.controller('AllSitesController', function($scope, $http) {
    $http.get('/api/all-sites').success(function(data) {
        $scope.data = data;
    }).error(function(data, status) {
        if (status == 401) {
            location.href = '/account/logout';
        }
    });
});


/* frequently asked questions */
app.controller('FaqController', function($scope, $http) {
    //
});


/* technical support */
app.controller('SupportController', function($scope, $http, $validator) {
    $scope.sendMail = function() {
        $validator.validate($scope).success(function() {
            //
        });
    }
});
