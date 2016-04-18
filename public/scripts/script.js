var tweetTemplateSource = document.getElementById('tweet-template').innerHTML,
		mainTemplateSource = document.getElementById('main-template').innerHTML,
		mainTemplate = Handlebars.compile(mainTemplateSource),
		tweetTemplate = Handlebars.compile(tweetTemplateSource),
		locals = { users: [], terms: [], tweets: [] },
		getTweetsForm = document.getElementsByClassName('getTweets')[0],
		querySubmit = document.getElementById('submit-query')

Handlebars.registerPartial('tweetTemplate',tweetTemplate)
Handlebars.registerHelper('addEntitiesToBody',function(body,entities) {
	var newBody = body
	if (entities.urls.length > 0) {
		entities.urls.forEach(function(u) {
			newBody = newBody.replace(u.url,"<a href=\""+u.url+"\">"+u.url+"</a>")
		})
	}
	if (entities.media != undefined && entities.media.length > 0) {
		entities.media.forEach(function(u) {
			newBody = newBody.replace(u.url,"<a href=\""+u.url+"\">"+u.url+"</a>")
		})
	}
	if (entities["user_mentions"].length > 0) {
		entities["user_mentions"].forEach(function(u) {
			newBody = newBody.replace("\@"+u["screen_name"],"<a href=\"https://twitter.com/"+u["screen_name"].toLowerCase()+"\">\@"+u["screen_name"]+"</a>")
		})
	}
	if (entities.hashtags.length > 0) {
		entities.hashtags.forEach(function(u) {
			newBody = newBody.replace("\#"+u.text,"<a href=\"https://twitter.com/hashtag/"+u.text+"\">\#"+u.text+"</a>")
		})
	}
	console.log(newBody)
	return new Handlebars.SafeString(newBody)
})

function makeRequest(method, url) {
	return new Promise(function(resolve,reject) {
		var xhr = new XMLHttpRequest()
		xhr.addEventListener('error', reject)
		xhr.addEventListener('load', resolve)
		xhr.open(method, url)
		xhr.send()
	})
}

function getTwitterOAuthToken() { return makeRequest("GET", window.location.origin + "/token") }
function getUserTweets(token,usn) { return makeRequest("GET", window.location.origin + "/tweets/"+encodeURIComponent(token)+"/"+usn) }

function addTweetsToLocals(usn) {
	return getTwitterOAuthToken()
		.then(function(r) {
			var token = JSON.parse(r.currentTarget.response)["token"]
			return getUserTweets(token,usn)
		})
		.then(function(r) {
			// console.log(JSON.parse(r.currentTarget.response))
			var tweets = JSON.parse(r.currentTarget.response)
			tweets.map(function(t) {
				locals.tweets.push(t)
			})
		})
		.then(function(r) { document.body.innerHTML += mainTemplate(locals)})
		.catch(function(err) { console.log(err) })
}

getTweetsForm.addEventListener('submit', function(e) {
	e.preventDefault()
	e.stopImmediatePropagation()
	console.log(e)
	var query = getTweetsForm.getElementsByClassName('getTweets-query')[0].value
	addTweetsToLocals(query)
		.then(function(r) { return false })
})