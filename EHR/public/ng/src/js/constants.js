'use strict';

angular.module('app').constant(
	'REST_URL',
	{
		// login
		'login': '/login',
		// logout
		'logout': '/logout',
		// update my inform
		'upmif': '/upmif',
		// get nurses
		'gusers': '/gusers',
		// get beds
		'gbeds' : '/gbeds',
		// Give Bed and Update Record
		'gvbedr': '/channels/mychannel/chaincodes/mycc/gvbedr',
		// Take Bed and Sign Record
		'tkbedr': '/channels/mychannel/chaincodes/mycc/tkbedr',
		// invoke
		'invoke': '/channels/mychannel/chaincodes/mycc/invoke',
		// query
		'query': '/channels/mychannel/chaincodes/mycc/query'

	}
);