var app = angular.module('MobYourLife.Filters', []);
var m = function (i) {
    var locale = readCookie('locale').toLowerCase();
    return moment(i).locale(locale);
}

app.filter('momentTimeAgo', function () {
    return function (input) {
        var date = m(input);
        return (date.format('YYYY') < 1970 ? 'nunca' : date.fromNow());
    }
});

app.filter('momentTimeOffset', function () {
    return function (input) {
        var date = m(input);
        return date.format('DD/MM/YYYY - HH:mm:ss Z');
    }
});