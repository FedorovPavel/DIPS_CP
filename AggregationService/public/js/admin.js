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

function createCar(elem) {
	var manufacture = $('#acc-manufacture').val();
	var model = $('#acc-model').val();
	var type = $('#acc-type').val();
	var doors = $('#acc-doors').val();
	var person = $('#acc-person').val();
	var transmission = $('#acc-transmission').val();
	var cost = $('#acc-cost').val();

	if(manufacture && model && type && doors && person && transmission && cost) {
		const url = '/aggregator/admin/car/create';
		let req = new XMLHttpRequest();
		req.open('POST', url, true);
		req.setRequestHeader('Content-Type', 'application/json');
		req.setRequestHeader("Authorization", "Bearer " + sessionStorage.getItem('token'));
		req.onreadystatechange = function(){
			if (req.readyState == 4) {
				location.reload();
			}
		}
		req.send(JSON.stringify({
			manufacture: manufacture,
			model: model,
			type: type,
			doors: doors,
			person: person,
			transmission: transmission,
			cost: cost
		}));
	} else
		alert('Для добавления нового автомобиля заполните все поля.');

}

$(document).ready(function() {
	isAdmin(function(result) {
		if(result)
			unhideAdminPills();
	});
});