tiny-lr
-------

This script manages a tiny [LiveReload](http://livereload.com/) server
implementation you spawn in the background.

It doesn't have any watch ability, it must be done at the build process or
application level.

Instead, it exposes a very simple API to notify the server that some
changes have been made, that is then broadcasted to every livereload client
connected.

    # notify a single change
    curl http://localhost:35729/changed?files=style.css

    # notify using a longer path
    curl http://localhost:35729/changed?files=js/app.js

    # notify multiple changes, comma or space delimited
    curl http://localhost:35729/changed?files=index.html,style.css,docs/docco.css

Or you can bulk the information into a POST request, with body as a JSON array of files.

    curl -X POST http://localhost:35729/changed -d '{ "files": ["style.css", "app.js"] }'

As for the livereload client, you need to install the browser extension:
http://feedback.livereload.com/knowledgebase/articles/86242-how-do-i-install-and-use-the-browser-extensions-
(**note**: you need to listen on port 35729 to be able to use with your
brower extension)

or add the livereload script tag manually:
http://feedback.livereload.com/knowledgebase/articles/86180-how-do-i-add-the-script-tag-manually-
(and here you can choose whatever port you want)

## Integration

### Using make

```make
# add tiny-lr to your PATH (only affect the Makefile)
PATH := ./node_modules/.bin:$(PATH)

# define the list of files you want to watch (you can additional path from
CSS_FILES ?= $(shell find styles -name *.css )
JS_FILES  ?= $(shell find scripts -name *.js )

tiny-lr.pid:
  @echo ... Starting server, running in background ...
  @echo ... Run: "make stop" to stop the server ...
  @tiny-lr &

stop:
  @[ -a tiny-lr.pid ] && curl http://localhost:35729/kill
  # or
  # @[ -a tiny-lr.pid ] && kill $(shell cat tiny-lr.pid)

start: tiny-lr.pid

# define our watch target(s)
styles: $(CSS_FILES)
  @echo CSS files changed: $?
  curl -X POST http://localhost:35729/changed -d '{ "files": "$?" }'
  touch $@

# possibly you can group the css / js target here
scripts: $(JS_FILES)
  @echo JS files changed: $?
  curl -X POST http://localhost:35729/changed -d '{ "files": "$?" }'
  touch $@

watch: styles scripts

.PHONY: start stop
```

Now, whenever you run `make watch`, make will:

- Start up the server, generate the pidfile at ./tiny-lr.pid. Only if it isn't already started yet.
- For each prerequisites in `$(JS_FILES)` or `$(CSS_FILES)`, make will compare last modification time and build the list of updated files.
- If one of the prerequisites is newer than the target (the scripts or
  styles directory), make will rerun the recipe.
- The recipe simply trigger a POST request to the livereload server with
  the list of files to refresh.
- This can possibly be done after a JS or CSS compilation step (compass,
  less, component-bulid, sprockets, r.js, browserify, etc.)

Combine this with
[visionmedia/watch](https://github.com/visionmedia/watch) and you have a
livereload environment.

    watch make scripts styles

    # add a -q flag to the watch command to suppress most of the annoying output
    watch -q scripts styles

The `-q` flag only outputs STDERR, you can in your Makefile redirect the
output of your commands to `>&2` to see them in `watch -q` mode.

### Using grunt

```js
// In your Gruntfile
var Server = require('tiny-lr');

var server;
grunt.registerTask('tinylr-start', 'Start the tiny livereload server', function() {
    server = new Server();
    server.listen(options.port, this.async());
});

// define an alias to the tinylr-start followed by watch task.
grunt.registerTask('start', 'tinylr-start watch');
```

And in one of your watch task, using `grunt.file.watchFiles` hash.

Using the server instance created before:

```js
// use the changed method
server.changed({
  params: {
    files: grunt.file.watchFiles.changed
  }
});
```

Or make an HTTP request to the `/changed` endpoint.

```js
// https://github.com/mikeal/request
var request = require('request');

request.post('http://localhost:35729/changed')
  .form({ files: ['style.css', 'path/to/my/app.js'] })
  .on('end', this.async());
```

**note**:

- Do not rely on `grunt.config()` to pass around the server
instance. Rely on some closure scope if you need to access the server in
both of your task.
- Use grunt 0.4 to be able to access that handy
  `grunt.file.watchFiles.changed` list of files in one of your watch
task.

## API

You can start the server using the binary provided, or use your own start script.

```js
var Server = require('tiny-lr');

server.listen(35729, function(err) {
  if(err) {
    // deal with err
    return;
  }

  console.log('... Listening on %s (pid: %s) ...', opts.port, process.pid);
});
```

You can define your own route and listen for specific request:

```js
server.on('GET /myplace', function(req, res) {
  res.write('Mine');
  res.end();
})
```

And stop the server manually:

```js
server.close();
```

This will close any websocket connection established and exit the process.

## Tests

    npm test

---


# TOC
   - [tiny-lr](#tiny-lr)
     - [GET /](#tiny-lr-get-)
     - [GET /changed](#tiny-lr-get-changed)
     - [POST /changed](#tiny-lr-post-changed)
     - [GET /livereload.js](#tiny-lr-get-livereloadjs)
     - [GET /kill](#tiny-lr-get-kill)
<a name="" />

<a name="tiny-lr" />
# tiny-lr
accepts ws clients.

```js
var url = parse(this.request.url);
var server = this.app;

var ws = this.ws = new WebSocket('ws://' + url.host + '/livereload');

ws.onopen = function(event) {
  var hello = {
    command: 'hello',
    protocols: ['http://livereload.com/protocols/official-7']
  };

  ws.send(JSON.stringify(hello));
};

ws.onmessage = function(event) {
  assert.deepEqual(event.data, JSON.stringify({
    command: 'hello',
    protocols: ['http://livereload.com/protocols/official-7'],
    serverName: 'tiny-lr'
  }));

  assert.ok(Object.keys(server.clients).length);
  done();
};
```

properly cleans up established connection on exit.

```js
var ws = this.ws;

ws.onclose = done.bind(null, null);

request(this.server)
  .get('/kill')
  .expect(200, function() {
    console.log('server shutdown');
  });
```

<a name="tiny-lr" />
# tiny-lr
<a name="tiny-lr-get-" />
## GET /
respond with nothing, but respond.

```js
request(this.server)
  .get('/')
  .expect('Content-Type', /json/)
  .expect('{"tinylr":"Welcome","version":"0.0.1"}')
  .expect(200, done);
```

unknown route respond with proper 404 and error message.

```js
request(this.server)
  .get('/whatev')
  .expect('Content-Type', /json/)
  .expect('{"error":"not_found","reason":"no such route"}')
  .expect(404, done);
```

<a name="tiny-lr-get-changed" />
## GET /changed
with no clients, no files.

```js
request(this.server)
  .get('/changed')
  .expect('Content-Type', /json/)
  .expect(/"clients":\[\]/)
  .expect(/"files":\[\]/)
  .expect(200, done);
```

with no clients, some files.

```js
request(this.server)
  .get('/changed?files=gonna.css,test.css,it.css')
  .expect('Content-Type', /json/)
  .expect('{"clients":[],"files":["gonna.css","test.css","it.css"]}')
  .expect(200, done);
```

<a name="tiny-lr-post-changed" />
## POST /changed
with no clients, no files.

```js
request(this.server)
  .post('/changed')
  .expect('Content-Type', /json/)
  .expect(/"clients":\[\]/)
  .expect(/"files":\[\]/)
  .expect(200, done);
```

with no clients, some files.

```js
var data = { clients: [], files: ['cat.css', 'sed.css', 'ack.js'] };

request(this.server)
  .post('/changed')
  .send({ files: data.files })
  .expect('Content-Type', /json/)
  .expect(JSON.stringify(data))
  .expect(200, done);
```

<a name="tiny-lr-get-livereloadjs" />
## GET /livereload.js
respond with livereload script.

```js
request(this.server)
  .get('/livereload.js')
  .expect(/LiveReload/)
  .expect(200, done);
```

<a name="tiny-lr-get-kill" />
## GET /kill
shutdown the server.

```js
var server = this.server;
request(server)
  .get('/kill')
  .expect(200, function(err) {
    if(err) return done(err);
    assert.ok(!server._handle);
    done();
  });
```
