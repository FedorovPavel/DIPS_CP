function isAdmin(callback) {
	let self = this;
	const url = '/aggregator/admin/getUserRole';
	let req = new XMLHttpRequest();
	req.open('GET', url, true);
	req.setRequestHeader("Authorization", "Bearer " + sessionStorage.getItem('token'));
	req.onreadystatechange = function(){
		if (req.readyState == 4 && req.status == 200) {
			var resObj = JSON.parse(req.responseText);
			if(resObj.role == 'admin')
				return callback(true);
			return callback(false);
		}
	}
	req.send();
}

function unhideAdminPills() {
	$('#report-pill').removeClass('hidden');
	$('#carmanager-pill').removeClass('hidden');
}

function deleteCar(id) {
	console.log(id);
	const url = '/aggregator/admin/car/'+id;
	let req = new XMLHttpRequest();
	req.open('DELETE', url, true);
	req.setRequestHeader("Authorization", "Bearer " + sessionStorage.getItem('token'));
	req.onreadystatechange = function(){
		if (req.readyState == 4) {
			location.reload();
		}
	}
	req.send();
}

$(document).ready(function() {
	isAdmin(function(result) {
		if(result)
			unhideAdminPills();
	});
});