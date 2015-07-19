var checkIsAdmin = function(user) {
	if (user.facebook && user.facebook.email) {
		var allowed = [
			'contato@fmoliveira.com.br',
			'marcelofante01@gmail.com',
			'latorremarcelo08@gmail.com'
		];

		for (var i = 0; i < allowed.length; i++) {
			if (allowed[i].localeCompare(user.facebook.email) == 0) {
				return true;
			}
		}
	}

	return false;
}

module.exports = {
	isAdmin: checkIsAdmin
};
