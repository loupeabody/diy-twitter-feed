var https = require('https'),
		express = require('express'),
		querystring = require('querystring'),
		promise = require('promise'),
		btoa = require('btoa'),
		moment = require('moment'),
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
					"Authorization": "Bearer "+token
				}
			}

	return makeRequest(options)
}

var app = express()

app.use(express.static(__dirname + '/public'))

// respond with Twitter token
app.get('/token', function(req,res) {
	console.log('received request for token at /token')
	twitterOAuthToken()
		.then(function(r) {
			var token = { "token": JSON.parse(r)["access_token"] }

			res.setHeader('Content-Type','application/json')
			res.send(JSON.stringify(token),null,3)
		})
		.catch(function(err) { res.send(err) })
})

// respond with user tweets as JSON
app.get('/tweets/:token/:usn', function(req,res) {
	console.log('received request for tweets at /tweets')
	var query = {"count":5,"screen_name":req.params.usn},
			token =	req.params.token

	getUserTweets(token,query)
		.then(function(r) {
			var responseJSON = JSON.parse(r).map(function(d) {
						return {
							"id": d["id"],
							"name": d["user"]["name"],
							"username": d["user"]["screen_name"],
							"ts": moment(d["created_at"],'dd MMM DD HH:mm:ss ZZ YYYY','en').fromNow(),
							"text": d["text"]
						}
					})

			res.setHeader('Content-Type','application/json')
			res.send(JSON.stringify(responseJSON),null,3)
		})
		.catch(function(err) { res.send(err) })
})

app.listen(3535,function() {
	console.log('server listening on port 3535')
})