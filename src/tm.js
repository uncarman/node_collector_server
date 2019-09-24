var mysql      = require('mysql');
var connection = mysql.createConnection({
	host     : 'rm-uf67xbt5r3r17jddto.mysql.rds.aliyuncs.com',
	database : 'lp_energy',
	user     : 'llproj',
	password : 'asjfy3j7Y@62o@hksowi',
});
 
connection.connect();
connection.query('SELECT * from a_building', function (error, results, fields) {
	if (error) throw error;
	console.log('The solution is: ', results[0]);
});