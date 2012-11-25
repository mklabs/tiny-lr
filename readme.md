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

    .PHONY: livereload-stop stop

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

