/**
 * Copyright 2017 IBM All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an 'AS IS' BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
'use strict';
var log4js = require('log4js');
var logger = log4js.getLogger('SilverEHR');
var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var util = require('util');
var app = express();
var expressJWT = require('express-jwt');
var jwt = require('jsonwebtoken');
var bearerToken = require('express-bearer-token');
var cors = require('cors');
var path = require('path');

require('./config.js');
var config = require('./config.json');
var hfc = require('fabric-client');

var helper = require('./app/helper.js');
var createChannel = require('./app/create-channel.js');
var join = require('./app/join-channel.js');
var updateAnchorPeers = require('./app/update-anchor-peers.js');
var install = require('./app/install-chaincode.js');
var instantiate = require('./app/instantiate-chaincode.js');
var invoke = require('./app/invoke-transaction.js');
var query = require('./app/query.js');
const users = require('./app/table-user.js');
const beds = require('./app/table-bed.js');
var host = process.env.HOST || hfc.getConfigSetting('host');
var port = process.env.PORT || hfc.getConfigSetting('port');

///////////////////////////////////////////////////////////////////////////////
//////////////////////////////// SET CONFIGURATONS ////////////////////////////
///////////////////////////////////////////////////////////////////////////////
app.options('*', cors());
app.use(cors());
//support parsing of application/json type post data
app.use(bodyParser.json());
//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({
	extended: false
}));
// set secret variable
app.set('secret', 'thisismysecret');
// app.use(expressJWT({
// 	secret: 'thisismysecret'
// }).unless({
// 	path: ['/users', '/login']
// }));
app.use(bearerToken());
app.use(express.static(path.join(__dirname, 'public')));
process.TOKENS = [];
// Fliter
app.use(function (req, res, next) {
	logger.debug(' ------>>>>>> new request for %s', req.originalUrl);
	if (req.originalUrl.indexOf('/channels') >= 0 || req.originalUrl.indexOf('/gusers') >= 0 || req.originalUrl.indexOf('/upmif') >= 0 || req.originalUrl.indexOf('/chaincodes') >= 0 || req.originalUrl.indexOf('/gbeds') >= 0) {
		var token = req.token || req.body.token;
		jwt.verify(token, app.get('secret'), (err, decoded) => {
			if (err || process.TOKENS[decoded.username] == null) {
				console.log(err);
				return res.redirect('/ng/src/#/access/signin');
			} else {
				if (process.TOKENS[decoded.username] != null && process.TOKENS[decoded.username] != token) {
					return res.send({
						success: false,
						message: 'token 过期，请重新登录'
					});

				}
				// add the decoded user name and org name to the request object
				// for the downstream code to use
				req.username = decoded.username;
				req.orgname = decoded.orgName;
				logger.debug(util.format('Decoded from JWT token: username - %s, orgname - %s', decoded.username, decoded.orgName));
				return next();
			}
		});
	} else if (req.originalUrl.indexOf('/users') >= 0 || req.originalUrl.indexOf('/ng/src/#/') >= 0 || req.originalUrl.indexOf('/login') >= 0 || req.originalUrl.indexOf('/logout') >= 0) {
		return next();
	} else {
		return res.redirect('/ng/src/#/access/404');
	}
});

///////////////////////////////////////////////////////////////////////////////
//////////////////////////////// START SERVER /////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
var server = http.createServer(app).listen(port, () => { });
logger.info('****************** SERVER STARTED ************************');
logger.info('***************  http://%s:%s  ******************', host, port);
server.timeout = 240000;

function getErrorMessage(field) {
	var response = {
		success: false,
		message: field + ' field is missing or Invalid in the request'
	};
	return response;
}

// manage token
function updateToken(pin, token) {
	try {
		process.TOKENS[pin] = token;
		return token;
	} catch (err) {
		return null;
	}
}

function clearToken(pin) {
	process.TOKENS[pin] = null;
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////// REST ENDPOINTS START HERE ///////////////////////////
///////////////////////////////////////////////////////////////////////////////
// Register and enroll user
app.post('/users', async function (req, res) {
	var username = req.body.username;
	var orgName = req.body.orgName;
	logger.debug('End point : /users');
	logger.debug('User name : ' + username);
	logger.debug('Org name  : ' + orgName);
	if (!username) {
		res.json(getErrorMessage('\'username\''));
		return;
	}
	if (!orgName) {
		res.json(getErrorMessage('\'orgName\''));
		return;
	}
	var token = jwt.sign({
		exp: Math.floor(Date.now() / 1000) + parseInt(hfc.getConfigSetting('jwt_expiretime')),
		username: username,
		orgName: orgName
	}, app.get('secret'));
	let response = await helper.getRegisteredUser(username, orgName, true);
	logger.debug('-- returned from registering the username %s for organization %s', username, orgName);
	if (response && typeof response !== 'string') {
		logger.debug('Successfully registered the username %s for organization %s', username, orgName);
		updateToken(username, token);
		response.token = token;
		res.json(response);
	} else {
		logger.debug('Failed to register the username %s for organization %s with::%s', username, orgName, response);
		res.json({ success: false, message: response });
	}

});
//  User login
app.post('/login', async (req, res) => {
	var pin = req.body.pin;
	var orgName = req.body.orgName;
	var password = req.body.password;
	logger.info('End point : /users');
	logger.info('User pin : ' + pin);
	logger.info('Org name  : ' + orgName);
	if (!pin) {
		res.json(getErrorMessage('\'pin\''));
		return;
	}
	if (!orgName) {
		res.json(getErrorMessage('\'orgName\''));
		return;
	}
	if (!password) {
		res.json(getErrorMessage('\'password\''));
		return;
	}

	users.getUserByPin(pin).then(async user => {
		if (!(user.password === password)) {
			return res.json({
				success: false,
				message: '密码错误，请重试'
			});
		} else {
			var loginuser = {
				"id": user.id,
				"pin": user.pin,
				"username": user.username,
				//"password": user.pasword,
				"orgname": config.orgname[user.orgname],
				"position": user.position,
				"department": user.department,
				"identity": user.identity,
				"address": user.address
			};
			var token = jwt.sign({
				exp: Math.floor(Date.now() / 1000) + parseInt(config.jwt_expiretime),
				username: pin,
				orgName: orgName,
				password: password
			}, app.get('secret'));
			helper.getRegisteredUser(pin, orgName, true).then(response => {
				if (response && typeof response !== 'string') {
					updateToken(pin, token);
					return res.status(200).json({
						success: true,
						secret: response.secret,
						message: "登录成功",
						token: token,
						user: loginuser
					});
				} else {
					return res.json({
						success: false,
						message: response
					});
				}
			});
		}
	}).catch(err => {
		//findOne行为发生错误时
		return res.json({
			success: false,
			message: "用户不存在"
		});
	});

});
// Update my Information
app.post('/upmif', async (req, res) => {
	let user = req.body.user;
	let inup = req.body.inup;
	let msg = '已';
	// update user info
	users.updateUser(user, inup).then(response => {
		if (inup) {
			msg = msg + '修改密码，请重新登录';
			clearToken(req.pin);
		} else {
			msg = msg + '更新信息';
		}

		return res.json({
			success: true,
			message: msg
		});
	}).catch(err => {
		//findOne行为发生错误时
		return res.json({
			success: false,
			message: "服务器错误"
		});
		//logger.debug('err:'+err);
	});
	// return

});
// get Nurse list
app.post('/gusers', async (req, res) => {
	// update user info
	let position = req.body.position;
	let orgname = config.orgname.indexOf(req.body.orgname);
	users.getUserList(position, orgname).then((userlist) => {
		let userlistf = JSON.stringify(userlist);
		res.json({
			success: true,
			userlist: userlistf
		});
	}).catch(err => {
		//findOne行为发生错误时
		res.json({
			success: false,
			message: "查询出错"
		});
	});
});
// logout
app.post('/logout', (req, res) => {
	clearToken(req.username);
	return res.json({
		success: true,
		message: '已登出'
	});
});
// get empty list
app.post('/gbeds', async (req, res) => {
	// update user info
	beds.getEmptyBedLest().then((bedlist) => {
		let bedlistf = JSON.stringify(bedlist);
		res.json({
			success: true,
			bedlist: bedlistf
		});
	}).catch(err => {
		//findOne行为发生错误时
		res.json({
			success: false,
			message: "查询出错"
		});
	});
});
// Create Channel
app.post('/channels', async function (req, res) {
	logger.info('<<<<<<<<<<<<<<<<< C R E A T E  C H A N N E L >>>>>>>>>>>>>>>>>');
	logger.debug('End point : /channels');
	var channelName = req.body.channelName;
	var channelConfigPath = req.body.channelConfigPath;
	logger.debug('Channel name : ' + channelName);
	logger.debug('channelConfigPath : ' + channelConfigPath); //../artifacts/channel/mychannel.tx
	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!channelConfigPath) {
		res.json(getErrorMessage('\'channelConfigPath\''));
		return;
	}

	let message = await createChannel.createChannel(channelName, channelConfigPath, req.username, req.orgname);
	res.send(message);
});
// Join Channel
app.post('/channels/:channelName/peers', async function (req, res) {
	logger.info('<<<<<<<<<<<<<<<<< J O I N  C H A N N E L >>>>>>>>>>>>>>>>>');
	var channelName = req.params.channelName;
	var peers = req.body.peers;
	logger.debug('channelName : ' + channelName);
	logger.debug('peers : ' + peers);
	logger.debug('username :' + req.username);
	logger.debug('orgname:' + req.orgname);

	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!peers || peers.length == 0) {
		res.json(getErrorMessage('\'peers\''));
		return;
	}

	let message = await join.joinChannel(channelName, peers, req.username, req.orgname);
	res.send(message);
});
// Update anchor peers
app.post('/channels/:channelName/anchorpeers', async function (req, res) {
	logger.debug('==================== UPDATE ANCHOR PEERS ==================');
	var channelName = req.params.channelName;
	var configUpdatePath = req.body.configUpdatePath;
	logger.debug('Channel name : ' + channelName);
	logger.debug('configUpdatePath : ' + configUpdatePath);
	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!configUpdatePath) {
		res.json(getErrorMessage('\'configUpdatePath\''));
		return;
	}

	let message = await updateAnchorPeers.updateAnchorPeers(channelName, configUpdatePath, req.username, req.orgname);
	res.send(message);
});
// Install chaincode on target peers
app.post('/chaincodes', async function (req, res) {
	logger.debug('==================== INSTALL CHAINCODE ==================');
	var peers = req.body.peers;
	var chaincodeName = req.body.chaincodeName;
	var chaincodePath = req.body.chaincodePath;
	var chaincodeVersion = req.body.chaincodeVersion;
	var chaincodeType = req.body.chaincodeType;
	logger.debug('peers : ' + peers); // target peers list
	logger.debug('chaincodeName : ' + chaincodeName);
	logger.debug('chaincodePath  : ' + chaincodePath);
	logger.debug('chaincodeVersion  : ' + chaincodeVersion);
	logger.debug('chaincodeType  : ' + chaincodeType);
	if (!peers || peers.length == 0) {
		res.json(getErrorMessage('\'peers\''));
		return;
	}
	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	}
	if (!chaincodePath) {
		res.json(getErrorMessage('\'chaincodePath\''));
		return;
	}
	if (!chaincodeVersion) {
		res.json(getErrorMessage('\'chaincodeVersion\''));
		return;
	}
	if (!chaincodeType) {
		res.json(getErrorMessage('\'chaincodeType\''));
		return;
	}
	let message = await install.installChaincode(peers, chaincodeName, chaincodePath, chaincodeVersion, chaincodeType, req.username, req.orgname)
	res.send(message);
});
// Instantiate chaincode on target peers
app.post('/channels/:channelName/chaincodes', async function (req, res) {
	logger.debug('==================== INSTANTIATE CHAINCODE ==================');
	var peers = req.body.peers;
	var chaincodeName = req.body.chaincodeName;
	var chaincodeVersion = req.body.chaincodeVersion;
	var channelName = req.params.channelName;
	var chaincodeType = req.body.chaincodeType;
	var fcn = req.body.fcn;
	var args = req.body.args;
	logger.debug('peers  : ' + peers);
	logger.debug('channelName  : ' + channelName);
	logger.debug('chaincodeName : ' + chaincodeName);
	logger.debug('chaincodeVersion  : ' + chaincodeVersion);
	logger.debug('chaincodeType  : ' + chaincodeType);
	logger.debug('fcn  : ' + fcn);
	logger.debug('args  : ' + args);
	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	}
	if (!chaincodeVersion) {
		res.json(getErrorMessage('\'chaincodeVersion\''));
		return;
	}
	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!chaincodeType) {
		res.json(getErrorMessage('\'chaincodeType\''));
		return;
	}
	if (!args) {
		res.json(getErrorMessage('\'args\''));
		return;
	}

	let message = await instantiate.instantiateChaincode(peers, channelName, chaincodeName, chaincodeVersion, chaincodeType, fcn, args, req.username, req.orgname);
	res.send(message);
});
// Invoke transaction on chaincode on target peers
app.post('/channels/:channelName/chaincodes/:chaincodeName/invoke', async function (req, res) {
	logger.debug('==================== INVOKE ON CHAINCODE ==================');
	var peers = req.body.peers;
	var chaincodeName = req.params.chaincodeName;
	var channelName = req.params.channelName;
	var fcn = req.body.fcn;
	var args = req.body.args;
	logger.debug('channelName  : ' + channelName);
	logger.debug('chaincodeName : ' + chaincodeName);
	logger.debug('fcn  : ' + fcn);
	logger.debug('args  : ' + args);
	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	}
	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!fcn) {
		res.json(getErrorMessage('\'fcn\''));
		return;
	}
	if (!args) {
		res.json(getErrorMessage('\'args\''));
		return;
	}

	let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, fcn, args, req.username, req.orgname);
	res.send(message);
});
// Query on chaincode on target peers
app.post('/channels/:channelName/chaincodes/:chaincodeName/query', async function (req, res) {
	logger.debug('==================== QUERY BY CHAINCODE ==================');
	var channelName = req.params.channelName;
	var chaincodeName = req.params.chaincodeName;
	let args = req.body.args;
	let fcn = req.body.fcn;
	let peer = req.body.peers[0];

	logger.debug('channelName : ' + channelName);
	logger.debug('chaincodeName : ' + chaincodeName);
	logger.debug('fcn : ' + fcn);
	logger.debug('args : ' + args);

	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	}
	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!fcn) {
		res.json(getErrorMessage('\'fcn\''));
		return;
	}
	if (!args) {
		res.json(getErrorMessage('\'args\''));
		return;
	}
	// args = args.replace(/'/g, '"');
	// args = JSON.parse(args);
	// logger.debug(args);

	query.queryChaincode(peer, channelName, chaincodeName, args, fcn, req.username, req.orgname).then(msg => {
		return res.send({
			success: true,
			message: msg
		});
	});
});
// Give Bed and Update Record
app.post('/channels/:channelName/chaincodes/:chaincodeName/gvbedr', async function (req, res) {
	logger.debug('==================== INVOKE ON CHAINCODE ==================');
	var peers = req.body.peers;
	var chaincodeName = req.params.chaincodeName;
	var channelName = req.params.channelName;
	var fcn = "updateRecd";
	var args = req.body.args;
	logger.debug('channelName  : ' + channelName);
	logger.debug('chaincodeName : ' + chaincodeName);
	logger.debug('fcn  : ' + fcn);
	logger.debug('args  : ' + args);
	var bedid = JSON.parse(args).P_ward;
	beds.getBed(bedid).then(async bed => {
		if (!bed.isempty) {
			return res.json({
				success: false,
				message: "病床已被占用"
			});
		}
		beds.setBedState(bed);
	});
	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	}
	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!fcn) {
		res.json(getErrorMessage('\'fcn\''));
		return;
	}
	if (!args) {
		res.json(getErrorMessage('\'args\''));
		return;
	}

	let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, fcn, args, req.username, req.orgname);
	res.send(message);
});
// Take Bed and Sign Record
app.post('/channels/:channelName/chaincodes/:chaincodeName/tkbedr', async function (req, res) {
	logger.debug('==================== INVOKE ON CHAINCODE ==================');
	var peers = req.body.peers;
	var chaincodeName = req.params.chaincodeName;
	var channelName = req.params.channelName;
	var fcn = "acceptSign";
	var args = req.body.args;
	logger.debug('channelName  : ' + channelName);
	logger.debug('chaincodeName : ' + chaincodeName);
	logger.debug('args  : ' + args);
	var bedid = JSON.parse(args).P_ward;
	beds.getBed(bedid).then(async bed => {
		beds.setBedState(bed);
	});
	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	}
	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!args) {
		res.json(getErrorMessage('\'args\''));
		return;
	}

	let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, fcn, args, req.username, req.orgname);
	res.send(message);
});