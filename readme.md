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

or add the livereload script tag manually:
http://feedback.livereload.com/knowledgebase/articles/86180-how-do-i-add-the-script-tag-manually-

## Integration

### Using make

```make
# add tiny-lr to your PATH (only affect the Makefile)
PATH := ./node_modules/.bin:$(PATH)

# define the list of files you want to watch (you can additional path from
# the command line, with WATCHED="filepath.ext ..."
WATCHED += $(shell find docs -name *.css )
WATCHED += $(shell find docs -name *.html )

tiny-lr.pid:
  @echo ... Starting server, running in background ...
  @echo ... Run: "make stop" to stop the server ...
  @tiny-lr &

livereload-stop:
  @[ -a tiny-lr.pid ] && curl http://localhost:35729/kill

# alias both livereload / start target to the server pid file.
livereload: tiny-lr.pid
start: livereload

# alias stop to livereload-stop target
stop: livereload-stop

# define our watch target
watch.log: $(WATCHED)
  @echo reload $? >> $@
  curl -X POST http://localhost:35729/changed -d '{ "files": "$?" }'

clean:
  rm watch.log

watch: tiny-lr.pid watch.log

.PHONY: livereload-stop stop clean
```

Now, whenever you run `make watch`, make will:

- Start up the server, generate the pidfile at ./tiny-lr.pid. Only if it isn't already started yet.
- For each prerequisites in `$(WATCHED)`, make will compare last modification
  time and build the list of updated files.
- `@echo reload $? >> $@` takes care of editing the `watch.log` target,
  updating the last edit time for this file.
- and trigger a POST request to the livereload server with the list of files to refresh.

Combine this with [visionmedia/watch](https://github.com/visionmedia/watch) and
you have a livereload environment.

### Using grunt

```js
// In your Gruntfile
var Server = require('tiny-lr');

grunt.registerTask('tinylr-start', 'Start the tiny livereload server', function() {
  grunt.log
    .writeln('... Starting server, running in background ...')
    .writeln('... Run: "grunt stop" to stop the server ...');

    var options = this.options();

    var server = new Server();
    server.listen(options.port, this.async());
});

// define an alias to the tinylr-start followed by watch task.
grunt.registerTask('start', 'tinylr-start watch');
```

And in one of your watch task, using `grunt.file.watchFiles` hash.

Using the server instance created before:

```js
// assuming you have stored the server instance before
var server = grunt.config('tinylr-server');

// use the changed method
server.changed({
  files: grunt.file.watchFiles.changed
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

## API

You can start the server using the binary provided, or use your own start script.

```js
var Server = require('tiny-lr');

server.listen(35729, function() {
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
