'use strict';
const Sequelize = require('sequelize');
var db = require('./database.js');
var option = db.connect.define(
	'user',
	// 字段定义（主键、created_at、updated_at默认包含，不用特殊定义）
	{
		'id': {
			'type': Sequelize.INTEGER(11).UNSIGNED,
			'autoIncrement': true,
			'primaryKey': true,
			'unique': true
		},
		'pin': {
			'type': Sequelize.INTEGER(5).UNSIGNED,
			'allowNull': false,
			'unique': true
		},
		'username': {
			'type': Sequelize.STRING(20),
			'allowNull': false
		},
		'password': {
			'type': Sequelize.STRING(20),
			'allowNull': false
		},
		'orgname': {
			'type': Sequelize.INTEGER(3).UNSIGNED,
			'allowNull': true
		},
		'position': {
			'type': Sequelize.STRING(10),
			'allowNull': true
		},
		'department': {
			'type': Sequelize.STRING(10),
			'allowNull': true
		},
		'identity': {
			'type': Sequelize.CHAR(18),
			'allowNull': false,
			'unique': true
		},
		'address': {
			'type': Sequelize.STRING(100),
			'allowNull': true
		}
	},
	{
		// 自定义表名
		'freezeTableName': false,
		// 'tableName': 'users',

		// 是否需要增加createdAt、updatedAt、deletedAt字段
		'timestamps': false,

		// 不需要createdAt字段
		'createdAt': false,

		// 将updatedAt字段改个名
		'updatedAt': false,

		// 将deletedAt字段改名
		// 同时需要设置paranoid为true（此种模式下，删除数据时不会进行物理删除，而是设置deletedAt为当前时间
		'deletedAt': false
	}
);

var getUserByPin = async (pin) => {
	return option.findOne({
		'where': {
			'pin': pin
		}
	});
};

var updateUser = async (user, inup) => {
	if (inup) {
		return option.update(user, { 'where': { 'id': user.id }, 'fields': ['password', 'address'] });
	} else {
		return option.update(user, { 'where': { 'id': user.id }, 'fields': ['address'] });
	}
};

var getUserList = async (position, orgname) => {
	return option.findAll({
		'attributes': ['username', 'pin', 'department'],
		'where': {
			'position': position,
			'orgname': orgname
		}
	});
};

exports.option = option;
exports.getUserByPin = getUserByPin;
exports.getUserList = getUserList;
exports.updateUser = updateUser;