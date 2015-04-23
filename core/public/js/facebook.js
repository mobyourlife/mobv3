var locale = readCookie('locale').replace('-', '_');

(function(d, s, id) {
var js, fjs = d.getElementsByTagName(s)[0];
if (d.getElementById(id)) return;
js = d.createElement(s); js.id = id;
js.src = "//connect.facebook.net/" + locale + "/sdk.js#xfbml=1&version=v2.3&appId=276059775932748";
fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));