'use strict';
const Sequelize = require('sequelize');
var db = require('./database.js');
var option = db.connect.define(
    'bed',
    // 字段定义（主键、created_at、updated_at默认包含，不用特殊定义）
    {
        'id': {
            'type': Sequelize.INTEGER(11).UNSIGNED,
            'autoIncrement': true,
            'primaryKey': true,
            'unique': true
        },
        'bedid': {
            'type': Sequelize.STRING(10),
            'allowNull': false,
            'unique': true
        },
        'floor': {
            'type': Sequelize.INTEGER(3),
            'allowNull': false
        },
        'room': {
            'type': Sequelize.STRING(10),
            'allowNull': false
        },
        'isempty': {
            'type': Sequelize.BOOLEAN(),
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

var getEmptyBedLest = async () => {
    return option.findAll({
        'where': {
            'isempty': true
        }
    });
};

var getBed = async (bedid) => {
    return option.findOne({
        'where': {
            'bedid': bedid
        }
    });
};

var setBedState = async (bed) => {
    bed.isempty = 1 - bed.isempty;
    return option.update(bed, {
        'where': { 'id': bed.id }, 'fields': ['isempty']
    });
};

exports.option = option;
exports.getEmptyBedLest = getEmptyBedLest;
exports.getBed = getBed;
exports.setBedState = setBedState