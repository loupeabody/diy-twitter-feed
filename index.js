var https = require('https'),
		querystring = require('querystring'),
		promise = require('promise'),
		btoa = require('btoa'),
		config = require('./config')

function makeRequest(options,body) {

	return new Promise(function(resolve, reject) {
		var req = https.request(options,function(res) {
			res.setEncoding('utf-8')
			var responseString = ''

			res.on('data', function(data) { responseString += data })
			res.on('end', function() { resolve(responseString) })
			res.on('error', function(e) { reject(e) })
		})

		req.on('error', function(e) { reject(e) })
		if (body) req.write(body)
		req.end()
	})

}

// Authenticate w/ OAuth
function twitterOAuthToken() {
	var oauthKEY = config._twitterOAuthKEY,
			oauthSECRET = config._twitterOAuthSECRET,
			oauthREQUEST = ''

	oauthREQUEST += btoa(encodeURIComponent(oauthKEY) + ':' + encodeURIComponent(oauthSECRET))

	var options = {
				host: 'api.twitter.com',
				path: '/oauth2/token',
				method: 'POST',
				headers: {
					"Authorization": "Basic "+oauthREQUEST,
					"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"
				}
			},
			body = 'grant_type=client_credentials'

	return makeRequest(options,body)
}

function getUserTweets(token,query) {
	var tweetQuery = querystring.stringify(query),
			options = {
				host: 'api.twitter.com',
				path: '/1.1/statuses/user_timeline.json?'+tweetQuery,
				method: 'GET',
				headers: {
					"Authorization":"Bearer "+token
				}
			}

	return makeRequest(options)
}

var tweets = []
// Generate Request Token
// Get User Tweets
twitterOAuthToken()
	.then(function(token) {
		var access_token = JSON.parse(token)["access_token"]
		return getUserTweets(access_token,{"count":5,"screen_name":"kottke"})
	})
	.then(function(response) {
		tweets = JSON.parse(response).map(function(d) {
			return {
				"id":d["id"],
				"name":d["user"]["name"],
				"username":d["user"]["screen_name"],
				"ts":d["created_at"],
				"text":d["text"]
			}
		})
		console.log(tweets)
	})
	.catch(function(err) { console.error(err) })