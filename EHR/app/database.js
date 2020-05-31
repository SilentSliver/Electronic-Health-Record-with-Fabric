'use strict';
const Sequelize = require('sequelize');
var config = require('../config.json');
var connect = new Sequelize('hospital', config.db[0].username, config.db[0].passwd, {
	host: config.host,
	dialect: 'mariadb', //'mysql'
	pool: {
		max: 5,
		min: 0,
		idle: 10000
	},
	timezone: config.db[0].timezone
});
exports.connect = connect;
