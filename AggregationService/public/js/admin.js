function isAdmin() {
	let self = this;
	const url = 'aggregator/admin/getUserRole';
	let req = new XMLHttpRequest();
	req.open('GET', url, true);
	req.setRequestHeader("Authorization", "Bearer " + self.token);
	req.onreadystatechange = function(){
		if (req.readyState == 4) {
			console.log('lol');
		}
	}
	req.send();
}

$(document).ready(function() {
	//isAdmin();
});