var cola = (function () {

    // for test specification name identification
    var specifcation = null;

    //test spec extension
    var TEST_FILE_EXTENSIOIN = '.js';

    jasmine.Spec.prototype.runs = function (func) {
        var block = new jasmine.Block(this.env, func, this),
            spec = specifcation;
        log.debug('specifcation is found ' + spec);
        // replace to id for this.env.currentSpec.suite.description

        if (spec == null) {
            this.addToQueue(block);
        } else if (this.env.currentSpec.suite.queue.env.currentSpec.id == spec) {
            this.addToQueue(block);

        }

        return this;
    };

    jasmine.Queue.prototype.next_ = function () {
        var self = this;
        var goAgain = true;

        while (goAgain) {
            goAgain = false;

            if (self.index < self.blocks.length && !(this.abort && !this.ensured[self.index])) {
                var calledSynchronously = true;
                var completedSynchronously = false;

                var onComplete = function () {
                    if (jasmine.Queue.LOOP_DONT_RECURSE && calledSynchronously) {
                        completedSynchronously = true;
                        return;
                    }

                    if (self.blocks[self.index].abort) {
                        self.abort = true;
                    }

                    self.offset = 0;
                    self.index++;

                    var now = new Date().getTime();

                    if (self.env.lastUpdate == 0) {

                        self.env.lastUpdate = now;
                    }

                    if (self.env.updateInterval && now - self.env.lastUpdate > self.env.updateInterval) {
                        self.env.lastUpdate = now;
                        self.next_();
                    } else {
                        if (jasmine.Queue.LOOP_DONT_RECURSE && completedSynchronously) {

                            goAgain = true;
                        } else {
                            self.next_();
                        }
                    }
                };
                self.blocks[self.index].execute(onComplete);

                calledSynchronously = false;
                if (completedSynchronously) {
                    onComplete();
                }

            } else {
                self.running = false;
                if (self.onComplete) {
                    self.onComplete();
                }
            }
        }
    };

    /*
     * function execute calling runner to starting testing after identification
     * url and location pattern to be executed
     *
     */
    jasmine.Env.prototype.execute = function () {
        if (urlMapper()) {
            this.currentRunner_.execute();
        }
    };

    /**
     * run is main function that will be called from app test level
     * this funtion will register the reporter for ENV in jasmine
     *
     */
    var run = function() {
	log.debug('Called the run for cola');
	var jasmineEnv = jasmine.getEnv(),
	renderingFormat = request.getParameter('format');
	// for 1.1 V for test framework or if it fixed for AJAx called
	// after fixing this jaggery blocker
	// https://wso2.org/jira/browse/JAGGERY-339 will support AJAX then blow
	// line can be uncommented for User-Agent/Accept to get type
	//https://wso2.org/jira/browse/JAGGERY-339
	// renderingFormat request.getHeader("Accept"); // for to check text/html
	if (renderingFormat == 'html') {
	    var htmlReporter = new jasmine.HTMLReporter();
	    jasmineEnv.addReporter(htmlReporter);
	} else {
	    var jsonReporter = new jasmine.JSONReporter();
	    jasmineEnv.addReporter(jsonReporter);
	}
	jasmineEnv.execute();
    };
    
    /**
     * function have URl mapping for pattern (n *m , 0<n,m<N) folder structure with one
     * file inside with specification
     * 
     * http://localhost:9763/automobile/test[/{folderName}0-n][/{fileName}0-1][/{
     * testSpecName }0-1] * above URL pattern can be handle
     * 
     */
    var urlMapper = function () {
        var uri = request.getRequestURI(),
            pathMatcher1 = null,
            pathMatcher2 = null,
            uriMatcher = new URIMatcher(
                uri);
        log.debug(uri);

        // Provide a pattern to be matched against the URL
        if (uriMatcher.match('/{appname}/{test}/{+path}')) {
            // If pattern matches, elements can be accessed from their keys

            pathMatcher1 = '/' + uriMatcher.elements().test + '/' + uriMatcher.elements().path;
            if (pathMatcher1 != null) {
                pathMatcher2 = pathMatcher1.substr(0, pathMatcher1
                    .lastIndexOf("/"));
                if (isValidPath(pathMatcher1, pathMatcher2)) {
                    specifcation = pathMatcher1.substr(pathMatcher1
                        .lastIndexOf("/") + 1);
                }
            }
            log.debug('path : ' + pathMatcher1 + ',' + pathMatcher2);
            return validatedPatten(pathMatcher1, pathMatcher2);
            log.debug(isExists(pathMatcher1));
            log.debug(isExists(pathMatcher2));

        }

        if (uriMatcher.match('/{appname}/{test}/')) {
            // root pattern for test Directory
            log.debug('getting all file from Require');
            crawl('/' + uriMatcher.elements().test);
            return true;
        }

    };

    /**
     * function is validate URL pattern for requiring files
     *
     * @param pathMatcher1
     *            is path of a pattern of path can existing
     * @param pathMatcher2
     *            is path of a pattern of path can existing for second level
     * @returns boolean
     */
    var validatedPatten = function (pathMatcher1, pathMatcher2) {
        if (!reqiureFiles(pathMatcher1)) {
            if (!(reqiureFiles(pathMatcher2)) && pathMatcher2 != null && !(isValidPath(pathMatcher1, pathMatcher2))) {
                log.debug("Path not exsting");
                print({
                    'error': true,
                    'message': 'path \'' + pathMatcher1 + '\' is not valid'
                });
                return false;
            }
        }
        return true;
    };

    /**
     * function will require all test specification js files/file in path
     *
     * @param path
     *            can be directory or to file path with out extension all test specification is
     *            define as *.js
     * @returns
     */
    var reqiureFiles = function (path) {
        log.debug('requiring from ' + path);
        isCompleted = false;
        if (isDirectory(path)) {
            isCompleted = true;
            log.debug("is Dir " + path);
            crawl(path);
        } else if (isExists(path + TEST_FILE_EXTENSIOIN)) {
            isCompleted = true;
            log.debug("is File " + path + TEST_FILE_EXTENSIOIN);
            require(path + TEST_FILE_EXTENSIOIN);
        }
        return isCompleted;
    };

    /**
     * function crawl will require all the file in root location
     *
     * @param root
     *            is path of directory to search for test specification files
     */
    var crawl = function (root) {
        log.debug('crawling on root called ' + root);
        var file = new File(root),
            list = file.listFiles();

        if (list == null)
            return;

        for (var i = 0; i < list.length; i++) {
            log.debug(i + ' checking files on ' + root);
            var f = list[i];
            if (f.isDirectory()) {

                log.debug("Dir:" + f.getName());
                crawl(root + '/' + f.getName());
            } else {
                log.debug("File:" + f.getName());
                require(root + '/' + f.getName());
            }
        }
    };

    /**
     * This function is main for passing js fils in front end
     * from from jaggery module level to app level
     * TO-DO - TO-CALL - Jaggery have limitation on this, this need to be fixed in jaggery
     * THIS-LIMITATION in jaggery not allowing AJAX process in front end
     *
     * @param path of the file inside jaggery module
     * @returns file will be return for front end
     */
    var loadJSToFront = function (filePath) {
        var file = new File(filePath);
        file.open("r");
        print(file.readAll());
    };





    /**
     * function is to checks whether the given path is a directory
     *
     * @param path
     * @returns directory is existing return true
     */
    var isDirectory = function (path) {
        var file = new File(path);
        return file.isDirectory();
    };


    /**
     * file give the name of the file
     * @param path
     * @returns Name of the file without the path
     */
    var getName = function (path) {
        var file = new File(path);
        return file.getName();
    };

    /**
     *
     * @param path
     * @returns checks whether this file actually exists. Returns true if the
     *          file exists.
     */
    var isExists = function (path) {
        var file = new File(path);
        return file.isExists();
    };

    /**
     * validation check for specification name of test suite
     *
     * @param path1
     * @param path2
     * @returns {Boolean}
     */
    var isValidPath = function (path1, path2) {
        var isValid = false;
        if ((isDirectory(path2) || isExists(path2 + TEST_FILE_EXTENSIOIN)) && !(isDirectory(path1) || isExists(path1 + TEST_FILE_EXTENSIOIN))) {
            log.debug('Current URL - path is validated for testspec name.');
            isValid = true;
        }
        return isValid;
    };

    return {
        run: run,
        loadJSToFront: loadJSToFront
    };

}());