// This code implements the `-sMODULARIZE` settings by taking the generated
// JS program code (INNER_JS_CODE) and wrapping it in a factory function.

// Single threaded MINIMAL_RUNTIME programs do not need access to
// document.currentScript, so a simple export declaration is enough.
var unityFramework = (() => {
  // When MODULARIZE this JS may be executed later,
  // after document.currentScript is gone, so we save it.
  // In EXPORT_ES6 mode we can just use 'import.meta.url'.
  var _scriptName = globalThis.document?.currentScript?.src;
  return async function(moduleArg = {}) {
    var moduleRtn;

// include: shell.js
// include: minimum_runtime_check.js
(function() {
  // "30.0.0" -> 300000
  function humanReadableVersionToPacked(str) {
    str = str.split('-')[0]; // Remove any trailing part from e.g. "12.53.3-alpha"
    var vers = str.split('.').slice(0, 3);
    while(vers.length < 3) vers.push('00');
    vers = vers.map((n, i, arr) => n.padStart(2, '0'));
    return vers.join('');
  }
  // 300000 -> "30.0.0"
  var packedVersionToHumanReadable = n => [n / 10000 | 0, (n / 100 | 0) % 100, n % 100].join('.');

  var TARGET_NOT_SUPPORTED = 2147483647;

  // Note: We use a typeof check here instead of optional chaining using
  // globalThis because older browsers might not have globalThis defined.
  var currentNodeVersion = typeof process !== 'undefined' && process.versions?.node ? humanReadableVersionToPacked(process.versions.node) : TARGET_NOT_SUPPORTED;
  if (currentNodeVersion < TARGET_NOT_SUPPORTED) {
    throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');
  }
  if (currentNodeVersion < 2147483647) {
    throw new Error(`This emscripten-generated code requires node v${ packedVersionToHumanReadable(2147483647) } (detected v${packedVersionToHumanReadable(currentNodeVersion)})`);
  }

  var userAgent = typeof navigator !== 'undefined' && navigator.userAgent;
  if (!userAgent) {
    return;
  }

  var currentSafariVersion = userAgent.includes("Safari/") && userAgent.match(/Version\/(\d+\.?\d*\.?\d*)/) ? humanReadableVersionToPacked(userAgent.match(/Version\/(\d+\.?\d*\.?\d*)/)[1]) : TARGET_NOT_SUPPORTED;
  if (currentSafariVersion < 150000) {
    throw new Error(`This emscripten-generated code requires Safari v${ packedVersionToHumanReadable(150000) } (detected v${currentSafariVersion})`);
  }

  var currentFirefoxVersion = userAgent.match(/Firefox\/(\d+(?:\.\d+)?)/) ? parseFloat(userAgent.match(/Firefox\/(\d+(?:\.\d+)?)/)[1]) : TARGET_NOT_SUPPORTED;
  if (currentFirefoxVersion < 79) {
    throw new Error(`This emscripten-generated code requires Firefox v79 (detected v${currentFirefoxVersion})`);
  }

  var currentChromeVersion = userAgent.match(/Chrome\/(\d+(?:\.\d+)?)/) ? parseFloat(userAgent.match(/Chrome\/(\d+(?:\.\d+)?)/)[1]) : TARGET_NOT_SUPPORTED;
  if (currentChromeVersion < 85) {
    throw new Error(`This emscripten-generated code requires Chrome v85 (detected v${currentChromeVersion})`);
  }
})();

// end include: minimum_runtime_check.js
// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(moduleArg) => Promise<Module>
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = moduleArg;

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).

var ENVIRONMENT_IS_WEB = true;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)
// include: D:/Work/Unity/6000.6.0f1/Editor/Data/PlaybackEngines/WebGLSupport/BuildTools/UserJsprePlaceholder.js


// end include: D:/Work/Unity/6000.6.0f1/Editor/Data/PlaybackEngines/WebGLSupport/BuildTools/UserJsprePlaceholder.js
// include: D:/Work/Unity/6000.6.0f1/Editor/Data/PlaybackEngines/WebGLSupport/BuildTools/prejs/AnimationFrameRate.js
let screenAnimationFrameRate = 60;

(function() {
    const defaultDelta = 1000 / 60;
    // Keep a rolling history of 60 most recent raf frame delta-times, assuming 60 fps to start.
    const deltaTimes = Array(60).fill(defaultDelta);
    const deltaTimeSums = Array(60).fill(1000);
    const startTime = performance.now();

    requestAnimationFrame(() => rafUpdateLoop(0, startTime, performance.now()));

    function rafUpdateLoop(index, prevTime, currTime) {
        const frameRate = computeAnimationFrameRate(index, prevTime, currTime);
        if (frameRate !== undefined) {
            screenAnimationFrameRate = frameRate;
        }
        requestAnimationFrame(() => rafUpdateLoop((index + 1) % 60, currTime, performance.now()));
    }

    function computeAnimationFrameRate(index, prevTime, currTime) {
        const deltaTime = currTime - prevTime;
        const prevIndex = (index + 59) % 60;
        const deltaTimeSum = deltaTimeSums[prevIndex] - deltaTimes[index] + deltaTime;

        deltaTimes[index] = deltaTime;
        deltaTimeSums[index] = deltaTimeSum;

        const min = Math.min(...deltaTimes);
        const max = Math.max(...deltaTimes);
        const minSum = Math.min(...deltaTimeSums);
        const maxSum = Math.max(...deltaTimeSums);

        // If there's < 3ms fluctuation in frame times, and < 8ms fluctuation in accumulated frame history then it is plausible we are seeing the actual display refresh rate. These cutoff limits were empirically tested on a PC gaming display to avoid false positives.
        if (max < min + 3 && maxSum < minSum + 8) {
            const deltaTimeAvg = deltaTimeSums[index] / 60;
            // Janky spaghetti "pretend that display refresh rate is an exact integer Hz" snapping to avoid fluctuation in the detected times.
            let frameRate = (1e3 / deltaTimeAvg) | 0;
            // Even more janky spaghetti "snap integer Hz refresh rate to close to common marketed gaming display refresh rates, and multiples of 10 Hz":
            const comparisonFrameRates = [75, 144, 165, Math.round((frameRate + 5) / 10) * 10];
            for (let i = 0; i < comparisonFrameRates.length; ++i) {
                if (Math.abs(frameRate - comparisonFrameRates[i]) < 2) frameRate = comparisonFrameRates[i];
            }
            return frameRate;
        } else {
            // Too much fluctation to accurately report a frame rate
            return undefined;
        }
    };
})();
// end include: D:/Work/Unity/6000.6.0f1/Editor/Data/PlaybackEngines/WebGLSupport/BuildTools/prejs/AnimationFrameRate.js
// include: D:/Work/Unity/6000.6.0f1/Editor/Data/PlaybackEngines/WebGLSupport/BuildTools/prejs/Error.js
var abort = function (what) {
  if (ABORT)
    return;
  ABORT = true;
  EXITSTATUS = 1;
  if (typeof ENVIRONMENT_IS_PTHREAD !== "undefined" && ENVIRONMENT_IS_PTHREAD)
    console.error("Pthread aborting at " + new Error().stack);
  if (what !== undefined) {
    out(what);
    err(what);
    // Convert "what" to a string for the abort handler.
    // Use .toString() method for Error objects to get a readable text.
    what = (what instanceof Error) ? what.toString() : JSON.stringify(what);
  } else {
    what = "";
  }
  var message = "abort(" + what + ") at " + new Error().stack;
  if (Module.abortHandler && Module.abortHandler(message))
    return;
  throw message;
}
// end include: D:/Work/Unity/6000.6.0f1/Editor/Data/PlaybackEngines/WebGLSupport/BuildTools/prejs/Error.js
// include: D:/Work/Unity/6000.6.0f1/Editor/Data/PlaybackEngines/WebGLSupport/BuildTools/prejs/FullScreen.js
Module["SetFullscreen"] = function (fullscreen) {
  if (typeof runtimeInitialized === 'undefined' || !runtimeInitialized) {
    console.log ("Runtime not initialized yet.");
  } else if (typeof JSEvents === 'undefined') {
    console.log ("Player not loaded yet.");
  } else {
    var tmp = JSEvents.canPerformEventHandlerRequests;
    JSEvents.canPerformEventHandlerRequests = function () { return 1; };
    Module.ccall("SetFullscreen", null, ["number"], [fullscreen]);
    JSEvents.canPerformEventHandlerRequests = tmp;
  }
};
// end include: D:/Work/Unity/6000.6.0f1/Editor/Data/PlaybackEngines/WebGLSupport/BuildTools/prejs/FullScreen.js
// include: D:/Work/Unity/6000.6.0f1/Editor/Data/PlaybackEngines/WebGLSupport/BuildTools/prejs/IdbFs.js
if (typeof ENVIRONMENT_IS_PTHREAD === 'undefined' || !ENVIRONMENT_IS_PTHREAD) {
  if (!Module['preRun']) Module['preRun'] = [];
  Module['preRun'].push(function () {
    function injectIndexedDBToAutomaticallyPersist() {
      // The contents of this function cherry-pick the changes from upstream Emscripten
      // PR https://github.com/emscripten-core/emscripten/pull/21938.
      // TODO: Once Emscripten is updated the next time, this IDBFS.queuePersist = ... assignment can be removed.
      IDBFS.queuePersist = function(mount) {
        function onPersistComplete() {
          if (mount.idbPersistState === 'again') startPersist(); // If a new sync request has appeared in between, kick off a new sync
          else mount.idbPersistState = 0; // Otherwise reset sync state back to idle to wait for a new sync later
        }
        function startPersist() {
          mount.idbPersistState = 'idb'; // Mark that we are currently running a sync operation
          IDBFS.syncfs(mount, /*populate:*/false, onPersistComplete);
        }

        if (!mount.idbPersistState) {
          // Programs typically write/copy/move multiple files in the in-memory
          // filesystem within a single app frame, so when a filesystem sync
          // command is triggered, do not start it immediately, but only after
          // the current frame is finished. This way all the modified files
          // inside the main loop tick will be batched up to the same sync.
          mount.idbPersistState = setTimeout(startPersist, 0);
        } else if (mount.idbPersistState === 'idb') {
          // There is an active IndexedDB sync operation in-flight, but we now
          // have accumulated more files to sync. We should therefore queue up
          // a new sync after the current one finishes so that all writes
          // will be properly persisted.
          mount.idbPersistState = 'again';
        }
      };
      // TODO: Once Emscripten is updated the next time, this IDBFS.mount = ... assignment can be removed.
      IDBFS.mount = function(mount) {
        // reuse core MEMFS functionality
        var mnt = MEMFS.mount(mount);
        // If the automatic IDBFS persistence option has been selected, then automatically persist
        // all modifications to the filesystem as they occur.
        if (typeof mount !== 'undefined' && mount.opts && mount.opts.autoPersist) {
          mnt.idbPersistState = 0; // IndexedDB sync starts in idle state
          var memfs_node_ops = mnt.node_ops;
          mnt.node_ops = Object.assign({}, mnt.node_ops); // Clone node_ops to inject write tracking
          mnt.node_ops.mknod = function(parent, name, mode, dev) {
            var node = memfs_node_ops.mknod(parent, name, mode, dev);
            // Propagate injected node_ops to the newly created child node
            node.node_ops = mnt.node_ops;
            // Remember for each IDBFS node which IDBFS mount point they came from so we know which mount to persist on modification.
            node.idbfs_mount = mnt.mount;
            // Remember original MEMFS stream_ops for this node
            node.memfs_stream_ops = node.stream_ops;
            // Clone stream_ops to inject write tracking
            node.stream_ops = Object.assign({}, node.stream_ops);

            // Track all file writes
            node.stream_ops.write = function(stream, buffer, offset, length, position, canOwn) {
              // This file has been modified, we must persist IndexedDB when this file closes
              stream.node.isModified = true;
              return node.memfs_stream_ops.write(stream, buffer, offset, length, position, canOwn);
            };

            // Persist IndexedDB on file close
            node.stream_ops.close = function(stream) {
              var n = stream.node;
              if (n.isModified) {
                IDBFS.queuePersist(n.idbfs_mount);
                n.isModified = false;
              }
              if (n.memfs_stream_ops.close) return n.memfs_stream_ops.close(stream);
            };

            return node;
          };
          // Also kick off persisting the filesystem on other operations that modify the filesystem.
          mnt.node_ops.rmdir   = function(parent, name) { IDBFS.queuePersist(mnt.mount); return memfs_node_ops.rmdir(parent, name); };
          mnt.node_ops.unlink  = function(parent, name) { IDBFS.queuePersist(mnt.mount); return memfs_node_ops.unlink(parent, name); };
          mnt.node_ops.mkdir   = function(path, mode)   { IDBFS.queuePersist(mnt.mount); return memfs_node_ops.mkdir(path, mode); };
          mnt.node_ops.symlink = function(parent, newname, oldpath)    { IDBFS.queuePersist(mnt.mount); return memfs_node_ops.symlink(parent, newname, oldpath); };
          mnt.node_ops.rename  = function(old_node, new_dir, new_name) { IDBFS.queuePersist(mnt.mount); return memfs_node_ops.rename(old_node, new_dir, new_name); };
        }
        return mnt;
      };
    }
    // TODO: Once Emscripten is updated the next time, this injectIndexedDBToAutomaticallyPersist() function can be removed.
    injectIndexedDBToAutomaticallyPersist();
    // Initialize the IndexedDB based file system. Module['unityFileSystemInit'] allows
    // developers to override this with their own function, when they want to do cloud storage
    // instead.
    var unityFileSystemInit = Module['unityFileSystemInit'] || function () {
      FS.mkdir('/idbfs');
      // If user has specified Module.autoSyncPersistentDataPath = true in their JS web template config, then the IndexedDB storage
      // will be automatically persisted to the user.
      // Save the IDBFS mount point to Module so that JS_FileSystem_Sync() function can have access to it.
      Module.__unityIdbfsMount = FS.mount(IDBFS, { autoPersist: !!Module['autoSyncPersistentDataPath'] }, '/idbfs');
      Module.addRunDependency('JS_FileSystem_Mount');
      FS.syncfs(true, function (err) {
        if (err)
          console.log('IndexedDB is not available. Data will not persist in cache and PlayerPrefs will not be saved.');
        Module.removeRunDependency('JS_FileSystem_Mount');
      });
    };
    unityFileSystemInit();
  });
}
// end include: D:/Work/Unity/6000.6.0f1/Editor/Data/PlaybackEngines/WebGLSupport/BuildTools/prejs/IdbFs.js
// include: D:/Work/Unity/6000.6.0f1/Editor/Data/PlaybackEngines/WebGLSupport/BuildTools/prejs/MediaDevices.js
var videoInputDevices = []; // Set to null to disable video input devices altogether.
// Track whether we have been able to enumerate media devices successfully at least once. Used
// by JS_WebCamVideo_GetNumDevices() to detect if we are clear of the browser spec issue
// https://github.com/w3c/mediacapture-main/issues/905
var videoInputDevicesSuccessfullyEnumerated = false;

// Bug/limitation: Chrome does not specify deviceIds for any MediaDeviceInfo input devices at least in Chrome 85 on Windows 10
// This means that we need to use an awkward heuristic way of matching old video input connections to new ones.
function matchToOldDevice(newDevice) {
	var oldDevices = Object.keys(videoInputDevices);
	// First match by deviceId
	for(var i = 0; i < oldDevices.length; ++i) {
		var old = videoInputDevices[oldDevices[i]];
		if (old.deviceId && old.deviceId == newDevice.deviceId) return old;
	}
	// Then by object identity, in case that is supported.
	for(var i = 0; i < oldDevices.length; ++i) {
		var old = videoInputDevices[oldDevices[i]];
		if (old == newDevice) return old;
	}
	// Then by label
	for(var i = 0; i < oldDevices.length; ++i) {
		var old = videoInputDevices[oldDevices[i]];
		if (old.label && old.label == newDevice.label) return old;
	}
	// Last, by groupId + kind combination
	for(var i = 0; i < oldDevices.length; ++i) {
		var old = videoInputDevices[oldDevices[i]];
		if (old.groupId && old.kind && old.groupId == newDevice.groupId && old.kind == newDevice.kind) return old;
	}
}

function assignNewVideoInputId() {
	for(var i = 0;; ++i) {
		if (!videoInputDevices[i]) return i;
	}
}

function updateVideoInputDevices(devices) {
	videoInputDevicesSuccessfullyEnumerated = true;
	var retainedDevices = {};
	var newDevices = [];

	// Find devices that still exist
	devices.forEach(function (device) {
		if (device.kind === 'videoinput') { // Only interested in WebCam inputs
			var oldDevice = matchToOldDevice(device);
			if (oldDevice) {
				var updatedOldDevice = oldDevice;
				if (device.isFrontFacing != undefined)
				{
					// if we got an updated facing mode after getting device permissions, update just that property
					updatedOldDevice.isFrontFacing = device.isFrontFacing;
				}
				retainedDevices[oldDevice.id] = updatedOldDevice;
			} else {
				newDevices.push(device);
			}
		}
	});
	videoInputDevices = retainedDevices;

	// Assign IDs to video input devices that are new
	newDevices.forEach(function (device) {
		if (!device.id) {
			device.id = assignNewVideoInputId();
			// Attempt to name the device. In both Firefox and Chrome, label is null.
			// In Chrome, deviceId is null. (could use it here, but human-readable
			// name is probably better than a long hash)
			device.name = device.label || ("Video input #" + (device.id + 1));

			// This is the "old"/backup way of checking whether a camera is front facing
			// It doesn't work for non-English languages since it looks for the English word "front"
			// We only want to use this method if we aren't able to get permissions from the user to access the web camera, which lets us access the facing mode
			// If there's no "front" or "back" in the label or name, we're going to assume it's front facing, which is generally the case
			device.isFrontFacing = device.name.toLowerCase().includes('front') || (!(device.name.toLowerCase().includes('front')) && !(device.name.toLowerCase().includes('back')));

			videoInputDevices[device.id] = device;
		}
	});
}

// Track whether we are currently waiting for enumerateMediaDevices action to complete before
// we'll continue with the rest of the page startup.
var mediaDevicesRunDependencyPending = true;

function removeEnumerateMediaDevicesRunDependency() {
	if (!mediaDevicesRunDependencyPending) return;
	mediaDevicesRunDependencyPending = false;
	// This is the startup run of media devices enumeration, so remove the "run blocker"
	// from the Emscripten runtime, which will cause the Wasm code main() to start as
	// result. But If main() throws an exception, we don't want that exception to flow
	// into the catch() handler of this Promise below, so detach the execution of
	// removeRunDependency() to occur on the next event loop tick.
	try {
		removeRunDependency('enumerateMediaDevices');
	} catch(e) {
		// Raise a startup error that is propagated out to the Promise returned from
		// createUnityInstance().
		Module.startupErrorHandler(e);
	};
}

function queueWebCamDeviceUpdates(devices) {
	devices = devices.filter(device => device.kind === "videoinput");
	var promises = devices.map(function(device) {
		return navigator.mediaDevices.getUserMedia({
		video: { deviceId: device.deviceId }
		}).then(function(stream) {
			var track = stream.getVideoTracks()[0];
			const capabilities = track.getCapabilities();
			// Check if device has "user" in facingMode array, which indicates it is front facing
			// If we fail to get the capabilities property, set isFrontFacing to true by default
			device.isFrontFacing = Array.isArray(capabilities.facingMode)
				? capabilities.facingMode.includes("user")
				: true;
			track.stop();
		}).catch(function(err) {
			var deviceId = device.deviceId ?? "unknown";
			var label = device.label ?? "unknown";
			console.warn(`Device with id: ${deviceId} and label: ${label} failed to update\n ${err}`)}
		)
	});

	return promises;
}

function enumerateMediaDeviceList() {
	if (!videoInputDevices) return;
	// Bug/limitation: If there are multiple video or audio devices connected,
	// Chrome only lists one of each category (audioinput/videoinput/audioutput) (tested Chrome 85 on Windows 10)
	navigator.mediaDevices.enumerateDevices().then(function(devices) {
		// Devices enumeration completed: update video input devices list.
		updateVideoInputDevices(devices);
		removeEnumerateMediaDevicesRunDependency();
	}).catch(function(e) {
		console.warn('Unable to enumerate media devices: ' + e + '\nWebcams will not be available.');
		disableAccessToMediaDevices();
	});
}

function disableAccessToMediaDevices() {
	// Safari 11 has navigator.mediaDevices, but navigator.mediaDevices.add/removeEventListener is undefined
	if (navigator.mediaDevices && navigator.mediaDevices.removeEventListener) {
		navigator.mediaDevices.removeEventListener('devicechange', enumerateMediaDeviceList);
	}
	videoInputDevices = null;
}
Module['disableAccessToMediaDevices'] = disableAccessToMediaDevices;

if (typeof ENVIRONMENT_IS_PTHREAD === 'undefined' || !ENVIRONMENT_IS_PTHREAD) {
	if (!navigator.mediaDevices) {
		console.warn('navigator.mediaDevices not supported by this browser. Webcam access will not be available.' + (location.protocol == 'https:' ? '' : ' Try hosting the page over HTTPS, because some browsers disable webcam access when insecure HTTP is being used.'));
		disableAccessToMediaDevices();
	} else setTimeout(function() {
		try {
			// Do not start engine main() until we have completed enumeration.
			addRunDependency('enumerateMediaDevices');

			// Enumerate media devices now..
			enumerateMediaDeviceList();

			// .. and whenever the connected devices list changes.

			navigator.mediaDevices.addEventListener('devicechange', enumerateMediaDeviceList);
			// Firefox won't complete device enumeration if the window isn't in focus causing the startup to hang, so we
			// wait a second before removing the dependency and starting with an empty list of devices. Moving forward it's
			// likely more browsers will assume this standard.
			// See https://w3c.github.io/mediacapture-main/#dom-mediadevices-enumeratedevices
			setTimeout(removeEnumerateMediaDevicesRunDependency, 1000);
		} catch(e) {
			console.warn('Unable to enumerate media devices: ' + e);
			disableAccessToMediaDevices();
		}
	}, 0);
}
// end include: D:/Work/Unity/6000.6.0f1/Editor/Data/PlaybackEngines/WebGLSupport/BuildTools/prejs/MediaDevices.js
// include: D:/Work/Unity/6000.6.0f1/Editor/Data/PlaybackEngines/WebGLSupport/BuildTools/prejs/PlayerConnection.js
// ConnectToProfiler defined in PlayerConnectionLib.js
Module["ConnectToProfiler"] = ConnectToProfiler;
Module["StopProfiling"] = function () {
  _StopProfiling();
};
Module["IsConnectedToProfiler"] = function () {
  return !!_IsConnectedToProfiler();
};
// end include: D:/Work/Unity/6000.6.0f1/Editor/Data/PlaybackEngines/WebGLSupport/BuildTools/prejs/PlayerConnection.js
// include: D:/Work/Unity/6000.6.0f1/Editor/Data/PlaybackEngines/WebGLSupport/BuildTools/prejs/SendMessage.js
// Export SendMessage out from the JS module via the Module export object
// SendMessageJS defined in SendMessageLib.js
Module["SendMessage"] = SendMessage;
// end include: D:/Work/Unity/6000.6.0f1/Editor/Data/PlaybackEngines/WebGLSupport/BuildTools/prejs/SendMessage.js
// include: D:/Work/Unity/6000.6.0f1/Editor/Data/PlaybackEngines/WebGLSupport/BuildTools/prejs/WebPlayerInitilization.js
// Create a promise that is resolved later when "RunWebGLPlayer" was run
// We can ignore the reject handler as the UnityLoader registers a global startupErrorHandler
var _resolvePlayerIsInitialized;
var _playerIsInitializedPromise = new Promise(function (resolve) {
    _resolvePlayerIsInitialized = resolve;
});

// Waits for unity player initialization to finish, i.e., load initial scene
function _WaitForInitialization() {
    return _playerIsInitializedPromise;
}

Module["WebPlayer"] = {    
    PlayerIsInitialized: _resolvePlayerIsInitialized,
    WaitForInitialization: _WaitForInitialization,
};
// end include: D:/Work/Unity/6000.6.0f1/Editor/Data/PlaybackEngines/WebGLSupport/BuildTools/prejs/WebPlayerInitilization.js


var arguments_ = [];
var thisProgram = './this.program';
var quit_ = (status, toThrow) => {
  throw toThrow;
};

// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = '';
function locateFile(path) {
  if (Module['locateFile']) {
    return Module['locateFile'](path, scriptDirectory);
  }
  return scriptDirectory + path;
}

// Hooks that are implemented differently in different runtime environments.
var readAsync, readBinary;

if (ENVIRONMENT_IS_SHELL) {

} else

// Note that this includes Node.js workers when relevant (pthreads is enabled).
// Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
// ENVIRONMENT_IS_NODE.
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  try {
    scriptDirectory = new URL('.', _scriptName).href; // includes trailing slash
  } catch {
    // Must be a `blob:` or `data:` URL (e.g. `blob:http://site.com/etc/etc`), we cannot
    // infer anything from them.
  }

  if (!(globalThis.window || globalThis.WorkerGlobalScope)) throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');

  {
// include: web_or_worker_shell_read.js
readAsync = async (url) => {
    assert(!isFileURI(url), "readAsync does not work with file:// URLs");
    var response = await fetch(url, { credentials: 'same-origin' });
    if (response.ok) {
      return response.arrayBuffer();
    }
    throw new Error(response.status + ' : ' + response.url);
  };
// end include: web_or_worker_shell_read.js
  }
} else
{
  throw new Error('environment detection error');
}

var out = console.log.bind(console);
var err = console.error.bind(console);


var PROXYFS = 'PROXYFS is no longer included by default; build with -lproxyfs.js';
var WORKERFS = 'WORKERFS is no longer included by default; build with -lworkerfs.js';
var FETCHFS = 'FETCHFS is no longer included by default; build with -lfetchfs.js';
var ICASEFS = 'ICASEFS is no longer included by default; build with -licasefs.js';
var JSFILEFS = 'JSFILEFS is no longer included by default; build with -ljsfilefs.js';
var OPFS = 'OPFS is no longer included by default; build with -lopfs.js';

var NODEFS = 'NODEFS is no longer included by default; build with -lnodefs.js';

// perform assertions in shell.js after we set up out() and err(), as otherwise
// if an assertion fails it cannot print the message

assert(!ENVIRONMENT_IS_WORKER, 'worker environment detected but not enabled at build time.  Add `worker` to `-sENVIRONMENT` to enable.');

assert(!ENVIRONMENT_IS_NODE, 'node environment detected but not enabled at build time.  Add `node` to `-sENVIRONMENT` to enable.');

assert(!ENVIRONMENT_IS_SHELL, 'shell environment detected but not enabled at build time.  Add `shell` to `-sENVIRONMENT` to enable.');

// end include: shell.js

// include: preamble.js
// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html

var wasmBinary;

if (!globalThis.WebAssembly) {
  err('no native wasm support detected');
}

// Wasm globals

//========================================
// Runtime essentials
//========================================

// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS;

// In STRICT mode, we only define assert() when ASSERTIONS is set.  i.e. we
// don't define it at all in release modes.  This matches the behaviour of
// MINIMAL_RUNTIME.
// TODO(sbc): Make this the default even without STRICT enabled.
/** @type {function(*, string=)} */
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed' + (text ? ': ' + text : ''));
  }
}

// We used to include malloc/free by default in the past. Show a helpful error in
// builds with assertions.

/**
 * Indicates whether filename is delivered via file protocol (as opposed to http/https)
 * @noinline
 */
var isFileURI = (filename) => filename.startsWith('file://');

// include: runtime_common.js
// include: runtime_stack_check.js
// Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.
function writeStackCookie() {
  var max = _emscripten_stack_get_end();
  assert((max & 3) == 0);
  // If the stack ends at address zero we write our cookies 4 bytes into the
  // stack.  This prevents interference with SAFE_HEAP and ASAN which also
  // monitor writes to address zero.
  if (max == 0) {
    max += 4;
  }
  // The stack grow downwards towards _emscripten_stack_get_end.
  // We write cookies to the final two words in the stack and detect if they are
  // ever overwritten.
  HEAPU32[((max)>>2)] = 0x02135467;
  HEAPU32[(((max)+(4))>>2)] = 0x89BACDFE;
  // Also test the global address 0 for integrity.
  HEAPU32[((0)>>2)] = 1668509029;
}

function checkStackCookie() {
  if (ABORT) return;
  var max = _emscripten_stack_get_end();
  // See writeStackCookie().
  if (max == 0) {
    max += 4;
  }
  var cookie1 = HEAPU32[((max)>>2)];
  var cookie2 = HEAPU32[(((max)+(4))>>2)];
  if (cookie1 != 0x02135467 || cookie2 != 0x89BACDFE) {
    abort(`Stack overflow! Stack cookie has been overwritten at ${ptrToString(max)}, expected hex dwords 0x89BACDFE and 0x2135467, but received ${ptrToString(cookie2)} ${ptrToString(cookie1)}`);
  }
  // Also test the global address 0 for integrity.
  if (HEAPU32[((0)>>2)] != 0x63736d65 /* 'emsc' */) {
    abort('Runtime error: The application has corrupted its heap memory area (address zero)!');
  }
}
// end include: runtime_stack_check.js
// include: runtime_exceptions.js
// Base Emscripten EH error class
class EmscriptenEH extends Error {}

class EmscriptenSjLj extends EmscriptenEH {}

class CppException extends EmscriptenEH {
  constructor(excPtr) {
    super(excPtr);
    this.excPtr = excPtr;
    const excInfo = getExceptionMessage(excPtr);
    this.name = excInfo[0];
    this.message = excInfo[1];
  }
}
// end include: runtime_exceptions.js
// include: runtime_debug.js
var runtimeDebug = true; // Switch to false at runtime to disable logging at the right times

// Used by XXXXX_DEBUG settings to output debug messages.
function dbg(...args) {
  if (!runtimeDebug && typeof runtimeDebug != 'undefined') return;
  // TODO(sbc): Make this configurable somehow.  Its not always convenient for
  // logging to show up as warnings.
  console.warn(...args);
}

// Endianness check
(() => {
  var h16 = new Int16Array(1);
  var h8 = new Int8Array(h16.buffer);
  h16[0] = 0x6373;
  if (h8[0] !== 0x73 || h8[1] !== 0x63) abort('Runtime error: expected the system to be little-endian! (Run with -sSUPPORT_BIG_ENDIAN to bypass)');
})();

function consumedModuleProp(prop) {
  if (!Object.getOwnPropertyDescriptor(Module, prop)) {
    Object.defineProperty(Module, prop, {
      configurable: true,
      set() {
        abort(`Attempt to set \`Module.${prop}\` after it has already been processed.  This can happen, for example, when code is injected via '--post-js' rather than '--pre-js'`);

      }
    });
  }
}

function makeInvalidEarlyAccess(name) {
  return () => assert(false, `call to '${name}' via reference taken before Wasm module initialization`);

}

function ignoredModuleProp(prop) {
  if (Object.getOwnPropertyDescriptor(Module, prop)) {
    abort(`\`Module.${prop}\` was supplied but \`${prop}\` not included in INCOMING_MODULE_JS_API`);
  }
}

// forcing the filesystem exports a few things by default
function isExportedByForceFilesystem(name) {
  return name === 'FS_createPath' ||
         name === 'FS_createDataFile' ||
         name === 'FS_createPreloadedFile' ||
         name === 'FS_preloadFile' ||
         name === 'FS_unlink' ||
         name === 'addRunDependency' ||
         // The old FS has some functionality that WasmFS lacks.
         name === 'FS_createLazyFile' ||
         name === 'FS_createDevice' ||
         name === 'removeRunDependency';
}

function missingLibrarySymbol(sym) {

  // Any symbol that is not included from the JS library is also (by definition)
  // not exported on the Module object.
  unexportedRuntimeSymbol(sym);
}

function unexportedRuntimeSymbol(sym) {
  if (!Object.getOwnPropertyDescriptor(Module, sym)) {
    Object.defineProperty(Module, sym, {
      configurable: true,
      get() {
        var msg = `'${sym}' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the Emscripten FAQ)`;
        if (isExportedByForceFilesystem(sym)) {
          msg += '. Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you';
        }
        abort(msg);
      },
    });
  }
}

// end include: runtime_debug.js
var readyPromiseResolve, readyPromiseReject;

// Memory management
var
/** @type {!Int8Array} */
  HEAP8,
/** @type {!Uint8Array} */
  HEAPU8,
/** @type {!Int16Array} */
  HEAP16,
/** @type {!Uint16Array} */
  HEAPU16,
/** @type {!Int32Array} */
  HEAP32,
/** @type {!Uint32Array} */
  HEAPU32,
/** @type {!Float32Array} */
  HEAPF32,
/** @type {!Float64Array} */
  HEAPF64;

var runtimeInitialized = false;



function updateMemoryViews() {
  var b = wasmMemory.buffer;
  HEAP8 = new Int8Array(b);
  HEAP16 = new Int16Array(b);
  HEAPU8 = new Uint8Array(b);
  HEAPU16 = new Uint16Array(b);
  HEAP32 = new Int32Array(b);
  Module['HEAPU32'] = HEAPU32 = new Uint32Array(b);
  HEAPF32 = new Float32Array(b);
  Module['HEAPF64'] = HEAPF64 = new Float64Array(b);
}

// include: memoryprofiler.js
// end include: memoryprofiler.js
// end include: runtime_common.js
assert(globalThis.Int32Array && globalThis.Float64Array && Int32Array.prototype.subarray && Int32Array.prototype.set,
       'JS engine does not provide full typed array support');

function preRun() {
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  consumedModuleProp('preRun');
  // Begin ATPRERUNS hooks
  callRuntimeCallbacks(onPreRuns);
  // End ATPRERUNS hooks
}

function initRuntime() {
  assert(!runtimeInitialized);
  runtimeInitialized = true;

  checkStackCookie();

  // Begin ATINITS hooks
  if (!Module['noFSInit'] && !FS.initialized) FS.init();
TTY.init();
SOCKFS.root = FS.mount(SOCKFS, {}, null);
  // End ATINITS hooks

  wasmExports['__wasm_call_ctors']();

  // Begin ATPOSTCTORS hooks
  FS.ignorePermissions = false;
  // End ATPOSTCTORS hooks
}

function preMain() {
  checkStackCookie();
  // No ATMAINS hooks
}

function postRun() {
  checkStackCookie();
   // PThreads reuse the runtime from the main thread.

  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  consumedModuleProp('postRun');

  // Begin ATPOSTRUNS hooks
  callRuntimeCallbacks(onPostRuns);
  // End ATPOSTRUNS hooks
}

/** @param {string|number=} what */
function abort(what) {
  Module['onAbort']?.(what);

  what = 'Aborted(' + what + ')';
  // TODO(sbc): Should we remove printing and leave it up to whoever
  // catches the exception?
  err(what);

  ABORT = true;

  // Use a wasm runtime error, because a JS error might be seen as a foreign
  // exception, which means we'd run destructors on it. We need the error to
  // simply make the program stop.
  // FIXME This approach does not work in Wasm EH because it currently does not assume
  // all RuntimeErrors are from traps; it decides whether a RuntimeError is from
  // a trap or not based on a hidden field within the object. So at the moment
  // we don't have a way of throwing a wasm trap from JS. TODO Make a JS API that
  // allows this in the wasm spec.

  // Suppress closure compiler warning here. Closure compiler's builtin extern
  // definition for WebAssembly.RuntimeError claims it takes no arguments even
  // though it can.
  // TODO(https://github.com/google/closure-compiler/pull/3913): Remove if/when upstream closure gets fixed.
  /** @suppress {checkTypes} */
  var e = new WebAssembly.RuntimeError(what);

  readyPromiseReject?.(e);
  // Throw the error whether or not MODULARIZE is set because abort is used
  // in code paths apart from instantiation where an exception is expected
  // to be thrown when abort is called.
  throw e;
}

function createExportWrapper(name, nargs) {
  return (...args) => {
    assert(runtimeInitialized, `native function \`${name}\` called before runtime initialization`);
    var f = wasmExports[name];
    assert(f, `exported native function \`${name}\` not found`);
    // Only assert for too many arguments. Too few can be valid since the missing arguments will be zero filled.
    assert(args.length <= nargs, `native function \`${name}\` called with ${args.length} args but expects ${nargs}`);
    return f(...args);
  };
}

var wasmBinaryFile;

function findWasmBinary() {
  return locateFile('build.wasm');
}

function getBinarySync(file) {
  if (file == wasmBinaryFile && wasmBinary) {
    return new Uint8Array(wasmBinary);
  }
  if (readBinary) {
    return readBinary(file);
  }
  // Throwing a plain string here, even though it not normally adviables since
  // this gets turning into an `abort` in instantiateArrayBuffer.
  throw 'both async and sync fetching of the wasm failed';
}

async function getWasmBinary(binaryFile) {
  // If we don't have the binary yet, load it asynchronously using readAsync.
  if (!wasmBinary) {
    // Fetch the binary using readAsync
    try {
      var response = await readAsync(binaryFile);
      return new Uint8Array(response);
    } catch {
      // Fall back to getBinarySync below;
    }
  }

  // Otherwise, getBinarySync should be able to get it synchronously
  return getBinarySync(binaryFile);
}

async function instantiateArrayBuffer(binaryFile, imports) {
  try {
    var binary = await getWasmBinary(binaryFile);
    var instance = await WebAssembly.instantiate(binary, imports);
    return instance;
  } catch (reason) {
    err(`failed to asynchronously prepare wasm: ${reason}`);

    // Warn on some common problems.
    if (isFileURI(binaryFile)) {
      err(`warning: Loading from a file URI (${binaryFile}) is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing`);
    }
    abort(reason);
  }
}

async function instantiateAsync(binary, binaryFile, imports) {
  if (!binary
     ) {
    try {
      var response = fetch(binaryFile, { credentials: 'same-origin' });
      var instantiationResult = await WebAssembly.instantiateStreaming(response, imports);
      return instantiationResult;
    } catch (reason) {
      // We expect the most common failure cause to be a bad MIME type for the binary,
      // in which case falling back to ArrayBuffer instantiation should work.
      err(`wasm streaming compile failed: ${reason}`);
      err('falling back to ArrayBuffer instantiation');
      // fall back of instantiateArrayBuffer below
    };
  }
  return instantiateArrayBuffer(binaryFile, imports);
}

function getWasmImports() {

  // prepare imports
  var imports = {
    'env': wasmImports,
    'wasi_snapshot_preview1': wasmImports,
  };
  return imports;
}

// Create the wasm instance.
// Receives the wasm imports, returns the exports.
async function createWasm() {
  // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup
  /** @param {WebAssembly.Module=} module*/
  function receiveInstance(instance, module) {
    wasmExports = instance.exports;

    assignWasmExports(wasmExports);

    updateMemoryViews();

    return wasmExports;
  }

  // Prefer streaming instantiation if available.
  // Async compilation can be confusing when an error on the page overwrites Module
  // (for example, if the order of elements is wrong, and the one defining Module is
  // later), so we save Module and check it later.
  var trueModule = Module;
  function receiveInstantiationResult(result) {
    // 'result' is a ResultObject object which has both the module and instance.
    // receiveInstance() will swap in the exports (to Module.asm) so they can be called
    assert(Module === trueModule, 'the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?');
    trueModule = null;
    // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193, the above line no longer optimizes out down to the following line.
    // When the regression is fixed, can restore the above PTHREADS-enabled path.
    return receiveInstance(result['instance']);
  }

  var info = getWasmImports();

  // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
  // to manually instantiate the Wasm module themselves. This allows pages to
  // run the instantiation parallel to any other async startup actions they are
  // performing.
  // Also pthreads and wasm workers initialize the wasm instance through this
  // path.
  if (Module['instantiateWasm']) {
    return new Promise((resolve, reject) => {
      try {
        Module['instantiateWasm'](info, (inst, mod) => {
          resolve(receiveInstance(inst, mod));
        });
      } catch(e) {
        err(`Module.instantiateWasm callback failed with error: ${e}`);
        reject(e);
      }
    });
  }

  wasmBinaryFile ??= findWasmBinary();
  var result = await instantiateAsync(wasmBinary, wasmBinaryFile, info);
  var exports = receiveInstantiationResult(result);
  return exports;
}

// Globals used by JS i64 conversions (see makeSetValue)
var tempDouble;
var tempI64;

// end include: preamble.js

// Begin JS library code


  class ExitStatus {
      name = 'ExitStatus';
      constructor(status) {
        this.message = `Program terminated with exit(${status})`;
        this.status = status;
      }
    }

  var callRuntimeCallbacks = (callbacks) => {
      while (callbacks.length > 0) {
        // Pass the module as the first argument.
        callbacks.shift()(Module);
      }
    };
  var onPostRuns = [];
  var addOnPostRun = (cb) => onPostRuns.push(cb);

  var onPreRuns = [];
  var addOnPreRun = (cb) => onPreRuns.push(cb);


  var dynCalls = {
  };
  var dynCallLegacy = (sig, ptr, args) => {
      sig = sig.replace(/p/g, 'i')
      assert(sig in dynCalls, `bad function pointer type - sig is not in dynCalls: '${sig}'`);
      if (args?.length) {
        // j (64-bit integer) must be passed in as two numbers [low 32, high 32].
        assert(args.length === sig.substring(1).replace(/j/g, '--').length);
      } else {
        assert(sig.length == 1);
      }
      var f = dynCalls[sig];
      return f(ptr, ...args);
    };
  var dynCall = (sig, ptr, args = [], promising = false) => {
      assert(ptr, `null function pointer in dynCall`);
      assert(!promising, 'async dynCall is not supported in this mode')
      var rtn = dynCallLegacy(sig, ptr, args);
  
      function convert(rtn) {
        return rtn;
      }
  
      return convert(rtn);
    };

  
    /**
     * @param {number} ptr
     * @param {string} type
     */
  function getValue(ptr, type = 'i8') {
    if (type.endsWith('*')) type = '*';
    switch (type) {
      case 'i1': return HEAP8[ptr];
      case 'i8': return HEAP8[ptr];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': abort('to do getValue(i64) use WASM_BIGINT');
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      case '*': return HEAPU32[((ptr)>>2)];
      default: abort(`invalid type for getValue: ${type}`);
    }
  }

  var noExitRuntime = true;

  var ptrToString = (ptr) => {
      assert(typeof ptr === 'number', `ptrToString expects a number, got ${typeof ptr}`);
      // Convert to 32-bit unsigned value
      ptr >>>= 0;
      return '0x' + ptr.toString(16).padStart(8, '0');
    };

  
    /**
     * @param {number} ptr
     * @param {number} value
     * @param {string} type
     */
  function setValue(ptr, value, type = 'i8') {
    if (type.endsWith('*')) type = '*';
    switch (type) {
      case 'i1': HEAP8[ptr] = value; break;
      case 'i8': HEAP8[ptr] = value; break;
      case 'i16': HEAP16[((ptr)>>1)] = value; break;
      case 'i32': HEAP32[((ptr)>>2)] = value; break;
      case 'i64': abort('to do setValue(i64) use WASM_BIGINT');
      case 'float': HEAPF32[((ptr)>>2)] = value; break;
      case 'double': HEAPF64[((ptr)>>3)] = value; break;
      case '*': HEAPU32[((ptr)>>2)] = value; break;
      default: abort(`invalid type for setValue: ${type}`);
    }
  }

  var stackRestore = (val) => __emscripten_stack_restore(val);

  var stackSave = () => _emscripten_stack_get_current();

  var warnOnce = (text) => {
      warnOnce.shown ||= {};
      if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        err(text);
      }
    };

  

  function _ChatSocket_Close() {
      var state = Module.chatSocket;
      if (state && state.socket) {
        state.socket.onclose = null;
        state.socket.close();
      }
      Module.chatSocket = null;
    }

  var UTF8Decoder = globalThis.TextDecoder && new TextDecoder();
  
  var findStringEnd = (heapOrArray, idx, maxBytesToRead, ignoreNul) => {
      var maxIdx = idx + maxBytesToRead;
      if (ignoreNul) return maxIdx;
      // TextDecoder needs to know the byte length in advance, it doesn't stop on
      // null terminator by itself.
      // As a tiny code save trick, compare idx against maxIdx using a negation,
      // so that maxBytesToRead=undefined/NaN means Infinity.
      while (heapOrArray[idx] && !(idx >= maxIdx)) ++idx;
      return idx;
    };
  
  
    /**
     * Given a pointer 'idx' to a null-terminated UTF8-encoded string in the given
     * array that contains uint8 values, returns a copy of that string as a
     * Javascript String object.
     * heapOrArray is either a regular array, or a JavaScript typed array view.
     * @param {number=} idx
     * @param {number=} maxBytesToRead
     * @param {boolean=} ignoreNul - If true, the function will not stop on a NUL character.
     * @return {string}
     */
  var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead, ignoreNul) => {
  
      var endPtr = findStringEnd(heapOrArray, idx, maxBytesToRead, ignoreNul);
  
      // When using conditional TextDecoder, skip it for short strings as the overhead of the native call is not worth it.
      if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
        return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
      }
      var str = '';
      while (idx < endPtr) {
        // For UTF8 byte structure, see:
        // http://en.wikipedia.org/wiki/UTF-8#Description
        // https://www.ietf.org/rfc/rfc2279.txt
        // https://tools.ietf.org/html/rfc3629
        var u0 = heapOrArray[idx++];
        if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
        var u1 = heapOrArray[idx++] & 63;
        if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
        var u2 = heapOrArray[idx++] & 63;
        if ((u0 & 0xF0) == 0xE0) {
          u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
        } else {
          if ((u0 & 0xF8) != 0xF0) warnOnce('Invalid UTF-8 leading byte ' + ptrToString(u0) + ' encountered when deserializing a UTF-8 string in wasm memory to a JS string!');
          u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
        }
  
        if (u0 < 0x10000) {
          str += String.fromCharCode(u0);
        } else {
          var ch = u0 - 0x10000;
          str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
        }
      }
      return str;
    };
  
    /**
     * Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the
     * emscripten HEAP, returns a copy of that string as a Javascript String object.
     *
     * @param {number} ptr
     * @param {number=} maxBytesToRead - An optional length that specifies the
     *   maximum number of bytes to read. You can omit this parameter to scan the
     *   string until the first 0 byte. If maxBytesToRead is passed, and the string
     *   at [ptr, ptr+maxBytesToReadr[ contains a null byte in the middle, then the
     *   string will cut short at that byte index.
     * @param {boolean=} ignoreNul - If true, the function will not stop on a NUL character.
     * @return {string}
     */
  var UTF8ToString = (ptr, maxBytesToRead, ignoreNul) => {
      assert(typeof ptr == 'number', `UTF8ToString expects a number (got ${typeof ptr})`);
      return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead, ignoreNul) : '';
    };
  function _ChatSocket_Open(urlPtr) {
      var url = UTF8ToString(urlPtr);
      var state = (Module.chatSocket = { events: [], socket: null });
      var ws = new WebSocket(url);
      state.socket = ws;
      ws.onopen = function () { state.events.push(JSON.stringify({ t: "open" })); };
      ws.onmessage = function (e) { state.events.push(JSON.stringify({ t: "msg", d: e.data })); };
      ws.onerror = function () { state.events.push(JSON.stringify({ t: "error" })); };
      ws.onclose = function (e) {
        state.events.push(JSON.stringify({ t: "close", code: e.code, reason: e.reason }));
      };
    }

  function _ChatSocket_Poll() {
      var state = Module.chatSocket;
      var text = state && state.events.length ? state.events.shift() : "";
      var size = lengthBytesUTF8(text) + 1;
      var buffer = _malloc(size);
      stringToUTF8(text, buffer, size);
      return buffer;
    }

  function _GetJSLoadTimeInfo(loadTimePtr) {
    loadTimePtr = (loadTimePtr >> 2);
    HEAPU32[loadTimePtr] = Module.pageStartupTime || 0;
    HEAPU32[loadTimePtr + 1] = Module.dataUrlLoadEndTime || 0;
    HEAPU32[loadTimePtr + 2] = Module.codeDownloadTimeEnd || 0;
   }

  function _GetJSMemoryInfo(totalJSptr, usedJSptr) {
      totalJSptr = (totalJSptr >> 3);
      usedJSptr = (usedJSptr >> 3);
      if (performance.memory) {
        HEAPF64[totalJSptr] = performance.memory.totalJSHeapSize;
        HEAPF64[usedJSptr] = performance.memory.usedJSHeapSize;
      } else {
        HEAPF64[totalJSptr] = NaN;
        HEAPF64[usedJSptr] = NaN;
      }
    }

  var JS_Accelerometer = null;
  
  var JS_Accelerometer_callback = 0;
  function _JS_Accelerometer_IsRunning() {
          // Sensor is running if there is an activated new JS_Accelerometer; or the JS_Accelerometer_callback is hooked up
          return (JS_Accelerometer && JS_Accelerometer.activated) || (JS_Accelerometer_callback != 0);
      }

  
  
  
  var JS_Accelerometer_multiplier = 1;
  
  var JS_Accelerometer_lastValue = {
  x:0,
  y:0,
  z:0,
  };
  function JS_Accelerometer_eventHandler() {
          // Record the last value for gravity computation
          JS_Accelerometer_lastValue = {
              x: JS_Accelerometer.x * JS_Accelerometer_multiplier,
              y: JS_Accelerometer.y * JS_Accelerometer_multiplier,
              z: JS_Accelerometer.z * JS_Accelerometer_multiplier
          };
          if (JS_Accelerometer_callback != 0)
              ((a1, a2, a3) => dynCall_vfff(JS_Accelerometer_callback, a1, a2, a3))(JS_Accelerometer_lastValue.x, JS_Accelerometer_lastValue.y, JS_Accelerometer_lastValue.z);
      }
  
  
  var JS_Accelerometer_frequencyRequest = 0;
  
  var JS_Accelerometer_frequency = 0;
  
  
  var JS_LinearAccelerationSensor_callback = 0;
  
  var JS_GravitySensor_callback = 0;
  
  var JS_Gyroscope_callback = 0;
  
  
  function JS_ComputeGravity(accelerometerValue, linearAccelerationValue) {
          // On some Android devices, the linear acceleration direction is reversed compared to its accelerometer
          // So, compute both the difference and sum (difference of the negative) and return the one that's the smallest in magnitude
          var difference = {
              x: accelerometerValue.x - linearAccelerationValue.x,
              y: accelerometerValue.y - linearAccelerationValue.y,
              z: accelerometerValue.z - linearAccelerationValue.z
          };
          var differenceMagnitudeSq = difference.x*difference.x + difference.y*difference.y + difference.z*difference.z;
  
          var sum = {
              x: accelerometerValue.x + linearAccelerationValue.x,
              y: accelerometerValue.y + linearAccelerationValue.y,
              z: accelerometerValue.z + linearAccelerationValue.z
          };
          var sumMagnitudeSq = sum.x*sum.x + sum.y*sum.y + sum.z*sum.z;
  
          return (differenceMagnitudeSq <= sumMagnitudeSq) ? difference : sum;
      }
  function JS_DeviceMotion_eventHandler(event) {
          // The accelerationIncludingGravity property is the amount of acceleration recorded by the device, in meters per second squared (m/s2).
          // Its value is the sum of the acceleration of the device as induced by the user and the acceleration caused by gravity.
          // Apply the JS_Accelerometer_multiplier to convert to g
          var accelerometerValue = {
              x: event.accelerationIncludingGravity.x * JS_Accelerometer_multiplier,
              y: event.accelerationIncludingGravity.y * JS_Accelerometer_multiplier,
              z: event.accelerationIncludingGravity.z * JS_Accelerometer_multiplier
          };
          if (JS_Accelerometer_callback != 0)
              ((a1, a2, a3) => dynCall_vfff(JS_Accelerometer_callback, a1, a2, a3))(accelerometerValue.x, accelerometerValue.y, accelerometerValue.z);
  
          // The acceleration property is the amount of acceleration recorded by the device, in meters per second squared (m/s2), compensated for gravity.
          // Apply the JS_Accelerometer_multiplier to convert to g
          var linearAccelerationValue = {
              x: event.acceleration.x * JS_Accelerometer_multiplier,
              y: event.acceleration.y * JS_Accelerometer_multiplier,
              z: event.acceleration.z * JS_Accelerometer_multiplier
          };
          if (JS_LinearAccelerationSensor_callback != 0)
              ((a1, a2, a3) => dynCall_vfff(JS_LinearAccelerationSensor_callback, a1, a2, a3))(linearAccelerationValue.x, linearAccelerationValue.y, linearAccelerationValue.z);
  
          // Compute and raise the gravity sensor vector
          if (JS_GravitySensor_callback != 0) {
              assert(typeof GravitySensor === 'undefined');
              var gravityValue = JS_ComputeGravity(accelerometerValue, linearAccelerationValue);
              ((a1, a2, a3) => dynCall_vfff(JS_GravitySensor_callback, a1, a2, a3))(gravityValue.x, gravityValue.y, gravityValue.z);
          }
  
          // The rotationRate property describes the rotation rates of the device around each of its axes (deg/s), but we want in radians/s so must scale
          // Note that the spec here has been updated so x,y,z axes are alpha,beta,gamma.
          // Therefore the order of axes at https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent/rotationRate is incorrect
          //
          // There is a bug in Chrome < M66 where rotationRate values are not in deg/s https://bugs.chromium.org/p/chromium/issues/detail?id=541607
          // But that version is too old to include a check here
          if (JS_Gyroscope_callback != 0) {
              var degToRad = Math.PI / 180;
              ((a1, a2, a3) => dynCall_vfff(JS_Gyroscope_callback, a1, a2, a3))(event.rotationRate.alpha * degToRad, event.rotationRate.beta * degToRad, event.rotationRate.gamma * degToRad);
          }
      }
  
  var JS_DeviceSensorPermissions = 0;
  
  function JS_RequestDeviceSensorPermissions(permissions) {
          // iOS requires that we request permissions before using device sensor events
          if (permissions & 1/*DeviceOrientationEvent permission*/) {
              if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                  DeviceOrientationEvent.requestPermission()
                      .then(function(permissionState) {
                          if (permissionState === 'granted') {
                              JS_DeviceSensorPermissions &= ~1; // Remove DeviceOrientationEvent permission bit
                          } else {
                              warnOnce("DeviceOrientationEvent permission not granted");
                          }
                      })
                      .catch(function(err) {
                          // Permissions cannot be requested unless on a user interaction (a touch event)
                          // So in this case set JS_DeviceSensorPermissions and we will try again on a touch event
                          warnOnce(err);
                          JS_DeviceSensorPermissions |= 1/*DeviceOrientationEvent permission*/;
                      });
              }
          }
          if (permissions & 2/*DeviceMotionEvent permission*/) {
              if (typeof DeviceMotionEvent.requestPermission === 'function') {
                  DeviceMotionEvent.requestPermission()
                      .then(function(permissionState) {
                          if (permissionState === 'granted') {
                              JS_DeviceSensorPermissions &= ~2; // Remove DeviceMotionEvent permission bit
                          } else {
                              warnOnce("DeviceMotionEvent permission not granted");
                          }
                      })
                      .catch(function(err) {
                          // Permissions cannot be requested unless on a user interaction (a touch event)
                          // So in this case set JS_DeviceSensorPermissions and we will try again on a touch event
                          warnOnce(err);
                          JS_DeviceSensorPermissions |= 2/*DeviceMotionEvent permission*/;
                      });
              }
          }
      }
  
  
  
  
  function JS_DeviceMotion_add() {
          // Only add the event listener if we don't yet have any of the motion callbacks set
          if (JS_Accelerometer_callback == 0 &&
              JS_LinearAccelerationSensor_callback == 0 &&
              JS_GravitySensor_callback == 0 &&
              JS_Gyroscope_callback == 0) {
              JS_RequestDeviceSensorPermissions(2/*DeviceMotionEvent permission*/);
              window.addEventListener('devicemotion', JS_DeviceMotion_eventHandler);
          }
      }
  
  function JS_DefineAccelerometerMultiplier() {
          // Earth's gravity in m/s^2, same as ASENSOR_STANDARD_GRAVITY
          var g = 9.80665;
  
          // Multiplier is 1/g to normalize acceleration
          // iOS has its direction opposite to Android and Windows (tested Surface Pro tablet)
          // We include Macintosh in the test to capture Safari on iOS viewing in Desktop mode (the default now on iPads)
          JS_Accelerometer_multiplier = (/(iPhone|iPad|Macintosh)/i.test(navigator.userAgent)) ? 1/g : -1/g;
      }
  
  function _JS_Accelerometer_Start(callback, frequency) {
          // callback can be zero here when called via JS_GravitySensor_Start
  
          JS_DefineAccelerometerMultiplier();
  
          // If we don't have new sensor API, fallback to old DeviceMotionEvent
          if (typeof Accelerometer === 'undefined') {
              JS_DeviceMotion_add(); // Must call before we set the callback
              if (callback != 0) JS_Accelerometer_callback = callback;
              return;
          }
  
          if (callback != 0) JS_Accelerometer_callback = callback;
  
          function InitializeAccelerometer(frequency) {
              // Use device referenceFrame, since New Input System package does its own compensation
              JS_Accelerometer = new Accelerometer({ frequency: frequency, referenceFrame: 'device' });
              JS_Accelerometer.addEventListener('reading', JS_Accelerometer_eventHandler);
              JS_Accelerometer.addEventListener('error', function(e) {
                  // e.error could be DOMException: Could not connect to a sensor
                  warnOnce((e.error) ? e.error : e);
              });
              JS_Accelerometer.start();
              JS_Accelerometer_frequency = frequency;
          }
  
          // If the sensor is already created, stop and re-create it with new frequency
          if (JS_Accelerometer) {
              if (JS_Accelerometer_frequency != frequency) {
                  JS_Accelerometer.stop();
                  JS_Accelerometer.removeEventListener('reading', JS_Accelerometer_eventHandler);
                  InitializeAccelerometer(frequency);
              }
          }
          else if (JS_Accelerometer_frequencyRequest != 0) {
              // If the permissions promise is currently in progress, then note new frequency only
              JS_Accelerometer_frequencyRequest = frequency;
          }
          else {
              JS_Accelerometer_frequencyRequest = frequency;
  
              // Request required permission for the Accelerometer
              navigator.permissions.query({name: 'accelerometer'})
                  .then(function(result) {
                      if (result.state === "granted") {
                          InitializeAccelerometer(JS_Accelerometer_frequencyRequest);
                      } else {
                          warnOnce("No permission to use Accelerometer.");
                      }
                      JS_Accelerometer_frequencyRequest = 0;
              });
          }
      }

  
  
  
  
  
  
  
  
  
  function JS_DeviceMotion_remove() {
          // If we've removed the last callback, remove the devicemotion event listener
          if (JS_Accelerometer_callback == 0 &&
              JS_LinearAccelerationSensor_callback == 0 &&
              JS_GravitySensor_callback == 0 &&
              JS_Gyroscope_callback == 0 ) {
              window.removeEventListener('devicemotion', JS_DeviceOrientation_eventHandler);
          }
      }
  function _JS_Accelerometer_Stop() {
          if (JS_Accelerometer) {
              // Only actually stop the accelerometer if we don't need it to compute gravity values
              if (typeof GravitySensor !== 'undefined' || JS_GravitySensor_callback == 0) {
                  JS_Accelerometer.stop();
                  JS_Accelerometer.removeEventListener('reading', JS_Accelerometer_eventHandler);
                  JS_Accelerometer = null;
              }
              JS_Accelerometer_callback = 0;
              JS_Accelerometer_frequency = 0;
          }
          else if (JS_Accelerometer_callback != 0) {
              JS_Accelerometer_callback = 0;
              JS_DeviceMotion_remove();
          }
      }

  var ExceptionsSeen = 0;
  
  function LogErrorWithAdditionalInformation(error) {
  		// Module.dynCall_* or dynCall_* is directly is used for calling callbacks.
  		// Use makeDynCall instead for compatibility with WebAssembly.Table.
  		if (
  			(
  				error instanceof ReferenceError ||
  				error instanceof TypeError
  			) &&
  			error.message.indexOf('dynCall_') != -1
  		) {
  			error.message = 'Detected use of deprecated "Module.dynCall_*" API. Use "makeDynCall" API instead. Refer to https://docs.unity3d.com/6000.0/Documentation/Manual/web-interacting-browser-deprecated.html#dyncall for more information.\n' + error.message;
  		}
  
  		console.error(error);
  	}
  var _JS_CallAsLongAsNoExceptionsSeen = function(cb) {
  		if (!ExceptionsSeen) {
  			try {
  				(() => dynCall_v(cb))();
  			} catch(e) {
  				ExceptionsSeen = 1;
  				console.error('Uncaught exception from main loop:');
  				LogErrorWithAdditionalInformation(e);
  				console.error('Halting program.');
  				if (Module.errorHandler) Module.errorHandler(e);
  				throw e;
  			}
  		}
  	};

  function _JS_Cursor_SetImage(ptr, length) {
      ptr = ptr;
      var binary = "";
      for (var i = 0; i < length; i++)
        binary += String.fromCharCode(HEAPU8[ptr + i]);
      Module.canvas.style.cursor = "url(data:image/cur;base64," + btoa(binary) + "),default";
    }

  function _JS_Cursor_SetShow(show) {
      Module.canvas.style.cursor = show ? "default" : "none";
    }

  function jsDomCssEscapeId(id) {
  		// Use CSS Object Model to escape ID if feature is present
  		if (typeof window.CSS !== "undefined" && typeof window.CSS.escape !== "undefined") {
  			return window.CSS.escape(id);
  		}
  
  		// Fallback: Escape special characters with RegExp. This handles most cases but not all!
  		return id.replace(/(#|\.|\+|\[|\]|\(|\)|\{|\})/g, "\\$1");
  	}
  function jsCanvasSelector() {
  		// This lookup specifies the target canvas that different DOM
  		// events are registered to, like keyboard and mouse events.
  		// This requires that Module['canvas'] must have a CSS ID associated
  		// with it, it cannot be empty. Override Module['canvas'] to specify
  		// some other target to use, e.g. if the page contains multiple Unity
  		// game instances.
  		if (Module['canvas'] && !Module['canvas'].id) throw 'Module["canvas"] must have a CSS ID associated with it!';
  		var canvasId = Module['canvas'] ? Module['canvas'].id : 'unity-canvas';
  		return '#' + jsDomCssEscapeId(canvasId);
  	}
  function _JS_DOM_MapViewportCoordinateToElementLocalCoordinate(viewportX, viewportY, targetX, targetY) {
  		targetX = (targetX >> 2);
  		targetY = (targetY >> 2);
  		var canvas = document.querySelector(jsCanvasSelector());
  		var rect = canvas && canvas.getBoundingClientRect();
  		HEAPU32[targetX] = viewportX - (rect ? rect.left : 0);
  		HEAPU32[targetY] = viewportY - (rect ? rect.top : 0);
  	}

  var lengthBytesUTF8 = (str) => {
      var len = 0;
      for (var i = 0; i < str.length; ++i) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code
        // unit, not a Unicode code point of the character! So decode
        // UTF16->UTF32->UTF8.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        var c = str.charCodeAt(i); // possibly a lead surrogate
        if (c <= 0x7F) {
          len++;
        } else if (c <= 0x7FF) {
          len += 2;
        } else if (c >= 0xD800 && c <= 0xDFFF) {
          len += 4; ++i;
        } else {
          len += 3;
        }
      }
      return len;
    };
  
  var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
      assert(typeof str === 'string', `stringToUTF8Array expects a string (got ${typeof str})`);
      // Parameter maxBytesToWrite is not optional. Negative values, 0, null,
      // undefined and false each don't write out any bytes.
      if (!(maxBytesToWrite > 0))
        return 0;
  
      var startIdx = outIdx;
      var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
      for (var i = 0; i < str.length; ++i) {
        // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description
        // and https://www.ietf.org/rfc/rfc2279.txt
        // and https://tools.ietf.org/html/rfc3629
        var u = str.codePointAt(i);
        if (u <= 0x7F) {
          if (outIdx >= endIdx) break;
          heap[outIdx++] = u;
        } else if (u <= 0x7FF) {
          if (outIdx + 1 >= endIdx) break;
          heap[outIdx++] = 0xC0 | (u >> 6);
          heap[outIdx++] = 0x80 | (u & 63);
        } else if (u <= 0xFFFF) {
          if (outIdx + 2 >= endIdx) break;
          heap[outIdx++] = 0xE0 | (u >> 12);
          heap[outIdx++] = 0x80 | ((u >> 6) & 63);
          heap[outIdx++] = 0x80 | (u & 63);
        } else {
          if (outIdx + 3 >= endIdx) break;
          if (u > 0x10FFFF) warnOnce('Invalid Unicode code point ' + ptrToString(u) + ' encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x10FFFF).');
          heap[outIdx++] = 0xF0 | (u >> 18);
          heap[outIdx++] = 0x80 | ((u >> 12) & 63);
          heap[outIdx++] = 0x80 | ((u >> 6) & 63);
          heap[outIdx++] = 0x80 | (u & 63);
          // Gotcha: if codePoint is over 0xFFFF, it is represented as a surrogate pair in UTF-16.
          // We need to manually skip over the second code unit for correct iteration.
          i++;
        }
      }
      // Null-terminate the pointer to the buffer.
      heap[outIdx] = 0;
      return outIdx - startIdx;
    };
  var stringToUTF8 = (str, outPtr, maxBytesToWrite) => {
      assert(typeof maxBytesToWrite == 'number', 'stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
      return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
    };
  
  var stringToNewUTF8 = (str) => {
      var size = lengthBytesUTF8(str) + 1;
      var ret = _malloc(size);
      if (ret) stringToUTF8(str, ret, size);
      return ret;
    };
  
  function _JS_DOM_UnityCanvasSelector() {
  		var canvasSelector = jsCanvasSelector();
  		if (_JS_DOM_UnityCanvasSelector.selector != canvasSelector) {
  			if (_JS_DOM_UnityCanvasSelector.ptr) _free(_JS_DOM_UnityCanvasSelector.ptr);
  			_JS_DOM_UnityCanvasSelector.ptr = stringToNewUTF8(canvasSelector);
  			_JS_DOM_UnityCanvasSelector.selector = canvasSelector;
  		}
  		return _JS_DOM_UnityCanvasSelector.ptr;
  	}

  
  
  function _JS_DOM_UnityFullscreenElementSelector() {
  		const containerSelector = Module.fullscreenElementID ? `#${jsDomCssEscapeId(Module.fullscreenElementID)}` : null;
          // Fall back to <canvas> element if the fullscreen container is not found.
          const selector = (
              containerSelector && document.querySelector(containerSelector)
              ? containerSelector
              : jsCanvasSelector()
          );
          return stringToNewUTF8(selector);
      }

  
  function _JS_DownloadTextFile(pathPtr, dataPtr, mimeTypePtr) {
          const path = UTF8ToString(pathPtr);
          const text = UTF8ToString(dataPtr);
          const mimeType = mimeTypePtr ? UTF8ToString(mimeTypePtr) : 'application/json';
  
          const parts = path.split(/[\\/]/);
          const filename = parts.pop();
  
          const link = document.createElement('a');
          link.href = URL.createObjectURL(new Blob([text], { type: mimeType }));
          link.download = filename;
          link.click();
          URL.revokeObjectURL(link.href);
      }

  
  function _JS_Eval_OpenURL(ptr)
  {
  	var str = UTF8ToString(ptr);
  	window.open(str, '_blank', '');
  }

  function _JS_FileSystem_Initialize()
  {
  	// no-op
  }

  function _JS_FileSystem_Sync()
  {
  	// Kick off a new IDBFS sync on Unity's Application.persistentDataPath directory tree.
  	// Do it carefully in a fashion that is compatible with the Module.autoSyncPersistentDataPath option
  	// (to avoid multiple redundant syncs in flight at the same time)
  	IDBFS.queuePersist(Module.__unityIdbfsMount.mount);
  	if (!window.warnedAboutManualFilesystemSyncGettingDeprecated) {
  		window.warnedAboutManualFilesystemSyncGettingDeprecated = true;
  		if (!Module.autoSyncPersistentDataPath) {
  			console.warn('Manual synchronization of Unity Application.persistentDataPath via JS_FileSystem_Sync() is deprecated and will be later removed in a future Unity version. The persistent data directory will be automatically synchronized instead on file modification. Pass config.autoSyncPersistentDataPath = true; to configuration in createUnityInstance() to opt in to the new behavior.');
  		}
  	}
  }

  
  function jsGetSharedAssetsResourcePath(path) {
          // TODO(PLAT-19583): A limitation of the current approach for finding dependent player data files is that it's
          // unable to derive sharedassets<n>.resource files. It's suspected this is because resource files are raw
          // binary data instead of being serialized files. As a workaround, we assume that a sharedassets<n>.assets file
          // may have a corresponding sharedassets<n>.resource file which is validated by checking if that file was
          // produced as part of the build using Module.secondaryDataUrls.
          const sharedAssetsRegex = /(?<baseName>sharedassets\d+)\.assets$/;
          const sharedAssetsMatch = path.match(sharedAssetsRegex);
          if (sharedAssetsMatch === null) {
              return null;
          }
          const sharedAssetsResourcePath = `${sharedAssetsMatch.groups.baseName}.resource`;
          if (!Module.secondaryDataUrls.includes(sharedAssetsResourcePath)) {
              return null;
          }
          return sharedAssetsResourcePath;
      }
  
  function jsGetFileNameWithoutExtension(path) {
          const fileNameStart = path.lastIndexOf('/') + 1;
          const fileNameEnd = path.endsWith('.gz') || path.endsWith('.br') ? path.length - 3 : path.length;
          return path.substring(fileNameStart, fileNameEnd);
      }
  var jsIsDataUrlDownloaded = function(path) {
          // TODO(PLAT-19279): Ideally we should use the full URL when checking if a secondary data file is downloaded.
          // Unfortunately getting the full output path in the player build during scene loading is non-trivial so as a
          // workaround, we only check the file name which is generally safe, but assumes each file name is unique.
          const fileName = jsGetFileNameWithoutExtension(path);
          if (Module.secondaryDataUrls.some(url => jsGetFileNameWithoutExtension(url) === fileName)) {
              return Module.dataUrls && Module.dataUrls.has(fileName);
          }
          return true;  // Ignore files that are not part of the player build as they may be streamed from elsewhere.
      };
  
  var _JS_GetDownloadProgress = function(pathPtr, loadedPtr, totalPtr) {
          const path = UTF8ToString(pathPtr);
          const sharedAssetsResourcePath = jsGetSharedAssetsResourcePath(path);
  
          const [isDownloaded, totalLoaded, totalBytes] = [path, sharedAssetsResourcePath]
              .filter((filePath) => filePath !== null)
              .reduce(([isDownloaded, sumLoaded, sumTotal], fileName) => {
                  const {loaded = 0, total = 0} = Module.downloadProgress[fileName] ?? {};
                  return [
                      isDownloaded && jsIsDataUrlDownloaded(fileName),
                      sumLoaded + loaded,
                      sumTotal + total
                  ];
              }, [true, 0, 0]);
  
          HEAPU32[(loadedPtr >> 2)] = totalLoaded;
          HEAPU32[(totalPtr >> 2)] = totalBytes;
          return isDownloaded;
      };

  function _JS_GetRandomBytes(destBuffer, numBytes) {
      // Crypto is widely available in browsers, but if running in
      // Node.js or another shell, it might not be present.
      // getRandomValues() cannot be called for more than 64K bytes at a time.
      if (typeof crypto === 'undefined' || numBytes > 65535)
          return 0;
  
      crypto.getRandomValues(new Uint8Array(HEAPU8.buffer, destBuffer, numBytes));
      return 1;
    }

  function _JS_Get_WASM_Size()
    {
      return Module.wasmFileSize;
    }

  var JS_GravitySensor = null;
  
  function _JS_GravitySensor_IsRunning() {
          return (typeof GravitySensor !== 'undefined') ? (JS_GravitySensor && JS_GravitySensor.activated) : JS_GravitySensor_callback != 0;
      }

  
  
  
  var JS_GravitySensor_eventHandler = function() {
          if (JS_GravitySensor_callback != 0)
              ((a1, a2, a3) => dynCall_vfff(JS_GravitySensor_callback, a1, a2, a3))(
                  JS_GravitySensor.x * JS_Accelerometer_multiplier,
                  JS_GravitySensor.y * JS_Accelerometer_multiplier,
                  JS_GravitySensor.z * JS_Accelerometer_multiplier);
      };
  
  
  var JS_GravitySensor_frequencyRequest = 0;
  
  
  
  var JS_LinearAccelerationSensor = null;
  
  
  
  
  
  
  function JS_LinearAccelerationSensor_eventHandler() {
          var linearAccelerationValue = {
              x: JS_LinearAccelerationSensor.x * JS_Accelerometer_multiplier,
              y: JS_LinearAccelerationSensor.y * JS_Accelerometer_multiplier,
              z: JS_LinearAccelerationSensor.z * JS_Accelerometer_multiplier
          };
          if (JS_LinearAccelerationSensor_callback != 0)
              ((a1, a2, a3) => dynCall_vfff(JS_LinearAccelerationSensor_callback, a1, a2, a3))(linearAccelerationValue.x, linearAccelerationValue.y, linearAccelerationValue.z);
  
          // Calculate and call the Gravity callback if the Gravity Sensor API isn't present
          if (JS_GravitySensor_callback != 0 && typeof GravitySensor === 'undefined') {
              var gravityValue = JS_ComputeGravity(JS_Accelerometer_lastValue, linearAccelerationValue);
              ((a1, a2, a3) => dynCall_vfff(JS_GravitySensor_callback, a1, a2, a3))(gravityValue.x, gravityValue.y, gravityValue.z);
          }
      }
  
  
  var JS_LinearAccelerationSensor_frequencyRequest = 0;
  
  var JS_LinearAccelerationSensor_frequency = 0;
  
  
  
  function _JS_LinearAccelerationSensor_Start(callback, frequency) {
          // callback can be zero here when called via JS_GravitySensor_Start
  
          JS_DefineAccelerometerMultiplier();
  
          // If we don't have new sensor API, fallback to old DeviceMotionEvent
          if (typeof LinearAccelerationSensor === 'undefined') {
              JS_DeviceMotion_add(); // Must call before we set the callback
              if (callback != 0) JS_LinearAccelerationSensor_callback = callback;
              return;
          }
  
          if (callback != 0) JS_LinearAccelerationSensor_callback = callback;
  
          function InitializeLinearAccelerationSensor(frequency) {
              // Use device referenceFrame, since New Input System package does its own compensation
              JS_LinearAccelerationSensor = new LinearAccelerationSensor({ frequency: frequency, referenceFrame: 'device' });
              JS_LinearAccelerationSensor.addEventListener('reading', JS_LinearAccelerationSensor_eventHandler);
              JS_LinearAccelerationSensor.addEventListener('error', function(e) {
                  // e.error could be DOMException: Could not connect to a sensor
                  warnOnce((e.error) ? e.error : e);
              });
              JS_LinearAccelerationSensor.start();
              JS_LinearAccelerationSensor_frequency = frequency;
          }
  
          // If the sensor is already created, stop and re-create it with new frequency
          if (JS_LinearAccelerationSensor) {
              if (JS_LinearAccelerationSensor_frequency != frequency) {
                  JS_LinearAccelerationSensor.stop();
                  JS_LinearAccelerationSensor.removeEventListener('reading', JS_LinearAccelerationSensor_eventHandler);
                  InitializeLinearAccelerationSensor(frequency);
              }
          }
          else if (JS_LinearAccelerationSensor_frequencyRequest != 0) {
              // If the permissions promise is currently in progress, then note new frequency only
              JS_LinearAccelerationSensor_frequencyRequest = frequency;
          }
          else {
              JS_LinearAccelerationSensor_frequencyRequest = frequency;
  
              // Request required permission for the LinearAccelerationSensor
              navigator.permissions.query({name: 'accelerometer'})
                  .then(function(result) {
                      if (result.state === "granted") {
                          InitializeLinearAccelerationSensor(JS_LinearAccelerationSensor_frequencyRequest);
                      } else {
                          warnOnce("No permission to use LinearAccelerationSensor.");
                      }
                      JS_LinearAccelerationSensor_frequencyRequest = 0;
              });
          }
      }
  
  
  
  function _JS_GravitySensor_Start(callback, frequency) {
          assert(callback != 0, 'Invalid callback passed to JS_GravitySensor_Start');
  
          // If we don't have explicit new Gravity Sensor API, start the Accelerometer and LinearAccelerationSensor
          // and we will compute the gravity value from those readings
          if (typeof GravitySensor === 'undefined') {
              // Start both Accelerometer and LinearAccelerationSensor
              _JS_Accelerometer_Start(0, Math.max(frequency, JS_Accelerometer_frequency));
              _JS_LinearAccelerationSensor_Start(0, Math.max(frequency, JS_LinearAccelerationSensor_frequency));
  
              // Add the gravity sensor callback (must be after Accelerometer and LinearAccelerationSensor start)
              JS_GravitySensor_callback = callback;
              return;
          }
  
          JS_DefineAccelerometerMultiplier();
  
          JS_GravitySensor_callback = callback;
  
          function InitializeGravitySensor(frequency) {
              // Use device referenceFrame, since New Input System package does its own compensation
              JS_GravitySensor = new GravitySensor({ frequency: frequency, referenceFrame: 'device' });
              JS_GravitySensor.addEventListener('reading', JS_GravitySensor_eventHandler);
              JS_GravitySensor.addEventListener('error', function(e) {
                  // e.error could be DOMException: Could not connect to a sensor
                  warnOnce((e.error) ? e.error : e);
              });
              JS_GravitySensor.start();
          }
  
          // If the sensor is already created, stop and re-create it with new frequency
          if (JS_GravitySensor) {
              JS_GravitySensor.stop();
              JS_GravitySensor.removeEventListener('reading', JS_GravitySensor_eventHandler);
              InitializeGravitySensor(frequency);
          }
          else if (JS_GravitySensor_frequencyRequest != 0) {
              // If the permissions promise is currently in progress, then note new frequency only
              JS_GravitySensor_frequencyRequest = frequency;
          }
          else {
              JS_GravitySensor_frequencyRequest = frequency;
  
              // Request required permission for the GravitySensor
              navigator.permissions.query({name: 'accelerometer'})
                  .then(function(result) {
                      if (result.state === "granted") {
                          InitializeGravitySensor(JS_GravitySensor_frequencyRequest);
                      } else {
                          warnOnce("No permission to use GravitySensor.");
                      }
                      JS_GravitySensor_frequencyRequest = 0;
              });
          }
      }

  
  
  
  
  
  
  
  
  
  
  
  function _JS_LinearAccelerationSensor_Stop() {
          if (JS_LinearAccelerationSensor) {
              // Only actually stop the Linear Acceleration Sensor if we don't need it to compute gravity values
              if (typeof GravitySensor !== 'undefined' || JS_GravitySensor_callback == 0) {
                  JS_LinearAccelerationSensor.stop();
                  JS_LinearAccelerationSensor.removeEventListener('reading', JS_LinearAccelerationSensor_eventHandler);
                  JS_LinearAccelerationSensor = null;
              }
              JS_LinearAccelerationSensor_callback = 0;
              JS_LinearAccelerationSensor_frequency = 0;
          }
          else if (JS_LinearAccelerationSensor_callback != 0) {
              JS_LinearAccelerationSensor_callback = 0;
              JS_DeviceMotion_remove();
          }
      }
  function _JS_GravitySensor_Stop() {
          JS_GravitySensor_callback = 0;
  
          // If we don't have Gravity Sensor API, stop the Accelerometer and LinearAccelerationSensor
          if (typeof GravitySensor === 'undefined') {
              // Stop the source sensors if they're not used explicitly by Unity
              if (JS_Accelerometer_callback == 0) _JS_Accelerometer_Stop();
              if (JS_LinearAccelerationSensor_callback == 0) _JS_LinearAccelerationSensor_Stop();
              return;
          }
  
          if (JS_GravitySensor) {
              JS_GravitySensor.stop();
              JS_GravitySensor.removeEventListener('reading', JS_GravitySensor_eventHandler);
              JS_GravitySensor = null;
          }
      }

  var JS_Gyroscope = null;
  
  function _JS_Gyroscope_IsRunning() {
          // Sensor is running if there is an activated new JS_Gyroscope; or the JS_Gyroscope_callback is hooked up
          return (JS_Gyroscope && JS_Gyroscope.activated) || (JS_Gyroscope_callback != 0);
      }

  
  
  var JS_Gyroscope_eventHandler = function() {
          // Radians per second
          if (JS_Gyroscope_callback != 0)
              ((a1, a2, a3) => dynCall_vfff(JS_Gyroscope_callback, a1, a2, a3))(JS_Gyroscope.x, JS_Gyroscope.y, JS_Gyroscope.z);
      };
  
  
  var JS_Gyroscope_frequencyRequest = 0;
  
  
  function _JS_Gyroscope_Start(callback, frequency) {
          assert(callback != 0, 'Invalid callback passed to JS_Gyroscope_Start');
  
          // If we don't have new sensor API, fallback to old DeviceMotionEvent
          if (typeof Gyroscope === 'undefined') {
              JS_DeviceMotion_add(); // Must call before we set the callback
              JS_Gyroscope_callback = callback;
              return;
          }
  
          JS_Gyroscope_callback = callback;
  
          function InitializeGyroscope(frequency) {
              // Use device referenceFrame, since New Input System package does its own compensation
              JS_Gyroscope = new Gyroscope({ frequency: frequency, referenceFrame: 'device' });
              JS_Gyroscope.addEventListener('reading', JS_Gyroscope_eventHandler);
              JS_Gyroscope.addEventListener('error', function(e) {
                  // e.error could be DOMException: Could not connect to a sensor
                  warnOnce((e.error) ? e.error : e);
              });
              JS_Gyroscope.start();
          }
  
          // If the sensor is already created, stop and re-create it with new frequency
          if (JS_Gyroscope) {
              JS_Gyroscope.stop();
              JS_Gyroscope.removeEventListener('reading', JS_Gyroscope_eventHandler);
              InitializeGyroscope(frequency);
          }
          else if (JS_Gyroscope_frequencyRequest != 0) {
              // If the permissions promise is currently in progress, then note new frequency only
              JS_Gyroscope_frequencyRequest = frequency;
          }
          else {
              JS_Gyroscope_frequencyRequest = frequency;
  
              // Request required permission for the Gyroscope
              navigator.permissions.query({name: 'gyroscope'})
                  .then(function(result) {
                      if (result.state === "granted") {
                          InitializeGyroscope(JS_Gyroscope_frequencyRequest);
                      } else {
                          warnOnce("No permission to use Gyroscope.");
                      }
                      JS_Gyroscope_frequencyRequest = 0;
              });
          }
      }

  
  
  
  function _JS_Gyroscope_Stop() {
          if (JS_Gyroscope) {
              JS_Gyroscope.stop();
              JS_Gyroscope.removeEventListener('reading', JS_Gyroscope_eventHandler);
              JS_Gyroscope = null;
              JS_Gyroscope_callback = 0;
          }
          else if (JS_Gyroscope_callback != 0) {
              JS_Gyroscope_callback = 0;
              JS_DeviceMotion_remove();
          }
      }

  function _JS_Init_ContextMenuHandler() {
          const _handleContextMenu = function (event){
              if(event.target.localName !== "canvas")
                  _ReleaseKeys();
          }
  
          document.addEventListener("contextmenu", _handleContextMenu);
  
          Module.deinitializers.push(function() {
              document.removeEventListener("contextmenu", _handleContextMenu);
          });
      }

  
  
  
  
  
  
  
  var mobile_input_hide_delay = null;
  var mobile_input_text = null;
  
  var mobile_input = null;
  
  function _JS_Init_CopyPaste() {
          var canvas = document.querySelector(jsCanvasSelector());
          
          // UUM-72388 we need to conditionally prevent default so that users can
          // copy paste between elements on the page to the unity canvas. Check
          // mobile input here otherwise paste data will paste twice.
          const _handlePaste = function (event) {
              if (document.activeElement == canvas || !!mobile_input)
                  event.preventDefault();
              const data = event.clipboardData.getData("text");
  
              if(!!mobile_input){
                  mobile_input.input.value += data;
              } else {
                  const str_wasm = stringToNewUTF8(data);
                  _SendPasteEvent(str_wasm);
                  _free(str_wasm);
              }
          }
  
          const _handleCopy = function (event) {
              if (document.activeElement == canvas)
                  event.preventDefault();
              const data = !!mobile_input
                  ? mobile_input.input.value.slice(mobile_input.input.selectionStart, mobile_input.input.selectionEnd) 
                  : UTF8ToString(_GetCopyBufferAsCStr());
  
              event.clipboardData.setData("text/plain", data);
          }
  
          // Add the event listener on the window to account for mobile copy paste.
          // When copying/pasting elements, the canvas is not the one in focus so
          // we cannot prevent default. On desktop canvas does not pick up copy paste events.
          window.addEventListener("paste", _handlePaste);
          window.addEventListener("copy", _handleCopy);
          window.addEventListener("cut", _handleCopy);
  
          Module.deinitializers.push(function() {
              window.removeEventListener("paste", _handlePaste);
              window.removeEventListener("copy", _handleCopy);
              window.removeEventListener("cut", _handleCopy);
          });
      }

  function _JS_IsProgressiveAssetLoadingEnabled() {
          // Progressive asset loading is only enabled when secondaryDataUrls is defined in the HTML template and there
          // is more than one scene to load asynchronously. This is a workaround because progressive asset loading is an
          // editor-only player setting that cannot be accessed at runtime. Therefore, Module.secondaryDataUrls should be
          // considered immutable, ensuring this function returns the same value throughout program execution.
          return Module.secondaryDataUrls && Module.secondaryDataUrls.length > 0;
      }

  
  function _JS_LinearAccelerationSensor_IsRunning() {
          // Sensor is running if there is an activated new JS_LinearAccelerationSensor; or the JS_LinearAccelerationSensor_callback is hooked up
          return (JS_LinearAccelerationSensor && JS_LinearAccelerationSensor.activated) || (JS_LinearAccelerationSensor_callback != 0);
      }



  
  function _JS_Log_Dump(ptr, type)
  {
  	var str = UTF8ToString(ptr);
  	if (typeof dump == 'function')
  		dump (str);
  	switch (type)
  	{
  		case 0: //LogType_Error
  		case 1: //LogType_Assert
  		case 4: //LogType_Exception
  			console.error (str);
  			return;
  
  		case 2: //LogType_Warning
  			console.warn (str);
  			return;
  
  		case 3: //LogType_Log
  		case 5: //LogType_Debug
  			console.log (str);
  			return;			
  
  		default:
  			console.error ("Unknown console message type!")
  			console.error (str);
  	}
  }

  
  function _JS_Log_StackTrace(buffer, bufferSize)
  {
  	var trace = new Error().stack.toString();
  	if (buffer)
  		stringToUTF8(trace, buffer, bufferSize);
  	return lengthBytesUTF8(trace);	
  }

  
  
  var mobile_input_ignore_blur_event = false;
  
  
  
  function _JS_MobileKeyboard_GetIgnoreBlurEvent() {
      // On some platforms, such as iOS15, a blur event is sent to the window after the keyboard
      // is closed. This causes the game to be paused in the blur event handler in ScreenManagerWebGL.
      // It checks this return value to see if it should ignore the blur event.
      return mobile_input_ignore_blur_event;
  }

  
  
  function _JS_MobileKeyboard_GetKeyboardStatus()
  {
      var kKeyboardStatusVisible = 0;
      var kKeyboardStatusDone = 1;
      //var kKeyboardStatusCanceled = 2;
      //var kKeyboardStatusLostFocus = 3;
      if (!mobile_input) return kKeyboardStatusDone;
      return kKeyboardStatusVisible;
  }

  
  
  
  
  function _JS_MobileKeyboard_GetText(buffer, bufferSize)
  {
      // If the keyboard was closed, use the cached version of the input's text so that Unity can
      // still ask for it.
      var text = mobile_input && mobile_input.input ? mobile_input.input.value :
          mobile_input_text ? mobile_input_text :
          "";
      if (buffer) stringToUTF8(text, buffer, bufferSize);
      return lengthBytesUTF8(text);
  }

  
  
  function _JS_MobileKeyboard_GetTextSelection(outStart, outLength)
  {
      outStart = (outStart >> 2);
      outLength = (outLength >> 2);
  
      if (!mobile_input) {
          HEAP32[outStart] = 0;
          HEAP32[outLength] = 0;
          return;
      }
      HEAP32[outStart] = mobile_input.input.selectionStart;
      HEAP32[outLength] = mobile_input.input.selectionEnd - mobile_input.input.selectionStart;
  }

  
  
  
  function _JS_MobileKeyboard_Hide(delay)
  {
      if (mobile_input_hide_delay) return;
      mobile_input_ignore_blur_event = true;
  
      function hideMobileKeyboard() {
          if (mobile_input && mobile_input.input) {
              mobile_input_text = mobile_input.input.value;
              mobile_input.input = null;
              if (mobile_input.parentNode && mobile_input.parentNode) {
                  mobile_input.parentNode.removeChild(mobile_input);
              }
          }
          mobile_input = null;
          mobile_input_hide_delay = null;
  
          // mobile_input_ignore_blur_event was set to true so that ScreenManagerWebGL will ignore
          // the blur event it might get from the closing of the keyboard. But it might not get that
          // blur event, too, depending on the browser. So we want to clear the flag, as soon as we
          // can, but some time after the blur event has been potentially fired.
          setTimeout(function() {
              mobile_input_ignore_blur_event = false;
          }, 100);
      }
  
      if (delay) {
          // Delaying the hide of the input/keyboard allows a new input to be selected and re-use the
          // existing control. This fixes a problem where a quick tap select of a new element would
          // cause it to not be displayed because it tried to be focused before the old keyboard finished
          // sliding away.
          var hideDelay = 200;
          mobile_input_hide_delay = setTimeout(hideMobileKeyboard, hideDelay);
      } else {
          hideMobileKeyboard();
      }
  }

  
  
  function _JS_MobileKeyboard_SetCharacterLimit(limit)
  {
      if (!mobile_input) return;
      mobile_input.input.maxLength = limit;
  }

  
  
  
  
  function _JS_MobileKeyboard_SetText(text)
  {
      if (!mobile_input) return;
      text = UTF8ToString(text);
      mobile_input.input.value = text;
  }

  
  
  function _JS_MobileKeyboard_SetTextSelection(start, length)
  {
      if (!mobile_input) return;
      var input = mobile_input.input;
      try {
          input.setSelectionRange(start, start + length);
      } catch (e) {
          var originalType = input.type;
          input.type = "text";
          try {
              input.setSelectionRange(start, start + length);
          } finally {
              input.type = originalType;
          }
      }
  }

  
  
  
  
  
  function _JS_MobileKeyboard_Show(text, keyboardType, autocorrection, multiline, secure, alert,
                                   placeholder, characterLimit)
  {
      if (mobile_input_hide_delay) {
          clearTimeout(mobile_input_hide_delay);
          mobile_input_hide_delay = null;
      }
  
      text = UTF8ToString(text);
      mobile_input_text = text;
  
      placeholder = UTF8ToString(placeholder);
  
      var container = document.body;
  
      var hasExistingMobileInput = !!mobile_input;
  
      // From KeyboardOnScreen::KeyboardTypes
      var input_type;
      var KEYBOARD_TYPE_NUMBERS_AND_PUNCTUATION = 2;
      var KEYBOARD_TYPE_URL = 3;
      var KEYBOARD_TYPE_NUMBER_PAD = 4;
      var KEYBOARD_TYPE_PHONE_PAD = 5;
      var KEYBOARD_TYPE_EMAIL_ADDRESS = 7;
      if (!secure) {
          switch (keyboardType) {
              case KEYBOARD_TYPE_EMAIL_ADDRESS:
                  input_type = "email";
                  break;
              case KEYBOARD_TYPE_URL:
                  input_type = "url";
                  break;
              case KEYBOARD_TYPE_NUMBERS_AND_PUNCTUATION:
              case KEYBOARD_TYPE_NUMBER_PAD:
              case KEYBOARD_TYPE_PHONE_PAD:
                  input_type = "number";
                  break;
              default:
                  input_type = "text";
                  break;
          }
      } else {
          input_type = "password";
      }
  
      if (hasExistingMobileInput) {
          if (mobile_input.multiline != multiline) {
              _JS_MobileKeyboard_Hide(false);
              return;
          }
      }
  
      var inputContainer = mobile_input || document.createElement("div");
      if (!hasExistingMobileInput) {
          inputContainer.style = "width:100%; position:fixed; bottom:0px; margin:0px; padding:0px; left:0px; border: 1px solid #000; border-radius: 5px; background-color:#fff; font-size:14pt;";
  
          container.appendChild(inputContainer);
          mobile_input = inputContainer;
      }
  
      var input = hasExistingMobileInput ?
          mobile_input.input :
          document.createElement(multiline ? "textarea" : "input");
  
      mobile_input.multiline = multiline;
      mobile_input.secure = secure;
      mobile_input.keyboardType = keyboardType;
      mobile_input.inputType = input_type;
  
      input.type = input_type;
      input.style = "width:calc(100% - 85px); " + (multiline ? "height:100px;" : "") + "vertical-align:top; border-radius: 5px; outline:none; cursor:default; resize:none; border:0px; padding:10px 0px 10px 10px;";
  
      input.spellcheck = autocorrection ? true : false;
      input.maxLength = characterLimit > 0 ? characterLimit : 524288;
      input.value = text;
      input.placeholder = placeholder;
  
      if (!hasExistingMobileInput) {
          inputContainer.appendChild(input);
          inputContainer.input = input;
      }
  
      if (!hasExistingMobileInput) {
          var okButton = document.createElement("button");
          okButton.innerText = "OK";
          okButton.style = "border:0; position:absolute; left:calc(100% - 75px); top:0px; width:75px; height:100%; margin:0; padding:0; border-radius: 5px; background-color:#fff";
          okButton.addEventListener("touchend", function() {
              _JS_MobileKeyboard_Hide(true);
          });
  
          inputContainer.appendChild(okButton);
          inputContainer.okButton = okButton;
  
          // For single-line text input, enter key will close the keyboard.
          input.addEventListener('keyup', function(e) {
              if (input.parentNode.multiline) return;
              if (e.code == 'Enter' || e.which == 13 || e.keyCode == 13) {
                  _JS_MobileKeyboard_Hide(true);
              }
          });
  
          // On iOS, the keyboard has a done button that hides the keyboard. The only way to detect
          // when this happens seems to be when the HTML input looses focus, so we watch for the blur
          // event on the input element and close the element/keybaord when it's gotten.
          input.addEventListener("blur", function(e) {
              _JS_MobileKeyboard_Hide(true);
              e.stopPropagation();
              e.preventDefault();
          });
  
          input.select();
          input.focus();
      } else {
          input.select();
      }
  }

  function _JS_Module_WebGLContextAttributes_PowerPreference() {
      return Module.webglContextAttributes.powerPreference;
    }

  function _JS_Module_WebGLContextAttributes_PremultipliedAlpha() {
      return Module.webglContextAttributes.premultipliedAlpha;
    }

  function _JS_Module_WebGLContextAttributes_PreserveDrawingBuffer() {
      return Module.webglContextAttributes.preserveDrawingBuffer;
    }

  var JS_OrientationSensor = null;
  
  var JS_OrientationSensor_callback = 0;
  function _JS_OrientationSensor_IsRunning() {
          // Sensor is running if there is an activated new JS_OrientationSensor; or the DeviceOrientation handler is hooked up
          return (JS_OrientationSensor && JS_OrientationSensor.activated) || (JS_OrientationSensor_callback != 0);
      }

  
  
  var JS_OrientationSensor_eventHandler = function() {
          if (JS_OrientationSensor_callback != 0)
              ((a1, a2, a3, a4) => dynCall_vffff(JS_OrientationSensor_callback, a1, a2, a3, a4))(JS_OrientationSensor.quaternion[0], JS_OrientationSensor.quaternion[1], JS_OrientationSensor.quaternion[2], JS_OrientationSensor.quaternion[3]);
      };
  
  
  var JS_OrientationSensor_frequencyRequest = 0;
  
  var JS_DeviceOrientation_eventHandler = function(event) {
          if (JS_OrientationSensor_callback) {
              // OBSERVATION: On Android Firefox, absolute = false, webkitCompassHeading = null
              // OBSERVATION: On iOS Safari, absolute is undefined, webkitCompassHeading and webkitCompassAccuracy are set
  
              // Convert alpha, beta, gamma Euler angles to a quaternion
              var degToRad = Math.PI / 180;
              var x = event.beta * degToRad;
              var y = event.gamma * degToRad;
              var z = event.alpha * degToRad;
  
              var cx = Math.cos(x/2);
              var sx = Math.sin(x/2);
              var cy = Math.cos(y/2);
              var sy = Math.sin(y/2);
              var cz = Math.cos(z/2);
              var sz = Math.sin(z/2);
  
              var qx = sx * cy * cz - cx * sy * sz;
              var qy = cx * sy * cz + sx * cy * sz;
              var qz = cx * cy * sz + sx * sy * cz;
              var qw = cx * cy * cz - sx * sy * sz;
  
              ((a1, a2, a3, a4) => dynCall_vffff(JS_OrientationSensor_callback, a1, a2, a3, a4))(qx, qy, qz, qw);
          }
      };
  
  
  function _JS_OrientationSensor_Start(callback, frequency) {
          assert(callback != 0, 'Invalid callback passed to JS_OrientationSensor_Start');
  
          // If we don't have new sensor API, fallback to old DeviceOrientationEvent
          if (typeof RelativeOrientationSensor === 'undefined') {
              if (JS_OrientationSensor_callback == 0) {
                  JS_OrientationSensor_callback = callback;
                  JS_RequestDeviceSensorPermissions(1/*DeviceOrientationEvent permission*/);
                  window.addEventListener('deviceorientation', JS_DeviceOrientation_eventHandler);
              }
              return;
          }
  
          JS_OrientationSensor_callback = callback;
  
          function InitializeOrientationSensor(frequency) {
              // Use device referenceFrame, since New Input System package does its own compensation
              // Use relative orientation to match native players
              JS_OrientationSensor = new RelativeOrientationSensor({ frequency: frequency, referenceFrame: 'device' });
              JS_OrientationSensor.addEventListener('reading', JS_OrientationSensor_eventHandler);
              JS_OrientationSensor.addEventListener('error', function(e) {
                  // e.error could be DOMException: Could not connect to a sensor
                  warnOnce((e.error) ? e.error : e);
              });
              JS_OrientationSensor.start();
          }
  
          // If the sensor is already created, stop and re-create it with new frequency
          if (JS_OrientationSensor) {
              JS_OrientationSensor.stop();
              JS_OrientationSensor.removeEventListener('reading', JS_OrientationSensor_eventHandler);
              InitializeOrientationSensor(frequency);
          }
          else if (JS_OrientationSensor_frequencyRequest != 0) {
              // If the permissions promise is currently in progress, then note new frequency only
              JS_OrientationSensor_frequencyRequest = frequency;
          }
          else {
              JS_OrientationSensor_frequencyRequest = frequency;
  
              // Request required permissions for the RelativeOrientationSensor
              Promise.all([navigator.permissions.query({ name: "accelerometer" }),
                           navigator.permissions.query({ name: "gyroscope" })])
                  .then(function(results) {
                      if (results.every(function(result) {return(result.state === "granted");})) {
                          InitializeOrientationSensor(JS_OrientationSensor_frequencyRequest);
                      } else {
                          warnOnce("No permissions to use RelativeOrientationSensor.");
                      }
                      JS_OrientationSensor_frequencyRequest = 0;
              });
          }
      }

  
  
  
  function _JS_OrientationSensor_Stop() {
          if (JS_OrientationSensor) {
              JS_OrientationSensor.stop();
              JS_OrientationSensor.removeEventListener('reading', JS_OrientationSensor_eventHandler);
              JS_OrientationSensor = null;
          }
          else if (JS_OrientationSensor_callback != 0) {
              window.removeEventListener('deviceorientation', JS_DeviceOrientation_eventHandler);
          }
          JS_OrientationSensor_callback = 0;
      }

  
  function _JS_RequestDeviceSensorPermissionsOnTouch() {
          if (JS_DeviceSensorPermissions == 0) return;
  
          // Re-request any required device sensor permissions (iOS requires that permissions are requested on a user interaction event)
          JS_RequestDeviceSensorPermissions(JS_DeviceSensorPermissions);
      }

  function _JS_RunQuitCallbacks() {
  	Module.QuitCleanup();
  }

  var JS_ScreenOrientation_callback = 0;
  var JS_ScreenOrientation_eventHandler = function() {
  		if (JS_ScreenOrientation_callback) ((a1, a2, a3) => dynCall_viii(JS_ScreenOrientation_callback, a1, a2, a3))(window.innerWidth, window.innerHeight, screen.orientation ? screen.orientation.angle : window.orientation);
  	};
  
  function _JS_ScreenOrientation_DeInit() {
  		JS_ScreenOrientation_callback = 0;
  		window.removeEventListener('resize', JS_ScreenOrientation_eventHandler);
  		if (screen.orientation) {
  			screen.orientation.removeEventListener('change', JS_ScreenOrientation_eventHandler);
  		}
  	}

  
  function _JS_ScreenOrientation_Init(callback) {
  		// Only register if not yet registered
  		if (!JS_ScreenOrientation_callback) {
  			if (screen.orientation) {
  				// Use Screen Orientation API if available:
  				// - https://www.w3.org/TR/screen-orientation/
  				// - https://caniuse.com/screen-orientation
  				// - https://developer.mozilla.org/en-US/docs/Web/API/Screen/orientation
  				// (Firefox, Chrome, Chrome for Android, Firefox for Android)
  				screen.orientation.addEventListener('change', JS_ScreenOrientation_eventHandler);
  			}
  
  			// As a fallback, use deprecated DOM window.orientation field if available:
  			// - https://compat.spec.whatwg.org/#dom-window-orientation
  			// - https://developer.mozilla.org/en-US/docs/Web/API/Window/orientation
  			// (Safari for iOS)
  			// Listening to resize event also helps emulate landscape/portrait transitions on desktop
  			// browsers when the browser window is scaled to narrow/wide configurations.
  			window.addEventListener('resize', JS_ScreenOrientation_eventHandler);
  
  			JS_ScreenOrientation_callback = callback;
  
  			// Trigger the event handler immediately after the engine initialization is done to start up
  			// ScreenManager with the initial state.
  			setTimeout(JS_ScreenOrientation_eventHandler, 0);
  		}
  	}

  var JS_ScreenOrientation_requestedLockType = -1;
  
  var JS_ScreenOrientation_appliedLockType = -1;
  
  var JS_ScreenOrientation_timeoutID = -1;
  
  function _JS_ScreenOrientation_Lock(orientationLockType) {
  		// We will use the Screen Orientation API if available, and silently return if not available
  		// - https://www.w3.org/TR/screen-orientation/
  		// - https://caniuse.com/screen-orientation
  		// - https://developer.mozilla.org/en-US/docs/Web/API/Screen/orientation
  		if (!screen.orientation || !screen.orientation.lock) {
  			// As of writing, this is only not implemented on Safari
  			return;
  		}
  
  		// Callback to apply the lock
  		function applyLock() {
  			JS_ScreenOrientation_appliedLockType = JS_ScreenOrientation_requestedLockType;
  
  			// Index must match enum class OrientationLockType in ScreenOrientation.h
  			var screenOrientations = ['any', 0/*natural*/, 'landscape', 'portrait', 'portrait-primary', 'portrait-secondary', 'landscape-primary', 'landscape-secondary' ];
  			var type = screenOrientations[JS_ScreenOrientation_appliedLockType];
  
  			assert(type, 'Invalid orientationLockType passed to JS_ScreenOrientation_Lock');
  
  			// Apply the lock, which is done asynchronously and returns a Promise
  			screen.orientation.lock(type).then(function() {
  				// Upon success, see if the JS_ScreenOrientation_requestedLockType value has changed, in which case, we will now need to queue another applyLock
  				if (JS_ScreenOrientation_requestedLockType != JS_ScreenOrientation_appliedLockType) {
  					JS_ScreenOrientation_timeoutID = setTimeout(applyLock, 0);
  				}
  				else {
  					JS_ScreenOrientation_timeoutID = -1;
  				}
  			}).catch(function(err) {
  				// When screen.orientation.lock() is called on a desktop browser, a DOMException is thrown by the promise
  				warnOnce(err);
  				JS_ScreenOrientation_timeoutID = -1;
  			});
  
  			// Note, there is also an screen.orientation.unlock() which unlocks auto rotate to default orientation.
  			// On my Google Pixel 5, this allows 'portrait-primary' AND 'landscape', but will differ depending on device.
  		}
  
  		// Request this orientationLockType be applied on the callback
  		JS_ScreenOrientation_requestedLockType = orientationLockType;
  
  		// Queue applyLock callback if there is not already a callback or a screen.orientation.lock call in progress
  		if (JS_ScreenOrientation_timeoutID == -1 && orientationLockType != JS_ScreenOrientation_appliedLockType) {
  			JS_ScreenOrientation_timeoutID = setTimeout(applyLock, 0);
  		}
  	}

  function _JS_SetLoadingBarProgress(progress) {
          Module.onProgress(progress);
      }

  
  var handleException = (e) => {
      // Certain exception types we do not treat as errors since they are used for
      // internal control flow.
      // 1. ExitStatus, which is thrown by exit()
      // 2. "unwind", which is thrown by emscripten_unwind_to_js_event_loop() and others
      //    that wish to return to JS event loop.
      if (e instanceof ExitStatus || e == 'unwind') {
        return EXITSTATUS;
      }
      checkStackCookie();
      if (e instanceof WebAssembly.RuntimeError) {
        if (_emscripten_stack_get_current() <= 0) {
          err('Stack overflow detected.  You can try increasing -sSTACK_SIZE (currently set to 524288)');
        }
      }
      quit_(1, e);
    };
  
  
  var runtimeKeepaliveCounter = 0;
  var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0;
  var _proc_exit = (code) => {
      EXITSTATUS = code;
      if (!keepRuntimeAlive()) {
        Module['onExit']?.(code);
        ABORT = true;
      }
      quit_(code, new ExitStatus(code));
    };
  
  
  /** @param {boolean|number=} implicit */
  var exitJS = (status, implicit) => {
      EXITSTATUS = status;
  
      checkUnflushedContent();
  
      // if exit() was called explicitly, warn the user if the runtime isn't actually being shut down
      if (keepRuntimeAlive() && !implicit) {
        var msg = `program exited (with status: ${status}), but keepRuntimeAlive() is set (counter=${runtimeKeepaliveCounter}) due to an async operation, so halting execution but not exiting the runtime or preventing further async execution (you can use emscripten_force_exit, if you want to force a true shutdown)`;
        readyPromiseReject?.(msg);
        err(msg);
      }
  
      _proc_exit(status);
    };
  var _exit = exitJS;
  
  
  var maybeExit = () => {
      if (!keepRuntimeAlive()) {
        try {
          _exit(EXITSTATUS);
        } catch (e) {
          handleException(e);
        }
      }
    };
  var callUserCallback = (func) => {
      if (ABORT) {
        err('user callback triggered after runtime exited or application aborted.  Ignoring.');
        return;
      }
      try {
        func();
        maybeExit();
      } catch (e) {
        handleException(e);
      }
    };
  
  var _emscripten_set_main_loop_timing = (mode, value) => {
      MainLoop.timingMode = mode;
      MainLoop.timingValue = value;
  
      if (!MainLoop.func) {
        err('emscripten_set_main_loop_timing: Cannot set timing mode for main loop since a main loop does not exist! Call emscripten_set_main_loop first to set one up.');
        return 1; // Return non-zero on failure, can't set timing mode when there is no main loop.
      }
  
      if (!MainLoop.running) {
        
        MainLoop.running = true;
      }
      if (mode == 0) {
        MainLoop.scheduler = function MainLoop_scheduler_setTimeout() {
          var timeUntilNextTick = Math.max(0, MainLoop.tickStartTime + value - _emscripten_get_now())|0;
          setTimeout(MainLoop.runner, timeUntilNextTick); // doing this each time means that on exception, we stop
        };
        MainLoop.method = 'timeout';
      } else if (mode == 1) {
        MainLoop.scheduler = function MainLoop_scheduler_rAF() {
          MainLoop.requestAnimationFrame(MainLoop.runner);
        };
        MainLoop.method = 'rAF';
      } else if (mode == 2) {
        if (!MainLoop.setImmediate) {
          if (globalThis.setImmediate) {
            MainLoop.setImmediate = setImmediate;
          } else {
            // Emulate setImmediate. (note: not a complete polyfill, we don't emulate clearImmediate() to keep code size to minimum, since not needed)
            var setImmediates = [];
            var emscriptenMainLoopMessageId = 'setimmediate';
            /** @param {Event} event */
            var MainLoop_setImmediate_messageHandler = (event) => {
              // When called in current thread or Worker, the main loop ID is structured slightly different to accommodate for --proxy-to-worker runtime listening to Worker events,
              // so check for both cases.
              if (event.data === emscriptenMainLoopMessageId || event.data.target === emscriptenMainLoopMessageId) {
                event.stopPropagation();
                setImmediates.shift()();
              }
            };
            addEventListener("message", MainLoop_setImmediate_messageHandler, true);
            MainLoop.setImmediate = /** @type{function(function(): ?, ...?): number} */((func) => {
              setImmediates.push(func);
              if (ENVIRONMENT_IS_WORKER) {
                Module['setImmediates'] ??= [];
                Module['setImmediates'].push(func);
                postMessage({target: emscriptenMainLoopMessageId}); // In --proxy-to-worker, route the message via proxyClient.js
              } else postMessage(emscriptenMainLoopMessageId, "*"); // On the main thread, can just send the message to itself.
            });
          }
        }
        MainLoop.scheduler = function MainLoop_scheduler_setImmediate() {
          MainLoop.setImmediate(MainLoop.runner);
        };
        MainLoop.method = 'immediate';
      }
      return 0;
    };
  var MainLoop = {
  running:false,
  scheduler:null,
  method:"",
  currentlyRunningMainloop:0,
  func:null,
  arg:0,
  timingMode:0,
  timingValue:0,
  currentFrameNumber:0,
  queue:[],
  preMainLoop:[],
  postMainLoop:[],
  pause() {
        MainLoop.scheduler = null;
        // Incrementing this signals the previous main loop that it's now become old, and it must return.
        MainLoop.currentlyRunningMainloop++;
      },
  resume() {
        MainLoop.currentlyRunningMainloop++;
        var timingMode = MainLoop.timingMode;
        var timingValue = MainLoop.timingValue;
        var func = MainLoop.func;
        MainLoop.func = null;
        // do not set timing and call scheduler, we will do it on the next lines
        setMainLoop(func, 0, false, MainLoop.arg, true);
        _emscripten_set_main_loop_timing(timingMode, timingValue);
        MainLoop.scheduler();
      },
  updateStatus() {
        if (Module['setStatus']) {
          var message = Module['statusMessage'] || 'Please wait...';
          var remaining = MainLoop.remainingBlockers ?? 0;
          var expected = MainLoop.expectedBlockers ?? 0;
          if (remaining) {
            if (remaining < expected) {
              Module['setStatus'](`{message} ({expected - remaining}/{expected})`);
            } else {
              Module['setStatus'](message);
            }
          } else {
            Module['setStatus']('');
          }
        }
      },
  init() {
        Module['preMainLoop'] && MainLoop.preMainLoop.push(Module['preMainLoop']);
        Module['postMainLoop'] && MainLoop.postMainLoop.push(Module['postMainLoop']);
      },
  runIter(func) {
        if (ABORT) return;
        for (var pre of MainLoop.preMainLoop) {
          if (pre() === false) {
            return; // |return false| skips a frame
          }
        }
        callUserCallback(func);
        for (var post of MainLoop.postMainLoop) {
          post();
        }
        checkStackCookie();
      },
  nextRAF:0,
  fakeRequestAnimationFrame(func) {
        // try to keep 60fps between calls to here
        var now = Date.now();
        if (MainLoop.nextRAF === 0) {
          MainLoop.nextRAF = now + 1000/60;
        } else {
          while (now + 2 >= MainLoop.nextRAF) { // fudge a little, to avoid timer jitter causing us to do lots of delay:0
            MainLoop.nextRAF += 1000/60;
          }
        }
        var delay = Math.max(MainLoop.nextRAF - now, 0);
        setTimeout(func, delay);
      },
  requestAnimationFrame(func) {
        if (globalThis.requestAnimationFrame) {
          requestAnimationFrame(func);
        } else {
          MainLoop.fakeRequestAnimationFrame(func);
        }
      },
  };
  
  
  var _emscripten_get_now = () => performance.now();
  
  
    /**
     * @param {number=} arg
     * @param {boolean=} noSetTiming
     */
  var setMainLoop = (iterFunc, fps, simulateInfiniteLoop, arg, noSetTiming) => {
      assert(!MainLoop.func, 'emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.');
      MainLoop.func = iterFunc;
      MainLoop.arg = arg;
  
      var thisMainLoopId = MainLoop.currentlyRunningMainloop;
      function checkIsRunning() {
        if (thisMainLoopId < MainLoop.currentlyRunningMainloop) {
          
          maybeExit();
          return false;
        }
        return true;
      }
  
      // We create the loop runner here but it is not actually running until
      // _emscripten_set_main_loop_timing is called (which might happen a
      // later time).  This member signifies that the current runner has not
      // yet been started so that we can call runtimeKeepalivePush when it
      // gets it timing set for the first time.
      MainLoop.running = false;
      MainLoop.runner = function MainLoop_runner() {
        if (ABORT) return;
        if (MainLoop.queue.length > 0) {
          var start = Date.now();
          var blocker = MainLoop.queue.shift();
          blocker.func(blocker.arg);
          if (MainLoop.remainingBlockers) {
            var remaining = MainLoop.remainingBlockers;
            var next = remaining%1 == 0 ? remaining-1 : Math.floor(remaining);
            if (blocker.counted) {
              MainLoop.remainingBlockers = next;
            } else {
              // not counted, but move the progress along a tiny bit
              next = next + 0.5; // do not steal all the next one's progress
              MainLoop.remainingBlockers = (8*remaining + next)/9;
            }
          }
          MainLoop.updateStatus();
  
          // catches pause/resume main loop from blocker execution
          if (!checkIsRunning()) return;
  
          setTimeout(MainLoop.runner, 0);
          return;
        }
  
        // catch pauses from non-main loop sources
        if (!checkIsRunning()) return;
  
        // Implement very basic swap interval control
        MainLoop.currentFrameNumber = MainLoop.currentFrameNumber + 1 | 0;
        if (MainLoop.timingMode == 1 && MainLoop.timingValue > 1 && MainLoop.currentFrameNumber % MainLoop.timingValue != 0) {
          // Not the scheduled time to render this frame - skip.
          MainLoop.scheduler();
          return;
        } else if (MainLoop.timingMode == 0) {
          MainLoop.tickStartTime = _emscripten_get_now();
        }
  
        if (MainLoop.method === 'timeout' && Module['ctx']) {
          warnOnce('Looks like you are rendering without using requestAnimationFrame for the main loop. You should use 0 for the frame rate in emscripten_set_main_loop in order to use requestAnimationFrame, as that can greatly improve your frame rates!');
          MainLoop.method = ''; // just warn once per call to set main loop
        }
  
        MainLoop.runIter(iterFunc);
  
        // catch pauses from the main loop itself
        if (!checkIsRunning()) return;
  
        MainLoop.scheduler();
      }
  
      if (!noSetTiming) {
        if (fps > 0) {
          _emscripten_set_main_loop_timing(0, 1000.0 / fps);
        } else {
          // Do rAF by rendering each frame (no decimating)
          _emscripten_set_main_loop_timing(1, 1);
        }
  
        MainLoop.scheduler();
      }
  
      if (simulateInfiniteLoop) {
        throw 'unwind';
      }
    };
  var _emscripten_set_main_loop = (func, fps, simulateInfiniteLoop) => {
      var iterFunc = (() => dynCall_v(func));
      setMainLoop(iterFunc, fps, simulateInfiniteLoop);
    };
  
  function SendMessage(gameObject, func, param) {
          const gameObject_cstr = stringToNewUTF8(gameObject);
          const func_cstr = stringToNewUTF8(func);
          let param_cstr = 0;
          try {
              if (param === undefined) {
                  _SendMessage(gameObject_cstr, func_cstr);
              } else if (typeof param === "string") {
                  param_cstr = stringToNewUTF8(param);
                  _SendMessageString(gameObject_cstr, func_cstr, param_cstr);
              } else if (typeof param === "number") {
                  _SendMessageNumber(gameObject_cstr, func_cstr, param);
              } else {
                  throw "" + param + " does not have a type which is supported by SendMessage.";
              }
          } finally {
              _free(param_cstr);
              _free(func_cstr);
              _free(gameObject_cstr);
          }
      }
  
  function ConnectToProfiler(ipAndPort) {
          const ipAndPortCstr = stringToNewUTF8(ipAndPort);
          _ConnectToProfiler(ipAndPortCstr);
          _free(ipAndPortCstr);
      }
  function _JS_SetMainLoop(func, fps, simulateInfiniteLoop) {
  		try {
  			_emscripten_set_main_loop(func, fps, simulateInfiniteLoop);
  		} catch {
  			// Discard the thrown 'unwind' exception.
  		}
  	}

  var WEBAudio = {
  audioInstanceIdCounter:0,
  audioInstances:{
  },
  microphoneSoundClips:{
  },
  audioContext:null,
  audioWebEnabled:0,
  audioCache:[],
  pendingAudioSources:{
  },
  FAKEMOD_SAMPLERATE:44100,
  audioContextSuspendedTime:0,
  audioContextResumeOffset:0,
  contextIsRunning:false,
  soundsPendingContextResume:[],
  };
  function _JS_Sound_GetAudioContextSampleRate()
  {
  	if (WEBAudio.audioWebEnabled == 0)
  		return WEBAudio.FAKEMOD_SAMPLERATE;
  	return WEBAudio.audioContext.sampleRate;
  }
  
  function jsAudioMixinSetPitch(source) {
  	// Add a helper to AudioBufferSourceNode which gives the current playback position of the clip in seconds.
  	source.estimatePlaybackPosition = function () {
  		var t = (WEBAudio.audioContext.currentTime - source.playbackStartTime) * source.playbackRate.value;
  		// Collapse extra times that the audio clip has looped through.
  		if (source.loop && t >= source.loopStart) {
  
  			t = (t - source.loopStart) % (source.loopEnd - source.loopStart) + source.loopStart;
  		}
  		return t;
  	}
  
  	// Add a helper to AudioBufferSourceNode to allow adjusting pitch in a way that keeps playback position estimation functioning.
  	source.setPitch = function (newPitch) {
  		var curPosition = source.estimatePlaybackPosition();
  		if (curPosition >= 0) { // If negative, the clip has not begun to play yet (that delay is not scaled by pitch)
  			source.playbackStartTime = WEBAudio.audioContext.currentTime - curPosition / newPitch;
  		}
  		if (source.playbackRate.value !== newPitch) source.playbackRate.value = newPitch;
  	}
  }
  
  function jsAudioCreateUncompressedSoundClip(buffer, error) {
  	var soundClip = {
  		buffer: buffer,
  		error: error
  	};
  
  	/**
  	 * Release resources of a sound clip
  	 */
  	soundClip.release = function () { };
  
  	/**
  	 * Get length of sound clip in number of samples
  	 * @returns {number}
  	 */
  	soundClip.getLength = function () {
  		if (!this.buffer) {
  			console.log ("Trying to get length of sound which is not loaded yet.");
  			return 0;
  		}
  
  		return this.buffer.length;
  	}
  
  	/**
  	 * Gets uncompressed audio data from sound clip.
  	 * If output buffer is smaller than the sound data only the first portion
  	 * of the sound data is read.
  	 * Sound clips with multiple channels will be stored one after the other.
  	 *
  	 * @param {number} ptr Pointer to the output buffer
  	 * @param {number} length Size of output buffer in bytes
  	 * @returns Size of data in bytes written to output buffer
  	 */
  	soundClip.getData = function (ptr, length) {
  		if (!this.buffer) {
  			console.log ("Trying to get data of sound which is not loaded.");
  			return 0;
  		}
  
  		// Get output buffer
  		var startOutputBuffer = (ptr >> 2);
  		var output = HEAPF32.subarray(startOutputBuffer, startOutputBuffer + (length >> 2));
  		var numMaxSamples = Math.floor((length >> 2) / this.buffer.numberOfChannels);
  		var numReadSamples = Math.min(this.buffer.length, numMaxSamples);
  
  		// Copy audio data to outputbuffer
  		for (var i = 0; i < this.buffer.numberOfChannels; i++) {
  			var channelData = this.buffer.getChannelData(i).subarray(0, numReadSamples);
  			output.set(channelData, i * numReadSamples);
  		}
  
  		return numReadSamples * this.buffer.numberOfChannels * 4;
  	}
  
  	/**
  	 * Gets number of channels of soundclip
  	 * @returns {number}
  	 */
  	soundClip.getNumberOfChannels = function () {
  		if (!this.buffer) {
  			console.log ("Trying to get metadata of sound which is not loaded.");
  			return 0;
  		}
  
  		return this.buffer.numberOfChannels;
  	}
  
  	/**
  	 * Gets sampling rate in Hz
  	 * @returns {number}
  	 */
  	soundClip.getFrequency = function () {
  		if (!this.buffer) {
  			console.log ("Trying to get metadata of sound which is not loaded.");
  			return _JS_Sound_GetAudioContextSampleRate();
  		}
  
  		return this.buffer.sampleRate;
  	}
  
  	/**
  	 * Create an audio source node.
  	 * @returns {AudioBufferSourceNode}
  	 */
  	soundClip.createSourceNode = function () {
  		if (!this.buffer) {
  			console.log ("Trying to play sound which is not loaded.");
  		}
  
  		var source = WEBAudio.audioContext.createBufferSource();
  		source.buffer = this.buffer;
  		source.release = function () { };
  		jsAudioMixinSetPitch(source);
  
  		return source;
  	};
  
  	return soundClip;
  }
  
  function jsAudioCreateChannel(callback, userData) {
  	var channel = {
  		callback: callback,
  		userData: userData,
  		soundClip: null, // currently played sound clip
  		source: null,
  		gain: WEBAudio.audioContext.createGain(),
  		panner: WEBAudio.audioContext.createPanner(),
  		spatialBlendDryGain: WEBAudio.audioContext.createGain(),
  		spatialBlendWetGain: WEBAudio.audioContext.createGain(),
  		spatialBlendLevel: 0,
  		loop: false,
  		loopStart: 0,
  		loopEnd: 0,
  		pitch: 1.0
  	};
  
  	channel.panner.rolloffFactor = 0; // We calculate rolloff ourselves.
  
  	/**
  	 * Release internal resources.
  	 */
  	channel.release = function () {
  		// Explicitly disconnect audio nodes related to this audio channel when the channel should be
  		// GCd to work around Safari audio performance bug that resulted in crackling audio; as suggested
  		// in https://bugs.webkit.org/show_bug.cgi?id=222098#c23
  		this.disconnectSource();
  		this.gain.disconnect();
  		this.panner.disconnect();
  	}
  
  	/**
  	 * Play a sound clip on the channel
  	 * @param {UncompressedSoundClip|CompressedSoundClip} soundClip
  	 * @param {number} startTime Scheduled start time in seconds
  	 * @param {number} startOffset Start offset in seconds
  	 */
  	channel.playSoundClip = function (soundClip, startTime, startOffset) {
  
  		try {
  			var self = this;
  			this.soundClip = soundClip;
  			this.source = soundClip.createSourceNode();
  			this.configurePanningNodes();
  			this.setSpatialBlendLevel(this.spatialBlendLevel);
  
  			// Setup on ended callback
  			this.source.onended = function () {
  				self.source.isStopped = true;
  				self.disconnectSource();
  				if (self.callback) {
  					((a1) => dynCall_vi(self.callback, a1))(self.userData);
  				}
  			};
  
  			this.source.loop = this.loop;
  			this.source.loopStart = this.loopStart;
  			this.source.loopEnd = this.loopEnd;
  			this.source.start(startTime, startOffset);
  			this.source.playbackStartTime = startTime - startOffset / this.source.playbackRate.value;
  			this.source.setPitch(this.pitch);
  		} catch (e) {
  			// Need to catch exception, otherwise execution will stop on Safari if audio output is missing/broken
  			console.error("Channel.playSoundClip error. Exception: " + e);
  		}
  	};
  
  	/**
  	 * Stop playback on channel
  	 */
  	channel.stop = function (delay) {
  		if (!this.source) {
  			return;
  		}
  
  		// stop source currently playing.
  		this.soundClip = null;
  		try {
  			channel.source.stop(WEBAudio.audioContext.currentTime + delay);
  		} catch (e) {
  			// when stop() is used more than once for the same source in Safari it causes the following exception:
  			// InvalidStateError: DOM Exception 11: An attempt was made to use an object that is not, or is no longer, usable.
  			// Ignore that exception.
  		}
  
  		if (delay == 0) {
  			this.disconnectSource();
  		}
  	};
  
  	/**
  	 * Return wether the channel is currently paused
  	 * @returns {boolean}
  	 */
  	channel.isPaused = function () {
  		if (!this.source) {
  			return true;
  		}
  
  		if (this.source.isPausedMockNode) {
  			return true;
  		}
  
  		if (this.source.mediaElement) {
  			return this.source.mediaElement.paused || this.source.pauseRequested;
  		}
  
  		if (typeof this.source.isPaused === 'function') {
  			return this.source.isPaused();
  		}
  
  		return false;
  	};
  
  	/**
  	 * Pause playback of channel
  	 */
  	channel.pause = function () {
  		if (!this.source || this.source.isPausedMockNode) {
  			return;
  		}
  
  		if (this.source.mediaElement) {
  			this.source._pauseMediaElement();
  			return;
  		}
  
  		// Pause microphone source
  		if (typeof this.source.pause === 'function') {
  			this.source.pause();
  			return;
  		}
  
  		// WebAudio does not have support for pausing and resuming AudioBufferSourceNodes (they are a fire-once abstraction)
  		// When we want to pause a node, create a mocked object in its place that represents the needed state that is required
  		// for resuming the clip.
  		var pausedSource = {
  			isPausedMockNode: true,
  			buffer: this.source.buffer,
  			loop: this.source.loop,
  			loopStart: this.source.loopStart,
  			loopEnd: this.source.loopEnd,
  			playbackRate: this.source.playbackRate.value,
  			scheduledStopTime: undefined,
  			// Specifies in seconds the time at the clip where the playback was paused at.
  			// Can be negative if the audio clip has not started yet.
  			playbackPausedAtPosition: this.source.estimatePlaybackPosition(),
  			setPitch: function (v) { this.playbackRate = v; },
  			stop: function(when) { this.scheduledStopTime = when; }
  		};
  		// Stop and clear the real audio source...
  		this.stop(0);
  		this.disconnectSource();
  		// .. and replace the source with a paused mock version.
  		this.source = pausedSource;
  	};
  
  	/**
  	 * Resume playback on channel.
  	 */
  	channel.resume = function (offset = 0) {
  		// If the source is a compressed audio MediaElement, it was directly paused so we can
  		// directly play it again.
  		if (this.source && this.source.mediaElement) {
  			this.source.start(undefined, this.source.currentTime);
  			return;
  		}
  
  		// If it is a microphone source start it again
  		if (this.source && typeof this.source.resume === 'function') {
  			this.source.resume(offset);
  			return;
  		}
  
  		// N.B. We only resume a source that has been previously paused. That is, resume() cannot be used to start playback if
  		// channel was not playing an audio clip before, but playSoundClip() is to be used.
  		if (!this.source || !this.source.isPausedMockNode) {
  			return;
  		}
  
  		var pausedSource = this.source;
  
  		// In case playbackPausedAtPosition returns negative, we use its absolute value as the start delay
  		var startTime = WEBAudio.audioContext.currentTime;
  		if (pausedSource.playbackPausedAtPosition < 0)
  			startTime -= pausedSource.playbackPausedAtPosition;
  
  		var soundClip = jsAudioCreateUncompressedSoundClip(pausedSource.buffer, false);
  		this.playSoundClip(soundClip, startTime, Math.max(0, pausedSource.playbackPausedAtPosition) + offset);
  		this.source.loop = pausedSource.loop;
  		this.source.loopStart = pausedSource.loopStart;
  		this.source.loopEnd = pausedSource.loopEnd;
  		this.source.setPitch(pausedSource.playbackRate);
  
  		// Apply scheduled stop of source if present
  		if (typeof pausedSource.scheduledStopTime !== "undefined") {
  			var delay = Math.max(pausedSource.scheduledStopTime - WEBAudio.audioContext.currentTime, 0);
  			this.stop(delay);
  		}
  	};
  
  	/**
  	 * Set loop mode
  	 * @param {boolean} loop If true audio will be looped.
  	 */
  	channel.setLoop = function (loop) {
  		this.loop = loop;
  		if (!this.source || this.source.loop == loop) {
  			return;
  		}
  
  		this.source.loop = loop;
  	}
  
  	/**
  	 * Set loop start and end
  	 * @param {number} loopStart Start of the loop in seconds.
  	 * @param {number} loopEnd End of the loop in seconds.
  	 */
  	channel.setLoopPoints = function (loopStart, loopEnd) {
  		this.loopStart = loopStart;
  		this.loopEnd = loopEnd;
  		if (!this.source) {
  			return;
  		}
  
  		if (this.source.loopStart !== loopStart) {
  			this.source.loopStart = loopStart;
  		}
  
  		if (this.source.loopEnd !== loopEnd) {
  			this.source.loopEnd = loopEnd;
  		}
  	}
  
  	/**
  	 * Set channel 3D mode
  	 * @param {number} spatialBlendLevel Dry/wet mix for spatial panning
  	 */
  	channel.set3D = function (spatialBlendLevel) {
  		if (this.spatialBlendLevel != spatialBlendLevel) {
  			this.setSpatialBlendLevel(spatialBlendLevel);
  		}
  	}
  
  	/**
  	 * Set the pitch of the channel
  	 * @param {number} pitch Pitch of the channel
  	 */
  	channel.setPitch = function (pitch) {
  		this.pitch = pitch;
  
  		// Only update pitch if source is initialized
  		if (!this.source) {
  			return;
  		}
  
  		this.source.setPitch(pitch);
  	}
  
  	/**
  	 * Set volume of channel
  	 * @param {number} volume Volume of channel
  	 */
  	channel.setVolume = function (volume) {
  		// Work around WebKit bug https://bugs.webkit.org/show_bug.cgi?id=222098
  		// Updating volume only if it changes reduces sound distortion over time.
  		// See case 1350204, 1348348 and 1352665
  		if (this.gain.gain.value == volume) {
  			return;
  		}
  
  		this.gain.gain.value = volume;
  	}
  
  	/**
  	 * Set the 3D position of the audio channel
  	 * @param {number} x
  	 * @param {number} y
  	 * @param {number} z
  	 */
  	channel.setPosition = function (x, y, z) {
  		var p = this.panner;
  
  		// Work around Chrome performance bug https://bugs.chromium.org/p/chromium/issues/detail?id=1133233
  		// by only updating the PannerNode position if it has changed.
  		// See case 1270768.
  		if (p.positionX) {
  			// Use new properties if they exist ...
  			if (p.positionX.value !== x) p.positionX.value = x;
  			if (p.positionY.value !== y) p.positionY.value = y;
  			if (p.positionZ.value !== z) p.positionZ.value = z;
  		} else if (p._x !== x || p._y !== y || p._z !== z) {
  			// ... or the deprecated set function if they don't (and shadow cache the set values to avoid re-setting later)
  			p.setPosition(x, y, z);
  			p._x = x;
  			p._y = y;
  			p._z = z;
  		}
  	}
  
  	/**
  	 * Disconnect source node from graph
  	 */
  	channel.disconnectSource = function () {
  		if (!this.source || this.source.isPausedMockNode) {
  			return;
  		}
  
  		if (this.source.mediaElement) {
  			// Pause playback of media element
  			this.source._pauseMediaElement();
  		}
  
  		this.source.onended = null;
  		this.source.disconnect();
  		this.source.release();
  		this.soundClip = null;
  		this.source = null;
  	};
  
  	/**
  	 * Updates the spatial blend of the channel, reconfigures audio nodes if necessary
  	 */
  	channel.setSpatialBlendLevel = function (spatialBlendLevel) {
  
  		var sourceCanBeConfigured = this.source && !this.source.isPausedMockNode;
  		var spatializationTypeChanged = (this.spatialBlendLevel > 0 && spatialBlendLevel == 0) || (this.spatialBlendLevel == 0 && spatialBlendLevel > 0);
  		var needToReconfigureNodes = sourceCanBeConfigured && spatializationTypeChanged;
  
  		this.spatialBlendWetGain.gain.value = spatialBlendLevel;
  		this.spatialBlendDryGain.gain.value = 1 - spatialBlendLevel;
  		this.spatialBlendLevel = spatialBlendLevel;
  
  		if (needToReconfigureNodes)
  			this.configurePanningNodes();
  	}
  
  	/**
  	 * Configure audio panning options either for 3D or 2D.
  	 */
  	channel.configurePanningNodes = function() {
  
  		if (!this.source)
  			return;
  
  		this.source.disconnect();
  		this.spatialBlendDryGain.disconnect();
  		this.spatialBlendWetGain.disconnect();
  		this.panner.disconnect();
  		this.gain.disconnect();
  
  		if (this.spatialBlendLevel > 0) {
  			// In 3D: SourceNode -> DryGainNode --------------> GainNode -> AudioContext.destination
  			//                    ↘ WetGainNode -> PannerNode ↗
  
  			// Dry path
  			this.source.connect(this.spatialBlendDryGain);
  			this.spatialBlendDryGain.connect(this.gain);
  
  			// Spatialized path
  			this.source.connect(this.spatialBlendWetGain);
  			this.spatialBlendWetGain.connect(this.panner);
  			this.panner.connect(this.gain);
  
  		} else {
  			// In 2D: SourceNode -> GainNode -> AudioContext.destination
  			this.source.connect(this.gain);
  		}
  		this.gain.connect(WEBAudio.audioContext.destination);
  	}
  
  	/**
  	 * Returns wether playback on a channel is stopped.
  	 * @returns {boolean} Returns true if playback on channel is stopped.
  	 */
  	 channel.isStopped = function () {
  		if (!this.source) {
  			// Uncompressed audio
  			// No playback source -> channel is stopped
  			return true;
  		}
  
  		if (this.source.mediaElement) {
  			// Compressed audio
  			return this.source.isStopped;
  		}
  
  		return false;
  	}
  
  	return channel;
  }
  
  function _JS_Sound_Create_Channel(callback, userData)
  {
  	if (WEBAudio.audioWebEnabled == 0)
  		return;
  
  	WEBAudio.audioInstances[++WEBAudio.audioInstanceIdCounter] = jsAudioCreateChannel(callback, userData);
  	return WEBAudio.audioInstanceIdCounter;
  }

  
  var Microphone_Access = 0;
  
  var Microphones = [];
  
  
  var MediaAccessState = {
  Unknown:0,
  Granted:1,
  Denied:2,
  };
  function Microphone_GetMediaStream(id, channels, sampleRate) {
          if (Microphone_Access != MediaAccessState.Granted)
              return Promise.reject("No access rights to microphone.");
  
          const microphone = Microphones[id];
          if (!microphone)
              return Promise.reject(`Invalid id: ${id}`);
  
          return navigator.mediaDevices.getUserMedia({
              audio: {
                  deviceId: { exact: microphone.deviceId },
                  // Try to request the desired channel count and sample rate to avoid resampling.
                  channelCount: {
                      ideal: channels
                  },
                  sampleRate: {
                      ideal: sampleRate
                  }
              },
              video: false,
          }).then(function (stream) {
              const tracks = stream.getAudioTracks();
              tracks.forEach(function (track) {
                  track.enabled = true;
              });
  
              return stream;
          }).catch(function (err) {
              console.error(`Error accessing microphone: ${err}`)
              return err;
          });
      }
  
  function Microphone_CopyAudioBuffer(sourceBuffer, destinationBuffer, trimStart) {
          const sampleCount = Math.min(sourceBuffer.length, destinationBuffer.length);
          const startOffset = Math.max(0, sourceBuffer.length - sampleCount);
          if (sourceBuffer.numberOfChannels === destinationBuffer.numberOfChannels) {
              // Same number of channels, copy each channel
              for (let channel = 0; channel < sourceBuffer.numberOfChannels; ++channel) {
                  const sourceData = trimStart
                      ? sourceBuffer.getChannelData(channel).subarray(startOffset, startOffset + sampleCount)
                      : sourceBuffer.getChannelData(channel).subarray(0, sampleCount);
                  const destinationData = destinationBuffer.getChannelData(channel);
                  destinationData.set(sourceData);
              }
          } else if (sourceBuffer.numberOfChannels >= 1) {
              // Just copy first channel of source to all channels of destination
              const sourceData = trimStart
                      ? sourceBuffer.getChannelData(0).subarray(startOffset, startOffset + sampleCount)
                      : sourceBuffer.getChannelData(0).subarray(0, sampleCount);
              for (let channel = 0; channel < destinationBuffer.numberOfChannels; ++channel) {
                  const destinationData = destinationBuffer.getChannelData(channel);
                  destinationData.set(sourceData);
              }
          } else {
              throw new Error("Failed to copy audio data: source buffer does not contain data.");
          }
      }
  function Microphone_DecompressAudioBuffer(compressedBuffer, destinationBuffer, trimStart) {
          // Create a an offline audio context to perform the automatic resampling
          const offlineContext = new OfflineAudioContext(
              destinationBuffer.numberOfChannels,
              destinationBuffer.length,
              destinationBuffer.sampleRate
          );
  
          // Decode audio data automatically resamples to the sample rate of the offline context
          return offlineContext.decodeAudioData(compressedBuffer).then(function (decodedBuffer) {
              if (decodedBuffer.sampleRate !== destinationBuffer.sampleRate)
                  throw new Error("Resampling failed.");
  
              Microphone_CopyAudioBuffer(decodedBuffer, destinationBuffer, trimStart);
          });
      }
  
  function Microphone_CreateSoundClipForRecording(channels, length, sampleRate) {
          const soundClip = {
              deviceId: null,
              recordBuffer: WEBAudio.audioContext.createBuffer(channels, length, sampleRate),
              loopRecording: false,
              mediaStream: null,
              mediaRecorder: null,
              recordStartTime: 0,
              isRecording: false,
              isDecompressed: false,
              chunks: [],
              sourceNodes: []
          };
  
          soundClip.recordStart = function (deviceId, loopRecording) {
              if (Microphone_Access != MediaAccessState.Granted) {
                  console.warn("Can't create SoundClip from microphone because access is blocked by user.");
                  return;
              }
              soundClip.deviceId = deviceId;
              soundClip.loopRecording = loopRecording;
  
              // Get media stream for the microphone device async
              return Microphone_GetMediaStream(deviceId, soundClip.recordBuffer.numberOfChannels, soundClip.recordBuffer.sampleRate).then(function(stream) {
                  soundClip.mediaStream = stream;
                  soundClip.chunks = [];
                  const mediaRecorder = new MediaRecorder(stream);
                  const maxChunks = Math.ceil(soundClip.recordBuffer.length / (sampleRate * 0.1)) + 1; // 100 ms chunks + 1 extra to account for header data
                  mediaRecorder.ondataavailable = function (event) {
                      if (soundClip.loopRecording && soundClip.chunks.length >= maxChunks) {
                          // When looping is enabled only keep maxChunks
                          // Remove second oldest entry. First chunk may contain header data
                          soundClip.chunks.splice(1, 1);
                      }
                      const recordedDuration = WEBAudio.audioContext.currentTime - soundClip.recordStartTime;
                      if (!soundClip.loopRecording && recordedDuration >= soundClip.recordBuffer.duration) {
                          // If looping is disabled and we recorded enough data, stop recording
                          soundClip.recordStop();
                      }
  
                      // Add chunk to list
                      soundClip.chunks.push(event.data);
                  };
                  mediaRecorder.onstop = function () {
                      // Convert chunks to a single blob
                      const recordedBlob = new Blob(soundClip.chunks, { mimeType: mediaRecorder.mimeType });
                      soundClip.chunks = [];
                      soundClip.isDecompressed = false;
  
                      recordedBlob.arrayBuffer().then(function(compressedBuffer) {
                          // Skip decompression if sound clip was released before decompression finished
                          if (soundClip.recordBuffer === null)
                              return;
  
                          return Microphone_DecompressAudioBuffer(compressedBuffer, soundClip.recordBuffer, soundClip.loopRecording);
                      }).then(function() {
                          if (soundClip.recordBuffer === null) {
                              // Sound clip was released before decompression finished
                              soundClip.error = true;
                              return;
                          }
  
                          soundClip.isDecompressed = true;
                          soundClip.sourceNodes.forEach(function (source) {
                              source.onSoundDataAvailable();
                          });
                      }).catch(function(error) {
                          soundClip.error = true;
                          console.error(`Decompressing recorded audio failed: ${error}`);
                      });
                  };
                  soundClip.mediaRecorder = mediaRecorder;
  
                  soundClip.mediaRecorder.start(100); // Record in 100 ms chunks to allow looping of record buffer
                  soundClip.recordStartTime = WEBAudio.audioContext.currentTime;
                  soundClip.isRecording = true;
  
                  // Update all audio source nodes to use the new media stream
                  soundClip.sourceNodes.forEach(function (source) {
                      source.resetAudioSource();
                  });
              });
          };
  
          soundClip.recordStop = function () {
              if (!soundClip.isRecording) {
                  return;
              }
              // Old content needs to be replaced by new decompressed data
              // before clip can be played again
              soundClip.isDecompressed = false;
  
              // Stop media recorder and reset clip
              soundClip.mediaRecorder.stop();
              soundClip.mediaRecorder = null;
              soundClip.deviceId = null;
              soundClip.mediaStream = null;
              soundClip.isRecording = false;
  
              // Update all audio source nodes to use the buffer source
              soundClip.sourceNodes.forEach(function (source) {
                  source.resetAudioSource();
              });
          };
  
          /**
           * Get current recording position in number of samples.
           * If the sound clip is not recording, 0 is returned.
           * If looping is enabled, the position wraps around when it reaches the end of the record buffer.
           * @returns {number}
           */
          soundClip.getRecordPosition = function () {
              if (!soundClip.isRecording)
                  return 0;
  
              const recordedDuration = WEBAudio.audioContext.currentTime - soundClip.recordStartTime;
              let recordPosition = Math.floor(recordedDuration * soundClip.recordBuffer.sampleRate);
              if (soundClip.loopRecording)
                  recordPosition = recordPosition % soundClip.recordBuffer.length;
              else
                  recordPosition = Math.min(recordPosition, soundClip.recordBuffer.length);
  
              return recordPosition;
          }
  
          /**
           * Release resources of a sound clip
           */
          soundClip.release = function () {
              soundClip.recordStop();
              soundClip.recordBuffer = null;
          };
  
          /**
           * Get length of sound clip in number of samples
           * @returns {number}
           */
          soundClip.getLength = function () {
              return soundClip.recordBuffer.length;
          };
  
          /**
           * Gets uncompressed audio data from sound clip.
           * If output buffer is smaller than the sound data only the first portion
           * of the sound data is read.
           * If the sound clip is currently recording, no data will be returned.
           * Sound clips with multiple channels will be stored one after the other.
           *
           * @param {number} ptr Pointer to the output buffer
           * @param {number} length Size of output buffer in bytes
           * @returns Size of data in bytes written to output buffer
           */
          soundClip.getData = function (ptr, length) {
              if (soundClip.isRecording) {
                  console.warn("Can't get data from microphone sound clip while recording is in progress.");
                  return 0;
              }
  
              if (!soundClip.isDecompressed) {
                  console.warn("Can't get data from microphone sound clip because data is not yet decompressed.");
                  return 0;
              }
  
              // Get output buffer
              const startOutputBuffer = (ptr >> 2);
              const bufferLength = length >> 2;
              const output = HEAPF32.subarray(startOutputBuffer, startOutputBuffer + bufferLength);
              const numMaxSamples = Math.floor(bufferLength / this.recordBuffer.numberOfChannels);
              const numReadSamples = Math.min(this.recordBuffer.length, numMaxSamples);
  
              // Copy audio data to outputbuffer
              for (let i = 0; i < this.recordBuffer.numberOfChannels; i++) {
                  const channelData = this.recordBuffer.getChannelData(i).subarray(0, numReadSamples);
                  output.set(channelData, i * numReadSamples);
              }
  
              return numReadSamples * this.recordBuffer.numberOfChannels * 4;
          };
  
          /**
           * Gets number of channels of soundclip
           * @returns {number}
           */
          soundClip.getNumberOfChannels = function () {
              return soundClip.recordBuffer.numberOfChannels;
          };
  
          /**
           * Gets sampling rate in Hz
           * @returns {number}
           */
          soundClip.getFrequency = function () {
              return soundClip.recordBuffer.sampleRate;
          };
  
          /**
           * Create an audio source node
           * @returns {MediaStreamTrackAudioSourceNode}
           */
          soundClip.createSourceNode = function () {
              // Create a GainNode to be used as a "MicrophoneSource" and implement
              // an interface similar to other audio source nodes of the Web Audio API.
              // The actually used audio source node will be changed depending on if
              // the sound clip is recording or not.
              const microphoneSource = WEBAudio.audioContext.createGain();
              soundClip.sourceNodes.push(microphoneSource);
              microphoneSource.audioDataSourceNode = null;
              microphoneSource._loop = false;
              microphoneSource._loopStart = 0;
              microphoneSource._loopEnd = soundClip.recordBuffer.duration;
              microphoneSource._paused = false;
              microphoneSource._muted = false;
              microphoneSource._playbackRate = 1.0;
              microphoneSource._onended = undefined;
              microphoneSource._startTimeout = null;
              microphoneSource._stopTimeout = null;
              microphoneSource._autoStopTimeout = null;
              microphoneSource.startTime = undefined;
  
              microphoneSource.resetAudioSource = function () {
                  if (microphoneSource.audioDataSourceNode){
                      // Disconnect old source node and remove callback
                      microphoneSource.audioDataSourceNode.onended = null;
                      microphoneSource.audioDataSourceNode.disconnect();
                      microphoneSource.audioDataSourceNode = null;
                  }
  
                  if (soundClip.isRecording) {
                      const mediaStreamSource = WEBAudio.audioContext.createMediaStreamSource(soundClip.mediaStream);
                      mediaStreamSource.connect(microphoneSource);
                      microphoneSource.audioDataSourceNode = mediaStreamSource;
                  } else {
                      const bufferSource = WEBAudio.audioContext.createBufferSource();
                      bufferSource.buffer = soundClip.recordBuffer;
                      bufferSource.loop = microphoneSource._loop;
                      bufferSource.loopStart = microphoneSource._loopStart;
                      bufferSource.loopEnd = microphoneSource._loopEnd;
                      if (typeof microphoneSource._onended === 'function')
                          bufferSource.onended = microphoneSource._onended;
                      bufferSource.playbackRate.value = microphoneSource._playbackRate;
                      bufferSource.connect(microphoneSource);
                      microphoneSource.audioDataSourceNode = bufferSource;
                  }
              }
              microphoneSource.resetAudioSource();
  
              // Callback when decoded data is available
              microphoneSource.onSoundDataAvailable = function () {
                  // If sound was still playing when it switched from MediaStreamSource to BufferSource
                  // We need to start play back from buffer source
                  if (
                      typeof microphoneSource.startTime !== "undefined" &&
                      !microphoneSource.isPaused() &&
                      microphoneSource.loop &&
                      !microphoneSource.audioDataSourceNode.isStarted
                  ) {
                      microphoneSource.audioDataSourceNode.start(microphoneSource.startTime);
                      microphoneSource.audioDataSourceNode.isStarted = true;
                      return;
                  }
  
                  // If sound was still playing but not looping
                  // Stop playback
                  if (
                      typeof microphoneSource.startTime !== "undefined" &&
                      !microphoneSource.loop
                  ) {
                      microphoneSource.startTime = undefined;
                  }
              };
  
              // Cleanup source node when it is disconnected
              microphoneSource.release = function () {
                  const index = soundClip.sourceNodes.indexOf(microphoneSource);
                  if (index >= 0)
                      soundClip.sourceNodes.splice(index, 1);
              };
  
              // Mock some properties
              Object.defineProperty(microphoneSource, "loop", {
                  get: function () {
                      return microphoneSource._loop;
                  },
                  set: function (v) {
                      microphoneSource._loop = v;
  
                      if (!soundClip.isRecording)
                          microphoneSource.audioDataSourceNode.loop = v;
                  }
              });
              Object.defineProperty(microphoneSource, "loopStart", {
                  get: function () {
                      return microphoneSource._loopStart;
                  },
                  set: function (v) {
                      microphoneSource._loopStart = v;
  
                      if (!soundClip.isRecording)
                          microphoneSource.audioDataSourceNode.loopStart = v;
                  }
              });
              Object.defineProperty(microphoneSource, "loopEnd", {
                  get: function () {
                      return microphoneSource._loopEnd;
                  },
                  set: function (v) {
                      microphoneSource._loopEnd = v;
  
                      if (!soundClip.isRecording)
                          microphoneSource.audioDataSourceNode.loopEnd = v;
                  }
              });
              Object.defineProperty(microphoneSource, "mute", {
                  get: function () {
                      return microphoneSource.gain.value === 0;
                  },
                  set: function (v) {
                      microphoneSource.gain.value = v ? 0 : 1;
                  }
              });
  
              microphoneSource.playbackRate = {};
              Object.defineProperty(microphoneSource.playbackRate, "value", {
                  get: function () {
                      if (soundClip.isRecording)
                          return 1.0;
  
                      return microphoneSource.audioDataSourceNode.playbackRate.value;
                  },
                  set: function (v) {
                      microphoneSource._playbackRate = v;
                      if (!soundClip.isRecording &&
                          microphoneSource.audioDataSourceNode.playbackRate.value !== v
                      )
                          microphoneSource.audioDataSourceNode.playbackRate.value = v;
                  }
              });
  
              microphoneSource.estimatePlaybackPosition = function () {
                  if (typeof microphoneSource.startTime === "undefined")
                      return 0;
  
                  // Sound is played back live during recording
                  // report record position.
                  if (soundClip.isRecording)
                      return soundClip.getRecordPosition() / soundClip.getFrequency();
  
                  // Sound is played from buffer
                  const t = ((WEBAudio.audioContext.currentTime - microphoneSource.startTime) * microphoneSource.playbackRate.value) % soundClip.recordBuffer.duration;
                  return t;
              };
  
              microphoneSource.setPitch = function (newPitch) {
                  if (microphoneSource.playbackRate.value !== newPitch)
                      microphoneSource.playbackRate.value = newPitch;
              }
  
              Object.defineProperty(microphoneSource, "currentTime", {
                  get: function () {
                      return microphoneSource.estimatePlaybackPosition();
                  },
                  set: function (v) {
                      // Can't change current time of a live stream
                  }
              });
  
              Object.defineProperty(microphoneSource, "onended", {
                  get: function () {
                      return microphoneSource._onended;
                  },
                  set: function (onended) {
                      microphoneSource._onended = onended;
                      if (!soundClip.isRecording)
                          microphoneSource.audioDataSourceNode.onended = onended;
                  }
              });
  
              microphoneSource.isPaused = () => microphoneSource._paused;
  
              microphoneSource.pause = function () {
                  if (microphoneSource._paused)
                      return;
  
                  // Live stream from microphone can't be paused
                  // so we just mute the output instead.
                  microphoneSource._paused = true;
                  microphoneSource.mute = true;
  
                  if (!soundClip.isRecording) {
                      // Stop the source but keep track of playback position
                      microphoneSource.playbackPausedAtPosition = microphoneSource.estimatePlaybackPosition();
                      microphoneSource.scheduledStartTime = microphoneSource.startTime;
                      microphoneSource.stop();
                      microphoneSource.audioDataSourceNode.disconnect();
                  }
              };
  
              microphoneSource.resume = function (offset) {
                  if (!microphoneSource._paused)
                      return;
  
                  // Live stream from microphone can't be paused
                  // so we just unmute the output instead.
                  microphoneSource._paused = false;
                  microphoneSource.mute = false;
  
                  if (!soundClip.isRecording) {
                      // Recreate buffer source as it can't be reused after stop()
                      microphoneSource.resetAudioSource();
                      // Restart playback from paused position
                      // If playback start time is still scheduled in the future start later
                      // otherwise immediatly.
                      const startTime = (microphoneSource.scheduledStartTime > WEBAudio.audioContext.currentTime)
                          ? microphoneSource.scheduledStartTime
                          : WEBAudio.audioContext.currentTime;
                      // If an offset is passed in use it.
                      const resumeOffset = (offset == 0)
                          ? microphoneSource.playbackPausedAtPosition
                          : offset;
                      microphoneSource.start(startTime, resumeOffset);
                      microphoneSource.playbackPausedAtPosition = undefined;
                      microphoneSource.scheduledStartTime = undefined;
                  }
              }
  
              microphoneSource.addAutoStop = function (startTime, duration) {
                  const stopTime = startTime + duration;
                  const stopDelayMS = (stopTime - WEBAudio.audioContext.currentTime) * 1000;
  
                  // Simulate stop after end of record buffer is reached similar
                  // to playback from recorded buffer
                  microphoneSource._autoStopTimeout = setTimeout(function () {
                      microphoneSource._autoStopTimeout = null;
                      if (!microphoneSource.loop) {
                          // If source is not looping stop it immediatly and trigger onended
                          microphoneSource.stop();
                          if (typeof microphoneSource.onended === 'function')
                              microphoneSource.onended();
                      } else if (!soundClip.isRecording) {
                          // The sound is looping don't stop it now.
                          // But loop setting may be changed during loop, retrigger timeout
                          // to recheck after next iteration.
                          microphoneSource.addAutoStop(WEBAudio.audioContext.currentTime, duration);
                      }
                  }, stopDelayMS);
              };
  
              microphoneSource.removeAutoStop = function () {
                  if (!microphoneSource._autoStopTimeout)
                      return;
                  clearTimeout(microphoneSource._autoStopTimeout);
                  microphoneSource._autoStopTimeout = null;
              };
  
              microphoneSource.start = function (startTime, offset) {
                  // Keep track of playback time
                  microphoneSource.startTime = (typeof startTime === "undefined")
                      ? WEBAudio.audioContext.currentTime
                      : startTime;
  
                  if (soundClip.isRecording) {
                      // Simulate delayed playback
                      const startDelayThresholdMS = 4;
                      const startDelayMS = (startTime - WEBAudio.audioContext.currentTime) * 1000;
                      if (startDelayMS > startDelayThresholdMS) {
                          // Use timeout to start at scheduled time
                          microphoneSource._startTimeout = setTimeout(function () {
                              // Unmute live stream to start playback
                              microphoneSource.mute = false;
                          }, startDelayThresholdMS);
                      } else {
                          // Unmute live stream to start playback
                          microphoneSource.mute = false;
                      }
                      microphoneSource.addAutoStop(microphoneSource.startTime, soundClip.recordBuffer.duration);
                  } else {
                      // Playing back from recorded buffer
                      if (!microphoneSource.audioDataSourceNode.isStarted)
                          microphoneSource.audioDataSourceNode.start(startTime, offset);
                      microphoneSource.audioDataSourceNode.isStarted = true;
                  }
              };
  
              microphoneSource.stop = function (stopTime) {
                  microphoneSource.startTime = undefined;
                  microphoneSource.removeAutoStop();
                  if (soundClip.isRecording) {
                      const stopDelayThresholdMS = 4;
                      const stopDelayMS = (stopTime - WEBAudio.audioContext.currentTime) * 1000;
                      if (stopDelayMS > stopDelayThresholdMS) {
                          // Use timeout to stop at scheduled time
                          microphoneSource._stopTimeout = setTimeout(function () {
                              // Mute live stream to immediatly stop playback
                              microphoneSource.mute = true;
                          }, stopDelayThresholdMS);
                      } else {
                          // Mute live stream to immediatly stop playback
                          microphoneSource.mute = true;
                      }
                  } else {
                      // Stop plack from recorded buffer
                      if (microphoneSource.audioDataSourceNode.isStarted)
                          microphoneSource.audioDataSourceNode.stop(stopTime);
                  }
              };
  
              return microphoneSource;
          }
  
          return soundClip;
      }
  
  function _JS_Sound_Create_With_Buffer(channels, length, sampleRate) {
  	if (WEBAudio.audioWebEnabled == 0)
  		return 0;
  
  	var sound = Microphone_CreateSoundClipForRecording(channels, length, sampleRate);
  
  	WEBAudio.audioInstances[++WEBAudio.audioInstanceIdCounter] = sound;
  
  	return WEBAudio.audioInstanceIdCounter;
  }

  function _JS_Sound_GetAudioBufferSampleRate(soundInstance)
  {
  	if (WEBAudio.audioWebEnabled == 0)
  		return WEBAudio.FAKEMOD_SAMPLERATE;
  
  	var audioInstance = WEBAudio.audioInstances[soundInstance];
  	if (!audioInstance)
  		return WEBAudio.FAKEMOD_SAMPLERATE;
  
  	// Check if audioInstance is a SoundClip
  	if (typeof audioInstance.getFrequency === 'function')
  		return audioInstance.getFrequency();
  
  	// Check if audioInstance is a Channel currently playing a SoundClip
  	if (audioInstance.soundClip)
  	{
  		return audioInstance.soundClip.getFrequency();
  	}
  
  	// Return fake sample rate by default
  	return WEBAudio.FAKEMOD_SAMPLERATE;
  }


  function _JS_Sound_GetData(bufferInstance, ptr, length)
  {
  	if (WEBAudio.audioWebEnabled == 0)
  		return 0;
  
  	var soundClip = WEBAudio.audioInstances[bufferInstance];
  
  	if (!soundClip)
  		return 0;
  
  	return soundClip.getData(ptr, length);
  }

  function _JS_Sound_GetLength(bufferInstance)
  {
  	if (WEBAudio.audioWebEnabled == 0)
  		return 0;
  
  	var soundClip = WEBAudio.audioInstances[bufferInstance];
  
  	if (!soundClip)
  		return 0;
  
  	return soundClip.getLength();
  }

  function _JS_Sound_GetLoadState(bufferInstance)
  {
  	if (WEBAudio.audioWebEnabled == 0)
  		return 2;
  
  	var sound = WEBAudio.audioInstances[bufferInstance];
  	if (sound.error)
  		return 2;
  	if (sound.buffer || sound.url || sound.mediaStream || sound.isDecompressed)
  		return 0;
  	return 1;
  }

  function _JS_Sound_GetMetaData(bufferInstance, metaData)
  {
  	metaData = (metaData >> 2);
  	if (WEBAudio.audioWebEnabled == 0)
  	{
  		HEAPU32[metaData] = 0;
  		HEAPU32[metaData + 1] = 0;
  		return false;
  	}
  
  	var soundClip = WEBAudio.audioInstances[bufferInstance];
  
  	if (!soundClip)
  	{
  
  		HEAPU32[metaData] = 0;
  		HEAPU32[metaData + 1] = 0;
  		return false;
  	}
  
  	HEAPU32[metaData] = soundClip.getNumberOfChannels();
  	HEAPU32[metaData + 1] = soundClip.getFrequency();
  
  	return true;
  }

  
  function _JS_Sound_GetPosition(channelInstance)
  {
  	if (WEBAudio.audioWebEnabled == 0)
  		return 0;
  
  	var channel = WEBAudio.audioInstances[channelInstance];
  	if (!channel)
  		return 0;
  
  	var source = channel.source;
  	if (!source)
  		return 0;
  
  	return source.estimatePlaybackPosition ? source.estimatePlaybackPosition() : 0;
  }

  var _JS_Sound_Init = function () {
  
  	try {
  		window.AudioContext = window.AudioContext || window.webkitAudioContext;
  		WEBAudio.audioContext = new AudioContext();
  		WEBAudio.audioContextSuspendedTime = _GetFakemodTimeInSeconds();
  		WEBAudio.audioContextResumeOffset = 0;
  
  		WEBAudio.audioContext.onstatechange = () => {
  			var contextState = WEBAudio.audioContext.state;
  
  			if (contextState === 'running') {
  
  				WEBAudio.contextIsRunning = true;
  				var currentTime = _GetFakemodTimeInSeconds();
  				WEBAudio.audioContextResumeOffset = currentTime - WEBAudio.audioContextSuspendedTime;
  				console.log('Audio context resumed after ' + WEBAudio.audioContextResumeOffset.toFixed(3) + ' seconds.');
  
  				var sound = WEBAudio.soundsPendingContextResume.pop();
  				while (sound !== undefined) {
  
  					// Sound was paused
  					var stopChannel = sound.stopDelay >= 0.0;
  					if (sound.channel.source) {
  						sound.stopDelay -= WEBAudio.audioContextResumeOffset;
  						if (sound.stopDelay <= 0.0)
  							sound.stopDelay = 0.0;
  
  						var resumeChannel = !stopChannel || (sound.stopDelay > 0.0);
  						if (resumeChannel)
  							sound.channel.resume(WEBAudio.audioContextResumeOffset);
  
  						if (stopChannel)
  							sound.channel.stop(sound.stopDelay);
  
  					// Sound was not started yet
  					} else {
  						var resumeOffset = 0;
  						if (currentTime > sound.startTime)
  							resumeOffset = currentTime - sound.startTime;
  
  						sound.stopDelay -= resumeOffset;
  						if (sound.stopDelay <= 0.0)
  							sound.stopDelay = 0.0;
  
  						var playSoundClip = !stopChannel || (sound.stopDelay > 0.0);
  						if (playSoundClip) {
  							sound.channel.playSoundClip(sound.clip, sound.startTime, sound.offset + resumeOffset);
  
  							if (stopChannel)
  								sound.channel.stop(sound.stopDelay);
  						}
  					}
  
  					sound = WEBAudio.soundsPendingContextResume.pop();
  				}
  
  			} else {
  
  				WEBAudio.contextIsRunning = false;
  				console.log('Audio context suspended.');
  				WEBAudio.audioContextSuspendedTime = _GetFakemodTimeInSeconds();
  
  				Object.values(WEBAudio.audioInstances).forEach(audioInstance => {
  					if (audioInstance.source != null)
  					{
  						if (!audioInstance.isPaused()) {
  							audioInstance.pause();
  
  							WEBAudio.soundsPendingContextResume.push({
  							channel: audioInstance,
  							clip: null,
  							startTime: null,
  							stopDelay: -1.0,
  							offset: audioInstance.source.playbackPausedAtPosition,
  						});
  						}
  					}
  				});
  			}
  		}
  
  		var tryToResumeAudioContext = function () {
  			if (WEBAudio.audioContext.state === 'suspended')
  				WEBAudio.audioContext.resume().catch(function (error) {
  					console.warn("Could not resume audio context. Exception: " + error);
  				});
  			else
  				Module.clearInterval(resumeInterval);
  		};
  		var resumeInterval = Module.setInterval(tryToResumeAudioContext, 400);
  
  		WEBAudio.audioWebEnabled = 1;
  
  		// Safari has the restriction where Audio elements need to be created from a direct user event,
  		// even if the rest of the audio playback requirements is that a user event has happeend
  		// at some point previously. The AudioContext also needs to be resumed, if paused, from a
  		// direct user event. Catch user events here and use them to fill a cache of Audio
  		// elements to be used by the rest of the system.
  		var _userEventCallback = function () {
  			try {
  				// On Safari, resuming the audio context needs to happen from a user event.
  				// The AudioContext is suspended by default, and on iOS if the user switches tabs
  				// and comes back, it will be interrupted. Touching the page will resume audio
  				// playback.
  				if (WEBAudio.audioContext.state !== "running" && WEBAudio.audioContext.state !== "closed") {
  					WEBAudio.audioContext.resume().catch(function (error) {
  						console.warn("Could not resume audio context. Exception: " + error);
  					});
  				}
  
  				// How many audio elements should we cache? How many compressed audio channels might
  				// be played at a single time?
  				var audioCacheSize = 20;
  				while (WEBAudio.audioCache.length < audioCacheSize) {
  					var audio = new Audio();
  					audio.autoplay = false;
  					WEBAudio.audioCache.push(audio);
  				}
  			} catch (e) {
  				// Audio error, but don't need to notify here, they would have already been
  				// informed of audio errors.
  			}
  		};
  		window.addEventListener("mousedown", _userEventCallback);
  		window.addEventListener("touchstart", _userEventCallback);
  
  		// Make sure we release the event listeners when the app quits to avoid leaking memory.
  		Module.deinitializers.push(function () {
  			window.removeEventListener("mousedown", _userEventCallback);
  			window.removeEventListener("touchstart", _userEventCallback);
  		});
  	}
  	catch (e) {
  		alert('Web Audio API is not supported in this browser');
  	}
  };

  
  function jsAudioCreateUncompressedSoundClipFromCompressedAudio(audioData) {
  	var soundClip = jsAudioCreateUncompressedSoundClip(null, false);
  
  	WEBAudio.audioContext.decodeAudioData(
  		audioData,
  		function (_buffer) {
  			soundClip.buffer = _buffer;
  		},
  		function (_error) {
  			soundClip.error = true;
  			console.log("Decode error: " + _error);
  		}
  	);
  
  	return soundClip;
  }
  
  
  
  function jsAudioGetMimeTypeFromType(fmodSoundType) {
  	switch(fmodSoundType)
  	{
  		case 13: // FMOD_SOUND_TYPE_MPEG
  			return "audio/mpeg";
  		case 20: // FMOD_SOUND_TYPE_WAV
  			return "audio/wav";
  		default: // Fallback to mp4 audio file for other types or if not set (works on most browsers)
  			return "audio/mp4";
  	}
  }
  
  function jsAudioCreateCompressedSoundClip(audioData, fmodSoundType) {
  	var mimeType = jsAudioGetMimeTypeFromType(fmodSoundType);
  	var blob = new Blob([audioData], { type: mimeType });
  
  	var soundClip = {
  		url: URL.createObjectURL(blob),
  		error: false,
  		mediaElement: new Audio()
  	};
  
  	// An Audio element is created for the buffer so that we can access properties like duration
  	// in JS_Sound_GetLength, which knows about the buffer object, but not the channel object.
  	// This Audio element is used for metadata properties only, not for playback. Trying to play
  	// back this Audio element would cause an error on Safari because it's not created in a
  	// direct user event handler.
  	soundClip.mediaElement.preload = "metadata";
  	soundClip.mediaElement.src = soundClip.url;
  
  	/**
  	 * Release resources of a sound clip
  	 */
  	soundClip.release = function () {
  		if (!this.mediaElement) {
  			return;
  		}
  
  		this.mediaElement.src = "";
  		URL.revokeObjectURL(this.url);
  		delete this.mediaElement;
  		delete this.url;
  	}
  
  	/**
  	 * Get length of sound clip in number of samples
  	 * @returns {number}
  	 */
  	soundClip.getLength = function () {
  		var duration = this.mediaElement.duration
  
  		// Length gets converted to int32 or int64
  		// Make sure it's a valid integer to avoid NaN to BigInt conversion errors.
  		if (!isFinite(duration))
  			return 0;
  
  		// Convert duration (seconds) to number of samples. (Duration * Sample Rate)
  		return Math.round(duration * _JS_Sound_GetAudioContextSampleRate());
  	}
  	/**
  	 * Gets uncompressed audio data from sound clip.
  	 * If output buffer is smaller than the sound data only the first portion
  	 * of the sound data is read.
  	 * Sound clips with multiple channels will be stored one after the other.
  	 *
  	 * @param {number} ptr Pointer to the output buffer
  	 * @param {number} length Size of output buffer in bytes
  	 * @returns Size of data in bytes written to output buffer
  	 */
  	 soundClip.getData = function (ptr, length) {
  		console.warn("getData() is not supported for compressed sound.");
  
  		return 0;
  	}
  
  	/**
  	 * Gets number of channels of soundclip
  	 * @returns {number}
  	 */
  	soundClip.getNumberOfChannels = function () {
  		console.warn("getNumberOfChannels() is not supported for compressed sound.");
  
  		return 0;
  	}
  
  	/**
  	 * Gets sampling rate in Hz
  	 * @returns {number}
  	 */
  	soundClip.getFrequency = function () {
  		console.warn("getFrequency() is not supported for compressed sound.");
  
  		return _JS_Sound_GetAudioContextSampleRate();
  	}
  
  	/**
  	 * Create an audio source node
  	 * @returns {MediaElementAudioSourceNode}
  	 */
  	soundClip.createSourceNode = function () {
  		var self = this;
  		var mediaElement = WEBAudio.audioCache.length ? WEBAudio.audioCache.pop() : new Audio();
  		mediaElement.preload = "metadata";
  		mediaElement.src = this.url;
  		var source = WEBAudio.audioContext.createMediaElementSource(mediaElement);
  		source.release = function () {
  			source.mediaElement.removeAttribute('src');
  			source.mediaElement.load();
  		};
  
  		Object.defineProperty(source, "loop", {
  			get: function () {
  				return source.mediaElement.loop;
  			},
  			set: function (v) {
  				if (source.mediaElement.loop !== v) source.mediaElement.loop = v;
  			}
  		});
  
  		source.playbackRate = {};
  		Object.defineProperty(source.playbackRate, "value", {
  			get: function () {
  				return source.mediaElement.playbackRate;
  			},
  			set: function (v) {
  				if (source.mediaElement.playbackRate !== v) source.mediaElement.playbackRate = v;
  			}
  		});
  		Object.defineProperty(source, "currentTime", {
  			get: function () {
  				return source.mediaElement.currentTime;
  			},
  			set: function (v) {
  				if (source.mediaElement.currentTime !== v) source.mediaElement.currentTime = v;
  			}
  		});
  		source.estimatePlaybackPosition = function () {
  			return source.mediaElement.currentTime;
  		};
  		Object.defineProperty(source, "mute", {
  			get: function () {
  				return source.mediaElement.mute;
  			},
  			set: function (v) {
  				if (source.mediaElement.mute !== v) source.mediaElement.mute = v;
  			}
  		});
  		Object.defineProperty(source, "onended", {
  			get: function () {
  				return source.mediaElement.onended;
  			},
  			set: function (onended) {
  				source.mediaElement.onended = onended;
  			}
  		});
  
  		source.playPromise = null;
  		source.playTimeout = null;
  		source.pauseRequested = false;
  		source.isStopped = false;
  
  		source._pauseMediaElement = function () {
  			// If there is a play request still pending, then pausing now would cause an
  			// error. Instead, mark that we want the audio paused as soon as it can be,
  			// which will be when the play promise resolves.
  			if (source.playPromise || source.playTimeout) {
  				source.pauseRequested = true;
  			} else {
  				// If there is no play request pending, we can pause immediately.
  				source.mediaElement.pause();
  			}
  		};
  
  		source._startPlayback = function (offset) {
  			if (source.playPromise || source.playTimeout) {
  				source.mediaElement.currentTime = offset;
  				source.pauseRequested = false;
  				return;
  			}
  
  			source.mediaElement.currentTime = offset;
  			source.playPromise = source.mediaElement.play();
  
  			if (source.playPromise) {
  				source.playPromise.then(function () {
  					// If a pause was requested between play() and the MediaElement actually
  					// starting, then pause it now.
  					if (source.pauseRequested) {
  						source.mediaElement.pause();
  						source.pauseRequested = false;
  					}
  					source.playPromise = null;
  				}).catch(function (error) {
  					source.playPromise = null;
  					// AbortError: media source was cleared (via release()) while a play request was still pending.
  					if (error.name !== 'NotAllowedError' && error.name !== 'AbortError')
  						throw error;
  				});
  			}
  		};
  
  		source.start = function (startTime, offset) {
  			if (typeof startTime === "undefined") {
  				startTime = WEBAudio.audioContext.currentTime;
  			}
  
  			if (typeof offset === "undefined") {
  				offset = 0.0;
  			}
  
  			// Compare startTime to WEBAudio context currentTime, and if
  			// startTime is more than about 4 msecs in the future, do a setTimeout() wait
  			// for the remaining duration, and only then play. 4 msecs boundary because
  			// setTimeout() is specced to throttle <= 4 msec waits if repeatedly called.
  			var startDelayThresholdMS = 4;
  			// Convert startTime and currentTime to milliseconds
  			var startDelayMS = (startTime - WEBAudio.audioContext.currentTime) * 1000;
  			if (startDelayMS > startDelayThresholdMS) {
  				source.playTimeout = setTimeout(function () {
  					source.playTimeout = null;
  					source._startPlayback(offset);
  				}, startDelayMS);
  			} else {
  				source._startPlayback(offset);
  			}
  		};
  
  		source.stop = function (stopTime) {
  			if (typeof stopTime === "undefined") {
  				stopTime = WEBAudio.audioContext.currentTime;
  			}
  
  			// Compare stopTime to WEBAudio context currentTime, and if
  			// stopTime is more than about 4 msecs in the future, do a setTimeout() wait
  			// for the remaining duration, and only then stop. 4 msecs boundary because
  			// setTimeout() is specced to throttle <= 4 msec waits if repeatedly called.
  			var stopDelayThresholdMS = 4;
  			// Convert startTime and currentTime to milliseconds
  			var stopDelayMS = (stopTime - WEBAudio.audioContext.currentTime) * 1000;
  
  			if (stopDelayMS > stopDelayThresholdMS) {
  				setTimeout(function () {
  					source._pauseMediaElement();
  					source.isStopped = true;
  				}, stopDelayMS);
  			} else {
  				source._pauseMediaElement();
  				source.isStopped = true;
  			}
  		};
  
  		jsAudioMixinSetPitch(source);
  
  		return source;
  	}
  
  	return soundClip;
  }
  
  function _JS_Sound_Load(ptr, length, decompress, fmodSoundType) {
  	if (WEBAudio.audioWebEnabled == 0)
  		return 0;
  
      ptr = ptr;
  	var audioData = HEAPU8.buffer.slice(ptr, ptr + length);
  
  	// We don't ever want to play back really small audio clips as compressed, the compressor has a startup CPU cost,
  	// and replaying the same audio clip multiple times (either individually or when looping) has an unwanted CPU
  	// overhead if the same data will be decompressed on demand again and again. Hence we want to play back small
  	// audio files always as fully uncompressed in memory.
  
  	// However this will be a memory usage tradeoff.
  
  	// Tests with aac audio sizes in a .m4a container shows:
  	// 2.11MB stereo 44.1kHz .m4a file containing 90 seconds of 196kbps aac audio decompresses to 30.3MB of float32 PCM data. (~14.3x size increase)
  	// 721KB stereo 44.1kHz .m4a file 29 seconds of 196kbps aac audio decompresses to 10.0MB of float32 PCM data. (~14x size increase)
  	// 6.07KB mono 44.1kHZ .m4a file containing 1 second of 101kbps aac audio decompresses to 72kB of float32 PCM data. (~11x size increase)
  	// -> overall AAC compression factor is ~10x-15x.
  
  	// Based on above, take 128KB as a cutoff size: if we have a .m4a clip that is smaller than this,
  	// we always uncompress it up front, receiving at most ~1.8MB of raw audio data, which can hold about ~10 seconds of mono audio.
  	// In other words, heuristically all audio clips <= mono ~10 seconds (5 seconds if stereo) in duration will be always fully uncompressed in memory.
  	if (length < 131072) decompress = 1;
  
  	// Chrome's AudioContext retains internal references to every MediaElementAudioSourceNode, preventing GC of the nodes and their Audio elements.
  	// On Chromium-based browsers, decode into an AudioBuffer so that createSourceNode can use AudioBufferSourceNode instead, So no leak is caused.
  	// See: https://issues.chromium.org/issues/323694454
  	if (!!window.chrome) decompress = 1;
  
  	var sound;
  	if (decompress) {
  		sound = jsAudioCreateUncompressedSoundClipFromCompressedAudio(audioData);
  	} else {
  		sound = jsAudioCreateCompressedSoundClip(audioData, fmodSoundType);
  	}
  
  	WEBAudio.audioInstances[++WEBAudio.audioInstanceIdCounter] = sound;
  
  	return WEBAudio.audioInstanceIdCounter;
  }

  
  function jsAudioCreateUncompressedSoundClipFromPCM(channels, length, sampleRate, ptr) {
  	var buffer = WEBAudio.audioContext.createBuffer(channels, length, sampleRate);
  	var idx = (ptr >> 2)
  
  	// Copy audio data to buffer
  	for (var i = 0; i < channels; i++) {
  		var offs = idx + length * i;
  		var copyToChannel = buffer['copyToChannel'] || function (source, channelNumber, startInChannel) {
  			// Shim for copyToChannel on browsers which don't support it like Safari.
  			var clipped = source.subarray(0, Math.min(source.length, this.length - (startInChannel | 0)));
  			this.getChannelData(channelNumber | 0).set(clipped, startInChannel | 0);
  		};
  		var source = HEAPF32.subarray(offs, offs + length);
  		copyToChannel.apply(buffer, [source, i, 0]);
  	}
  
  	return jsAudioCreateUncompressedSoundClip(buffer, false);
  }
  
  function _JS_Sound_Load_PCM(channels, length, sampleRate, ptr) {
  	if (WEBAudio.audioWebEnabled == 0)
  		return 0;
  
  	var sound = jsAudioCreateUncompressedSoundClipFromPCM(channels, length, sampleRate, ptr);
  
  	WEBAudio.audioInstances[++WEBAudio.audioInstanceIdCounter] = sound;
  	return WEBAudio.audioInstanceIdCounter;
  }

  function _JS_Sound_Play(bufferInstance, channelInstance, offset, delay)
  {
  	if (WEBAudio.audioWebEnabled == 0)
  		return;
  
  	// stop sound clip which is currently playing in the channel.
  	_JS_Sound_Stop(channelInstance, 0);
  
  	var soundClip = WEBAudio.audioInstances[bufferInstance];
  	var channel = WEBAudio.audioInstances[channelInstance];
  
  	if (!soundClip) {
  		console.log("Trying to play sound which is not loaded.");
  		return;
  	}
  
  	try {
  		if (WEBAudio.contextIsRunning) {
  			channel.playSoundClip(soundClip, WEBAudio.audioContext.currentTime + delay, offset);
  		} else {
  			WEBAudio.soundsPendingContextResume.push({
  				channel: channel,
  				clip: soundClip,
  				startTime: WEBAudio.audioContext.currentTime + delay,
  				stopDelay: -1.0,
  				offset: offset
  			});
  		}
  	} catch (e) {
  		console.error("playSoundClip error. Exception: " + e);
  	}
  }

  function _JS_Sound_ReleaseInstance(instance) {
  	var object = WEBAudio.audioInstances[instance];
  	if (object) {
  		object.release();
  	}
  
  	// Let the GC free up the audio object.
  	delete WEBAudio.audioInstances[instance];
  }

  function _JS_Sound_ResumeIfNeeded()
  {
  	if (WEBAudio.audioWebEnabled == 0)
  		return;
  
  	if (WEBAudio.audioContext.state === 'suspended')
  		WEBAudio.audioContext.resume().catch(function (error) {
  			console.warn("Could not resume audio context. Exception: " + error);
  		});
  
  }

  function _JS_Sound_Set3D(channelInstance, spatialBlendLevel)
  {
  	var channel = WEBAudio.audioInstances[channelInstance];
  	channel.set3D(spatialBlendLevel);
  }

  function _JS_Sound_SetListenerOrientation(x, y, z, xUp, yUp, zUp)
  {
  	if (WEBAudio.audioWebEnabled == 0)
  		return;
  
  	// Web Audio uses a RHS coordinate system, Unity uses LHS, causing orientations to be flipped.
  	// So we pass a negative direction here to compensate, otherwise channels will be flipped.
  	x = -x;
  	y = -y;
  	z = -z;
  
  	var l = WEBAudio.audioContext.listener;
  
  	// Do not re-set same values here if the orientation has not changed. This avoid unpredictable performance issues in Chrome
  	// and Safari Web Audio implementations.
  	if (l.forwardX) {
  		// Use new properties if they exist ...
  		if (l.forwardX.value !== x) l.forwardX.value = x;
  		if (l.forwardY.value !== y) l.forwardY.value = y;
  		if (l.forwardZ.value !== z) l.forwardZ.value = z;
  
  		if (l.upX.value !== xUp) l.upX.value = xUp;
  		if (l.upY.value !== yUp) l.upY.value = yUp;
  		if (l.upZ.value !== zUp) l.upZ.value = zUp;
  	} else if (l._forwardX !== x || l._forwardY !== y || l._forwardZ !== z || l._upX !== xUp || l._upY !== yUp || l._upZ !== zUp) {
  		// ... and old deprecated setOrientation if new properties are not supported.
  		l.setOrientation(x, y, z, xUp, yUp, zUp);
  		l._forwardX = x;
  		l._forwardY = y;
  		l._forwardZ = z;
  		l._upX = xUp;
  		l._upY = yUp;
  		l._upZ = zUp;
  	}
  }

  function _JS_Sound_SetListenerPosition(x, y, z)
  {
  	if (WEBAudio.audioWebEnabled == 0)
  		return;
  
  	try {
  		var l = WEBAudio.audioContext.listener;
  
  		// Do not re-set same values here if the orientation has not changed. This avoid unpredictable performance issues in Chrome
  		// and Safari Web Audio implementations.
  		if (l.positionX) {
  			// Use new properties if they exist ...
  			if (l.positionX.value !== x) l.positionX.value = x;
  			if (l.positionY.value !== y) l.positionY.value = y;
  			if (l.positionZ.value !== z) l.positionZ.value = z;
  		} else if (l._positionX !== x || l._positionY !== y || l._positionZ !== z) {
  			// ... and old deprecated setPosition if new properties are not supported.
  			l.setPosition(x, y, z);
  			l._positionX = x;
  			l._positionY = y;
  			l._positionZ = z;
  		}
  	} catch (e) {
  		console.error('JS_Sound_SetListenerPosition(x=' + x + ', y=' + y + ', z=' + z + ') threw an exception: ' + e);
  	}
  }

  function _JS_Sound_SetLoop(channelInstance, loop)
  {
  	if (WEBAudio.audioWebEnabled == 0)
  		return;
  
  	var channel = WEBAudio.audioInstances[channelInstance];
  	channel.setLoop(loop);
  }

  function _JS_Sound_SetLoopPoints(channelInstance, loopStart, loopEnd)
  {
  	if (WEBAudio.audioWebEnabled == 0)
  		return;
  	var channel = WEBAudio.audioInstances[channelInstance];
  	channel.setLoopPoints(loopStart, loopEnd);
  }

  function _JS_Sound_SetPaused(channelInstance, paused)
  {
  	if (WEBAudio.audioWebEnabled == 0)
  		return;
  	var channel = WEBAudio.audioInstances[channelInstance];
  	if (paused != channel.isPaused()) {
  		if (paused) channel.pause();
  		else channel.resume();
  	}
  }

  function _JS_Sound_SetPitch(channelInstance, v)
  {
  	if (WEBAudio.audioWebEnabled == 0)
  		return;
  
  	try {
  		var channel = WEBAudio.audioInstances[channelInstance];
  		channel.setPitch(v);
  	} catch (e) {
  		console.error('JS_Sound_SetPitch(channel=' + channelInstance + ', pitch=' + v + ') threw an exception: ' + e);
  	}
  }

  function _JS_Sound_SetPosition(channelInstance, x, y, z)
  {
  	if (WEBAudio.audioWebEnabled == 0)
  		return;
  
  	var channel = WEBAudio.audioInstances[channelInstance];
  	channel.setPosition(x, y, z);
  }

  function _JS_Sound_SetVolume(channelInstance, v)
  {
  	if (WEBAudio.audioWebEnabled == 0)
  		return;
  
  	try {
  		var channel = WEBAudio.audioInstances[channelInstance];
  		channel.setVolume(v);
  	} catch (e) {
  		console.error('JS_Sound_SetVolume(channel=' + channelInstance + ', volume=' + v + ') threw an exception: ' + e);
  	}
  }

  function _JS_Sound_Stop(channelInstance, delay)
  {
  	if (WEBAudio.audioWebEnabled == 0)
  		return;
  
  	var channel = WEBAudio.audioInstances[channelInstance];
  	if (WEBAudio.contextIsRunning) {
  		channel.stop(delay);
  	}
  	else {
  		const soundToStopIndex = WEBAudio.soundsPendingContextResume.findIndex(sound => sound.channel == channel);
  		if (soundToStopIndex != -1)
  			WEBAudio.soundsPendingContextResume[soundToStopIndex].stopDelay = delay;
  	}
  }

  function _JS_SystemInfo_GetAnimationFrameRate() {
  		return screenAnimationFrameRate;
  	}

  
  function _JS_SystemInfo_GetBrowserName(buffer, bufferSize)
  	{
  		var browser = Module.SystemInfo.browser;
  		if (buffer)
  			stringToUTF8(browser, buffer, bufferSize);
  		return lengthBytesUTF8(browser);
  	}

  
  function _JS_SystemInfo_GetBrowserVersionString(buffer, bufferSize)
  	{
  		var browserVer = Module.SystemInfo.browserVersion;
  		if (buffer)
  			stringToUTF8(browserVer, buffer, bufferSize);
  		return lengthBytesUTF8(browserVer);
  	}

  
  function _JS_SystemInfo_GetCanvasClientSize(domElementSelector, outWidth, outHeight)
  	{
  		var selector = UTF8ToString(domElementSelector);
  		var canvas = (selector == '#canvas') ? Module['canvas'] : document.querySelector(selector);
  		var w = 0, h = 0;
  		if (canvas) {
  			var size = canvas.getBoundingClientRect();
  			w = size.width;
  			h = size.height;
  		}
  		outWidth = (outWidth >> 3);
  		outHeight = (outHeight >> 3);
  		HEAPF64[outWidth] = w;
  		HEAPF64[outHeight] = h;
  	}

  
  function _JS_SystemInfo_GetDocumentURL(buffer, bufferSize)
  	{
  		if (buffer)
  			stringToUTF8(document.URL, buffer, bufferSize);
  		return lengthBytesUTF8(document.URL);
  	}

  
  function _JS_SystemInfo_GetGPUInfo(buffer, bufferSize)
  	{
  		var gpuinfo = Module.SystemInfo.gpu;
  		if (buffer)
  			stringToUTF8(gpuinfo, buffer, bufferSize);
  		return lengthBytesUTF8(gpuinfo);
  	}

  function _JS_SystemInfo_GetMatchWebGLToCanvasSize()
  	{
  		// If matchWebGLToCanvasSize is not present, it is
  		// same as true, to keep backwards compatibility with user page templates
  		// that are not setting this field.
  		return Module.matchWebGLToCanvasSize || Module.matchWebGLToCanvasSize === undefined;
  	}

  
  function _JS_SystemInfo_GetOS(buffer, bufferSize)
  	{
  		var browser = Module.SystemInfo.os + " " + Module.SystemInfo.osVersion;
  		if (buffer)
  			stringToUTF8(browser, buffer, bufferSize);
  		return lengthBytesUTF8(browser);
  	}

  function _JS_SystemInfo_GetPreferredDevicePixelRatio()
  	{
  		return Module.matchWebGLToCanvasSize == false ? 1 : Module.devicePixelRatio || window.devicePixelRatio || 1;
  	}

  function _JS_SystemInfo_GetScreenSize(outWidth, outHeight)
  	{
  		outWidth = (outWidth >> 3);
  		outHeight = (outHeight >> 3);
  		HEAPF64[outWidth] = Module.SystemInfo.width;
  		HEAPF64[outHeight] = Module.SystemInfo.height;
  	}

  
  function _JS_SystemInfo_GetStreamingAssetsURL(buffer, bufferSize)
  	{
  		if (buffer)
  			stringToUTF8(Module.streamingAssetsUrl, buffer, bufferSize);
  		return lengthBytesUTF8(Module.streamingAssetsUrl);
  	}

  function _JS_SystemInfo_HasAstcHdr()
      {
        var ext = GLctx.getExtension('WEBGL_compressed_texture_astc');
        if (ext && ext.getSupportedProfiles) {
          return ext.getSupportedProfiles().includes("hdr");
        }
        return false;
      }

  function _JS_SystemInfo_HasCursorLock()
  	{
  		return Module.SystemInfo.hasCursorLock;
  	}

  function _JS_SystemInfo_HasFullscreen()
  	{
  		return Module.SystemInfo.hasFullscreen;
  	}

  function _JS_SystemInfo_HasWebGL()
  	{
  		return Module.SystemInfo.hasWebGL;
  	}

  function _JS_SystemInfo_HasWebGPU()
  	{
  		return Module.SystemInfo.hasWebGPU;
  	}

  function _JS_SystemInfo_IsMobile()
  	{
  		return Module.SystemInfo.mobile;
  	}

  function _JS_UnityEngineShouldQuit() {
  	return !!Module.shouldQuit;
  }

  var activeWebCams = {
  };
  function _JS_WebCamVideo_GetNativeHeight(deviceId) {
  		return activeWebCams[deviceId] && activeWebCams[deviceId].video.videoHeight;
  	}

  function _JS_WebCamVideo_GetNativeWidth(deviceId) {
  		return activeWebCams[deviceId] && activeWebCams[deviceId].video.videoWidth;
  	}

  function _JS_WebCamVideo_GrabFrame(deviceId, buffer, destWidth, destHeight) {
  		var webcam = activeWebCams[deviceId];
  		if (!webcam) return;
  		// Do not sample a new frame if there cannot be a new video frame available for us. (we would
  		// just be capturing the same pixels again, wasting performance)
  		var timeNow = performance.now();
  		if (timeNow < webcam.nextFrameAvailableTime) {
  			return;
  		}
  		// Calculate when the next video frame will be available.
  		webcam.nextFrameAvailableTime += webcam.frameLengthInMsecs;
  		// We have lost a lot of time and missed frames? Then reset the calculation for the next frame
  		// availability based on present time.
  		if (webcam.nextFrameAvailableTime < timeNow) {
  			webcam.nextFrameAvailableTime = timeNow + webcam.frameLengthInMsecs;
  		}
  		var canvas = webcam.canvas;
  		if (canvas.width != destWidth || canvas.height != destHeight || !webcam.context2d) {
  			canvas.width = destWidth;
  			canvas.height = destHeight;
  			// Chrome and Firefox bug? After resizing the canvas, the 2D context
  			// needs to be reacquired or the resize does not apply.
  			webcam.context2d = canvas.getContext('2d');
  		}
  		var context = webcam.context2d;
  		context.drawImage(webcam.video, 0, 0, webcam.video.videoWidth, webcam.video.videoHeight, 0, 0, destWidth, destHeight);
  		HEAPU8.set(context.getImageData(0, 0, destWidth, destHeight).data, buffer);
  		return 1; // Managed to capture a frame
  	}

  function _JS_WebGPU_SetCommandEncoder(encoder)
      {
          Module["WebGPU"].commandEncoder = encoder;
      }

  function utf8(ptr) {
      return UTF8ToString(ptr);
    }
  
  function wgpu_checked_shift(ptr, shift) {
      assert(ptr % (1 << shift) == 0);
      return ptr >> shift;
    }
  var wgpu = {
  };
  function _JS_WebGPU_Setup(adapter, device)
      {
          Module["WebGPU"] = {};
          Module["WebGPU"].adapter = wgpu[adapter];
          Module["WebGPU"].device = wgpu[device];
      }

  function _JS_WebPlayer_FinishInitialization() {
  		Module.WebPlayer.PlayerIsInitialized();
  	}

  var wr = {
  requests:{
  },
  responses:{
  },
  abortControllers:{
  },
  timer:{
  },
  nextRequestId:1,
  };
  function _JS_WebRequest_Abort(requestId)
  	{
  		var abortController = wr.abortControllers[requestId];
          if (!abortController || abortController.signal.aborted) {
              return;
          }
  
          abortController.abort();
  	}

  
  
  function _JS_WebRequest_Create(url, method)
  	{
  		var _url = UTF8ToString(url);
  		var _method = UTF8ToString(method);
  		var abortController = new AbortController();
  		var requestOptions = {
  			url: _url,
  			init: {
  				method: _method,
  				signal: abortController.signal,
  				headers: {},
  				enableStreamingDownload: true
  			},
  			tempBuffer: null,
  			tempBufferSize: 0
  		};
  
  		wr.abortControllers[wr.nextRequestId] = abortController;
  		wr.requests[wr.nextRequestId] = requestOptions;
  
  		return wr.nextRequestId++;
  	}

  
  function jsWebRequestGetResponseHeaderString(requestId) {
  		var response = wr.responses[requestId];
  		if (!response) {
            return "";
          }
  
  		// Use cached value of response header string if present
  		if (response.headerString) {
  			return response.headerString;
  		}
  
  		// Create response header string from headers object
  		var headers = "";
          var entries = response.headers.entries();
          for (var result = entries.next(); !result.done; result = entries.next()) {
              headers += result.value[0] + ": " + result.value[1] + "\r\n";
          }
  		response.headerString = headers;
  
  		return headers;
  	}
  
  
  function _JS_WebRequest_GetResponseMetaData(requestId, headerBuffer, headerSize, responseUrlBuffer, responseUrlSize)
  	{
  		var response = wr.responses[requestId];
  		if (!response) {
  		  stringToUTF8("", headerBuffer, headerSize);
  		  stringToUTF8("", responseUrlBuffer, responseUrlSize);
            return;
          }
  
  		if (headerBuffer) {
  			var headers = jsWebRequestGetResponseHeaderString(requestId);
  			stringToUTF8(headers, headerBuffer, headerSize);
  		}
  
  		if (responseUrlBuffer) {
  			stringToUTF8(response.url, responseUrlBuffer, responseUrlSize);
  		}
  	}

  
  function _JS_WebRequest_GetResponseMetaDataLengths(requestId, buffer)
  	{
  		buffer = (buffer >> 2);
  		var heapArray = HEAPU32;
  
  		var response = wr.responses[requestId];
  		if (!response) {
  		  heapArray[buffer] = 0;
  		  heapArray[buffer + 1] = 0;
            return;
          }
  
  		var headers = jsWebRequestGetResponseHeaderString(requestId);
  
  		// Set length of header and response url to output buffer
  		heapArray[buffer] = lengthBytesUTF8(headers);
  		heapArray[buffer + 1] = lengthBytesUTF8(response.url);
  	}

  function _JS_WebRequest_Release(requestId)
  	{
          // Clear timeout
  		if (wr.timer[requestId]) {
  			clearTimeout(wr.timer[requestId]);
  		}
  
  		// Remove all resources for request
  		delete wr.requests[requestId];
  		delete wr.responses[requestId];
  		delete wr.abortControllers[requestId];
  		delete wr.timer[requestId];
  	}

  
  
  function _JS_WebRequest_Send(requestId, ptr, length, arg, onresponse, onprogress)
  	{
  		ptr = ptr;
  		var requestOptions = wr.requests[requestId];
          var abortController = wr.abortControllers[requestId];
  
  		function getTempBuffer(size) {
  			// Allocate new temp buffer if none has been allocated
  			if (!requestOptions.tempBuffer) {
  				const initialSize = Math.max(size, 1024); // Use 1 kB as minimal temp buffer size to prevent too many reallocations
  				requestOptions.tempBuffer = _malloc(initialSize);
  				requestOptions.tempBufferSize = initialSize;
  			}
  
  			// Increase size of temp buffer if necessary
  			if (requestOptions.tempBufferSize < size) {
  				_free(requestOptions.tempBuffer);
  				requestOptions.tempBuffer =  _malloc(size);
  				requestOptions.tempBufferSize = size;
  			}
  
  			return requestOptions.tempBuffer;
  		}
  
          function ClearTimeout() {
  			if (wr.timer[requestId]) {
  				clearTimeout(wr.timer[requestId]);
                  delete wr.timer[requestId];
  			}
          }
  
  		function HandleSuccess(response, body) {
              ClearTimeout();
  
  			if (!onresponse) {
  				return;
  			}
  
  			var kWebRequestOK = 0;
  			// 200 is successful http request, 0 is returned by non-http requests (file:).
  			if (requestOptions.init.enableStreamingDownload) {
  				// Body was streamed only send final body length
  				((a1, a2, a3, a4, a5, a6) => dynCall_viiiiii(onresponse, a1, a2, a3, a4, a5, a6))(arg, response.status, 0, body.length, 0, kWebRequestOK);
  			} else if (body.length != 0) {
  				// Send whole body at once
  				var buffer = _malloc(body.length);
  				HEAPU8.set(body, buffer);
  				((a1, a2, a3, a4, a5, a6) => dynCall_viiiiii(onresponse, a1, a2, a3, a4, a5, a6))(arg, response.status, buffer, body.length, 0, kWebRequestOK);
  				_free(buffer);
  			} else {
  				((a1, a2, a3, a4, a5, a6) => dynCall_viiiiii(onresponse, a1, a2, a3, a4, a5, a6))(arg, response.status, 0, 0, 0, kWebRequestOK);
  			}
  
  			// Cleanup temp buffer
  			if (requestOptions.tempBuffer) {
  				_free(requestOptions.tempBuffer);
  			}
  		}
  
  		function HandleError(err, code) {
  			ClearTimeout();
  
              if (!onresponse) {
  				return;
  			}
  
  			var len = lengthBytesUTF8(err) + 1;
  			var buffer = _malloc(len);
  			stringToUTF8(err, buffer, len);
  			((a1, a2, a3, a4, a5, a6) => dynCall_viiiiii(onresponse, a1, a2, a3, a4, a5, a6))(arg, 500, 0, 0, buffer, code);
              _free(buffer);
  
  			// Clean up temp buffer
  			if (requestOptions.tempBuffer) {
  				_free(requestOptions.tempBuffer);
  			}
  		}
  
  		function HandleProgress(e) {
  			if (!onprogress) {
  				return;
  			}
  
  			var response = e.response;
  			wr.responses[requestId] = response;
  
  			if (e.chunk) {
  				// Response body streaming is enabled copy data to new buffer
  				var buffer = getTempBuffer(e.chunk.length);
  				HEAPU8.set(e.chunk, buffer);
  				((a1, a2, a3, a4, a5, a6) => dynCall_viiiiii(onprogress, a1, a2, a3, a4, a5, a6))(arg, response.status, e.loaded, e.total, buffer, e.chunk.length);
  			} else {
  				// no response body streaming
  				((a1, a2, a3, a4, a5, a6) => dynCall_viiiiii(onprogress, a1, a2, a3, a4, a5, a6))(arg, response.status, e.loaded, e.total, 0, 0);
  			}
  		}
  
  		try {
  			if (length > 0) {
  				var postData = HEAPU8.subarray(ptr, ptr+length);
  				requestOptions.init.body = new Blob([postData]);
  			}
  
  			// Add timeout handler if timeout is set
  			if (requestOptions.timeout) {
  				wr.timer[requestId] = setTimeout(function () {
  					requestOptions.isTimedOut = true;
  					abortController.abort();
  				}, requestOptions.timeout);
  			}
  
  			var fetchImpl = Module.fetchWithProgress;
  			requestOptions.init.onProgress = HandleProgress;
  			if (Module.companyName && Module.productName && Module.cachedFetch) {
  				fetchImpl = Module.cachedFetch;
  				requestOptions.init.companyName = Module.companyName;
  				requestOptions.init.productName = Module.productName;
  				requestOptions.init.productVersion = Module.productVersion;
  				requestOptions.init.control = Module.cacheControl(requestOptions.url);
  			}
  
  			fetchImpl(requestOptions.url, requestOptions.init).then(function (response) {
  				wr.responses[requestId] = response;
  
                  HandleSuccess(response, response.parsedBody);
  			}).catch(function (error) {
  				var kWebErrorUnknown = 2;
                  var kWebErrorAborted = 17;
                  var kWebErrorTimeout = 14;
  
                  if (requestOptions.isTimedOut) {
  					HandleError("Connection timed out.", kWebErrorTimeout);
                  } else if (abortController.signal.aborted) {
                      HandleError("Aborted.", kWebErrorAborted);
                  } else {
                      HandleError(error.message, kWebErrorUnknown);
                  }
  			});
  		} catch(error) {
  			var kWebErrorUnknown = 2;
              HandleError(error.message, kWebErrorUnknown);
  		}
  	}

  function _JS_WebRequest_SetRedirectLimit(request, redirectLimit)
  	{
  		var requestOptions = wr.requests[request];
  		if (!requestOptions) {
              return;
  		}
  
  		// Disable redirects if redirectLimit == 0 otherwise use browser defined redirect limit
  		requestOptions.init.redirect = redirectLimit === 0 ? "error" : "follow";
  	}

  
  
  function _JS_WebRequest_SetRequestHeader(requestId, header, value)
  	{
  		var requestOptions = wr.requests[requestId];
  		if (!requestOptions) {
              return;
  		}
  
  		var _header = UTF8ToString(header);
  		var _value = UTF8ToString(value);
  		requestOptions.init.headers[_header] = _value;
  	}

  function _JS_WebRequest_SetTimeout(requestId, timeout)
  	{
          var requestOptions = wr.requests[requestId];
  		if (!requestOptions) {
              return;
  		}
  
          requestOptions.timeout = timeout;
  	}

  function _Telegram_CloseWebApp() {
      if (window.Telegram && window.Telegram.WebApp)
        window.Telegram.WebApp.close();
    }

  function _Telegram_EnsureWebAppScript() {
      if (window.Telegram && window.Telegram.WebApp) return;
      if (document.getElementById("telegram-web-app-script")) return;
  
      var script = document.createElement("script");
      script.id = "telegram-web-app-script";
      script.src = "https://telegram.org/js/telegram-web-app.js";
      document.head.appendChild(script);
    }

  function _Telegram_GetUserData() {
      var webApp = window.Telegram && window.Telegram.WebApp;
      var user = webApp && webApp.initDataUnsafe && webApp.initDataUnsafe.user;
      if (!user) return 0;
  
      var deviceId = "";
      try {
        deviceId = window.localStorage.getItem("everything-lost-device-id") || "";
      } catch (error) {}
      if (!deviceId) {
        deviceId = window.__everythingLostDeviceId ||
          (window.crypto && window.crypto.randomUUID
            ? window.crypto.randomUUID()
            : String(Date.now()) + "-" + String(Math.random()));
        window.__everythingLostDeviceId = deviceId;
        try {
          window.localStorage.setItem("everything-lost-device-id", deviceId);
        } catch (error) {}
      }
  
      var data = JSON.stringify({
        id: String(user.id),
        username: user.username || "",
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        initData: webApp.initData || "",
        deviceId: deviceId
      });
  
      var size = lengthBytesUTF8(data) + 1;
      var buffer = _malloc(size);
      stringToUTF8(data, buffer, size);
      return buffer;
    }

  function _Telegram_GetUserId() {
      var webApp = window.Telegram && window.Telegram.WebApp;
      var user = webApp && webApp.initDataUnsafe && webApp.initDataUnsafe.user;
      if (!user || user.id == null) return 0;
  
      var id = String(user.id);
      var size = lengthBytesUTF8(id) + 1;
      var buffer = _malloc(size);
      stringToUTF8(id, buffer, size);
      return buffer;
    }

  var ___assert_fail = (condition, filename, line, func) =>
      abort(`Assertion failed: ${UTF8ToString(condition)}, at: ` + [filename ? UTF8ToString(filename) : 'unknown filename', line, func ? UTF8ToString(func) : 'unknown function']);

  var exceptionCaught =  [];
  
  
  
  var uncaughtExceptionCount = 0;
  var ___cxa_begin_catch = (ptr) => {
      var info = new ExceptionInfo(ptr);
      if (!info.get_caught()) {
        info.set_caught(true);
        uncaughtExceptionCount--;
      }
      info.set_rethrown(false);
      exceptionCaught.push(info);
      ___cxa_increment_exception_refcount(ptr);
      return ___cxa_get_exception_ptr(ptr);
    };

  
  var exceptionLast = 0;
  
  
  var ___cxa_end_catch = () => {
      // Clear state flag.
      _setThrew(0, 0);
      assert(exceptionCaught.length > 0);
      // Call destructor if one is registered then clear it.
      var info = exceptionCaught.pop();
  
      ___cxa_decrement_exception_refcount(info.excPtr);
      exceptionLast = 0; // XXX in decRef?
    };

  
  class ExceptionInfo {
      // excPtr - Thrown object pointer to wrap. Metadata pointer is calculated from it.
      constructor(excPtr) {
        this.excPtr = excPtr;
        this.ptr = excPtr - 24;
      }
  
      set_type(type) {
        HEAPU32[(((this.ptr)+(4))>>2)] = type;
      }
  
      get_type() {
        return HEAPU32[(((this.ptr)+(4))>>2)];
      }
  
      set_destructor(destructor) {
        HEAPU32[(((this.ptr)+(8))>>2)] = destructor;
      }
  
      get_destructor() {
        return HEAPU32[(((this.ptr)+(8))>>2)];
      }
  
      set_caught(caught) {
        caught = caught ? 1 : 0;
        HEAP8[(this.ptr)+(12)] = caught;
      }
  
      get_caught() {
        return HEAP8[(this.ptr)+(12)] != 0;
      }
  
      set_rethrown(rethrown) {
        rethrown = rethrown ? 1 : 0;
        HEAP8[(this.ptr)+(13)] = rethrown;
      }
  
      get_rethrown() {
        return HEAP8[(this.ptr)+(13)] != 0;
      }
  
      // Initialize native structure fields. Should be called once after allocated.
      init(type, destructor) {
        this.set_adjusted_ptr(0);
        this.set_type(type);
        this.set_destructor(destructor);
      }
  
      set_adjusted_ptr(adjustedPtr) {
        HEAPU32[(((this.ptr)+(16))>>2)] = adjustedPtr;
      }
  
      get_adjusted_ptr() {
        return HEAPU32[(((this.ptr)+(16))>>2)];
      }
    }
  
  
  var setTempRet0 = (val) => __emscripten_tempret_set(val);
  var findMatchingCatch = (args) => {
      var thrown =
        exceptionLast?.excPtr;
      if (!thrown) {
        // just pass through the null ptr
        setTempRet0(0);
        return 0;
      }
      var info = new ExceptionInfo(thrown);
      info.set_adjusted_ptr(thrown);
      var thrownType = info.get_type();
      if (!thrownType) {
        // just pass through the thrown ptr
        setTempRet0(0);
        return thrown;
      }
  
      // can_catch receives a **, add indirection
      // The different catch blocks are denoted by different types.
      // Due to inheritance, those types may not precisely match the
      // type of the thrown object. Find one which matches, and
      // return the type of the catch block which should be called.
      for (var caughtType of args) {
        if (caughtType === 0 || caughtType === thrownType) {
          // Catch all clause matched or exactly the same type is caught
          break;
        }
        var adjusted_ptr_addr = info.ptr + 16;
        if (___cxa_can_catch(caughtType, thrownType, adjusted_ptr_addr)) {
          setTempRet0(caughtType);
          return thrown;
        }
      }
      setTempRet0(thrownType);
      return thrown;
    };
  var ___cxa_find_matching_catch_2 = () => findMatchingCatch([]);

  var ___cxa_find_matching_catch_3 = (arg0) => findMatchingCatch([arg0]);

  var ___cxa_find_matching_catch_4 = (arg0,arg1) => findMatchingCatch([arg0,arg1]);

  
  
  var ___cxa_rethrow = () => {
      var info = exceptionCaught.pop();
      if (!info) {
        abort('no exception to throw');
      }
      var ptr = info.excPtr;
      if (!info.get_rethrown()) {
        // Only pop if the corresponding push was through rethrow_primary_exception
        exceptionCaught.push(info);
        info.set_rethrown(true);
        info.set_caught(false);
        uncaughtExceptionCount++;
      }
      exceptionLast = new CppException(ptr);
      throw exceptionLast;
    };

  
  
  var ___cxa_throw = (ptr, type, destructor) => {
      var info = new ExceptionInfo(ptr);
      // Initialize ExceptionInfo content after it was allocated in __cxa_allocate_exception.
      info.init(type, destructor);
      exceptionLast = new CppException(ptr);
      uncaughtExceptionCount++;
      throw exceptionLast;
    };

  var ___cxa_uncaught_exceptions = () => uncaughtExceptionCount;

  var ___resumeException = (ptr) => {
      if (!exceptionLast) {
        exceptionLast = new CppException(ptr);
      }
      throw exceptionLast;
    };

  var PATH = {
  isAbs:(path) => path.charAt(0) === '/',
  splitPath:(filename) => {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },
  normalizeArray:(parts, allowAboveRoot) => {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up; up--) {
            parts.unshift('..');
          }
        }
        return parts;
      },
  normalize:(path) => {
        var isAbsolute = PATH.isAbs(path),
            trailingSlash = path.slice(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter((p) => !!p), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },
  dirname:(path) => {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.slice(0, -1);
        }
        return root + dir;
      },
  basename:(path) => path && path.match(/([^\/]+|\/)\/*$/)[1],
  join:(...paths) => PATH.normalize(paths.join('/')),
  join2:(l, r) => PATH.normalize(l + '/' + r),
  };
  
  var initRandomFill = () => {
  
      return (view) => crypto.getRandomValues(view);
    };
  var randomFill = (view) => {
      // Lazily init on the first invocation.
      (randomFill = initRandomFill())(view);
    };
  
  
  
  var PATH_FS = {
  resolve:(...args) => {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = args.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? args[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path != 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            return ''; // an invalid portion invalidates the whole thing
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = PATH.isAbs(path);
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter((p) => !!p), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },
  relative:(from, to) => {
        from = PATH_FS.resolve(from).slice(1);
        to = PATH_FS.resolve(to).slice(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      },
  };
  
  
  
  var FS_stdin_getChar_buffer = [];
  
  
  /** @type {function(string, boolean=, number=)} */
  var intArrayFromString = (stringy, dontAddNull, length) => {
      var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
      var u8array = new Array(len);
      var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
      if (dontAddNull) u8array.length = numBytesWritten;
      return u8array;
    };
  var FS_stdin_getChar = () => {
      if (!FS_stdin_getChar_buffer.length) {
        var result = null;
        if (globalThis.window?.prompt) {
          // Browser.
          result = window.prompt('Input: ');  // returns null on cancel
          if (result !== null) {
            result += '\n';
          }
        } else
        {}
        if (!result) {
          return null;
        }
        FS_stdin_getChar_buffer = intArrayFromString(result, true);
      }
      return FS_stdin_getChar_buffer.shift();
    };
  var TTY = {
  ttys:[],
  init() {
        // https://github.com/emscripten-core/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process.stdin.setEncoding('utf8');
        // }
      },
  shutdown() {
        // https://github.com/emscripten-core/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process.stdin.pause();
        // }
      },
  register(dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },
  stream_ops:{
  open(stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(43);
          }
          stream.tty = tty;
          stream.seekable = false;
        },
  close(stream) {
          // flush any pending line data
          stream.tty.ops.fsync(stream.tty);
        },
  fsync(stream) {
          stream.tty.ops.fsync(stream.tty);
        },
  read(stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(60);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(29);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(6);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.atime = Date.now();
          }
          return bytesRead;
        },
  write(stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(60);
          }
          try {
            for (var i = 0; i < length; i++) {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            }
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
          if (length) {
            stream.node.mtime = stream.node.ctime = Date.now();
          }
          return i;
        },
  },
  default_tty_ops:{
  get_char(tty) {
          return FS_stdin_getChar();
        },
  put_char(tty, val) {
          if (val === null || val === 10) {
            out(UTF8ArrayToString(tty.output));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val); // val == 0 would cut text output off in the middle.
          }
        },
  fsync(tty) {
          if (tty.output?.length > 0) {
            out(UTF8ArrayToString(tty.output));
            tty.output = [];
          }
        },
  ioctl_tcgets(tty) {
          // typical setting
          return {
            c_iflag: 25856,
            c_oflag: 5,
            c_cflag: 191,
            c_lflag: 35387,
            c_cc: [
              0x03, 0x1c, 0x7f, 0x15, 0x04, 0x00, 0x01, 0x00, 0x11, 0x13, 0x1a, 0x00,
              0x12, 0x0f, 0x17, 0x16, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
              0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            ]
          };
        },
  ioctl_tcsets(tty, optional_actions, data) {
          // currently just ignore
          return 0;
        },
  ioctl_tiocgwinsz(tty) {
          return [24, 80];
        },
  },
  default_tty1_ops:{
  put_char(tty, val) {
          if (val === null || val === 10) {
            err(UTF8ArrayToString(tty.output));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val);
          }
        },
  fsync(tty) {
          if (tty.output?.length > 0) {
            err(UTF8ArrayToString(tty.output));
            tty.output = [];
          }
        },
  },
  };
  
  
  var mmapAlloc = (size) => {
      abort('internal error: mmapAlloc called but `emscripten_builtin_memalign` native symbol not exported');
    };
  var MEMFS = {
  ops_table:null,
  mount(mount) {
        return MEMFS.createNode(null, '/', 16895, 0);
      },
  createNode(parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(63);
        }
        MEMFS.ops_table ||= {
          dir: {
            node: {
              getattr: MEMFS.node_ops.getattr,
              setattr: MEMFS.node_ops.setattr,
              lookup: MEMFS.node_ops.lookup,
              mknod: MEMFS.node_ops.mknod,
              rename: MEMFS.node_ops.rename,
              unlink: MEMFS.node_ops.unlink,
              rmdir: MEMFS.node_ops.rmdir,
              readdir: MEMFS.node_ops.readdir,
              symlink: MEMFS.node_ops.symlink
            },
            stream: {
              llseek: MEMFS.stream_ops.llseek
            }
          },
          file: {
            node: {
              getattr: MEMFS.node_ops.getattr,
              setattr: MEMFS.node_ops.setattr
            },
            stream: {
              llseek: MEMFS.stream_ops.llseek,
              read: MEMFS.stream_ops.read,
              write: MEMFS.stream_ops.write,
              mmap: MEMFS.stream_ops.mmap,
              msync: MEMFS.stream_ops.msync
            }
          },
          link: {
            node: {
              getattr: MEMFS.node_ops.getattr,
              setattr: MEMFS.node_ops.setattr,
              readlink: MEMFS.node_ops.readlink
            },
            stream: {}
          },
          chrdev: {
            node: {
              getattr: MEMFS.node_ops.getattr,
              setattr: MEMFS.node_ops.setattr
            },
            stream: FS.chrdev_stream_ops
          }
        };
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.usedBytes = 0; // The actual number of bytes used in the typed array, as opposed to contents.length which gives the whole capacity.
          // When the byte data of the file is populated, this will point to either a typed array, or a normal JS array. Typed arrays are preferred
          // for performance, and used by default. However, typed arrays are not resizable like normal JS arrays are, so there is a small disk size
          // penalty involved for appending file writes that continuously grow a file similar to std::vector capacity vs used -scheme.
          node.contents = null; 
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.atime = node.mtime = node.ctime = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
          parent.atime = parent.mtime = parent.ctime = node.atime;
        }
        return node;
      },
  getFileDataAsTypedArray(node) {
        if (!node.contents) return new Uint8Array(0);
        if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes); // Make sure to not return excess unused bytes.
        return new Uint8Array(node.contents);
      },
  expandFileStorage(node, newCapacity) {
        var prevCapacity = node.contents ? node.contents.length : 0;
        if (prevCapacity >= newCapacity) return; // No need to expand, the storage was already large enough.
        // Don't expand strictly to the given requested limit if it's only a very small increase, but instead geometrically grow capacity.
        // For small filesizes (<1MB), perform size*2 geometric increase, but for large sizes, do a much more conservative size*1.125 increase to
        // avoid overshooting the allocation cap by a very large margin.
        var CAPACITY_DOUBLING_MAX = 1024 * 1024;
        newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2.0 : 1.125)) >>> 0);
        if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256); // At minimum allocate 256b for each file when expanding.
        var oldContents = node.contents;
        node.contents = new Uint8Array(newCapacity); // Allocate new storage.
        if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0); // Copy old data over to the new storage.
      },
  resizeFileStorage(node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
          node.contents = null; // Fully decommit when requesting a resize to zero.
          node.usedBytes = 0;
        } else {
          var oldContents = node.contents;
          node.contents = new Uint8Array(newSize); // Allocate new storage.
          if (oldContents) {
            node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes))); // Copy old data over to the new storage.
          }
          node.usedBytes = newSize;
        }
      },
  node_ops:{
  getattr(node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.usedBytes;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.atime);
          attr.mtime = new Date(node.mtime);
          attr.ctime = new Date(node.ctime);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },
  setattr(node, attr) {
          for (const key of ["mode", "atime", "mtime", "ctime"]) {
            if (attr[key] != null) {
              node[key] = attr[key];
            }
          }
          if (attr.size !== undefined) {
            MEMFS.resizeFileStorage(node, attr.size);
          }
        },
  lookup(parent, name) {
          throw new FS.ErrnoError(44);
        },
  mknod(parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },
  rename(old_node, new_dir, new_name) {
          var new_node;
          try {
            new_node = FS.lookupNode(new_dir, new_name);
          } catch (e) {}
          if (new_node) {
            if (FS.isDir(old_node.mode)) {
              // if we're overwriting a directory at new_name, make sure it's empty.
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(55);
              }
            }
            FS.hashRemoveNode(new_node);
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          new_dir.contents[new_name] = old_node;
          old_node.name = new_name;
          new_dir.ctime = new_dir.mtime = old_node.parent.ctime = old_node.parent.mtime = Date.now();
        },
  unlink(parent, name) {
          delete parent.contents[name];
          parent.ctime = parent.mtime = Date.now();
        },
  rmdir(parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(55);
          }
          delete parent.contents[name];
          parent.ctime = parent.mtime = Date.now();
        },
  readdir(node) {
          return ['.', '..', ...Object.keys(node.contents)];
        },
  symlink(parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 0o777 | 40960, 0);
          node.link = oldpath;
          return node;
        },
  readlink(node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(28);
          }
          return node.link;
        },
  },
  stream_ops:{
  read(stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= stream.node.usedBytes) return 0;
          var size = Math.min(stream.node.usedBytes - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else {
            for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
          }
          return size;
        },
  write(stream, buffer, offset, length, position, canOwn) {
          // The data buffer should be a typed array view
          assert(!(buffer instanceof ArrayBuffer));
          // If the buffer is located in main memory (HEAP), and if
          // memory can grow, we can't hold on to references of the
          // memory buffer, as they may get invalidated. That means we
          // need to do copy its contents.
          if (buffer.buffer === HEAP8.buffer) {
            canOwn = false;
          }
  
          if (!length) return 0;
          var node = stream.node;
          node.mtime = node.ctime = Date.now();
  
          if (buffer.subarray && (!node.contents || node.contents.subarray)) { // This write is from a typed array to a typed array?
            if (canOwn) {
              assert(position === 0, 'canOwn must imply no weird position inside the file');
              node.contents = buffer.subarray(offset, offset + length);
              node.usedBytes = length;
              return length;
            } else if (node.usedBytes === 0 && position === 0) { // If this is a simple first write to an empty file, do a fast set since we don't need to care about old data.
              node.contents = buffer.slice(offset, offset + length);
              node.usedBytes = length;
              return length;
            } else if (position + length <= node.usedBytes) { // Writing to an already allocated and used subrange of the file?
              node.contents.set(buffer.subarray(offset, offset + length), position);
              return length;
            }
          }
  
          // Appending to an existing file and we need to reallocate, or source data did not come as a typed array.
          MEMFS.expandFileStorage(node, position+length);
          if (node.contents.subarray && buffer.subarray) {
            // Use typed array write which is available.
            node.contents.set(buffer.subarray(offset, offset + length), position);
          } else {
            for (var i = 0; i < length; i++) {
             node.contents[position + i] = buffer[offset + i]; // Or fall back to manual write if not.
            }
          }
          node.usedBytes = Math.max(node.usedBytes, position + length);
          return length;
        },
  llseek(stream, offset, whence) {
          var position = offset;
          if (whence === 1) {
            position += stream.position;
          } else if (whence === 2) {
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.usedBytes;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(28);
          }
          return position;
        },
  mmap(stream, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(43);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if (!(flags & 2) && contents && contents.buffer === HEAP8.buffer) {
            // We can't emulate MAP_SHARED when the file is not backed by the
            // buffer we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            allocated = true;
            ptr = mmapAlloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(48);
            }
            if (contents) {
              // Try to avoid unnecessary slices.
              if (position > 0 || position + length < contents.length) {
                if (contents.subarray) {
                  contents = contents.subarray(position, position + length);
                } else {
                  contents = Array.prototype.slice.call(contents, position, position + length);
                }
              }
              HEAP8.set(contents, ptr);
            }
          }
          return { ptr, allocated };
        },
  msync(stream, buffer, offset, length, mmapFlags) {
          MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
          // should we check if bytesWritten and length are the same?
          return 0;
        },
  },
  };
  
  var FS_modeStringToFlags = (str) => {
      var flagModes = {
        'r': 0,
        'r+': 2,
        'w': 512 | 64 | 1,
        'w+': 512 | 64 | 2,
        'a': 1024 | 64 | 1,
        'a+': 1024 | 64 | 2,
      };
      var flags = flagModes[str];
      if (typeof flags == 'undefined') {
        throw new Error(`Unknown file open mode: ${str}`);
      }
      return flags;
    };
  
  var FS_getMode = (canRead, canWrite) => {
      var mode = 0;
      if (canRead) mode |= 292 | 73;
      if (canWrite) mode |= 146;
      return mode;
    };
  
  
  
  
  var IDBFS = {
  dbs:{
  },
  indexedDB:() => {
        assert(typeof indexedDB != 'undefined', 'IDBFS used, but indexedDB not supported');
        return indexedDB;
      },
  DB_VERSION:21,
  DB_STORE_NAME:"FILE_DATA",
  queuePersist:(mount) => {
        function onPersistComplete() {
          if (mount.idbPersistState === 'again') startPersist(); // If a new sync request has appeared in between, kick off a new sync
          else mount.idbPersistState = 0; // Otherwise reset sync state back to idle to wait for a new sync later
        }
        function startPersist() {
          mount.idbPersistState = 'idb'; // Mark that we are currently running a sync operation
          IDBFS.syncfs(mount, /*populate:*/false, onPersistComplete);
        }
  
        if (!mount.idbPersistState) {
          // Programs typically write/copy/move multiple files in the in-memory
          // filesystem within a single app frame, so when a filesystem sync
          // command is triggered, do not start it immediately, but only after
          // the current frame is finished. This way all the modified files
          // inside the main loop tick will be batched up to the same sync.
          mount.idbPersistState = setTimeout(startPersist, 0);
        } else if (mount.idbPersistState === 'idb') {
          // There is an active IndexedDB sync operation in-flight, but we now
          // have accumulated more files to sync. We should therefore queue up
          // a new sync after the current one finishes so that all writes
          // will be properly persisted.
          mount.idbPersistState = 'again';
        }
      },
  mount:(mount) => {
        // reuse core MEMFS functionality
        var mnt = MEMFS.mount(mount);
        // If the automatic IDBFS persistence option has been selected, then automatically persist
        // all modifications to the filesystem as they occur.
        if (mount?.opts?.autoPersist) {
          mount.idbPersistState = 0; // IndexedDB sync starts in idle state
          var memfs_node_ops = mnt.node_ops;
          mnt.node_ops = {...mnt.node_ops}; // Clone node_ops to inject write tracking
          mnt.node_ops.mknod = (parent, name, mode, dev) => {
            var node = memfs_node_ops.mknod(parent, name, mode, dev);
            // Propagate injected node_ops to the newly created child node
            node.node_ops = mnt.node_ops;
            // Remember for each IDBFS node which IDBFS mount point they came from so we know which mount to persist on modification.
            node.idbfs_mount = mnt.mount;
            // Remember original MEMFS stream_ops for this node
            node.memfs_stream_ops = node.stream_ops;
            // Clone stream_ops to inject write tracking
            node.stream_ops = {...node.stream_ops};
  
            // Track all file writes
            node.stream_ops.write = (stream, buffer, offset, length, position, canOwn) => {
              // This file has been modified, we must persist IndexedDB when this file closes
              stream.node.isModified = true;
              return node.memfs_stream_ops.write(stream, buffer, offset, length, position, canOwn);
            };
  
            // Persist IndexedDB on file close
            node.stream_ops.close = (stream) => {
              var n = stream.node;
              if (n.isModified) {
                IDBFS.queuePersist(n.idbfs_mount);
                n.isModified = false;
              }
              if (n.memfs_stream_ops.close) return n.memfs_stream_ops.close(stream);
            };
  
            // Persist the node we just created to IndexedDB
            IDBFS.queuePersist(mnt.mount);
  
            return node;
          };
          // Also kick off persisting the filesystem on other operations that modify the filesystem.
          mnt.node_ops.rmdir   = (...args) => (IDBFS.queuePersist(mnt.mount), memfs_node_ops.rmdir(...args));
          mnt.node_ops.symlink = (...args) => (IDBFS.queuePersist(mnt.mount), memfs_node_ops.symlink(...args));
          mnt.node_ops.unlink  = (...args) => (IDBFS.queuePersist(mnt.mount), memfs_node_ops.unlink(...args));
          mnt.node_ops.rename  = (...args) => (IDBFS.queuePersist(mnt.mount), memfs_node_ops.rename(...args));
        }
        return mnt;
      },
  syncfs:(mount, populate, callback) => {
        IDBFS.getLocalSet(mount, (err, local) => {
          if (err) return callback(err);
  
          IDBFS.getRemoteSet(mount, (err, remote) => {
            if (err) return callback(err);
  
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
  
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },
  quit:() => {
        for (var value of Object.values(IDBFS.dbs)) {
          value.close()
        }
        IDBFS.dbs = {};
      },
  getDB:(name, callback) => {
        // check the cache first
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
  
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return callback(e);
        }
        if (!req) {
          return callback("Unable to connect to IndexedDB");
        }
        req.onupgradeneeded = (e) => {
          var db = /** @type {IDBDatabase} */ (e.target.result);
          var transaction = e.target.transaction;
  
          var fileStore;
  
          if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
            fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
          } else {
            fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
          }
  
          if (!fileStore.indexNames.contains('timestamp')) {
            fileStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };
        req.onsuccess = () => {
          db = /** @type {IDBDatabase} */ (req.result);
  
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = (e) => {
          callback(e.target.error);
          e.preventDefault();
        };
      },
  getLocalSet:(mount, callback) => {
        var entries = {};
  
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return (p) => PATH.join2(root, p);
        };
  
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
  
        while (check.length) {
          var path = check.pop();
          var stat;
  
          try {
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
  
          if (FS.isDir(stat.mode)) {
            check.push(...FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
          }
  
          entries[path] = { 'timestamp': stat.mtime };
        }
  
        return callback(null, { type: 'local', entries: entries });
      },
  getRemoteSet:(mount, callback) => {
        var entries = {};
  
        IDBFS.getDB(mount.mountpoint, (err, db) => {
          if (err) return callback(err);
  
          try {
            var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
            transaction.onerror = (e) => {
              callback(e.target.error);
              e.preventDefault();
            };
  
            var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
            var index = store.index('timestamp');
  
            index.openKeyCursor().onsuccess = (event) => {
              var cursor = event.target.result;
  
              if (!cursor) {
                return callback(null, { type: 'remote', db, entries });
              }
  
              entries[cursor.primaryKey] = { 'timestamp': cursor.key };
  
              cursor.continue();
            };
          } catch (e) {
            return callback(e);
          }
        });
      },
  loadLocalEntry:(path, callback) => {
        var stat, node;
  
        try {
          var lookup = FS.lookupPath(path);
          node = lookup.node;
          stat = FS.stat(path);
        } catch (e) {
          return callback(e);
        }
  
        if (FS.isDir(stat.mode)) {
          return callback(null, { 'timestamp': stat.mtime, 'mode': stat.mode });
        } else if (FS.isFile(stat.mode)) {
          // Performance consideration: storing a normal JavaScript array to a IndexedDB is much slower than storing a typed array.
          // Therefore always convert the file contents to a typed array first before writing the data to IndexedDB.
          node.contents = MEMFS.getFileDataAsTypedArray(node);
          return callback(null, { 'timestamp': stat.mtime, 'mode': stat.mode, 'contents': node.contents });
        } else {
          return callback(new Error('node type not supported'));
        }
      },
  storeLocalEntry:(path, entry, callback) => {
        try {
          if (FS.isDir(entry['mode'])) {
            FS.mkdirTree(path, entry['mode']);
          } else if (FS.isFile(entry['mode'])) {
            FS.writeFile(path, entry['contents'], { canOwn: true });
          } else {
            return callback(new Error('node type not supported'));
          }
  
          FS.chmod(path, entry['mode']);
          FS.utime(path, entry['timestamp'], entry['timestamp']);
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },
  removeLocalEntry:(path, callback) => {
        try {
          var stat = FS.stat(path);
  
          if (FS.isDir(stat.mode)) {
            FS.rmdir(path);
          } else if (FS.isFile(stat.mode)) {
            FS.unlink(path);
          }
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },
  loadRemoteEntry:(store, path, callback) => {
        var req = store.get(path);
        req.onsuccess = (event) => callback(null, event.target.result);
        req.onerror = (e) => {
          callback(e.target.error);
          e.preventDefault();
        };
      },
  storeRemoteEntry:(store, path, entry, callback) => {
        try {
          var req = store.put(entry, path);
        } catch (e) {
          callback(e);
          return;
        }
        req.onsuccess = (event) => callback();
        req.onerror = (e) => {
          callback(e.target.error);
          e.preventDefault();
        };
      },
  removeRemoteEntry:(store, path, callback) => {
        var req = store.delete(path);
        req.onsuccess = (event) => callback();
        req.onerror = (e) => {
          callback(e.target.error);
          e.preventDefault();
        };
      },
  reconcile:(src, dst, callback) => {
        var total = 0;
  
        var create = [];
        for (var [key, e] of Object.entries(src.entries)) {
          var e2 = dst.entries[key];
          if (!e2 || e['timestamp'].getTime() != e2['timestamp'].getTime()) {
            create.push(key);
            total++;
          }
        }
  
        var remove = [];
        for (var key of Object.keys(dst.entries)) {
          if (!src.entries[key]) {
            remove.push(key);
            total++;
          }
        }
  
        if (!total) {
          return callback(null);
        }
  
        var errored = false;
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  
        function done(err) {
          if (err && !errored) {
            errored = true;
            return callback(err);
          }
        };
  
        // transaction may abort if (for example) there is a QuotaExceededError
        transaction.onerror = transaction.onabort = (e) => {
          done(e.target.error);
          e.preventDefault();
        };
  
        transaction.oncomplete = (e) => {
          if (!errored) {
            callback(null);
          }
        };
  
        // sort paths in ascending order so directory entries are created
        // before the files inside them
        for (const path of create.sort()) {
          if (dst.type === 'local') {
            IDBFS.loadRemoteEntry(store, path, (err, entry) => {
              if (err) return done(err);
              IDBFS.storeLocalEntry(path, entry, done);
            });
          } else {
            IDBFS.loadLocalEntry(path, (err, entry) => {
              if (err) return done(err);
              IDBFS.storeRemoteEntry(store, path, entry, done);
            });
          }
        }
  
        // sort paths in descending order so files are deleted before their
        // parent directories
        for (var path of remove.sort().reverse()) {
          if (dst.type === 'local') {
            IDBFS.removeLocalEntry(path, done);
          } else {
            IDBFS.removeRemoteEntry(store, path, done);
          }
        }
      },
  };
  
  
  
  var strError = (errno) => UTF8ToString(_strerror(errno));
  
  var ERRNO_CODES = {
      'EPERM': 63,
      'ENOENT': 44,
      'ESRCH': 71,
      'EINTR': 27,
      'EIO': 29,
      'ENXIO': 60,
      'E2BIG': 1,
      'ENOEXEC': 45,
      'EBADF': 8,
      'ECHILD': 12,
      'EAGAIN': 6,
      'EWOULDBLOCK': 6,
      'ENOMEM': 48,
      'EACCES': 2,
      'EFAULT': 21,
      'ENOTBLK': 105,
      'EBUSY': 10,
      'EEXIST': 20,
      'EXDEV': 75,
      'ENODEV': 43,
      'ENOTDIR': 54,
      'EISDIR': 31,
      'EINVAL': 28,
      'ENFILE': 41,
      'EMFILE': 33,
      'ENOTTY': 59,
      'ETXTBSY': 74,
      'EFBIG': 22,
      'ENOSPC': 51,
      'ESPIPE': 70,
      'EROFS': 69,
      'EMLINK': 34,
      'EPIPE': 64,
      'EDOM': 18,
      'ERANGE': 68,
      'ENOMSG': 49,
      'EIDRM': 24,
      'ECHRNG': 106,
      'EL2NSYNC': 156,
      'EL3HLT': 107,
      'EL3RST': 108,
      'ELNRNG': 109,
      'EUNATCH': 110,
      'ENOCSI': 111,
      'EL2HLT': 112,
      'EDEADLK': 16,
      'ENOLCK': 46,
      'EBADE': 113,
      'EBADR': 114,
      'EXFULL': 115,
      'ENOANO': 104,
      'EBADRQC': 103,
      'EBADSLT': 102,
      'EDEADLOCK': 16,
      'EBFONT': 101,
      'ENOSTR': 100,
      'ENODATA': 116,
      'ETIME': 117,
      'ENOSR': 118,
      'ENONET': 119,
      'ENOPKG': 120,
      'EREMOTE': 121,
      'ENOLINK': 47,
      'EADV': 122,
      'ESRMNT': 123,
      'ECOMM': 124,
      'EPROTO': 65,
      'EMULTIHOP': 36,
      'EDOTDOT': 125,
      'EBADMSG': 9,
      'ENOTUNIQ': 126,
      'EBADFD': 127,
      'EREMCHG': 128,
      'ELIBACC': 129,
      'ELIBBAD': 130,
      'ELIBSCN': 131,
      'ELIBMAX': 132,
      'ELIBEXEC': 133,
      'ENOSYS': 52,
      'ENOTEMPTY': 55,
      'ENAMETOOLONG': 37,
      'ELOOP': 32,
      'EOPNOTSUPP': 138,
      'EPFNOSUPPORT': 139,
      'ECONNRESET': 15,
      'ENOBUFS': 42,
      'EAFNOSUPPORT': 5,
      'EPROTOTYPE': 67,
      'ENOTSOCK': 57,
      'ENOPROTOOPT': 50,
      'ESHUTDOWN': 140,
      'ECONNREFUSED': 14,
      'EADDRINUSE': 3,
      'ECONNABORTED': 13,
      'ENETUNREACH': 40,
      'ENETDOWN': 38,
      'ETIMEDOUT': 73,
      'EHOSTDOWN': 142,
      'EHOSTUNREACH': 23,
      'EINPROGRESS': 26,
      'EALREADY': 7,
      'EDESTADDRREQ': 17,
      'EMSGSIZE': 35,
      'EPROTONOSUPPORT': 66,
      'ESOCKTNOSUPPORT': 137,
      'EADDRNOTAVAIL': 4,
      'ENETRESET': 39,
      'EISCONN': 30,
      'ENOTCONN': 53,
      'ETOOMANYREFS': 141,
      'EUSERS': 136,
      'EDQUOT': 19,
      'ESTALE': 72,
      'ENOTSUP': 138,
      'ENOMEDIUM': 148,
      'EILSEQ': 25,
      'EOVERFLOW': 61,
      'ECANCELED': 11,
      'ENOTRECOVERABLE': 56,
      'EOWNERDEAD': 62,
      'ESTRPIPE': 135,
    };
  
  var asyncLoad = async (url) => {
      var arrayBuffer = await readAsync(url);
      assert(arrayBuffer, `Loading data file "${url}" failed (no arrayBuffer).`);
      return new Uint8Array(arrayBuffer);
    };
  
  
  var FS_createDataFile = (...args) => FS.createDataFile(...args);
  
  var getUniqueRunDependency = (id) => {
      var orig = id;
      while (1) {
        if (!runDependencyTracking[id]) return id;
        id = orig + Math.random();
      }
    };
  
  var runDependencies = 0;
  
  
  var dependenciesFulfilled = null;
  
  var runDependencyTracking = {
  };
  
  var runDependencyWatcher = null;
  var removeRunDependency = (id) => {
      runDependencies--;
  
      Module['monitorRunDependencies']?.(runDependencies);
  
      assert(id, 'removeRunDependency requires an ID');
      assert(runDependencyTracking[id]);
      delete runDependencyTracking[id];
      if (runDependencies == 0) {
        if (runDependencyWatcher !== null) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
        }
        if (dependenciesFulfilled) {
          var callback = dependenciesFulfilled;
          dependenciesFulfilled = null;
          callback(); // can add another dependenciesFulfilled
        }
      }
    };
  
  
  var addRunDependency = (id) => {
      runDependencies++;
  
      Module['monitorRunDependencies']?.(runDependencies);
  
      assert(id, 'addRunDependency requires an ID')
      assert(!runDependencyTracking[id]);
      runDependencyTracking[id] = 1;
      if (runDependencyWatcher === null && globalThis.setInterval) {
        // Check for missing dependencies every few seconds
        runDependencyWatcher = setInterval(() => {
          if (ABORT) {
            clearInterval(runDependencyWatcher);
            runDependencyWatcher = null;
            return;
          }
          var shown = false;
          for (var dep in runDependencyTracking) {
            if (!shown) {
              shown = true;
              err('still waiting on run dependencies:');
            }
            err(`dependency: ${dep}`);
          }
          if (shown) {
            err('(end of list)');
          }
        }, 10000);
      }
    };
  
  
  var preloadPlugins = [];
  var FS_handledByPreloadPlugin = async (byteArray, fullname) => {
      // Ensure plugins are ready.
      if (typeof Browser != 'undefined') Browser.init();
  
      for (var plugin of preloadPlugins) {
        if (plugin['canHandle'](fullname)) {
          assert(plugin['handle'].constructor.name === 'AsyncFunction', 'Filesystem plugin handlers must be async functions (See #24914)')
          return plugin['handle'](byteArray, fullname);
        }
      }
      // In no plugin handled this file then return the original/unmodified
      // byteArray.
      return byteArray;
    };
  var FS_preloadFile = async (parent, name, url, canRead, canWrite, dontCreateFile, canOwn, preFinish) => {
      // TODO we should allow people to just pass in a complete filename instead
      // of parent and name being that we just join them anyways
      var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
      var dep = getUniqueRunDependency(`cp ${fullname}`); // might have several active requests for the same fullname
      addRunDependency(dep);
  
      try {
        var byteArray = url;
        if (typeof url == 'string') {
          byteArray = await asyncLoad(url);
        }
  
        byteArray = await FS_handledByPreloadPlugin(byteArray, fullname);
        preFinish?.();
        if (!dontCreateFile) {
          FS_createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
        }
      } finally {
        removeRunDependency(dep);
      }
    };
  var FS_createPreloadedFile = (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) => {
      FS_preloadFile(parent, name, url, canRead, canWrite, dontCreateFile, canOwn, preFinish).then(onload).catch(onerror);
    };
  var FS = {
  root:null,
  mounts:[],
  devices:{
  },
  streams:[],
  nextInode:1,
  nameTable:null,
  currentPath:"/",
  initialized:false,
  ignorePermissions:true,
  filesystems:null,
  syncFSRequests:0,
  readFiles:{
  },
  ErrnoError:class extends Error {
        name = 'ErrnoError';
        // We set the `name` property to be able to identify `FS.ErrnoError`
        // - the `name` is a standard ECMA-262 property of error objects. Kind of good to have it anyway.
        // - when using PROXYFS, an error can come from an underlying FS
        // as different FS objects have their own FS.ErrnoError each,
        // the test `err instanceof FS.ErrnoError` won't detect an error coming from another filesystem, causing bugs.
        // we'll use the reliable test `err.name == "ErrnoError"` instead
        constructor(errno) {
          super(runtimeInitialized ? strError(errno) : '');
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
        }
      },
  FSStream:class {
        shared = {};
        get object() {
          return this.node;
        }
        set object(val) {
          this.node = val;
        }
        get isRead() {
          return (this.flags & 2097155) !== 1;
        }
        get isWrite() {
          return (this.flags & 2097155) !== 0;
        }
        get isAppend() {
          return (this.flags & 1024);
        }
        get flags() {
          return this.shared.flags;
        }
        set flags(val) {
          this.shared.flags = val;
        }
        get position() {
          return this.shared.position;
        }
        set position(val) {
          this.shared.position = val;
        }
      },
  FSNode:class {
        node_ops = {};
        stream_ops = {};
        readMode = 292 | 73;
        writeMode = 146;
        mounted = null;
        constructor(parent, name, mode, rdev) {
          if (!parent) {
            parent = this;  // root node sets parent to itself
          }
          this.parent = parent;
          this.mount = parent.mount;
          this.id = FS.nextInode++;
          this.name = name;
          this.mode = mode;
          this.rdev = rdev;
          this.atime = this.mtime = this.ctime = Date.now();
        }
        get read() {
          return (this.mode & this.readMode) === this.readMode;
        }
        set read(val) {
          val ? this.mode |= this.readMode : this.mode &= ~this.readMode;
        }
        get write() {
          return (this.mode & this.writeMode) === this.writeMode;
        }
        set write(val) {
          val ? this.mode |= this.writeMode : this.mode &= ~this.writeMode;
        }
        get isFolder() {
          return FS.isDir(this.mode);
        }
        get isDevice() {
          return FS.isChrdev(this.mode);
        }
      },
  lookupPath(path, opts = {}) {
        if (!path) {
          throw new FS.ErrnoError(44);
        }
        opts.follow_mount ??= true
  
        if (!PATH.isAbs(path)) {
          path = FS.cwd() + '/' + path;
        }
  
        // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
        linkloop: for (var nlinks = 0; nlinks < 40; nlinks++) {
          // split the absolute path
          var parts = path.split('/').filter((p) => !!p);
  
          // start at the root
          var current = FS.root;
          var current_path = '/';
  
          for (var i = 0; i < parts.length; i++) {
            var islast = (i === parts.length-1);
            if (islast && opts.parent) {
              // stop resolving
              break;
            }
  
            if (parts[i] === '.') {
              continue;
            }
  
            if (parts[i] === '..') {
              current_path = PATH.dirname(current_path);
              if (FS.isRoot(current)) {
                path = current_path + '/' + parts.slice(i + 1).join('/');
                // We're making progress here, don't let many consecutive ..'s
                // lead to ELOOP
                nlinks--;
                continue linkloop;
              } else {
                current = current.parent;
              }
              continue;
            }
  
            current_path = PATH.join2(current_path, parts[i]);
            try {
              current = FS.lookupNode(current, parts[i]);
            } catch (e) {
              // if noent_okay is true, suppress a ENOENT in the last component
              // and return an object with an undefined node. This is needed for
              // resolving symlinks in the path when creating a file.
              if ((e?.errno === 44) && islast && opts.noent_okay) {
                return { path: current_path };
              }
              throw e;
            }
  
            // jump to the mount's root node if this is a mountpoint
            if (FS.isMountpoint(current) && (!islast || opts.follow_mount)) {
              current = current.mounted.root;
            }
  
            // by default, lookupPath will not follow a symlink if it is the final path component.
            // setting opts.follow = true will override this behavior.
            if (FS.isLink(current.mode) && (!islast || opts.follow)) {
              if (!current.node_ops.readlink) {
                throw new FS.ErrnoError(52);
              }
              var link = current.node_ops.readlink(current);
              if (!PATH.isAbs(link)) {
                link = PATH.dirname(current_path) + '/' + link;
              }
              path = link + '/' + parts.slice(i + 1).join('/');
              continue linkloop;
            }
          }
          return { path: current_path, node: current };
        }
        throw new FS.ErrnoError(32);
      },
  getPath(node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? `${mount}/${path}` : mount + path;
          }
          path = path ? `${node.name}/${path}` : node.name;
          node = node.parent;
        }
      },
  hashName(parentid, name) {
        var hash = 0;
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },
  hashAddNode(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },
  hashRemoveNode(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },
  lookupNode(parent, name) {
        var errCode = FS.mayLookup(parent);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },
  createNode(parent, name, mode, rdev) {
        assert(typeof parent == 'object')
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },
  destroyNode(node) {
        FS.hashRemoveNode(node);
      },
  isRoot(node) {
        return node === node.parent;
      },
  isMountpoint(node) {
        return !!node.mounted;
      },
  isFile(mode) {
        return (mode & 61440) === 32768;
      },
  isDir(mode) {
        return (mode & 61440) === 16384;
      },
  isLink(mode) {
        return (mode & 61440) === 40960;
      },
  isChrdev(mode) {
        return (mode & 61440) === 8192;
      },
  isBlkdev(mode) {
        return (mode & 61440) === 24576;
      },
  isFIFO(mode) {
        return (mode & 61440) === 4096;
      },
  isSocket(mode) {
        return (mode & 49152) === 49152;
      },
  flagsToPermissionString(flag) {
        var perms = ['r', 'w', 'rw'][flag & 3];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },
  nodePermissions(node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.includes('r') && !(node.mode & 292)) {
          return 2;
        } else if (perms.includes('w') && !(node.mode & 146)) {
          return 2;
        } else if (perms.includes('x') && !(node.mode & 73)) {
          return 2;
        }
        return 0;
      },
  mayLookup(dir) {
        if (!FS.isDir(dir.mode)) return 54;
        var errCode = FS.nodePermissions(dir, 'x');
        if (errCode) return errCode;
        if (!dir.node_ops.lookup) return 2;
        return 0;
      },
  mayCreate(dir, name) {
        if (!FS.isDir(dir.mode)) {
          return 54;
        }
        try {
          var node = FS.lookupNode(dir, name);
          return 20;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },
  mayDelete(dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var errCode = FS.nodePermissions(dir, 'wx');
        if (errCode) {
          return errCode;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return 54;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return 10;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return 31;
          }
        }
        return 0;
      },
  mayOpen(node, flags) {
        if (!node) {
          return 44;
        }
        if (FS.isLink(node.mode)) {
          return 32;
        } else if (FS.isDir(node.mode)) {
          if (FS.flagsToPermissionString(flags) !== 'r' // opening for write
              || (flags & (512 | 64))) { // TODO: check for O_SEARCH? (== search for dir only)
            return 31;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },
  checkOpExists(op, err) {
        if (!op) {
          throw new FS.ErrnoError(err);
        }
        return op;
      },
  MAX_OPEN_FDS:4096,
  nextfd() {
        for (var fd = 0; fd <= FS.MAX_OPEN_FDS; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(33);
      },
  getStreamChecked(fd) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(8);
        }
        return stream;
      },
  getStream:(fd) => FS.streams[fd],
  createStream(stream, fd = -1) {
        assert(fd >= -1);
  
        // clone it, so we can return an instance of FSStream
        stream = Object.assign(new FS.FSStream(), stream);
        if (fd == -1) {
          fd = FS.nextfd();
        }
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },
  closeStream(fd) {
        FS.streams[fd] = null;
      },
  dupStream(origStream, fd = -1) {
        var stream = FS.createStream(origStream, fd);
        stream.stream_ops?.dup?.(stream);
        return stream;
      },
  doSetAttr(stream, node, attr) {
        var setattr = stream?.stream_ops.setattr;
        var arg = setattr ? stream : node;
        setattr ??= node.node_ops.setattr;
        FS.checkOpExists(setattr, 63)
        setattr(arg, attr);
      },
  chrdev_stream_ops:{
  open(stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          stream.stream_ops.open?.(stream);
        },
  llseek() {
          throw new FS.ErrnoError(70);
        },
  },
  major:(dev) => ((dev) >> 8),
  minor:(dev) => ((dev) & 0xff),
  makedev:(ma, mi) => ((ma) << 8 | (mi)),
  registerDevice(dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },
  getDevice:(dev) => FS.devices[dev],
  getMounts(mount) {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push(...m.mounts);
        }
  
        return mounts;
      },
  syncfs(populate, callback) {
        if (typeof populate == 'function') {
          callback = populate;
          populate = false;
        }
  
        FS.syncFSRequests++;
  
        if (FS.syncFSRequests > 1) {
          err(`warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`);
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function doCallback(errCode) {
          assert(FS.syncFSRequests > 0);
          FS.syncFSRequests--;
          return callback(errCode);
        }
  
        function done(errCode) {
          if (errCode) {
            if (!done.errored) {
              done.errored = true;
              return doCallback(errCode);
            }
            return;
          }
          if (++completed >= mounts.length) {
            doCallback(null);
          }
        };
  
        // sync all mounts
        for (var mount of mounts) {
          if (mount.type.syncfs) {
            mount.type.syncfs(mount, populate, done);
          } else {
            done(null);
          }
        }
      },
  mount(type, opts, mountpoint) {
        if (typeof type == 'string') {
          // The filesystem was not included, and instead we have an error
          // message stored in the variable.
          throw type;
        }
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(10);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(54);
          }
        }
  
        var mount = {
          type,
          opts,
          mountpoint,
          mounts: []
        };
  
        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
  
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;
  
          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
  
        return mountRoot;
      },
  unmount(mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(28);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        for (var [hash, current] of Object.entries(FS.nameTable)) {
          while (current) {
            var next = current.name_next;
  
            if (mounts.includes(current.mount)) {
              FS.destroyNode(current);
            }
  
            current = next;
          }
        }
  
        // no longer a mountpoint
        node.mounted = null;
  
        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
      },
  lookup(parent, name) {
        return parent.node_ops.lookup(parent, name);
      },
  mknod(path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name) {
          throw new FS.ErrnoError(28);
        }
        if (name === '.' || name === '..') {
          throw new FS.ErrnoError(20);
        }
        var errCode = FS.mayCreate(parent, name);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(63);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },
  statfs(path) {
        return FS.statfsNode(FS.lookupPath(path, {follow: true}).node);
      },
  statfsStream(stream) {
        // We keep a separate statfsStream function because noderawfs overrides
        // it. In noderawfs, stream.node is sometimes null. Instead, we need to
        // look at stream.path.
        return FS.statfsNode(stream.node);
      },
  statfsNode(node) {
        // NOTE: None of the defaults here are true. We're just returning safe and
        //       sane values. Currently nodefs and rawfs replace these defaults,
        //       other file systems leave them alone.
        var rtn = {
          bsize: 4096,
          frsize: 4096,
          blocks: 1e6,
          bfree: 5e5,
          bavail: 5e5,
          files: FS.nextInode,
          ffree: FS.nextInode - 1,
          fsid: 42,
          flags: 2,
          namelen: 255,
        };
  
        if (node.node_ops.statfs) {
          Object.assign(rtn, node.node_ops.statfs(node.mount.opts.root));
        }
        return rtn;
      },
  create(path, mode = 0o666) {
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },
  mkdir(path, mode = 0o777) {
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },
  mkdirTree(path, mode) {
        var dirs = path.split('/');
        var d = '';
        for (var dir of dirs) {
          if (!dir) continue;
          if (d || PATH.isAbs(path)) d += '/';
          d += dir;
          try {
            FS.mkdir(d, mode);
          } catch(e) {
            if (e.errno != 20) throw e;
          }
        }
      },
  mkdev(path, mode, dev) {
        if (typeof dev == 'undefined') {
          dev = mode;
          mode = 0o666;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },
  symlink(oldpath, newpath) {
        if (!PATH_FS.resolve(oldpath)) {
          throw new FS.ErrnoError(44);
        }
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(44);
        }
        var newname = PATH.basename(newpath);
        var errCode = FS.mayCreate(parent, newname);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(63);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },
  rename(old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
  
        // let the errors from non existent directories percolate up
        lookup = FS.lookupPath(old_path, { parent: true });
        old_dir = lookup.node;
        lookup = FS.lookupPath(new_path, { parent: true });
        new_dir = lookup.node;
  
        if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(75);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH_FS.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(28);
        }
        // new path should not be an ancestor of the old path
        relative = PATH_FS.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(55);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var errCode = FS.mayDelete(old_dir, old_name, isdir);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        errCode = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(10);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          errCode = FS.nodePermissions(old_dir, 'w');
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
          // update old node (we do this here to avoid each backend
          // needing to)
          old_node.parent = new_dir;
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },
  rmdir(path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, true);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(10);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },
  readdir(path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        var readdir = FS.checkOpExists(node.node_ops.readdir, 54);
        return readdir(node);
      },
  unlink(path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(44);
        }
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, false);
        if (errCode) {
          // According to POSIX, we should map EISDIR to EPERM, but
          // we instead do what Linux does (and we must, as we use
          // the musl linux libc).
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(10);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },
  readlink(path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
          throw new FS.ErrnoError(44);
        }
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(28);
        }
        return link.node_ops.readlink(link);
      },
  stat(path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        var getattr = FS.checkOpExists(node.node_ops.getattr, 63);
        return getattr(node);
      },
  fstat(fd) {
        var stream = FS.getStreamChecked(fd);
        var node = stream.node;
        var getattr = stream.stream_ops.getattr;
        var arg = getattr ? stream : node;
        getattr ??= node.node_ops.getattr;
        FS.checkOpExists(getattr, 63)
        return getattr(arg);
      },
  lstat(path) {
        return FS.stat(path, true);
      },
  doChmod(stream, node, mode, dontFollow) {
        FS.doSetAttr(stream, node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          ctime: Date.now(),
          dontFollow
        });
      },
  chmod(path, mode, dontFollow) {
        var node;
        if (typeof path == 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        FS.doChmod(null, node, mode, dontFollow);
      },
  lchmod(path, mode) {
        FS.chmod(path, mode, true);
      },
  fchmod(fd, mode) {
        var stream = FS.getStreamChecked(fd);
        FS.doChmod(stream, stream.node, mode, false);
      },
  doChown(stream, node, dontFollow) {
        FS.doSetAttr(stream, node, {
          timestamp: Date.now(),
          dontFollow
          // we ignore the uid / gid for now
        });
      },
  chown(path, uid, gid, dontFollow) {
        var node;
        if (typeof path == 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        FS.doChown(null, node, dontFollow);
      },
  lchown(path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },
  fchown(fd, uid, gid) {
        var stream = FS.getStreamChecked(fd);
        FS.doChown(stream, stream.node, false);
      },
  doTruncate(stream, node, len) {
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(28);
        }
        var errCode = FS.nodePermissions(node, 'w');
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        FS.doSetAttr(stream, node, {
          size: len,
          timestamp: Date.now()
        });
      },
  truncate(path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(28);
        }
        var node;
        if (typeof path == 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        FS.doTruncate(null, node, len);
      },
  ftruncate(fd, len) {
        var stream = FS.getStreamChecked(fd);
        if (len < 0 || (stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(28);
        }
        FS.doTruncate(stream, stream.node, len);
      },
  utime(path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        var setattr = FS.checkOpExists(node.node_ops.setattr, 63);
        setattr(node, {
          atime: atime,
          mtime: mtime
        });
      },
  open(path, flags, mode = 0o666) {
        if (path === "") {
          throw new FS.ErrnoError(44);
        }
        flags = typeof flags == 'string' ? FS_modeStringToFlags(flags) : flags;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        var isDirPath;
        if (typeof path == 'object') {
          node = path;
        } else {
          isDirPath = path.endsWith("/");
          // noent_okay makes it so that if the final component of the path
          // doesn't exist, lookupPath returns `node: undefined`. `path` will be
          // updated to point to the target of all symlinks.
          var lookup = FS.lookupPath(path, {
            follow: !(flags & 131072),
            noent_okay: true
          });
          node = lookup.node;
          path = lookup.path;
        }
        // perhaps we need to create the node
        var created = false;
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(20);
            }
          } else if (isDirPath) {
            throw new FS.ErrnoError(31);
          } else {
            // node doesn't exist, try to create it
            // Ignore the permission bits here to ensure we can `open` this new
            // file below. We use chmod below the apply the permissions once the
            // file is open.
            node = FS.mknod(path, mode | 0o777, 0);
            created = true;
          }
        }
        if (!node) {
          throw new FS.ErrnoError(44);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // if asked only for a directory, then this must be one
        if ((flags & 65536) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(54);
        }
        // check permissions, if this is not a file we just created now (it is ok to
        // create and write to a file with read-only permissions; it is read-only
        // for later use)
        if (!created) {
          var errCode = FS.mayOpen(node, flags);
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
        }
        // do truncation if necessary
        if ((flags & 512) && !created) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512 | 131072);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        });
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (created) {
          FS.chmod(node, mode & 0o777);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
          }
        }
        return stream;
      },
  close(stream) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (stream.getdents) stream.getdents = null; // free readdir state
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
        stream.fd = null;
      },
  isClosed(stream) {
        return stream.fd === null;
      },
  llseek(stream, offset, whence) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(70);
        }
        if (whence != 0 && whence != 1 && whence != 2) {
          throw new FS.ErrnoError(28);
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position;
      },
  read(stream, buffer, offset, length, position) {
        assert(offset >= 0);
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(28);
        }
        var seeking = typeof position != 'undefined';
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(70);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },
  write(stream, buffer, offset, length, position, canOwn) {
        assert(offset >= 0);
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(28);
        }
        if (stream.seekable && stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var seeking = typeof position != 'undefined';
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(70);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },
  mmap(stream, length, position, prot, flags) {
        // User requests writing to file (prot & PROT_WRITE != 0).
        // Checking if we have permissions to write to the file unless
        // MAP_PRIVATE flag is set. According to POSIX spec it is possible
        // to write to file opened in read-only mode with MAP_PRIVATE flag,
        // as all modifications will be visible only in the memory of
        // the current process.
        if ((prot & 2) !== 0
            && (flags & 2) === 0
            && (stream.flags & 2097155) !== 2) {
          throw new FS.ErrnoError(2);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(2);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(43);
        }
        if (!length) {
          throw new FS.ErrnoError(28);
        }
        return stream.stream_ops.mmap(stream, length, position, prot, flags);
      },
  msync(stream, buffer, offset, length, mmapFlags) {
        assert(offset >= 0);
        if (!stream.stream_ops.msync) {
          return 0;
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
      },
  ioctl(stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(59);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },
  readFile(path, opts = {}) {
        opts.flags = opts.flags || 0;
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          abort(`Invalid encoding type "${opts.encoding}"`);
        }
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          buf = UTF8ArrayToString(buf);
        }
        FS.close(stream);
        return buf;
      },
  writeFile(path, data, opts = {}) {
        opts.flags = opts.flags || 577;
        var stream = FS.open(path, opts.flags, opts.mode);
        if (typeof data == 'string') {
          data = new Uint8Array(intArrayFromString(data, true));
        }
        if (ArrayBuffer.isView(data)) {
          FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
        } else {
          abort('Unsupported data type');
        }
        FS.close(stream);
      },
  cwd:() => FS.currentPath,
  chdir(path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (lookup.node === null) {
          throw new FS.ErrnoError(44);
        }
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(54);
        }
        var errCode = FS.nodePermissions(lookup.node, 'x');
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        FS.currentPath = lookup.path;
      },
  createDefaultDirectories() {
        FS.mkdir('/tmp');
        FS.mkdir('/home');
        FS.mkdir('/home/web_user');
      },
  createDefaultDevices() {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: () => 0,
          write: (stream, buffer, offset, length, pos) => length,
          llseek: () => 0,
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using err() rather than out()
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // setup /dev/[u]random
        // use a buffer to avoid overhead of individual crypto calls per byte
        var randomBuffer = new Uint8Array(1024), randomLeft = 0;
        var randomByte = () => {
          if (randomLeft === 0) {
            randomFill(randomBuffer);
            randomLeft = randomBuffer.byteLength;
          }
          return randomBuffer[--randomLeft];
        };
        FS.createDevice('/dev', 'random', randomByte);
        FS.createDevice('/dev', 'urandom', randomByte);
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },
  createSpecialDirectories() {
        // create /proc/self/fd which allows /proc/self/fd/6 => readlink gives the
        // name of the stream for fd 6 (see test_unistd_ttyname)
        FS.mkdir('/proc');
        var proc_self = FS.mkdir('/proc/self');
        FS.mkdir('/proc/self/fd');
        FS.mount({
          mount() {
            var node = FS.createNode(proc_self, 'fd', 16895, 73);
            node.stream_ops = {
              llseek: MEMFS.stream_ops.llseek,
            };
            node.node_ops = {
              lookup(parent, name) {
                var fd = +name;
                var stream = FS.getStreamChecked(fd);
                var ret = {
                  parent: null,
                  mount: { mountpoint: 'fake' },
                  node_ops: { readlink: () => stream.path },
                  id: fd + 1,
                };
                ret.parent = ret; // make it look like a simple root node
                return ret;
              },
              readdir() {
                return Array.from(FS.streams.entries())
                  .filter(([k, v]) => v)
                  .map(([k, v]) => k.toString());
              }
            };
            return node;
          }
        }, {}, '/proc/self/fd');
      },
  createStandardStreams(input, output, error) {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (input) {
          FS.createDevice('/dev', 'stdin', input);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (output) {
          FS.createDevice('/dev', 'stdout', null, output);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (error) {
          FS.createDevice('/dev', 'stderr', null, error);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 0);
        var stdout = FS.open('/dev/stdout', 1);
        var stderr = FS.open('/dev/stderr', 1);
        assert(stdin.fd === 0, `invalid handle for stdin (${stdin.fd})`);
        assert(stdout.fd === 1, `invalid handle for stdout (${stdout.fd})`);
        assert(stderr.fd === 2, `invalid handle for stderr (${stderr.fd})`);
      },
  staticInit() {
        FS.nameTable = new Array(4096);
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
  
        FS.filesystems = {
          'MEMFS': MEMFS,
          'IDBFS': IDBFS,
        };
      },
  init(input, output, error) {
        assert(!FS.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.initialized = true;
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        input ??= Module['stdin'];
        output ??= Module['stdout'];
        error ??= Module['stderr'];
  
        FS.createStandardStreams(input, output, error);
      },
  quit() {
        FS.initialized = false;
        // force-flush all streams, so we get musl std streams printed out
        _fflush(0);
        // close all of our streams
        for (var stream of FS.streams) {
          if (stream) {
            FS.close(stream);
          }
        }
      },
  findObject(path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (!ret.exists) {
          return null;
        }
        return ret.object;
      },
  analyzePath(path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },
  createPath(parent, path, canRead, canWrite) {
        parent = typeof parent == 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            if (e.errno != 20) throw e;
          }
          parent = current;
        }
        return current;
      },
  createFile(parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent == 'string' ? parent : FS.getPath(parent), name);
        var mode = FS_getMode(canRead, canWrite);
        return FS.create(path, mode);
      },
  createDataFile(parent, name, data, canRead, canWrite, canOwn) {
        var path = name;
        if (parent) {
          parent = typeof parent == 'string' ? parent : FS.getPath(parent);
          path = name ? PATH.join2(parent, name) : parent;
        }
        var mode = FS_getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data == 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 577);
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
      },
  createDevice(parent, name, input, output) {
        var path = PATH.join2(typeof parent == 'string' ? parent : FS.getPath(parent), name);
        var mode = FS_getMode(!!input, !!output);
        FS.createDevice.major ??= 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open(stream) {
            stream.seekable = false;
          },
          close(stream) {
            // flush any pending line data
            if (output?.buffer?.length) {
              output(10);
            }
          },
          read(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(6);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.atime = Date.now();
            }
            return bytesRead;
          },
          write(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
            }
            if (length) {
              stream.node.mtime = stream.node.ctime = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },
  forceLoadFile(obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        if (globalThis.XMLHttpRequest) {
          abort("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else { // Command-line.
          try {
            obj.contents = readBinary(obj.url);
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
        }
      },
  createLazyFile(parent, name, url, canRead, canWrite) {
        // Lazy chunked Uint8Array (implements get and length from Uint8Array).
        // Actual getting is abstracted away for eventual reuse.
        class LazyUint8Array {
          lengthKnown = false;
          chunks = []; // Loaded chunks. Index is the chunk number
          get(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = (idx / this.chunkSize)|0;
            return this.getter(chunkNum)[chunkOffset];
          }
          setDataGetter(getter) {
            this.getter = getter;
          }
          cacheLength() {
            // Find length
            var xhr = new XMLHttpRequest();
            xhr.open('HEAD', url, false);
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) abort("Couldn't load " + url + ". Status: " + xhr.status);
            var datalength = Number(xhr.getResponseHeader("Content-length"));
            var header;
            var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
            var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
  
            var chunkSize = 1024*1024; // Chunk size in bytes
  
            if (!hasByteServing) chunkSize = datalength;
  
            // Function to get a range from the remote URL.
            var doXHR = (from, to) => {
              if (from > to) abort("invalid range (" + from + ", " + to + ") or no bytes requested!");
              if (to > datalength-1) abort("only " + datalength + " bytes available! programmer error!");
  
              // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
              var xhr = new XMLHttpRequest();
              xhr.open('GET', url, false);
              if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
              // Some hints to the browser that we want binary data.
              xhr.responseType = 'arraybuffer';
              if (xhr.overrideMimeType) {
                xhr.overrideMimeType('text/plain; charset=x-user-defined');
              }
  
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) abort("Couldn't load " + url + ". Status: " + xhr.status);
              if (xhr.response !== undefined) {
                return new Uint8Array(/** @type{Array<number>} */(xhr.response || []));
              }
              return intArrayFromString(xhr.responseText || '', true);
            };
            var lazyArray = this;
            lazyArray.setDataGetter((chunkNum) => {
              var start = chunkNum * chunkSize;
              var end = (chunkNum+1) * chunkSize - 1; // including this byte
              end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
              if (typeof lazyArray.chunks[chunkNum] == 'undefined') {
                lazyArray.chunks[chunkNum] = doXHR(start, end);
              }
              if (typeof lazyArray.chunks[chunkNum] == 'undefined') abort('doXHR failed!');
              return lazyArray.chunks[chunkNum];
            });
  
            if (usesGzip || !datalength) {
              // if the server uses gzip or doesn't supply the length, we have to download the whole file to get the (uncompressed) length
              chunkSize = datalength = 1; // this will force getter(0)/doXHR do download the whole file
              datalength = this.getter(0).length;
              chunkSize = datalength;
              out("LazyFiles on gzip forces download of the whole file when length is accessed");
            }
  
            this._length = datalength;
            this._chunkSize = chunkSize;
            this.lengthKnown = true;
          }
          get length() {
            if (!this.lengthKnown) {
              this.cacheLength();
            }
            return this._length;
          }
          get chunkSize() {
            if (!this.lengthKnown) {
              this.cacheLength();
            }
            return this._chunkSize;
          }
        }
  
        if (globalThis.XMLHttpRequest) {
          if (!ENVIRONMENT_IS_WORKER) abort('Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc');
          var lazyArray = new LazyUint8Array();
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // Add a function that defers querying the file size until it is asked the first time.
        Object.defineProperties(node, {
          usedBytes: {
            get: function() { return this.contents.length; }
          }
        });
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        for (const [key, fn] of Object.entries(node.stream_ops)) {
          stream_ops[key] = (...args) => {
            FS.forceLoadFile(node);
            return fn(...args);
          };
        }
        function writeChunks(stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        }
        // use a custom read function
        stream_ops.read = (stream, buffer, offset, length, position) => {
          FS.forceLoadFile(node);
          return writeChunks(stream, buffer, offset, length, position)
        };
        // use a custom mmap function
        stream_ops.mmap = (stream, length, position, prot, flags) => {
          FS.forceLoadFile(node);
          var ptr = mmapAlloc(length);
          if (!ptr) {
            throw new FS.ErrnoError(48);
          }
          writeChunks(stream, HEAP8, ptr, length, position);
          return { ptr, allocated: true };
        };
        node.stream_ops = stream_ops;
        return node;
      },
  absolutePath() {
        abort('FS.absolutePath has been removed; use PATH_FS.resolve instead');
      },
  createFolder() {
        abort('FS.createFolder has been removed; use FS.mkdir instead');
      },
  createLink() {
        abort('FS.createLink has been removed; use FS.symlink instead');
      },
  joinPath() {
        abort('FS.joinPath has been removed; use PATH.join instead');
      },
  mmapAlloc() {
        abort('FS.mmapAlloc has been replaced by the top level function mmapAlloc');
      },
  standardizePath() {
        abort('FS.standardizePath has been removed; use PATH.normalize instead');
      },
  };
  
  var SYSCALLS = {
  DEFAULT_POLLMASK:5,
  calculateAt(dirfd, path, allowEmpty) {
        if (PATH.isAbs(path)) {
          return path;
        }
        // relative path
        var dir;
        if (dirfd === -100) {
          dir = FS.cwd();
        } else {
          var dirstream = SYSCALLS.getStreamFromFD(dirfd);
          dir = dirstream.path;
        }
        if (path.length == 0) {
          if (!allowEmpty) {
            throw new FS.ErrnoError(44);;
          }
          return dir;
        }
        return dir + '/' + path;
      },
  writeStat(buf, stat) {
        HEAPU32[((buf)>>2)] = stat.dev;
        HEAPU32[(((buf)+(4))>>2)] = stat.mode;
        HEAPU32[(((buf)+(8))>>2)] = stat.nlink;
        HEAPU32[(((buf)+(12))>>2)] = stat.uid;
        HEAPU32[(((buf)+(16))>>2)] = stat.gid;
        HEAPU32[(((buf)+(20))>>2)] = stat.rdev;
        (tempI64 = [stat.size>>>0,(tempDouble = stat.size,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? (+(Math.floor((tempDouble)/4294967296.0)))>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)], HEAP32[(((buf)+(24))>>2)] = tempI64[0],HEAP32[(((buf)+(28))>>2)] = tempI64[1]);
        HEAP32[(((buf)+(32))>>2)] = 4096;
        HEAP32[(((buf)+(36))>>2)] = stat.blocks;
        var atime = stat.atime.getTime();
        var mtime = stat.mtime.getTime();
        var ctime = stat.ctime.getTime();
        (tempI64 = [Math.floor(atime / 1000)>>>0,(tempDouble = Math.floor(atime / 1000),(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? (+(Math.floor((tempDouble)/4294967296.0)))>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)], HEAP32[(((buf)+(40))>>2)] = tempI64[0],HEAP32[(((buf)+(44))>>2)] = tempI64[1]);
        HEAPU32[(((buf)+(48))>>2)] = (atime % 1000) * 1000 * 1000;
        (tempI64 = [Math.floor(mtime / 1000)>>>0,(tempDouble = Math.floor(mtime / 1000),(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? (+(Math.floor((tempDouble)/4294967296.0)))>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)], HEAP32[(((buf)+(56))>>2)] = tempI64[0],HEAP32[(((buf)+(60))>>2)] = tempI64[1]);
        HEAPU32[(((buf)+(64))>>2)] = (mtime % 1000) * 1000 * 1000;
        (tempI64 = [Math.floor(ctime / 1000)>>>0,(tempDouble = Math.floor(ctime / 1000),(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? (+(Math.floor((tempDouble)/4294967296.0)))>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)], HEAP32[(((buf)+(72))>>2)] = tempI64[0],HEAP32[(((buf)+(76))>>2)] = tempI64[1]);
        HEAPU32[(((buf)+(80))>>2)] = (ctime % 1000) * 1000 * 1000;
        (tempI64 = [stat.ino>>>0,(tempDouble = stat.ino,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? (+(Math.floor((tempDouble)/4294967296.0)))>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)], HEAP32[(((buf)+(88))>>2)] = tempI64[0],HEAP32[(((buf)+(92))>>2)] = tempI64[1]);
        return 0;
      },
  writeStatFs(buf, stats) {
        HEAPU32[(((buf)+(4))>>2)] = stats.bsize;
        HEAPU32[(((buf)+(60))>>2)] = stats.bsize;
        (tempI64 = [stats.blocks>>>0,(tempDouble = stats.blocks,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? (+(Math.floor((tempDouble)/4294967296.0)))>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)], HEAP32[(((buf)+(8))>>2)] = tempI64[0],HEAP32[(((buf)+(12))>>2)] = tempI64[1]);
        (tempI64 = [stats.bfree>>>0,(tempDouble = stats.bfree,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? (+(Math.floor((tempDouble)/4294967296.0)))>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)], HEAP32[(((buf)+(16))>>2)] = tempI64[0],HEAP32[(((buf)+(20))>>2)] = tempI64[1]);
        (tempI64 = [stats.bavail>>>0,(tempDouble = stats.bavail,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? (+(Math.floor((tempDouble)/4294967296.0)))>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)], HEAP32[(((buf)+(24))>>2)] = tempI64[0],HEAP32[(((buf)+(28))>>2)] = tempI64[1]);
        (tempI64 = [stats.files>>>0,(tempDouble = stats.files,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? (+(Math.floor((tempDouble)/4294967296.0)))>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)], HEAP32[(((buf)+(32))>>2)] = tempI64[0],HEAP32[(((buf)+(36))>>2)] = tempI64[1]);
        (tempI64 = [stats.ffree>>>0,(tempDouble = stats.ffree,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? (+(Math.floor((tempDouble)/4294967296.0)))>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)], HEAP32[(((buf)+(40))>>2)] = tempI64[0],HEAP32[(((buf)+(44))>>2)] = tempI64[1]);
        HEAPU32[(((buf)+(48))>>2)] = stats.fsid;
        HEAPU32[(((buf)+(64))>>2)] = stats.flags;  // ST_NOSUID
        HEAPU32[(((buf)+(56))>>2)] = stats.namelen;
      },
  doMsync(addr, stream, len, flags, offset) {
        if (!FS.isFile(stream.node.mode)) {
          throw new FS.ErrnoError(43);
        }
        if (flags & 2) {
          // MAP_PRIVATE calls need not to be synced back to underlying fs
          return 0;
        }
        var buffer = HEAPU8.slice(addr, addr + len);
        FS.msync(stream, buffer, offset, len, flags);
      },
  getStreamFromFD(fd) {
        var stream = FS.getStreamChecked(fd);
        return stream;
      },
  varargs:undefined,
  getStr(ptr) {
        var ret = UTF8ToString(ptr);
        return ret;
      },
  };
  var ___syscall__newselect = function (nfds, readfds, writefds, exceptfds, timeout) {
  try {
  
      // readfds are supported,
      // writefds checks socket open status
      // exceptfds are supported, although on web, such exceptional conditions never arise in web sockets
      //                          and so the exceptfds list will always return empty.
      // timeout is supported, although on SOCKFS and PIPEFS these are ignored and always treated as 0 - fully async
      assert(nfds <= 64, 'nfds must be less than or equal to 64');  // fd sets have 64 bits // TODO: this could be 1024 based on current musl headers
  
      var total = 0;
  
      var srcReadLow = (readfds ? HEAP32[((readfds)>>2)] : 0),
          srcReadHigh = (readfds ? HEAP32[(((readfds)+(4))>>2)] : 0);
      var srcWriteLow = (writefds ? HEAP32[((writefds)>>2)] : 0),
          srcWriteHigh = (writefds ? HEAP32[(((writefds)+(4))>>2)] : 0);
      var srcExceptLow = (exceptfds ? HEAP32[((exceptfds)>>2)] : 0),
          srcExceptHigh = (exceptfds ? HEAP32[(((exceptfds)+(4))>>2)] : 0);
  
      var dstReadLow = 0,
          dstReadHigh = 0;
      var dstWriteLow = 0,
          dstWriteHigh = 0;
      var dstExceptLow = 0,
          dstExceptHigh = 0;
  
      var allLow = (readfds ? HEAP32[((readfds)>>2)] : 0) |
                   (writefds ? HEAP32[((writefds)>>2)] : 0) |
                   (exceptfds ? HEAP32[((exceptfds)>>2)] : 0);
      var allHigh = (readfds ? HEAP32[(((readfds)+(4))>>2)] : 0) |
                    (writefds ? HEAP32[(((writefds)+(4))>>2)] : 0) |
                    (exceptfds ? HEAP32[(((exceptfds)+(4))>>2)] : 0);
  
      var check = (fd, low, high, val) => fd < 32 ? (low & val) : (high & val);
  
      for (var fd = 0; fd < nfds; fd++) {
        var mask = 1 << (fd % 32);
        if (!(check(fd, allLow, allHigh, mask))) {
          continue;  // index isn't in the set
        }
  
        var stream = SYSCALLS.getStreamFromFD(fd);
  
        var flags = SYSCALLS.DEFAULT_POLLMASK;
  
        if (stream.stream_ops.poll) {
          var timeoutInMillis = -1;
          if (timeout) {
            // select(2) is declared to accept "struct timeval { time_t tv_sec; suseconds_t tv_usec; }".
            // However, musl passes the two values to the syscall as an array of long values.
            // Note that sizeof(time_t) != sizeof(long) in wasm32. The former is 8, while the latter is 4.
            // This means using "C_STRUCTS.timeval.tv_usec" leads to a wrong offset.
            // So, instead, we use POINTER_SIZE.
            var tv_sec = (readfds ? HEAP32[((timeout)>>2)] : 0),
                tv_usec = (readfds ? HEAP32[(((timeout)+(4))>>2)] : 0);
            timeoutInMillis = (tv_sec + tv_usec / 1000000) * 1000;
          }
          flags = stream.stream_ops.poll(stream, timeoutInMillis);
        }
  
        if ((flags & 1) && check(fd, srcReadLow, srcReadHigh, mask)) {
          fd < 32 ? (dstReadLow = dstReadLow | mask) : (dstReadHigh = dstReadHigh | mask);
          total++;
        }
        if ((flags & 4) && check(fd, srcWriteLow, srcWriteHigh, mask)) {
          fd < 32 ? (dstWriteLow = dstWriteLow | mask) : (dstWriteHigh = dstWriteHigh | mask);
          total++;
        }
        if ((flags & 2) && check(fd, srcExceptLow, srcExceptHigh, mask)) {
          fd < 32 ? (dstExceptLow = dstExceptLow | mask) : (dstExceptHigh = dstExceptHigh | mask);
          total++;
        }
      }
  
      if (readfds) {
        HEAP32[((readfds)>>2)] = dstReadLow;
        HEAP32[(((readfds)+(4))>>2)] = dstReadHigh;
      }
      if (writefds) {
        HEAP32[((writefds)>>2)] = dstWriteLow;
        HEAP32[(((writefds)+(4))>>2)] = dstWriteHigh;
      }
      if (exceptfds) {
        HEAP32[((exceptfds)>>2)] = dstExceptLow;
        HEAP32[(((exceptfds)+(4))>>2)] = dstExceptHigh;
      }
  
      return total;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  };

  var SOCKFS = {
  websocketArgs:{
  },
  callbacks:{
  },
  on(event, callback) {
        SOCKFS.callbacks[event] = callback;
      },
  emit(event, param) {
        SOCKFS.callbacks[event]?.(param);
      },
  mount(mount) {
        // The incomming Module['websocket'] can be used for configuring 
        // configuring subprotocol/url, etc
        SOCKFS.websocketArgs = Module['websocket'] || {};
        // Add the Event registration mechanism to the exported websocket configuration
        // object so we can register network callbacks from native JavaScript too.
        // For more documentation see system/include/emscripten/emscripten.h
        (Module['websocket'] ??= {})['on'] = SOCKFS.on;
  
        return FS.createNode(null, '/', 16895, 0);
      },
  createSocket(family, type, protocol) {
        // Emscripten only supports AF_INET
        if (family != 2) {
          throw new FS.ErrnoError(5);
        }
        type &= ~526336; // Some applications may pass it; it makes no sense for a single process.
        // Emscripten only supports SOCK_STREAM and SOCK_DGRAM
        if (type != 1 && type != 2) {
          throw new FS.ErrnoError(28);
        }
        var streaming = type == 1;
        if (streaming && protocol && protocol != 6) {
          throw new FS.ErrnoError(66); // if SOCK_STREAM, must be tcp or 0.
        }
  
        // create our internal socket structure
        var sock = {
          family,
          type,
          protocol,
          server: null,
          error: null, // Used in getsockopt for SOL_SOCKET/SO_ERROR test
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
  
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
  
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node,
          flags: 2,
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
  
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
  
        return sock;
      },
  getSocket(fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },
  stream_ops:{
  poll(stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },
  ioctl(stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },
  read(stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },
  write(stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },
  close(stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        },
  },
  nextname() {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return `socket[${SOCKFS.nextname.current++}]`;
      },
  websocket_sock_ops:{
  createPeer(sock, addr, port) {
          var ws;
  
          if (typeof addr == 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
  
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              // The default value is 'ws://' the replace is needed because the compiler replaces '//' comments with '#'
              // comments without checking context, so we'd end up with ws:#, the replace swaps the '#' for '//' again.
              var url = 'ws://'.replace('#', '//');
              // Make the WebSocket subprotocol (Sec-WebSocket-Protocol) default to binary if no configuration is set.
              var subProtocols = 'binary'; // The default value is 'binary'
              // The default WebSocket options
              var opts = undefined;
  
              // Fetch runtime WebSocket URL config.
              if (SOCKFS.websocketArgs['url']) {
                url = SOCKFS.websocketArgs['url'];
              }
              // Fetch runtime WebSocket subprotocol config.
              if (SOCKFS.websocketArgs['subprotocol']) {
                subProtocols = SOCKFS.websocketArgs['subprotocol'];
              } else if (SOCKFS.websocketArgs['subprotocol'] === null) {
                subProtocols = 'null'
              }
  
              if (url === 'ws://' || url === 'wss://') { // Is the supplied URL config just a prefix, if so complete it.
                var parts = addr.split('/');
                url = url + parts[0] + ":" + port + "/" + parts.slice(1).join('/');
              }
  
              if (subProtocols !== 'null') {
                // The regex trims the string (removes spaces at the beginning and end, then splits the string by
                // <any space>,<any space> into an Array. Whitespace removal is important for Websockify and ws.
                subProtocols = subProtocols.replace(/^ +| +$/g,"").split(/ *, */);
  
                opts = subProtocols;
              }
  
              // If node we use the ws library.
              var WebSocketConstructor;
              {
                WebSocketConstructor = WebSocket;
              }
              ws = new WebSocketConstructor(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(23);
            }
          }
  
          var peer = {
            addr,
            port,
            socket: ws,
            msg_send_queue: []
          };
  
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
  
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport != 'undefined') {
            peer.msg_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
  
          return peer;
        },
  getPeer(sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },
  addPeer(sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },
  removePeer(sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },
  handlePeerEvents(sock, peer) {
          var first = true;
  
          var handleOpen = function () {
  
            sock.connecting = false;
            SOCKFS.emit('open', sock.stream.fd);
  
            try {
              var queued = peer.msg_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.msg_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
  
          function handleMessage(data) {
            if (typeof data == 'string') {
              var encoder = new TextEncoder(); // should be utf-8
              data = encoder.encode(data); // make a typed array from the string
            } else {
              assert(data.byteLength !== undefined); // must receive an ArrayBuffer
              if (data.byteLength == 0) {
                // An empty ArrayBuffer will emit a pseudo disconnect event
                // as recv/recvmsg will return zero which indicates that a socket
                // has performed a shutdown although the connection has not been disconnected yet.
                return;
              }
              data = new Uint8Array(data); // make a typed array view on the array buffer
            }
  
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
  
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
            SOCKFS.emit('message', sock.stream.fd);
          };
  
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, isBinary) {
              if (!isBinary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer); // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('close', function() {
              SOCKFS.emit('close', sock.stream.fd);
            });
            peer.socket.on('error', function(error) {
              // Although the ws library may pass errors that may be more descriptive than
              // ECONNREFUSED they are not necessarily the expected error code e.g.
              // ENOTFOUND on getaddrinfo seems to be node.js specific, so using ECONNREFUSED
              // is still probably the most useful thing to do.
              sock.error = 14; // Used in getsockopt for SOL_SOCKET/SO_ERROR test.
              SOCKFS.emit('error', [sock.stream.fd, sock.error, 'ECONNREFUSED: Connection refused']);
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onclose = function() {
              SOCKFS.emit('close', sock.stream.fd);
            };
            peer.socket.onmessage = function peer_socket_onmessage(event) {
              handleMessage(event.data);
            };
            peer.socket.onerror = function(error) {
              // The WebSocket spec only allows a 'simple event' to be thrown on error,
              // so we only really know as much as ECONNREFUSED.
              sock.error = 14; // Used in getsockopt for SOL_SOCKET/SO_ERROR test.
              SOCKFS.emit('error', [sock.stream.fd, sock.error, 'ECONNREFUSED: Connection refused']);
            };
          }
        },
  poll(sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
  
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
  
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
  
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
  
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            // When an non-blocking connect fails mark the socket as writable.
            // Its up to the calling code to then use getsockopt with SO_ERROR to
            // retrieve the error.
            // See https://man7.org/linux/man-pages/man2/connect.2.html
            if (sock.connecting) {
              mask |= 4;
            } else  {
              mask |= 16;
            }
          }
  
          return mask;
        },
  ioctl(sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)] = bytes;
              return 0;
            case 21537:
              var on = HEAP32[((arg)>>2)];
              if (on) {
                sock.stream.flags |= 2048;
              } else {
                sock.stream.flags &= ~2048;
              }
              return 0;
            default:
              return 28;
          }
        },
  close(sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          for (var peer of Object.values(sock.peers)) {
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },
  bind(sock, addr, port) {
          if (typeof sock.saddr != 'undefined' || typeof sock.sport != 'undefined') {
            throw new FS.ErrnoError(28);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port;
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e.name === 'ErrnoError')) throw e;
              if (e.errno !== 138) throw e;
            }
          }
        },
  connect(sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(138);
          }
  
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
  
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr != 'undefined' && typeof sock.dport != 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(7);
              } else {
                throw new FS.ErrnoError(30);
              }
            }
          }
  
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
  
          // because we cannot synchronously block to wait for the WebSocket
          // connection to complete, we return here pretending that the connection
          // was a success.
          sock.connecting = true;
        },
  listen(sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(138);
          }
        },
  accept(listensock) {
          if (!listensock.server || !listensock.pending.length) {
            throw new FS.ErrnoError(28);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },
  getname(sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(53);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr, port };
        },
  sendmsg(sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(17);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
  
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
  
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(53);
            }
          }
  
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          if (ArrayBuffer.isView(buffer)) {
            offset += buffer.byteOffset;
            buffer = buffer.buffer;
          }
  
          var data = buffer.slice(offset, offset + length);
  
          // if we don't have a cached connectionless UDP datagram connection, or
          // the TCP socket is still connecting, queue the message to be sent upon
          // connect, and lie, saying the data was sent now.
          if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
            // if we're not connected, open a new connection
            if (sock.type === 2) {
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
            }
            dest.msg_send_queue.push(data);
            return length;
          }
  
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(28);
          }
        },
  recvmsg(sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(53);
          }
  
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
  
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(53);
              }
              if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              // else, our socket is in a valid state but truly has nothing available
              throw new FS.ErrnoError(6);
            }
            throw new FS.ErrnoError(6);
          }
  
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
  
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
  
          return res;
        },
  },
  };
  
  var getSocketFromFD = (fd) => {
      var socket = SOCKFS.getSocket(fd);
      if (!socket) throw new FS.ErrnoError(8);
      return socket;
    };
  
  var inetPton4 = (str) => {
      var b = str.split('.');
      for (var i = 0; i < 4; i++) {
        var tmp = Number(b[i]);
        if (isNaN(tmp)) return null;
        b[i] = tmp;
      }
      return (b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24)) >>> 0;
    };
  
  var inetPton6 = (str) => {
      var words;
      var w, offset, z, i;
      /* http://home.deds.nl/~aeron/regex/ */
      var valid6regx = /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i
      var parts = [];
      if (!valid6regx.test(str)) {
        return null;
      }
      if (str === "::") {
        return [0, 0, 0, 0, 0, 0, 0, 0];
      }
      // Z placeholder to keep track of zeros when splitting the string on ":"
      if (str.startsWith("::")) {
        str = str.replace("::", "Z:"); // leading zeros case
      } else {
        str = str.replace("::", ":Z:");
      }
  
      if (str.indexOf(".") > 0) {
        // parse IPv4 embedded stress
        str = str.replace(new RegExp('[.]', 'g'), ":");
        words = str.split(":");
        words[words.length-4] = Number(words[words.length-4]) + Number(words[words.length-3])*256;
        words[words.length-3] = Number(words[words.length-2]) + Number(words[words.length-1])*256;
        words = words.slice(0, words.length-2);
      } else {
        words = str.split(":");
      }
  
      offset = 0; z = 0;
      for (w=0; w < words.length; w++) {
        if (typeof words[w] == 'string') {
          if (words[w] === 'Z') {
            // compressed zeros - write appropriate number of zero words
            for (z = 0; z < (8 - words.length+1); z++) {
              parts[w+z] = 0;
            }
            offset = z-1;
          } else {
            // parse hex to field to 16-bit value and write it in network byte-order
            parts[w+offset] = _htons(parseInt(words[w],16));
          }
        } else {
          // parsed IPv4 words
          parts[w+offset] = words[w];
        }
      }
      return [
        (parts[1] << 16) | parts[0],
        (parts[3] << 16) | parts[2],
        (parts[5] << 16) | parts[4],
        (parts[7] << 16) | parts[6]
      ];
    };
  
  var zeroMemory = (ptr, size) => HEAPU8.fill(0, ptr, ptr + size);
  
  /** @param {number=} addrlen */
  var writeSockaddr = (sa, family, addr, port, addrlen) => {
      switch (family) {
        case 2:
          addr = inetPton4(addr);
          zeroMemory(sa, 16);
          if (addrlen) {
            HEAP32[((addrlen)>>2)] = 16;
          }
          HEAP16[((sa)>>1)] = family;
          HEAP32[(((sa)+(4))>>2)] = addr;
          HEAP16[(((sa)+(2))>>1)] = _htons(port);
          break;
        case 10:
          addr = inetPton6(addr);
          zeroMemory(sa, 28);
          if (addrlen) {
            HEAP32[((addrlen)>>2)] = 28;
          }
          HEAP32[((sa)>>2)] = family;
          HEAP32[(((sa)+(8))>>2)] = addr[0];
          HEAP32[(((sa)+(12))>>2)] = addr[1];
          HEAP32[(((sa)+(16))>>2)] = addr[2];
          HEAP32[(((sa)+(20))>>2)] = addr[3];
          HEAP16[(((sa)+(2))>>1)] = _htons(port);
          break;
        default:
          return 5;
      }
      return 0;
    };
  
  
  var DNS = {
  address_map:{
  id:1,
  addrs:{
  },
  names:{
  },
  },
  lookup_name(name) {
        // If the name is already a valid ipv4 / ipv6 address, don't generate a fake one.
        var res = inetPton4(name);
        if (res !== null) {
          return name;
        }
        res = inetPton6(name);
        if (res !== null) {
          return name;
        }
  
        // See if this name is already mapped.
        var addr;
  
        if (DNS.address_map.addrs[name]) {
          addr = DNS.address_map.addrs[name];
        } else {
          var id = DNS.address_map.id++;
          assert(id < 65535, 'exceeded max address mappings of 65535');
  
          addr = '172.29.' + (id & 0xff) + '.' + (id & 0xff00);
  
          DNS.address_map.names[addr] = name;
          DNS.address_map.addrs[name] = addr;
        }
  
        return addr;
      },
  lookup_addr(addr) {
        if (DNS.address_map.names[addr]) {
          return DNS.address_map.names[addr];
        }
  
        return null;
      },
  };
  function ___syscall_accept4(fd, addr, addrlen, flags, d1, d2) {
  try {
  
      var sock = getSocketFromFD(fd);
      var newsock = sock.sock_ops.accept(sock);
      if (addr) {
        var errno = writeSockaddr(addr, newsock.family, DNS.lookup_name(newsock.daddr), newsock.dport, addrlen);
        assert(!errno);
      }
      return newsock.stream.fd;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }

  function ___syscall_chmod(path, mode) {
  try {
  
      path = SYSCALLS.getStr(path);
      FS.chmod(path, mode);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }

  
  var inetNtop4 = (addr) =>
      (addr & 0xff) + '.' + ((addr >> 8) & 0xff) + '.' + ((addr >> 16) & 0xff) + '.' + ((addr >> 24) & 0xff);
  
  
  var inetNtop6 = (ints) => {
      //  ref:  http://www.ietf.org/rfc/rfc2373.txt - section 2.5.4
      //  Format for IPv4 compatible and mapped  128-bit IPv6 Addresses
      //  128-bits are split into eight 16-bit words
      //  stored in network byte order (big-endian)
      //  |                80 bits               | 16 |      32 bits        |
      //  +-----------------------------------------------------------------+
      //  |               10 bytes               |  2 |      4 bytes        |
      //  +--------------------------------------+--------------------------+
      //  +               5 words                |  1 |      2 words        |
      //  +--------------------------------------+--------------------------+
      //  |0000..............................0000|0000|    IPv4 ADDRESS     | (compatible)
      //  +--------------------------------------+----+---------------------+
      //  |0000..............................0000|FFFF|    IPv4 ADDRESS     | (mapped)
      //  +--------------------------------------+----+---------------------+
      var str = "";
      var word = 0;
      var longest = 0;
      var lastzero = 0;
      var zstart = 0;
      var len = 0;
      var i = 0;
      var parts = [
        ints[0] & 0xffff,
        (ints[0] >> 16),
        ints[1] & 0xffff,
        (ints[1] >> 16),
        ints[2] & 0xffff,
        (ints[2] >> 16),
        ints[3] & 0xffff,
        (ints[3] >> 16)
      ];
  
      // Handle IPv4-compatible, IPv4-mapped, loopback and any/unspecified addresses
  
      var hasipv4 = true;
      var v4part = "";
      // check if the 10 high-order bytes are all zeros (first 5 words)
      for (i = 0; i < 5; i++) {
        if (parts[i] !== 0) { hasipv4 = false; break; }
      }
  
      if (hasipv4) {
        // low-order 32-bits store an IPv4 address (bytes 13 to 16) (last 2 words)
        v4part = inetNtop4(parts[6] | (parts[7] << 16));
        // IPv4-mapped IPv6 address if 16-bit value (bytes 11 and 12) == 0xFFFF (6th word)
        if (parts[5] === -1) {
          str = "::ffff:";
          str += v4part;
          return str;
        }
        // IPv4-compatible IPv6 address if 16-bit value (bytes 11 and 12) == 0x0000 (6th word)
        if (parts[5] === 0) {
          str = "::";
          //special case IPv6 addresses
          if (v4part === "0.0.0.0") v4part = ""; // any/unspecified address
          if (v4part === "0.0.0.1") v4part = "1";// loopback address
          str += v4part;
          return str;
        }
      }
  
      // Handle all other IPv6 addresses
  
      // first run to find the longest contiguous zero words
      for (word = 0; word < 8; word++) {
        if (parts[word] === 0) {
          if (word - lastzero > 1) {
            len = 0;
          }
          lastzero = word;
          len++;
        }
        if (len > longest) {
          longest = len;
          zstart = word - longest + 1;
        }
      }
  
      for (word = 0; word < 8; word++) {
        if (longest > 1) {
          // compress contiguous zeros - to produce "::"
          if (parts[word] === 0 && word >= zstart && word < (zstart + longest) ) {
            if (word === zstart) {
              str += ":";
              if (zstart === 0) str += ":"; //leading zeros case
            }
            continue;
          }
        }
        // converts 16-bit words from big-endian to little-endian before converting to hex string
        str += Number(_ntohs(parts[word] & 0xffff)).toString(16);
        str += word < 7 ? ":" : "";
      }
      return str;
    };
  
  var readSockaddr = (sa, salen) => {
      // family / port offsets are common to both sockaddr_in and sockaddr_in6
      var family = HEAP16[((sa)>>1)];
      var port = _ntohs(HEAPU16[(((sa)+(2))>>1)]);
      var addr;
  
      switch (family) {
        case 2:
          if (salen !== 16) {
            return { errno: 28 };
          }
          addr = HEAP32[(((sa)+(4))>>2)];
          addr = inetNtop4(addr);
          break;
        case 10:
          if (salen !== 28) {
            return { errno: 28 };
          }
          addr = [
            HEAP32[(((sa)+(8))>>2)],
            HEAP32[(((sa)+(12))>>2)],
            HEAP32[(((sa)+(16))>>2)],
            HEAP32[(((sa)+(20))>>2)]
          ];
          addr = inetNtop6(addr);
          break;
        default:
          return { errno: 5 };
      }
  
      return { family: family, addr: addr, port: port };
    };
  
  
  var getSocketAddress = (addrp, addrlen) => {
      var info = readSockaddr(addrp, addrlen);
      if (info.errno) throw new FS.ErrnoError(info.errno);
      info.addr = DNS.lookup_addr(info.addr) || info.addr;
      return info;
    };
  function ___syscall_connect(fd, addr, addrlen, d1, d2, d3) {
  try {
  
      var sock = getSocketFromFD(fd);
      var info = getSocketAddress(addr, addrlen);
      sock.sock_ops.connect(sock, info.addr, info.port);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }

  function ___syscall_faccessat(dirfd, path, amode, flags) {
  try {
  
      path = SYSCALLS.getStr(path);
      assert(!flags || flags == 512);
      path = SYSCALLS.calculateAt(dirfd, path);
      if (amode & ~7) {
        // need a valid mode
        return -28;
      }
      var lookup = FS.lookupPath(path, { follow: true });
      var node = lookup.node;
      if (!node) {
        return -44;
      }
      var perms = '';
      if (amode & 4) perms += 'r';
      if (amode & 2) perms += 'w';
      if (amode & 1) perms += 'x';
      if (perms /* otherwise, they've just passed F_OK */ && FS.nodePermissions(node, perms)) {
        return -2;
      }
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }

  var syscallGetVarargI = () => {
      assert(SYSCALLS.varargs != undefined);
      // the `+` prepended here is necessary to convince the JSCompiler that varargs is indeed a number.
      var ret = HEAP32[((+SYSCALLS.varargs)>>2)];
      SYSCALLS.varargs += 4;
      return ret;
    };
  var syscallGetVarargP = syscallGetVarargI;
  
  
  function ___syscall_fcntl64(fd, cmd, varargs) {
  SYSCALLS.varargs = varargs;
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      switch (cmd) {
        case 0: {
          var arg = syscallGetVarargI();
          if (arg < 0) {
            return -28;
          }
          while (FS.streams[arg]) {
            arg++;
          }
          var newStream;
          newStream = FS.dupStream(stream, arg);
          return newStream.fd;
        }
        case 1:
        case 2:
          return 0;  // FD_CLOEXEC makes no sense for a single process.
        case 3:
          return stream.flags;
        case 4: {
          var arg = syscallGetVarargI();
          stream.flags |= arg;
          return 0;
        }
        case 12: {
          var arg = syscallGetVarargP();
          var offset = 0;
          // We're always unlocked.
          HEAP16[(((arg)+(offset))>>1)] = 2;
          return 0;
        }
        case 13:
        case 14:
          // Pretend that the locking is successful. These are process-level locks,
          // and Emscripten programs are a single process. If we supported linking a
          // filesystem between programs, we'd need to do more here.
          // See https://github.com/emscripten-core/emscripten/issues/23697
          return 0;
      }
      return -28;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }

  function ___syscall_fstat64(fd, buf) {
  try {
  
      return SYSCALLS.writeStat(buf, FS.fstat(fd));
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }

  var convertI32PairToI53Checked = (lo, hi) => {
      assert(lo == (lo >>> 0) || lo == (lo|0)); // lo should either be a i32 or a u32
      assert(hi === (hi|0));                    // hi should be a i32
      return ((hi + 0x200000) >>> 0 < 0x400001 - !!lo) ? (lo >>> 0) + hi * 4294967296 : NaN;
    };
  function ___syscall_ftruncate64(fd,length_low, length_high) {
    var length = convertI32PairToI53Checked(length_low, length_high);
  
  
  try {
  
      if (isNaN(length)) return -61;
      FS.ftruncate(fd, length);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  }

  
  function ___syscall_getcwd(buf, size) {
  try {
  
      if (size === 0) return -28;
      var cwd = FS.cwd();
      var cwdLengthInBytes = lengthBytesUTF8(cwd) + 1;
      if (size < cwdLengthInBytes) return -68;
      stringToUTF8(cwd, buf, size);
      return cwdLengthInBytes;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }

  
  function ___syscall_getdents64(fd, dirp, count) {
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd)
      stream.getdents ||= FS.readdir(stream.path);
  
      var struct_size = 280;
      var pos = 0;
      var off = FS.llseek(stream, 0, 1);
  
      var startIdx = Math.floor(off / struct_size);
      var endIdx = Math.min(stream.getdents.length, startIdx + Math.floor(count/struct_size))
      for (var idx = startIdx; idx < endIdx; idx++) {
        var id;
        var type;
        var name = stream.getdents[idx];
        if (name === '.') {
          id = stream.node.id;
          type = 4; // DT_DIR
        }
        else if (name === '..') {
          var lookup = FS.lookupPath(stream.path, { parent: true });
          id = lookup.node.id;
          type = 4; // DT_DIR
        }
        else {
          var child;
          try {
            child = FS.lookupNode(stream.node, name);
          } catch (e) {
            // If the entry is not a directory, file, or symlink, nodefs
            // lookupNode will raise EINVAL. Skip these and continue.
            if (e?.errno === 28) {
              continue;
            }
            throw e;
          }
          id = child.id;
          type = FS.isChrdev(child.mode) ? 2 :  // DT_CHR, character device.
                 FS.isDir(child.mode) ? 4 :     // DT_DIR, directory.
                 FS.isLink(child.mode) ? 10 :   // DT_LNK, symbolic link.
                 8;                             // DT_REG, regular file.
        }
        assert(id);
        (tempI64 = [id>>>0,(tempDouble = id,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? (+(Math.floor((tempDouble)/4294967296.0)))>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)], HEAP32[((dirp + pos)>>2)] = tempI64[0],HEAP32[(((dirp + pos)+(4))>>2)] = tempI64[1]);
        (tempI64 = [(idx + 1) * struct_size>>>0,(tempDouble = (idx + 1) * struct_size,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? (+(Math.floor((tempDouble)/4294967296.0)))>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)], HEAP32[(((dirp + pos)+(8))>>2)] = tempI64[0],HEAP32[(((dirp + pos)+(12))>>2)] = tempI64[1]);
        HEAP16[(((dirp + pos)+(16))>>1)] = 280;
        HEAP8[(dirp + pos)+(18)] = type;
        stringToUTF8(name, dirp + pos + 19, 256);
        pos += struct_size;
      }
      FS.llseek(stream, idx * struct_size, 0);
      return pos;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }

  function ___syscall_getsockopt(fd, level, optname, optval, optlen, d1) {
  try {
  
      var sock = getSocketFromFD(fd);
      // Minimal getsockopt aimed at resolving https://github.com/emscripten-core/emscripten/issues/2211
      // so only supports SOL_SOCKET with SO_ERROR.
      if (level === 1) {
        if (optname === 4) {
          HEAP32[((optval)>>2)] = sock.error;
          HEAP32[((optlen)>>2)] = 4;
          sock.error = null; // Clear the error (The SO_ERROR option obtains and then clears this field).
          return 0;
        }
      }
      return -50; // The option is unknown at the level indicated.
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }

  
  function ___syscall_ioctl(fd, op, varargs) {
  SYSCALLS.varargs = varargs;
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      switch (op) {
        case 21509: {
          if (!stream.tty) return -59;
          return 0;
        }
        case 21505: {
          if (!stream.tty) return -59;
          if (stream.tty.ops.ioctl_tcgets) {
            var termios = stream.tty.ops.ioctl_tcgets(stream);
            var argp = syscallGetVarargP();
            HEAP32[((argp)>>2)] = termios.c_iflag || 0;
            HEAP32[(((argp)+(4))>>2)] = termios.c_oflag || 0;
            HEAP32[(((argp)+(8))>>2)] = termios.c_cflag || 0;
            HEAP32[(((argp)+(12))>>2)] = termios.c_lflag || 0;
            for (var i = 0; i < 32; i++) {
              HEAP8[(argp + i)+(17)] = termios.c_cc[i] || 0;
            }
            return 0;
          }
          return 0;
        }
        case 21510:
        case 21511:
        case 21512: {
          if (!stream.tty) return -59;
          return 0; // no-op, not actually adjusting terminal settings
        }
        case 21506:
        case 21507:
        case 21508: {
          if (!stream.tty) return -59;
          if (stream.tty.ops.ioctl_tcsets) {
            var argp = syscallGetVarargP();
            var c_iflag = HEAP32[((argp)>>2)];
            var c_oflag = HEAP32[(((argp)+(4))>>2)];
            var c_cflag = HEAP32[(((argp)+(8))>>2)];
            var c_lflag = HEAP32[(((argp)+(12))>>2)];
            var c_cc = []
            for (var i = 0; i < 32; i++) {
              c_cc.push(HEAP8[(argp + i)+(17)]);
            }
            return stream.tty.ops.ioctl_tcsets(stream.tty, op, { c_iflag, c_oflag, c_cflag, c_lflag, c_cc });
          }
          return 0; // no-op, not actually adjusting terminal settings
        }
        case 21519: {
          if (!stream.tty) return -59;
          var argp = syscallGetVarargP();
          HEAP32[((argp)>>2)] = 0;
          return 0;
        }
        case 21520: {
          if (!stream.tty) return -59;
          return -28; // not supported
        }
        case 21537:
        case 21531: {
          var argp = syscallGetVarargP();
          return FS.ioctl(stream, op, argp);
        }
        case 21523: {
          // TODO: in theory we should write to the winsize struct that gets
          // passed in, but for now musl doesn't read anything on it
          if (!stream.tty) return -59;
          if (stream.tty.ops.ioctl_tiocgwinsz) {
            var winsize = stream.tty.ops.ioctl_tiocgwinsz(stream.tty);
            var argp = syscallGetVarargP();
            HEAP16[((argp)>>1)] = winsize[0];
            HEAP16[(((argp)+(2))>>1)] = winsize[1];
          }
          return 0;
        }
        case 21524: {
          // TODO: technically, this ioctl call should change the window size.
          // but, since emscripten doesn't have any concept of a terminal window
          // yet, we'll just silently throw it away as we do TIOCGWINSZ
          if (!stream.tty) return -59;
          return 0;
        }
        case 21515: {
          if (!stream.tty) return -59;
          return 0;
        }
        default: return -28; // not supported
      }
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }

  function ___syscall_lstat64(path, buf) {
  try {
  
      path = SYSCALLS.getStr(path);
      return SYSCALLS.writeStat(buf, FS.lstat(path));
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }

  function ___syscall_mkdirat(dirfd, path, mode) {
  try {
  
      path = SYSCALLS.getStr(path);
      path = SYSCALLS.calculateAt(dirfd, path);
      FS.mkdir(path, mode, 0);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }

  function ___syscall_newfstatat(dirfd, path, buf, flags) {
  try {
  
      path = SYSCALLS.getStr(path);
      var nofollow = flags & 256;
      var allowEmpty = flags & 4096;
      flags = flags & (~6400);
      assert(!flags, `unknown flags in __syscall_newfstatat: ${flags}`);
      path = SYSCALLS.calculateAt(dirfd, path, allowEmpty);
      return SYSCALLS.writeStat(buf, nofollow ? FS.lstat(path) : FS.stat(path));
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }

  
  function ___syscall_openat(dirfd, path, flags, varargs) {
  SYSCALLS.varargs = varargs;
  try {
  
      path = SYSCALLS.getStr(path);
      path = SYSCALLS.calculateAt(dirfd, path);
      var mode = varargs ? syscallGetVarargI() : 0;
      return FS.open(path, flags, mode).fd;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }

  
  
  function ___syscall_readlinkat(dirfd, path, buf, bufsize) {
  try {
  
      path = SYSCALLS.getStr(path);
      path = SYSCALLS.calculateAt(dirfd, path);
      if (bufsize <= 0) return -28;
      var ret = FS.readlink(path);
  
      var len = Math.min(bufsize, lengthBytesUTF8(ret));
      var endChar = HEAP8[buf+len];
      stringToUTF8(ret, buf, bufsize+1);
      // readlink is one of the rare functions that write out a C string, but does never append a null to the output buffer(!)
      // stringToUTF8() always appends a null byte, so restore the character under the null byte after the write.
      HEAP8[buf+len] = endChar;
      return len;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }

  
  
  function ___syscall_recvfrom(fd, buf, len, flags, addr, addrlen) {
  try {
  
      var sock = getSocketFromFD(fd);
      var msg = sock.sock_ops.recvmsg(sock, len);
      if (!msg) return 0; // socket is closed
      if (addr) {
        var errno = writeSockaddr(addr, sock.family, DNS.lookup_name(msg.addr), msg.port, addrlen);
        assert(!errno);
      }
      HEAPU8.set(msg.buffer, buf);
      return msg.buffer.byteLength;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }

  function ___syscall_renameat(olddirfd, oldpath, newdirfd, newpath) {
  try {
  
      oldpath = SYSCALLS.getStr(oldpath);
      newpath = SYSCALLS.getStr(newpath);
      oldpath = SYSCALLS.calculateAt(olddirfd, oldpath);
      newpath = SYSCALLS.calculateAt(newdirfd, newpath);
      FS.rename(oldpath, newpath);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }

  function ___syscall_rmdir(path) {
  try {
  
      path = SYSCALLS.getStr(path);
      FS.rmdir(path);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }

  
  function ___syscall_sendto(fd, message, length, flags, addr, addr_len) {
  try {
  
      var sock = getSocketFromFD(fd);
      if (!addr) {
        // send, no address provided
        return FS.write(sock.stream, HEAP8, message, length);
      }
      var dest = getSocketAddress(addr, addr_len);
      // sendto an address
      return sock.sock_ops.sendmsg(sock, HEAP8, message, length, dest.addr, dest.port);
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }

  function ___syscall_socket(domain, type, protocol) {
  try {
  
      var sock = SOCKFS.createSocket(domain, type, protocol);
      assert(sock.stream.fd < 64); // XXX ? select() assumes socket fd values are in 0..63
      return sock.stream.fd;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }

  function ___syscall_stat64(path, buf) {
  try {
  
      path = SYSCALLS.getStr(path);
      return SYSCALLS.writeStat(buf, FS.stat(path));
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }

  function ___syscall_statfs64(path, size, buf) {
  try {
  
      assert(size === 88);
      SYSCALLS.writeStatFs(buf, FS.statfs(SYSCALLS.getStr(path)));
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }

  function ___syscall_symlinkat(target, dirfd, linkpath) {
  try {
  
      target = SYSCALLS.getStr(target);
      linkpath = SYSCALLS.getStr(linkpath);
      linkpath = SYSCALLS.calculateAt(dirfd, linkpath);
      FS.symlink(target, linkpath);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }

  
  function ___syscall_truncate64(path,length_low, length_high) {
    var length = convertI32PairToI53Checked(length_low, length_high);
  
  
  try {
  
      if (isNaN(length)) return -61;
      path = SYSCALLS.getStr(path);
      FS.truncate(path, length);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  }

  function ___syscall_unlinkat(dirfd, path, flags) {
  try {
  
      path = SYSCALLS.getStr(path);
      path = SYSCALLS.calculateAt(dirfd, path);
      if (!flags) {
        FS.unlink(path);
      } else if (flags === 512) {
        FS.rmdir(path);
      } else {
        return -28;
      }
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }

  var readI53FromI64 = (ptr) => {
      return HEAPU32[((ptr)>>2)] + HEAP32[(((ptr)+(4))>>2)] * 4294967296;
    };
  
  function ___syscall_utimensat(dirfd, path, times, flags) {
  try {
  
      path = SYSCALLS.getStr(path);
      assert(!flags);
      path = SYSCALLS.calculateAt(dirfd, path, true);
      var now = Date.now(), atime, mtime;
      if (!times) {
        atime = now;
        mtime = now;
      } else {
        var seconds = readI53FromI64(times);
        var nanoseconds = HEAP32[(((times)+(8))>>2)];
        if (nanoseconds == 1073741823) {
          atime = now;
        } else if (nanoseconds == 1073741822) {
          atime = null;
        } else {
          atime = (seconds*1000) + (nanoseconds/(1000*1000));
        }
        times += 16;
        seconds = readI53FromI64(times);
        nanoseconds = HEAP32[(((times)+(8))>>2)];
        if (nanoseconds == 1073741823) {
          mtime = now;
        } else if (nanoseconds == 1073741822) {
          mtime = null;
        } else {
          mtime = (seconds*1000) + (nanoseconds/(1000*1000));
        }
      }
      // null here means UTIME_OMIT was passed. If both were set to UTIME_OMIT then
      // we can skip the call completely.
      if ((mtime ?? atime) !== null) {
        FS.utime(path, atime, mtime);
      }
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }

  var __abort_js = () =>
      abort('native code called abort()');

  var jsStackTrace = () => new Error().stack.toString();
  
  /** @param {number=} flags */
  var getCallstack = (flags) => {
      var callstack = jsStackTrace();
  
      if (flags & 8) {
        warnOnce('emscripten_log with EM_LOG_C_STACK no longer has any effect');
      }
  
      // Process all lines:
      var lines = callstack.split('\n');
      callstack = '';
      // Extract components of form:
      // '       Object._main@http://server.com:4324:12'
      var firefoxRe = new RegExp('\\s*(.*?)@(.*?):([0-9]+):([0-9]+)');
      // Extract components of form:
      // '    at Object._main (http://server.com/file.html:4324:12)'
      var chromeRe = new RegExp('\\s*at (.*?) \\\((.*):(.*):(.*)\\\)');
  
      for (var line of lines) {
        var symbolName = '';
        var file = '';
        var lineno = 0;
        var column = 0;
  
        var parts = chromeRe.exec(line);
        if (parts?.length == 5) {
          symbolName = parts[1];
          file = parts[2];
          lineno = parts[3];
          column = parts[4];
        } else {
          parts = firefoxRe.exec(line);
          if (parts?.length >= 4) {
            symbolName = parts[1];
            file = parts[2];
            lineno = parts[3];
            // Old Firefox doesn't carry column information, but in new FF30, it
            // is present. See https://bugzil.la/762556
            column = parts[4]|0;
          } else {
            // Was not able to extract this line for demangling/sourcemapping
            // purposes. Output it as-is.
            callstack += line + '\n';
            continue;
          }
        }
  
        // Find the symbols in the callstack that corresponds to the functions that
        // report callstack information, and remove everything up to these from the
        // output.
        if (symbolName == '_emscripten_log' || symbolName == '_emscripten_get_callstack') {
          callstack = '';
          continue;
        }
  
        if ((flags & 24)) {
          if (flags & 64) {
            file = file.substring(file.replace(/\\/g, "/").lastIndexOf('/')+1);
          }
          callstack += `    at ${symbolName} (${file}:${lineno}:${column})\n`;
        }
      }
      // Trim extra whitespace at the end of the output.
      callstack = callstack.replace(/\s+$/, '');
      return callstack;
    };
  
  var __emscripten_log_formatted = (flags, str) => {
      str = UTF8ToString(str);
  
      if (flags & 24) {
        str = str.replace(/\s+$/, ''); // Ensure the message and the callstack are joined cleanly with exactly one newline.
        str += (str.length > 0 ? '\n' : '') + getCallstack(flags);
      }
  
      if (flags & 1) {
        if (flags & 4) {
          console.error(str);
        } else if (flags & 2) {
          console.warn(str);
        } else if (flags & 512) {
          console.info(str);
        } else if (flags & 256) {
          console.debug(str);
        } else {
          console.log(str);
        }
      } else if (flags & 6) {
        err(str);
      } else {
        out(str);
      }
    };

  
  
  
  var __emscripten_lookup_name = (name) => {
      // uint32_t _emscripten_lookup_name(const char *name);
      var nameString = UTF8ToString(name);
      return inetPton4(DNS.lookup_name(nameString));
    };

  var __emscripten_throw_longjmp = () => {
      throw new EmscriptenSjLj;
    };

  function __gmtime_js(time_low, time_high,tmPtr) {
    var time = convertI32PairToI53Checked(time_low, time_high);
  
  
      var date = new Date(time * 1000);
      HEAP32[((tmPtr)>>2)] = date.getUTCSeconds();
      HEAP32[(((tmPtr)+(4))>>2)] = date.getUTCMinutes();
      HEAP32[(((tmPtr)+(8))>>2)] = date.getUTCHours();
      HEAP32[(((tmPtr)+(12))>>2)] = date.getUTCDate();
      HEAP32[(((tmPtr)+(16))>>2)] = date.getUTCMonth();
      HEAP32[(((tmPtr)+(20))>>2)] = date.getUTCFullYear()-1900;
      HEAP32[(((tmPtr)+(24))>>2)] = date.getUTCDay();
      var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
      var yday = ((date.getTime() - start) / (1000 * 60 * 60 * 24))|0;
      HEAP32[(((tmPtr)+(28))>>2)] = yday;
    ;
  }

  var isLeapYear = (year) => year%4 === 0 && (year%100 !== 0 || year%400 === 0);
  
  var MONTH_DAYS_LEAP_CUMULATIVE = [0,31,60,91,121,152,182,213,244,274,305,335];
  
  var MONTH_DAYS_REGULAR_CUMULATIVE = [0,31,59,90,120,151,181,212,243,273,304,334];
  var ydayFromDate = (date) => {
      var leap = isLeapYear(date.getFullYear());
      var monthDaysCumulative = (leap ? MONTH_DAYS_LEAP_CUMULATIVE : MONTH_DAYS_REGULAR_CUMULATIVE);
      var yday = monthDaysCumulative[date.getMonth()] + date.getDate() - 1; // -1 since it's days since Jan 1
  
      return yday;
    };
  
  function __localtime_js(time_low, time_high,tmPtr) {
    var time = convertI32PairToI53Checked(time_low, time_high);
  
  
      var date = new Date(time*1000);
      HEAP32[((tmPtr)>>2)] = date.getSeconds();
      HEAP32[(((tmPtr)+(4))>>2)] = date.getMinutes();
      HEAP32[(((tmPtr)+(8))>>2)] = date.getHours();
      HEAP32[(((tmPtr)+(12))>>2)] = date.getDate();
      HEAP32[(((tmPtr)+(16))>>2)] = date.getMonth();
      HEAP32[(((tmPtr)+(20))>>2)] = date.getFullYear()-1900;
      HEAP32[(((tmPtr)+(24))>>2)] = date.getDay();
  
      var yday = ydayFromDate(date)|0;
      HEAP32[(((tmPtr)+(28))>>2)] = yday;
      HEAP32[(((tmPtr)+(36))>>2)] = -(date.getTimezoneOffset() * 60);
  
      // Attention: DST is in December in South, and some regions don't have DST at all.
      var start = new Date(date.getFullYear(), 0, 1);
      var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
      var winterOffset = start.getTimezoneOffset();
      var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset))|0;
      HEAP32[(((tmPtr)+(32))>>2)] = dst;
    ;
  }

  
  var _setTempRet0 = setTempRet0;
  
  var __mktime_js = function(tmPtr) {
  
  var ret = (() => { 
      var date = new Date(HEAP32[(((tmPtr)+(20))>>2)] + 1900,
                          HEAP32[(((tmPtr)+(16))>>2)],
                          HEAP32[(((tmPtr)+(12))>>2)],
                          HEAP32[(((tmPtr)+(8))>>2)],
                          HEAP32[(((tmPtr)+(4))>>2)],
                          HEAP32[((tmPtr)>>2)],
                          0);
  
      // There's an ambiguous hour when the time goes back; the tm_isdst field is
      // used to disambiguate it.  Date() basically guesses, so we fix it up if it
      // guessed wrong, or fill in tm_isdst with the guess if it's -1.
      var dst = HEAP32[(((tmPtr)+(32))>>2)];
      var guessedOffset = date.getTimezoneOffset();
      var start = new Date(date.getFullYear(), 0, 1);
      var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
      var winterOffset = start.getTimezoneOffset();
      var dstOffset = Math.min(winterOffset, summerOffset); // DST is in December in South
      if (dst < 0) {
        // Attention: some regions don't have DST at all.
        HEAP32[(((tmPtr)+(32))>>2)] = Number(summerOffset != winterOffset && dstOffset == guessedOffset);
      } else if ((dst > 0) != (dstOffset == guessedOffset)) {
        var nonDstOffset = Math.max(winterOffset, summerOffset);
        var trueOffset = dst > 0 ? dstOffset : nonDstOffset;
        // Don't try setMinutes(date.getMinutes() + ...) -- it's messed up.
        date.setTime(date.getTime() + (trueOffset - guessedOffset)*60000);
      }
  
      HEAP32[(((tmPtr)+(24))>>2)] = date.getDay();
      var yday = ydayFromDate(date)|0;
      HEAP32[(((tmPtr)+(28))>>2)] = yday;
      // To match expected behavior, update fields from date
      HEAP32[((tmPtr)>>2)] = date.getSeconds();
      HEAP32[(((tmPtr)+(4))>>2)] = date.getMinutes();
      HEAP32[(((tmPtr)+(8))>>2)] = date.getHours();
      HEAP32[(((tmPtr)+(12))>>2)] = date.getDate();
      HEAP32[(((tmPtr)+(16))>>2)] = date.getMonth();
      HEAP32[(((tmPtr)+(20))>>2)] = date.getYear();
  
      var timeMs = date.getTime();
      if (isNaN(timeMs)) {
        return -1;
      }
      // Return time in microseconds
      return timeMs / 1000;
     })();
  return (setTempRet0((tempDouble = ret,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? (+(Math.floor((tempDouble)/4294967296.0)))>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)), ret>>>0);
  };

  
  var __tzset_js = (timezone, daylight, std_name, dst_name) => {
      // TODO: Use (malleable) environment variables instead of system settings.
      var currentYear = new Date().getFullYear();
      var winter = new Date(currentYear, 0, 1);
      var summer = new Date(currentYear, 6, 1);
      var winterOffset = winter.getTimezoneOffset();
      var summerOffset = summer.getTimezoneOffset();
  
      // Local standard timezone offset. Local standard time is not adjusted for
      // daylight savings.  This code uses the fact that getTimezoneOffset returns
      // a greater value during Standard Time versus Daylight Saving Time (DST).
      // Thus it determines the expected output during Standard Time, and it
      // compares whether the output of the given date the same (Standard) or less
      // (DST).
      var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
  
      // timezone is specified as seconds west of UTC ("The external variable
      // `timezone` shall be set to the difference, in seconds, between
      // Coordinated Universal Time (UTC) and local standard time."), the same
      // as returned by stdTimezoneOffset.
      // See http://pubs.opengroup.org/onlinepubs/009695399/functions/tzset.html
      HEAPU32[((timezone)>>2)] = stdTimezoneOffset * 60;
  
      HEAP32[((daylight)>>2)] = Number(winterOffset != summerOffset);
  
      var extractZone = (timezoneOffset) => {
        // Why inverse sign?
        // Read here https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset
        var sign = timezoneOffset >= 0 ? "-" : "+";
  
        var absOffset = Math.abs(timezoneOffset)
        var hours = String(Math.floor(absOffset / 60)).padStart(2, "0");
        var minutes = String(absOffset % 60).padStart(2, "0");
  
        return `UTC${sign}${hours}${minutes}`;
      }
  
      var winterName = extractZone(winterOffset);
      var summerName = extractZone(summerOffset);
      assert(winterName);
      assert(summerName);
      assert(lengthBytesUTF8(winterName) <= 16, `timezone name truncated to fit in TZNAME_MAX (${winterName})`);
      assert(lengthBytesUTF8(summerName) <= 16, `timezone name truncated to fit in TZNAME_MAX (${summerName})`);
      if (summerOffset < winterOffset) {
        // Northern hemisphere
        stringToUTF8(winterName, std_name, 17);
        stringToUTF8(summerName, dst_name, 17);
      } else {
        stringToUTF8(winterName, dst_name, 17);
        stringToUTF8(summerName, std_name, 17);
      }
    };

  
  var _emscripten_get_now_res = () => { // return resolution of get_now, in nanoseconds
      // Modern environment where performance.now() is supported:
      return 1000; // microseconds (1/1000 of a millisecond)
    };
  
  var nowIsMonotonic = 1;
  
  var checkWasiClock = (clock_id) => clock_id >= 0 && clock_id <= 3;
  var _clock_res_get = (clk_id, pres) => {
      if (!checkWasiClock(clk_id)) {
        return 28;
      }
      var nsec;
      // all wasi clocks but realtime are monotonic
      if (clk_id === 0) {
        nsec = 1000 * 1000; // educated guess that it's milliseconds
      } else if (nowIsMonotonic) {
        nsec = _emscripten_get_now_res();
      } else {
        return 52;
      }
      (tempI64 = [nsec>>>0,(tempDouble = nsec,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? (+(Math.floor((tempDouble)/4294967296.0)))>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)], HEAP32[((pres)>>2)] = tempI64[0],HEAP32[(((pres)+(4))>>2)] = tempI64[1]);
      return 0;
    };

  
  var _emscripten_date_now = () => Date.now();
  
  
  
  function _clock_time_get(clk_id,ignored_precision_low, ignored_precision_high,ptime) {
    var ignored_precision = convertI32PairToI53Checked(ignored_precision_low, ignored_precision_high);
  
  
      if (!checkWasiClock(clk_id)) {
        return 28;
      }
      var now;
      // all wasi clocks but realtime are monotonic
      if (clk_id === 0) {
        now = _emscripten_date_now();
      } else if (nowIsMonotonic) {
        now = _emscripten_get_now();
      } else {
        return 52;
      }
      // "now" is in ms, and wasi times are in ns.
      var nsec = Math.round(now * 1000 * 1000);
      (tempI64 = [nsec>>>0,(tempDouble = nsec,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? (+(Math.floor((tempDouble)/4294967296.0)))>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)], HEAP32[((ptime)>>2)] = tempI64[0],HEAP32[(((ptime)+(4))>>2)] = tempI64[1]);
      return 0;
    ;
  }

  var _emscripten_cancel_main_loop = () => {
      MainLoop.pause();
      MainLoop.func = null;
    };

  var _emscripten_clear_interval = (id) => {
      
      clearInterval(id);
    };

  var _emscripten_console_error = (str) => {
      assert(typeof str == 'number');
      console.error(UTF8ToString(str));
    };


  var _emscripten_debugger = () => { debugger };

  var _emscripten_err = (str) => err(UTF8ToString(str));

  var onExits = [];
  var addOnExit = (cb) => onExits.push(cb);
  var JSEvents = {
  memcpy(target, src, size) {
        HEAP8.set(HEAP8.subarray(src, src + size), target);
      },
  removeAllEventListeners() {
        while (JSEvents.eventHandlers.length) {
          JSEvents._removeHandler(JSEvents.eventHandlers.length - 1);
        }
        JSEvents.deferredCalls = [];
      },
  inEventHandler:0,
  deferredCalls:[],
  deferCall(targetFunction, precedence, argsList) {
        function arraysHaveEqualContent(arrA, arrB) {
          if (arrA.length != arrB.length) return false;
  
          for (var i in arrA) {
            if (arrA[i] != arrB[i]) return false;
          }
          return true;
        }
        // Test if the given call was already queued, and if so, don't add it again.
        for (var call of JSEvents.deferredCalls) {
          if (call.targetFunction == targetFunction && arraysHaveEqualContent(call.argsList, argsList)) {
            return;
          }
        }
        JSEvents.deferredCalls.push({
          targetFunction,
          precedence,
          argsList
        });
  
        JSEvents.deferredCalls.sort((x,y) => x.precedence < y.precedence);
      },
  removeDeferredCalls(targetFunction) {
        JSEvents.deferredCalls = JSEvents.deferredCalls.filter((call) => call.targetFunction != targetFunction);
      },
  canPerformEventHandlerRequests() {
        if (navigator.userActivation) {
          // Verify against transient activation status from UserActivation API
          // whether it is possible to perform a request here without needing to defer. See
          // https://developer.mozilla.org/en-US/docs/Web/Security/User_activation#transient_activation
          // and https://caniuse.com/mdn-api_useractivation
          // At the time of writing, Firefox does not support this API: https://bugzil.la/1791079
          return navigator.userActivation.isActive;
        }
  
        return JSEvents.inEventHandler && JSEvents.currentEventHandler.allowsDeferredCalls;
      },
  runDeferredCalls() {
        if (!JSEvents.canPerformEventHandlerRequests()) {
          return;
        }
        var deferredCalls = JSEvents.deferredCalls;
        JSEvents.deferredCalls = [];
        for (var call of deferredCalls) {
          call.targetFunction(...call.argsList);
        }
      },
  eventHandlers:[],
  removeAllHandlersOnTarget:(target, eventTypeString) => {
        for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
          if (JSEvents.eventHandlers[i].target == target &&
            (!eventTypeString || eventTypeString == JSEvents.eventHandlers[i].eventTypeString)) {
             JSEvents._removeHandler(i--);
           }
        }
      },
  _removeHandler(i) {
        var h = JSEvents.eventHandlers[i];
        h.target.removeEventListener(h.eventTypeString, h.eventListenerFunc, h.useCapture);
        JSEvents.eventHandlers.splice(i, 1);
      },
  registerOrRemoveHandler(eventHandler) {
        if (!eventHandler.target) {
          err('registerOrRemoveHandler: the target element for event handler registration does not exist, when processing the following event handler registration:');
          console.dir(eventHandler);
          return -4;
        }
        if (eventHandler.callbackfunc) {
          eventHandler.eventListenerFunc = function(event) {
            // Increment nesting count for the event handler.
            ++JSEvents.inEventHandler;
            JSEvents.currentEventHandler = eventHandler;
            // Process any old deferred calls the user has placed.
            JSEvents.runDeferredCalls();
            // Process the actual event, calls back to user C code handler.
            eventHandler.handlerFunc(event);
            // Process any new deferred calls that were placed right now from this event handler.
            JSEvents.runDeferredCalls();
            // Out of event handler - restore nesting count.
            --JSEvents.inEventHandler;
          };
  
          eventHandler.target.addEventListener(eventHandler.eventTypeString,
                                               eventHandler.eventListenerFunc,
                                               eventHandler.useCapture);
          JSEvents.eventHandlers.push(eventHandler);
        } else {
          for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
            if (JSEvents.eventHandlers[i].target == eventHandler.target
             && JSEvents.eventHandlers[i].eventTypeString == eventHandler.eventTypeString) {
               JSEvents._removeHandler(i--);
             }
          }
        }
        return 0;
      },
  getNodeNameForTarget(target) {
        if (!target) return '';
        if (target == window) return '#window';
        if (target == screen) return '#screen';
        return target?.nodeName || '';
      },
  fullscreenEnabled() {
        return document.fullscreenEnabled
        // Safari 13.0.3 on macOS Catalina 10.15.1 still ships with prefixed webkitFullscreenEnabled.
        // TODO: If Safari at some point ships with unprefixed version, update the version check above.
        || document.webkitFullscreenEnabled
         ;
      },
  };
  
  /** @type {Object} */
  var specialHTMLTargets = [0, document, window];
  
  
  var maybeCStringToJsString = (cString) => {
      // "cString > 2" checks if the input is a number, and isn't of the special
      // values we accept here, EMSCRIPTEN_EVENT_TARGET_* (which map to 0, 1, 2).
      // In other words, if cString > 2 then it's a pointer to a valid place in
      // memory, and points to a C string.
      return cString > 2 ? UTF8ToString(cString) : cString;
    };
  
  var findEventTarget = (target) => {
      target = maybeCStringToJsString(target);
      var domElement = specialHTMLTargets[target] || document.querySelector(target);
      return domElement;
    };
  var findCanvasEventTarget = findEventTarget;
  var _emscripten_get_canvas_element_size = (target, width, height) => {
      var canvas = findCanvasEventTarget(target);
      if (!canvas) return -4;
      HEAP32[((width)>>2)] = canvas.width;
      HEAP32[((height)>>2)] = canvas.height;
    };
  
  
  
  
  
  var stackAlloc = (sz) => __emscripten_stack_alloc(sz);
  var stringToUTF8OnStack = (str) => {
      var size = lengthBytesUTF8(str) + 1;
      var ret = stackAlloc(size);
      stringToUTF8(str, ret, size);
      return ret;
    };
  var getCanvasElementSize = (target) => {
      var sp = stackSave();
      var w = stackAlloc(8);
      var h = w + 4;
  
      var targetInt = stringToUTF8OnStack(target.id);
      var ret = _emscripten_get_canvas_element_size(targetInt, w, h);
      var size = [HEAP32[((w)>>2)], HEAP32[((h)>>2)]];
      stackRestore(sp);
      return size;
    };
  
  var _emscripten_set_canvas_element_size = (target, width, height) => {
      var canvas = findCanvasEventTarget(target);
      if (!canvas) return -4;
      canvas.width = width;
      canvas.height = height;
      return 0;
    };
  
  
  
  var setCanvasElementSize = (target, width, height) => {
      if (!target.controlTransferredOffscreen) {
        target.width = width;
        target.height = height;
      } else {
        // This function is being called from high-level JavaScript code instead of asm.js/Wasm,
        // and it needs to synchronously proxy over to another thread, so marshal the string onto the heap to do the call.
        var sp = stackSave();
        var targetInt = stringToUTF8OnStack(target.id);
        _emscripten_set_canvas_element_size(targetInt, width, height);
        stackRestore(sp);
      }
    };
  
  var currentFullscreenStrategy = {
  };
  var registerRestoreOldStyle = (canvas) => {
      var canvasSize = getCanvasElementSize(canvas);
      var oldWidth = canvasSize[0];
      var oldHeight = canvasSize[1];
      var oldCssWidth = canvas.style.width;
      var oldCssHeight = canvas.style.height;
      var oldBackgroundColor = canvas.style.backgroundColor; // Chrome reads color from here.
      var oldDocumentBackgroundColor = document.body.style.backgroundColor; // IE11 reads color from here.
      // Firefox always has black background color.
      var oldPaddingLeft = canvas.style.paddingLeft; // Chrome, FF, Safari
      var oldPaddingRight = canvas.style.paddingRight;
      var oldPaddingTop = canvas.style.paddingTop;
      var oldPaddingBottom = canvas.style.paddingBottom;
      var oldMarginLeft = canvas.style.marginLeft; // IE11
      var oldMarginRight = canvas.style.marginRight;
      var oldMarginTop = canvas.style.marginTop;
      var oldMarginBottom = canvas.style.marginBottom;
      var oldDocumentBodyMargin = document.body.style.margin;
      var oldDocumentOverflow = document.documentElement.style.overflow; // Chrome, Firefox
      var oldDocumentScroll = document.body.scroll; // IE
      var oldImageRendering = canvas.style.imageRendering;
  
      function restoreOldStyle() {
        if (!getFullscreenElement()) {
          document.removeEventListener('fullscreenchange', restoreOldStyle);
  
          // As of Safari 13.0.3 on macOS Catalina 10.15.1 still ships with prefixed webkitfullscreenchange. TODO: revisit this check once Safari ships unprefixed version.
          document.removeEventListener('webkitfullscreenchange', restoreOldStyle);
  
          setCanvasElementSize(canvas, oldWidth, oldHeight);
  
          canvas.style.width = oldCssWidth;
          canvas.style.height = oldCssHeight;
          canvas.style.backgroundColor = oldBackgroundColor; // Chrome
          // IE11 hack: assigning 'undefined' or an empty string to document.body.style.backgroundColor has no effect, so first assign back the default color
          // before setting the undefined value. Setting undefined value is also important, or otherwise we would later treat that as something that the user
          // had explicitly set so subsequent fullscreen transitions would not set background color properly.
          if (!oldDocumentBackgroundColor) document.body.style.backgroundColor = 'white';
          document.body.style.backgroundColor = oldDocumentBackgroundColor; // IE11
          canvas.style.paddingLeft = oldPaddingLeft; // Chrome, FF, Safari
          canvas.style.paddingRight = oldPaddingRight;
          canvas.style.paddingTop = oldPaddingTop;
          canvas.style.paddingBottom = oldPaddingBottom;
          canvas.style.marginLeft = oldMarginLeft; // IE11
          canvas.style.marginRight = oldMarginRight;
          canvas.style.marginTop = oldMarginTop;
          canvas.style.marginBottom = oldMarginBottom;
          document.body.style.margin = oldDocumentBodyMargin;
          document.documentElement.style.overflow = oldDocumentOverflow; // Chrome, Firefox
          document.body.scroll = oldDocumentScroll; // IE
          canvas.style.imageRendering = oldImageRendering;
          if (canvas.GLctxObject) canvas.GLctxObject.GLctx.viewport(0, 0, oldWidth, oldHeight);
  
          if (currentFullscreenStrategy.canvasResizedCallback) {
            ((a1, a2, a3) => dynCall_iiii(currentFullscreenStrategy.canvasResizedCallback, a1, a2, a3))(37, 0, currentFullscreenStrategy.canvasResizedCallbackUserData);
          }
        }
      }
      document.addEventListener('fullscreenchange', restoreOldStyle);
      // As of Safari 13.0.3 on macOS Catalina 10.15.1 still ships with prefixed webkitfullscreenchange. TODO: revisit this check once Safari ships unprefixed version.
      document.addEventListener('webkitfullscreenchange', restoreOldStyle);
      return restoreOldStyle;
    };
  
  
  var setLetterbox = (element, topBottom, leftRight) => {
      // Cannot use margin to specify letterboxes in FF or Chrome, since those ignore margins in fullscreen mode.
      element.style.paddingLeft = element.style.paddingRight = leftRight + 'px';
      element.style.paddingTop = element.style.paddingBottom = topBottom + 'px';
    };
  
  
  var getBoundingClientRect = (e) => specialHTMLTargets.indexOf(e) < 0 ? e.getBoundingClientRect() : {'left':0,'top':0};
  var JSEvents_resizeCanvasForFullscreen = (target, strategy) => {
      var restoreOldStyle = registerRestoreOldStyle(target);
      var cssWidth = strategy.softFullscreen ? innerWidth : screen.width;
      var cssHeight = strategy.softFullscreen ? innerHeight : screen.height;
      var rect = getBoundingClientRect(target);
      var windowedCssWidth = rect.width;
      var windowedCssHeight = rect.height;
      var canvasSize = getCanvasElementSize(target);
      var windowedRttWidth = canvasSize[0];
      var windowedRttHeight = canvasSize[1];
  
      if (strategy.scaleMode == 3) {
        setLetterbox(target, (cssHeight - windowedCssHeight) / 2, (cssWidth - windowedCssWidth) / 2);
        cssWidth = windowedCssWidth;
        cssHeight = windowedCssHeight;
      } else if (strategy.scaleMode == 2) {
        if (cssWidth*windowedRttHeight < windowedRttWidth*cssHeight) {
          var desiredCssHeight = windowedRttHeight * cssWidth / windowedRttWidth;
          setLetterbox(target, (cssHeight - desiredCssHeight) / 2, 0);
          cssHeight = desiredCssHeight;
        } else {
          var desiredCssWidth = windowedRttWidth * cssHeight / windowedRttHeight;
          setLetterbox(target, 0, (cssWidth - desiredCssWidth) / 2);
          cssWidth = desiredCssWidth;
        }
      }
  
      // If we are adding padding, must choose a background color or otherwise Chrome will give the
      // padding a default white color. Do it only if user has not customized their own background color.
      target.style.backgroundColor ||= 'black';
      // IE11 does the same, but requires the color to be set in the document body.
      document.body.style.backgroundColor ||= 'black'; // IE11
      // Firefox always shows black letterboxes independent of style color.
  
      target.style.width = cssWidth + 'px';
      target.style.height = cssHeight + 'px';
  
      if (strategy.filteringMode == 1) {
        target.style.imageRendering = 'optimizeSpeed';
        target.style.imageRendering = '-moz-crisp-edges';
        target.style.imageRendering = '-o-crisp-edges';
        target.style.imageRendering = '-webkit-optimize-contrast';
        target.style.imageRendering = 'optimize-contrast';
        target.style.imageRendering = 'crisp-edges';
        target.style.imageRendering = 'pixelated';
      }
  
      var dpiScale = (strategy.canvasResolutionScaleMode == 2) ? devicePixelRatio : 1;
      if (strategy.canvasResolutionScaleMode != 0) {
        var newWidth = (cssWidth * dpiScale)|0;
        var newHeight = (cssHeight * dpiScale)|0;
        setCanvasElementSize(target, newWidth, newHeight);
        if (target.GLctxObject) target.GLctxObject.GLctx.viewport(0, 0, newWidth, newHeight);
      }
      return restoreOldStyle;
    };
  var JSEvents_requestFullscreen = (target, strategy) => {
      // EMSCRIPTEN_FULLSCREEN_SCALE_DEFAULT + EMSCRIPTEN_FULLSCREEN_CANVAS_SCALE_NONE is a mode where no extra logic is performed to the DOM elements.
      if (strategy.scaleMode != 0 || strategy.canvasResolutionScaleMode != 0) {
        JSEvents_resizeCanvasForFullscreen(target, strategy);
      }
  
      if (target.requestFullscreen) {
        target.requestFullscreen();
      } else if (target.webkitRequestFullscreen) {
        target.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
      } else {
        return JSEvents.fullscreenEnabled() ? -3 : -1;
      }
  
      currentFullscreenStrategy = strategy;
  
      if (strategy.canvasResizedCallback) {
        ((a1, a2, a3) => dynCall_iiii(strategy.canvasResizedCallback, a1, a2, a3))(37, 0, strategy.canvasResizedCallbackUserData);
      }
  
      return 0;
    };
  var _emscripten_exit_fullscreen = () => {
      if (!JSEvents.fullscreenEnabled()) return -1;
      // Make sure no queued up calls will fire after this.
      JSEvents.removeDeferredCalls(JSEvents_requestFullscreen);
  
      var d = specialHTMLTargets[1];
      if (d.exitFullscreen) {
        d.fullscreenElement && d.exitFullscreen();
      } else if (d.webkitExitFullscreen) {
        d.webkitFullscreenElement && d.webkitExitFullscreen();
      } else {
        return -1;
      }
  
      return 0;
    };

  
  var requestPointerLock = (target) => {
      if (target.requestPointerLock) {
        target.requestPointerLock();
      } else {
        // document.body is known to accept pointer lock, so use that to differentiate if the user passed a bad element,
        // or if the whole browser just doesn't support the feature.
        if (document.body.requestPointerLock) {
          return -3;
        }
        return -1;
      }
      return 0;
    };
  var _emscripten_exit_pointerlock = () => {
      // Make sure no queued up calls will fire after this.
      JSEvents.removeDeferredCalls(requestPointerLock);
      if (!document.exitPointerLock) return -1;
      document.exitPointerLock();
      return 0;
    };


  
  
  
  function getFullscreenElement() {
      return document.fullscreenElement || document.mozFullScreenElement ||
             document.webkitFullscreenElement || document.webkitCurrentFullScreenElement ||
             document.msFullscreenElement;
    }
  var fillFullscreenChangeEventData = (eventStruct) => {
      var fullscreenElement = getFullscreenElement();
      var isFullscreen = !!fullscreenElement;
      // Assigning a boolean to HEAP32 with expected type coercion.
      /** @suppress{checkTypes} */
      HEAP8[eventStruct] = isFullscreen;
      HEAP8[(eventStruct)+(1)] = JSEvents.fullscreenEnabled();
      // If transitioning to fullscreen, report info about the element that is now fullscreen.
      // If transitioning to windowed mode, report info about the element that just was fullscreen.
      var reportedElement = isFullscreen ? fullscreenElement : JSEvents.previousFullscreenElement;
      var nodeName = JSEvents.getNodeNameForTarget(reportedElement);
      var id = reportedElement?.id || '';
      stringToUTF8(nodeName, eventStruct + 2, 128);
      stringToUTF8(id, eventStruct + 130, 128);
      HEAP32[(((eventStruct)+(260))>>2)] = reportedElement ? reportedElement.clientWidth : 0;
      HEAP32[(((eventStruct)+(264))>>2)] = reportedElement ? reportedElement.clientHeight : 0;
      HEAP32[(((eventStruct)+(268))>>2)] = screen.width;
      HEAP32[(((eventStruct)+(272))>>2)] = screen.height;
      if (isFullscreen) {
        JSEvents.previousFullscreenElement = fullscreenElement;
      }
    };
  var _emscripten_get_fullscreen_status = (fullscreenStatus) => {
      if (!JSEvents.fullscreenEnabled()) return -1;
      fillFullscreenChangeEventData(fullscreenStatus);
      return 0;
    };

  
  var fillGamepadEventData = (eventStruct, e) => {
      HEAPF64[((eventStruct)>>3)] = e.timestamp;
      for (var i = 0; i < e.axes.length; ++i) {
        HEAPF64[(((eventStruct+i*8)+(16))>>3)] = e.axes[i];
      }
      for (var i = 0; i < e.buttons.length; ++i) {
        if (typeof e.buttons[i] == 'object') {
          HEAPF64[(((eventStruct+i*8)+(528))>>3)] = e.buttons[i].value;
        } else {
          HEAPF64[(((eventStruct+i*8)+(528))>>3)] = e.buttons[i];
        }
      }
      for (var i = 0; i < e.buttons.length; ++i) {
        if (typeof e.buttons[i] == 'object') {
          HEAP8[(eventStruct+i)+(1040)] = e.buttons[i].pressed;
        } else {
          // Assigning a boolean to HEAP32, that's ok, but Closure would like to warn about it:
          /** @suppress {checkTypes} */
          HEAP8[(eventStruct+i)+(1040)] = e.buttons[i] == 1;
        }
      }
      HEAP8[(eventStruct)+(1104)] = e.connected;
      HEAP32[(((eventStruct)+(1108))>>2)] = e.index;
      HEAP32[(((eventStruct)+(8))>>2)] = e.axes.length;
      HEAP32[(((eventStruct)+(12))>>2)] = e.buttons.length;
      stringToUTF8(e.id, eventStruct + 1112, 64);
      stringToUTF8(e.mapping, eventStruct + 1176, 64);
    };
  var _emscripten_get_gamepad_status = (index, gamepadState) => {
      assert(JSEvents.lastGamepadState, 'emscripten_get_gamepad_status() can only be called after having first called emscripten_sample_gamepad_data() and that function has returned EMSCRIPTEN_RESULT_SUCCESS!');
      // INVALID_PARAM is returned on a Gamepad index that never was there.
      if (index < 0 || index >= JSEvents.lastGamepadState.length) return -5;
  
      // NO_DATA is returned on a Gamepad index that was removed.
      // For previously disconnected gamepads there should be an empty slot (null/undefined/false) at the index.
      // This is because gamepads must keep their original position in the array.
      // For example, removing the first of two gamepads produces [null/undefined/false, gamepad].
      if (!JSEvents.lastGamepadState[index]) return -7;
  
      fillGamepadEventData(gamepadState, JSEvents.lastGamepadState[index]);
      return 0;
    };

  var getHeapMax = () =>
      // Stay one Wasm page short of 4GB: while e.g. Chrome is able to allocate
      // full 4GB Wasm memories, the size will wrap back to 0 bytes in Wasm side
      // for any code that deals with heap sizes, which would require special
      // casing all heap size related code to treat 0 specially.
      2147418112;
  var _emscripten_get_heap_max = () => getHeapMax();


  var _emscripten_get_num_gamepads = () => {
      assert(JSEvents.lastGamepadState, 'emscripten_get_num_gamepads() can only be called after having first called emscripten_sample_gamepad_data() and that function has returned EMSCRIPTEN_RESULT_SUCCESS!');
      // N.B. Do not call emscripten_get_num_gamepads() unless having first called emscripten_sample_gamepad_data(), and that has returned EMSCRIPTEN_RESULT_SUCCESS.
      // Otherwise the following line will throw an exception.
      return JSEvents.lastGamepadState.length;
    };

  var _emscripten_html5_remove_all_event_listeners = () => JSEvents.removeAllEventListeners();

  var GLctx;
  
  var webgl_enable_ANGLE_instanced_arrays = (ctx) => {
      // Extension available in WebGL 1 from Firefox 26 and Google Chrome 30 onwards. Core feature in WebGL 2.
      var ext = ctx.getExtension('ANGLE_instanced_arrays');
      // Because this extension is a core function in WebGL 2, assign the extension entry points in place of
      // where the core functions will reside in WebGL 2. This way the calling code can call these without
      // having to dynamically branch depending if running against WebGL 1 or WebGL 2.
      if (ext) {
        ctx['vertexAttribDivisor'] = (index, divisor) => ext['vertexAttribDivisorANGLE'](index, divisor);
        ctx['drawArraysInstanced'] = (mode, first, count, primcount) => ext['drawArraysInstancedANGLE'](mode, first, count, primcount);
        ctx['drawElementsInstanced'] = (mode, count, type, indices, primcount) => ext['drawElementsInstancedANGLE'](mode, count, type, indices, primcount);
        return 1;
      }
    };
  
  var webgl_enable_OES_vertex_array_object = (ctx) => {
      // Extension available in WebGL 1 from Firefox 25 and WebKit 536.28/desktop Safari 6.0.3 onwards. Core feature in WebGL 2.
      var ext = ctx.getExtension('OES_vertex_array_object');
      if (ext) {
        ctx['createVertexArray'] = () => ext['createVertexArrayOES']();
        ctx['deleteVertexArray'] = (vao) => ext['deleteVertexArrayOES'](vao);
        ctx['bindVertexArray'] = (vao) => ext['bindVertexArrayOES'](vao);
        ctx['isVertexArray'] = (vao) => ext['isVertexArrayOES'](vao);
        return 1;
      }
    };
  
  var webgl_enable_WEBGL_draw_buffers = (ctx) => {
      // Extension available in WebGL 1 from Firefox 28 onwards. Core feature in WebGL 2.
      var ext = ctx.getExtension('WEBGL_draw_buffers');
      if (ext) {
        ctx['drawBuffers'] = (n, bufs) => ext['drawBuffersWEBGL'](n, bufs);
        return 1;
      }
    };
  
  var webgl_enable_WEBGL_draw_instanced_base_vertex_base_instance = (ctx) =>
      // Closure is expected to be allowed to minify the '.dibvbi' property, so not accessing it quoted.
      !!(ctx.dibvbi = ctx.getExtension('WEBGL_draw_instanced_base_vertex_base_instance'));
  
  var webgl_enable_WEBGL_multi_draw_instanced_base_vertex_base_instance = (ctx) => {
      // Closure is expected to be allowed to minify the '.mdibvbi' property, so not accessing it quoted.
      return !!(ctx.mdibvbi = ctx.getExtension('WEBGL_multi_draw_instanced_base_vertex_base_instance'));
    };
  
  var webgl_enable_EXT_polygon_offset_clamp = (ctx) =>
      !!(ctx.extPolygonOffsetClamp = ctx.getExtension('EXT_polygon_offset_clamp'));
  
  var webgl_enable_EXT_clip_control = (ctx) =>
      !!(ctx.extClipControl = ctx.getExtension('EXT_clip_control'));
  
  var webgl_enable_WEBGL_polygon_mode = (ctx) =>
      !!(ctx.webglPolygonMode = ctx.getExtension('WEBGL_polygon_mode'));
  
  var webgl_enable_WEBGL_multi_draw = (ctx) =>
      // Closure is expected to be allowed to minify the '.multiDrawWebgl' property, so not accessing it quoted.
      !!(ctx.multiDrawWebgl = ctx.getExtension('WEBGL_multi_draw'));
  
  var getEmscriptenSupportedExtensions = (ctx) => {
      // Restrict the list of advertised extensions to those that we actually
      // support.
      var supportedExtensions = [
        // WebGL 1 extensions
        'ANGLE_instanced_arrays',
        'EXT_blend_minmax',
        'EXT_disjoint_timer_query',
        'EXT_frag_depth',
        'EXT_shader_texture_lod',
        'EXT_sRGB',
        'OES_element_index_uint',
        'OES_fbo_render_mipmap',
        'OES_standard_derivatives',
        'OES_texture_float',
        'OES_texture_half_float',
        'OES_texture_half_float_linear',
        'OES_vertex_array_object',
        'WEBGL_color_buffer_float',
        'WEBGL_depth_texture',
        'WEBGL_draw_buffers',
        // WebGL 2 extensions
        'EXT_color_buffer_float',
        'EXT_conservative_depth',
        'EXT_disjoint_timer_query_webgl2',
        'EXT_texture_norm16',
        'NV_shader_noperspective_interpolation',
        'WEBGL_clip_cull_distance',
        // WebGL 1 and WebGL 2 extensions
        'EXT_clip_control',
        'EXT_color_buffer_half_float',
        'EXT_depth_clamp',
        'EXT_float_blend',
        'EXT_polygon_offset_clamp',
        'EXT_texture_compression_bptc',
        'EXT_texture_compression_rgtc',
        'EXT_texture_filter_anisotropic',
        'KHR_parallel_shader_compile',
        'OES_texture_float_linear',
        'WEBGL_blend_func_extended',
        'WEBGL_compressed_texture_astc',
        'WEBGL_compressed_texture_etc',
        'WEBGL_compressed_texture_etc1',
        'WEBGL_compressed_texture_s3tc',
        'WEBGL_compressed_texture_s3tc_srgb',
        'WEBGL_debug_renderer_info',
        'WEBGL_debug_shaders',
        'WEBGL_lose_context',
        'WEBGL_multi_draw',
        'WEBGL_polygon_mode'
      ];
      // .getSupportedExtensions() can return null if context is lost, so coerce to empty array.
      return (ctx.getSupportedExtensions() || []).filter(ext => supportedExtensions.includes(ext));
    };
  
  var registerPreMainLoop = (f) => {
      // Does nothing unless $MainLoop is included/used.
      typeof MainLoop != 'undefined' && MainLoop.preMainLoop.push(f);
    };
  
  
  var GL = {
  counter:1,
  buffers:[],
  mappedBuffers:{
  },
  programs:[],
  framebuffers:[],
  renderbuffers:[],
  textures:[],
  shaders:[],
  vaos:[],
  contexts:[],
  offscreenCanvases:{
  },
  queries:[],
  samplers:[],
  transformFeedbacks:[],
  syncs:[],
  byteSizeByTypeRoot:5120,
  byteSizeByType:[1,1,2,2,4,4,4,2,3,4,8],
  stringCache:{
  },
  stringiCache:{
  },
  unpackAlignment:4,
  unpackRowLength:0,
  recordError:(errorCode) => {
        if (!GL.lastError) {
          GL.lastError = errorCode;
        }
      },
  getNewId:(table) => {
        var ret = GL.counter++;
        for (var i = table.length; i < ret; i++) {
          table[i] = null;
        }
        // Skip over any non-null elements that might have been created by
        // glBindBuffer.
        while (table[ret]) {
          ret = GL.counter++;
        }
        return ret;
      },
  genObject:(n, buffers, createFunction, objectTable
        ) => {
        for (var i = 0; i < n; i++) {
          var buffer = GLctx[createFunction]();
          var id = buffer && GL.getNewId(objectTable);
          if (buffer) {
            buffer.name = id;
            objectTable[id] = buffer;
          } else {
            GL.recordError(0x502 /* GL_INVALID_OPERATION */);
          }
          HEAP32[(((buffers)+(i*4))>>2)] = id;
        }
      },
  MAX_TEMP_BUFFER_SIZE:2097152,
  numTempVertexBuffersPerSize:64,
  log2ceilLookup:(i) => 32 - Math.clz32(i === 0 ? 0 : i - 1),
  generateTempBuffers:(quads, context) => {
        var largestIndex = GL.log2ceilLookup(GL.MAX_TEMP_BUFFER_SIZE);
        context.tempVertexBufferCounters1 = [];
        context.tempVertexBufferCounters2 = [];
        context.tempVertexBufferCounters1.length = context.tempVertexBufferCounters2.length = largestIndex+1;
        context.tempVertexBuffers1 = [];
        context.tempVertexBuffers2 = [];
        context.tempVertexBuffers1.length = context.tempVertexBuffers2.length = largestIndex+1;
        context.tempIndexBuffers = [];
        context.tempIndexBuffers.length = largestIndex+1;
        for (var i = 0; i <= largestIndex; ++i) {
          context.tempIndexBuffers[i] = null; // Created on-demand
          context.tempVertexBufferCounters1[i] = context.tempVertexBufferCounters2[i] = 0;
          var ringbufferLength = GL.numTempVertexBuffersPerSize;
          context.tempVertexBuffers1[i] = [];
          context.tempVertexBuffers2[i] = [];
          var ringbuffer1 = context.tempVertexBuffers1[i];
          var ringbuffer2 = context.tempVertexBuffers2[i];
          ringbuffer1.length = ringbuffer2.length = ringbufferLength;
          for (var j = 0; j < ringbufferLength; ++j) {
            ringbuffer1[j] = ringbuffer2[j] = null; // Created on-demand
          }
        }
  
        if (quads) {
          // GL_QUAD indexes can be precalculated
          context.tempQuadIndexBuffer = GLctx.createBuffer();
          context.GLctx.bindBuffer(0x8893 /*GL_ELEMENT_ARRAY_BUFFER*/, context.tempQuadIndexBuffer);
          var numIndexes = GL.MAX_TEMP_BUFFER_SIZE >> 1;
          var quadIndexes = new Uint16Array(numIndexes);
          var i = 0, v = 0;
          while (1) {
            quadIndexes[i++] = v;
            if (i >= numIndexes) break;
            quadIndexes[i++] = v+1;
            if (i >= numIndexes) break;
            quadIndexes[i++] = v+2;
            if (i >= numIndexes) break;
            quadIndexes[i++] = v;
            if (i >= numIndexes) break;
            quadIndexes[i++] = v+2;
            if (i >= numIndexes) break;
            quadIndexes[i++] = v+3;
            if (i >= numIndexes) break;
            v += 4;
          }
          context.GLctx.bufferData(0x8893 /*GL_ELEMENT_ARRAY_BUFFER*/, quadIndexes, 0x88E4 /*GL_STATIC_DRAW*/);
          context.GLctx.bindBuffer(0x8893 /*GL_ELEMENT_ARRAY_BUFFER*/, null);
        }
      },
  getTempVertexBuffer:(sizeBytes) => {
        var idx = GL.log2ceilLookup(sizeBytes);
        var ringbuffer = GL.currentContext.tempVertexBuffers1[idx];
        var nextFreeBufferIndex = GL.currentContext.tempVertexBufferCounters1[idx];
        GL.currentContext.tempVertexBufferCounters1[idx] = (GL.currentContext.tempVertexBufferCounters1[idx]+1) & (GL.numTempVertexBuffersPerSize-1);
        var vbo = ringbuffer[nextFreeBufferIndex];
        if (vbo) {
          return vbo;
        }
        var prevVBO = GLctx.getParameter(0x8894 /*GL_ARRAY_BUFFER_BINDING*/);
        ringbuffer[nextFreeBufferIndex] = GLctx.createBuffer();
        GLctx.bindBuffer(0x8892 /*GL_ARRAY_BUFFER*/, ringbuffer[nextFreeBufferIndex]);
        GLctx.bufferData(0x8892 /*GL_ARRAY_BUFFER*/, 1 << idx, 0x88E8 /*GL_DYNAMIC_DRAW*/);
        GLctx.bindBuffer(0x8892 /*GL_ARRAY_BUFFER*/, prevVBO);
        return ringbuffer[nextFreeBufferIndex];
      },
  getTempIndexBuffer:(sizeBytes) => {
        var idx = GL.log2ceilLookup(sizeBytes);
        var ibo = GL.currentContext.tempIndexBuffers[idx];
        if (ibo) {
          return ibo;
        }
        var prevIBO = GLctx.getParameter(0x8895 /*ELEMENT_ARRAY_BUFFER_BINDING*/);
        GL.currentContext.tempIndexBuffers[idx] = GLctx.createBuffer();
        GLctx.bindBuffer(0x8893 /*GL_ELEMENT_ARRAY_BUFFER*/, GL.currentContext.tempIndexBuffers[idx]);
        GLctx.bufferData(0x8893 /*GL_ELEMENT_ARRAY_BUFFER*/, 1 << idx, 0x88E8 /*GL_DYNAMIC_DRAW*/);
        GLctx.bindBuffer(0x8893 /*GL_ELEMENT_ARRAY_BUFFER*/, prevIBO);
        return GL.currentContext.tempIndexBuffers[idx];
      },
  newRenderingFrameStarted:() => {
        if (!GL.currentContext) {
          return;
        }
        var vb = GL.currentContext.tempVertexBuffers1;
        GL.currentContext.tempVertexBuffers1 = GL.currentContext.tempVertexBuffers2;
        GL.currentContext.tempVertexBuffers2 = vb;
        vb = GL.currentContext.tempVertexBufferCounters1;
        GL.currentContext.tempVertexBufferCounters1 = GL.currentContext.tempVertexBufferCounters2;
        GL.currentContext.tempVertexBufferCounters2 = vb;
        var largestIndex = GL.log2ceilLookup(GL.MAX_TEMP_BUFFER_SIZE);
        for (var i = 0; i <= largestIndex; ++i) {
          GL.currentContext.tempVertexBufferCounters1[i] = 0;
        }
      },
  getSource:(shader, count, string, length) => {
        var source = '';
        for (var i = 0; i < count; ++i) {
          var len = length ? HEAPU32[(((length)+(i*4))>>2)] : undefined;
          source += UTF8ToString(HEAPU32[(((string)+(i*4))>>2)], len);
        }
        return source;
      },
  calcBufLength:(size, type, stride, count) => {
        if (stride > 0) {
          return count * stride;  // XXXvlad this is not exactly correct I don't think
        }
        var typeSize = GL.byteSizeByType[type - GL.byteSizeByTypeRoot];
        return size * typeSize * count;
      },
  usedTempBuffers:[],
  preDrawHandleClientVertexAttribBindings:(count) => {
        GL.resetBufferBinding = false;
  
        // TODO: initial pass to detect ranges we need to upload, might not need
        // an upload per attrib
        for (var i = 0; i < GL.currentContext.maxVertexAttribs; ++i) {
          var cb = GL.currentContext.clientBuffers[i];
          if (!cb.clientside || !cb.enabled) continue;
  
          GL.resetBufferBinding = true;
  
          var size = GL.calcBufLength(cb.size, cb.type, cb.stride, count);
          var buf = GL.getTempVertexBuffer(size);
          GLctx.bindBuffer(0x8892 /*GL_ARRAY_BUFFER*/, buf);
          GLctx.bufferSubData(0x8892 /*GL_ARRAY_BUFFER*/,
                                   0,
                                   HEAPU8.subarray(cb.ptr, cb.ptr + size));
          cb.vertexAttribPointerAdaptor.call(GLctx, i, cb.size, cb.type, cb.normalized, cb.stride, 0);
        }
      },
  postDrawHandleClientVertexAttribBindings:() => {
        if (GL.resetBufferBinding) {
          GLctx.bindBuffer(0x8892 /*GL_ARRAY_BUFFER*/, GL.buffers[GLctx.currentArrayBufferBinding]);
        }
      },
  createContext:(/** @type {HTMLCanvasElement} */ canvas, webGLContextAttributes) => {
  
        // BUG: Workaround Safari WebGL issue: After successfully acquiring WebGL
        // context on a canvas, calling .getContext() will always return that
        // context independent of which 'webgl' or 'webgl2'
        // context version was passed. See:
        //   https://webkit.org/b/222758
        // and:
        //   https://github.com/emscripten-core/emscripten/issues/13295.
        // TODO: Once the bug is fixed and shipped in Safari, adjust the Safari
        // version field in above check.
        if (!canvas.getContextSafariWebGL2Fixed) {
          canvas.getContextSafariWebGL2Fixed = canvas.getContext;
          /** @type {function(this:HTMLCanvasElement, string, (Object|null)=): (Object|null)} */
          function fixedGetContext(ver, attrs) {
            var gl = canvas.getContextSafariWebGL2Fixed(ver, attrs);
            return ((ver == 'webgl') == (gl instanceof WebGLRenderingContext)) ? gl : null;
          }
          canvas.getContext = fixedGetContext;
        }
  
        var ctx =
          (webGLContextAttributes.majorVersion > 1)
          ? canvas.getContext("webgl2", webGLContextAttributes) :
          canvas.getContext("webgl", webGLContextAttributes);
  
        if (!ctx) return 0;
  
        var handle = GL.registerContext(ctx, webGLContextAttributes);
  
        return handle;
      },
  registerContext:(ctx, webGLContextAttributes) => {
        // without pthreads a context is just an integer ID
        var handle = GL.getNewId(GL.contexts);
  
        var context = {
          handle,
          attributes: webGLContextAttributes,
          version: webGLContextAttributes.majorVersion,
          GLctx: ctx
        };
  
        // Store the created context object so that we can access the context
        // given a canvas without having to pass the parameters again.
        if (ctx.canvas) ctx.canvas.GLctxObject = context;
        GL.contexts[handle] = context;
        if (typeof webGLContextAttributes.enableExtensionsByDefault == 'undefined' || webGLContextAttributes.enableExtensionsByDefault) {
          GL.initExtensions(context);
        }
  
        context.maxVertexAttribs = context.GLctx.getParameter(0x8869 /*GL_MAX_VERTEX_ATTRIBS*/);
        context.clientBuffers = [];
        for (var i = 0; i < context.maxVertexAttribs; i++) {
          context.clientBuffers[i] = {
            enabled: false,
            clientside: false,
            size: 0,
            type: 0,
            normalized: 0,
            stride: 0,
            ptr: 0,
            vertexAttribPointerAdaptor: null,
          };
        }
  
        GL.generateTempBuffers(false, context);
  
        return handle;
      },
  makeContextCurrent:(contextHandle) => {
  
        // Active Emscripten GL layer context object.
        GL.currentContext = GL.contexts[contextHandle];
        // Active WebGL context object.
        Module['ctx'] = GLctx = GL.currentContext?.GLctx;
        return !(contextHandle && !GLctx);
      },
  getContext:(contextHandle) => {
        return GL.contexts[contextHandle];
      },
  deleteContext:(contextHandle) => {
        if (GL.currentContext === GL.contexts[contextHandle]) {
          GL.currentContext = null;
        }
        if (typeof JSEvents == 'object') {
          // Release all JS event handlers on the DOM element that the GL context is
          // associated with since the context is now deleted.
          JSEvents.removeAllHandlersOnTarget(GL.contexts[contextHandle].GLctx.canvas);
        }
        // Make sure the canvas object no longer refers to the context object so
        // there are no GC surprises.
        if (GL.contexts[contextHandle]?.GLctx.canvas) {
          GL.contexts[contextHandle].GLctx.canvas.GLctxObject = undefined;
        }
        GL.contexts[contextHandle] = null;
      },
  initExtensions:(context) => {
        // If this function is called without a specific context object, init the
        // extensions of the currently active context.
        context ||= GL.currentContext;
  
        if (context.initExtensionsDone) return;
        context.initExtensionsDone = true;
  
        var GLctx = context.GLctx;
  
        // Detect the presence of a few extensions manually, ction GL interop
        // layer itself will need to know if they exist.
  
        // Extensions that are available in both WebGL 1 and WebGL 2
        webgl_enable_WEBGL_multi_draw(GLctx);
        webgl_enable_EXT_polygon_offset_clamp(GLctx);
        webgl_enable_EXT_clip_control(GLctx);
        webgl_enable_WEBGL_polygon_mode(GLctx);
        // Extensions that are only available in WebGL 1 (the calls will be no-ops
        // if called on a WebGL 2 context active)
        webgl_enable_ANGLE_instanced_arrays(GLctx);
        webgl_enable_OES_vertex_array_object(GLctx);
        webgl_enable_WEBGL_draw_buffers(GLctx);
        // Extensions that are available from WebGL >= 2 (no-op if called on a WebGL 1 context active)
        webgl_enable_WEBGL_draw_instanced_base_vertex_base_instance(GLctx);
        webgl_enable_WEBGL_multi_draw_instanced_base_vertex_base_instance(GLctx);
  
        // On WebGL 2, EXT_disjoint_timer_query is replaced with an alternative
        // that's based on core APIs, and exposes only the queryCounterEXT()
        // entrypoint.
        if (context.version >= 2) {
          GLctx.disjointTimerQueryExt = GLctx.getExtension("EXT_disjoint_timer_query_webgl2");
        }
  
        // However, Firefox exposes the WebGL 1 version on WebGL 2 as well and
        // thus we look for the WebGL 1 version again if the WebGL 2 version
        // isn't present. https://bugzil.la/1328882
        if (context.version < 2 || !GLctx.disjointTimerQueryExt)
        {
          GLctx.disjointTimerQueryExt = GLctx.getExtension("EXT_disjoint_timer_query");
        }
  
        for (var ext of getEmscriptenSupportedExtensions(GLctx)) {
          // WEBGL_lose_context, WEBGL_debug_renderer_info and WEBGL_debug_shaders
          // are not enabled by default.
          if (!ext.includes('lose_context') && !ext.includes('debug')) {
            // Call .getExtension() to enable that extension permanently.
            GLctx.getExtension(ext);
          }
        }
      },
  };
  var _emscripten_is_webgl_context_lost = (contextHandle) =>
      !GL.contexts[contextHandle] || GL.contexts[contextHandle].GLctx.isContextLost();

  var _emscripten_performance_now = () => performance.now();

  
  
  var doRequestFullscreen = (target, strategy) => {
      if (!JSEvents.fullscreenEnabled()) return -1;
      target = findEventTarget(target);
      if (!target) return -4;
  
      if (!target.requestFullscreen
        && !target.webkitRequestFullscreen
        ) {
        return -3;
      }
  
      // Queue this function call if we're not currently in an event handler and
      // the user saw it appropriate to do so.
      if (!JSEvents.canPerformEventHandlerRequests()) {
        if (strategy.deferUntilInEventHandler) {
          JSEvents.deferCall(JSEvents_requestFullscreen, 1 /* priority over pointer lock */, [target, strategy]);
          return 1;
        }
        return -2;
      }
  
      return JSEvents_requestFullscreen(target, strategy);
    };
  var _emscripten_request_fullscreen = (target, deferUntilInEventHandler) => {
      var strategy = {
        // These options perform no added logic, but just bare request fullscreen.
        scaleMode: 0,
        canvasResolutionScaleMode: 0,
        filteringMode: 0,
        deferUntilInEventHandler,
        canvasResizedCallbackTargetThread: 2
      };
      return doRequestFullscreen(target, strategy);
    };

  
  
  var _emscripten_request_pointerlock = (target, deferUntilInEventHandler) => {
      target = findEventTarget(target);
      if (!target) return -4;
      if (!target.requestPointerLock) {
        return -1;
      }
  
      // Queue this function call if we're not currently in an event handler and
      // the user saw it appropriate to do so.
      if (!JSEvents.canPerformEventHandlerRequests()) {
        if (deferUntilInEventHandler) {
          JSEvents.deferCall(requestPointerLock, 2 /* priority below fullscreen */, [target]);
          return 1;
        }
        return -2;
      }
  
      return requestPointerLock(target);
    };

  var abortOnCannotGrowMemory = (requestedSize) => {
      abort(`Cannot enlarge memory arrays to size ${requestedSize} bytes (OOM). If you want malloc to return NULL (0) instead of this abort, do not link with -sABORTING_MALLOC (that is, the default when growth is enabled is to not abort, but you have overridden that)`);
    };
  
  
  var alignMemory = (size, alignment) => {
      assert(alignment, "alignment argument is required");
      return Math.ceil(size / alignment) * alignment;
    };
  
  var growMemory = (size) => {
      var oldHeapSize = wasmMemory.buffer.byteLength;
      var pages = ((size - oldHeapSize + 65535) / 65536) | 0;
      try {
        // round size grow request up to wasm page size (fixed 64KB per spec)
        wasmMemory.grow(pages); // .grow() takes a delta compared to the previous size
        updateMemoryViews();
        return 1 /*success*/;
      } catch(e) {
        err(`growMemory: Attempted to grow heap from ${oldHeapSize} bytes to ${size} bytes, but got error: ${e}`);
      }
      // implicit 0 return to save code size (caller will cast "undefined" into 0
      // anyhow)
    };
  var _emscripten_resize_heap = (requestedSize) => {
      var oldSize = HEAPU8.length;
      // With CAN_ADDRESS_2GB or MEMORY64, pointers are already unsigned.
      requestedSize >>>= 0;
      // With multithreaded builds, races can happen (another thread might increase the size
      // in between), so return a failure, and let the caller retry.
      assert(requestedSize > oldSize);
  
      // Memory resize rules:
      // 1.  Always increase heap size to at least the requested size, rounded up
      //     to next page multiple.
      // 2a. If MEMORY_GROWTH_LINEAR_STEP == -1, excessively resize the heap
      //     geometrically: increase the heap size according to
      //     MEMORY_GROWTH_GEOMETRIC_STEP factor (default +20%), At most
      //     overreserve by MEMORY_GROWTH_GEOMETRIC_CAP bytes (default 96MB).
      // 2b. If MEMORY_GROWTH_LINEAR_STEP != -1, excessively resize the heap
      //     linearly: increase the heap size by at least
      //     MEMORY_GROWTH_LINEAR_STEP bytes.
      // 3.  Max size for the heap is capped at 2048MB-WASM_PAGE_SIZE, or by
      //     MAXIMUM_MEMORY, or by ASAN limit, depending on which is smallest
      // 4.  If we were unable to allocate as much memory, it may be due to
      //     over-eager decision to excessively reserve due to (3) above.
      //     Hence if an allocation fails, cut down on the amount of excess
      //     growth, in an attempt to succeed to perform a smaller allocation.
  
      // A limit is set for how much we can grow. We should not exceed that
      // (the wasm binary specifies it, so if we tried, we'd fail anyhow).
      var maxHeapSize = getHeapMax();
      if (requestedSize > maxHeapSize) {
        err(`Cannot enlarge memory, requested ${requestedSize} bytes, but the limit is ${maxHeapSize} bytes!`);
        abortOnCannotGrowMemory(requestedSize);
      }
  
      // Loop through potential heap size increases. If we attempt a too eager
      // reservation that fails, cut down on the attempted size and reserve a
      // smaller bump instead. (max 3 times, chosen somewhat arbitrarily)
      for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
        var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown); // ensure geometric growth
        // but limit overreserving (default to capping at +96MB overgrowth at most)
        overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296 );
  
        var newSize = Math.min(maxHeapSize, alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536));
  
        var replacement = growMemory(newSize);
        if (replacement) {
  
          return true;
        }
      }
      err(`Failed to grow the heap from ${oldSize} bytes to ${newSize} bytes, not enough memory!`);
      abortOnCannotGrowMemory(requestedSize);
    };

  /** @suppress {checkTypes} */
  var _emscripten_sample_gamepad_data = () => {
      try {
        if (navigator.getGamepads) return (JSEvents.lastGamepadState = navigator.getGamepads())
          ? 0 : -1;
      } catch(e) {
        err(`navigator.getGamepads() exists, but failed to execute with exception ${e}. Disabling Gamepad access.`);
        navigator.getGamepads = null; // Disable getGamepads() so that it won't be attempted to be used again.
      }
      return -1;
    };

  
  
  
  var registerFocusEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
      JSEvents.focusEvent ||= _malloc(256);
  
      var focusEventHandlerFunc = (e = event) => {
        var nodeName = JSEvents.getNodeNameForTarget(e.target);
        var id = e.target.id ? e.target.id : '';
  
        var focusEvent = JSEvents.focusEvent;
        stringToUTF8(nodeName, focusEvent + 0, 128);
        stringToUTF8(id, focusEvent + 128, 128);
  
        if (((a1, a2, a3) => dynCall_iiii(callbackfunc, a1, a2, a3))(eventTypeId, focusEvent, userData)) e.preventDefault();
      };
  
      var eventHandler = {
        target: findEventTarget(target),
        eventTypeString,
        callbackfunc,
        handlerFunc: focusEventHandlerFunc,
        useCapture
      };
      return JSEvents.registerOrRemoveHandler(eventHandler);
    };
  var _emscripten_set_blur_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) =>
      registerFocusEventCallback(target, userData, useCapture, callbackfunc, 12, "blur", targetThread);


  var _emscripten_set_focus_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) =>
      registerFocusEventCallback(target, userData, useCapture, callbackfunc, 13, "focus", targetThread);

  
  
  
  var registerFullscreenChangeEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
      JSEvents.fullscreenChangeEvent ||= _malloc(276);
  
      var fullscreenChangeEventhandlerFunc = (e = event) => {
        var fullscreenChangeEvent = JSEvents.fullscreenChangeEvent;
  
        fillFullscreenChangeEventData(fullscreenChangeEvent);
  
        if (((a1, a2, a3) => dynCall_iiii(callbackfunc, a1, a2, a3))(eventTypeId, fullscreenChangeEvent, userData)) e.preventDefault();
      };
  
      var eventHandler = {
        target,
        eventTypeString,
        callbackfunc,
        handlerFunc: fullscreenChangeEventhandlerFunc,
        useCapture
      };
      return JSEvents.registerOrRemoveHandler(eventHandler);
    };
  
  var _emscripten_set_fullscreenchange_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) => {
      if (!JSEvents.fullscreenEnabled()) return -1;
      target = findEventTarget(target);
      if (!target) return -4;
  
      // As of Safari 13.0.3 on macOS Catalina 10.15.1 still ships with prefixed webkitfullscreenchange. TODO: revisit this check once Safari ships unprefixed version.
      registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, 19, "webkitfullscreenchange", targetThread);
  
      return registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, 19, "fullscreenchange", targetThread);
    };

  
  
  
  var registerGamepadEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
      JSEvents.gamepadEvent ||= _malloc(1240);
  
      var gamepadEventHandlerFunc = (e = event) => {
        var gamepadEvent = JSEvents.gamepadEvent;
        fillGamepadEventData(gamepadEvent, e["gamepad"]);
  
        if (((a1, a2, a3) => dynCall_iiii(callbackfunc, a1, a2, a3))(eventTypeId, gamepadEvent, userData)) e.preventDefault();
      };
  
      var eventHandler = {
        target: findEventTarget(target),
        allowsDeferredCalls: true,
        eventTypeString,
        callbackfunc,
        handlerFunc: gamepadEventHandlerFunc,
        useCapture
      };
      return JSEvents.registerOrRemoveHandler(eventHandler);
    };
  
  var _emscripten_set_gamepadconnected_callback_on_thread = (userData, useCapture, callbackfunc, targetThread) => {
      if (_emscripten_sample_gamepad_data()) return -1;
      return registerGamepadEventCallback(2, userData, useCapture, callbackfunc, 26, "gamepadconnected", targetThread);
    };

  
  var _emscripten_set_gamepaddisconnected_callback_on_thread = (userData, useCapture, callbackfunc, targetThread) => {
      if (_emscripten_sample_gamepad_data()) return -1;
      return registerGamepadEventCallback(2, userData, useCapture, callbackfunc, 27, "gamepaddisconnected", targetThread);
    };

  var _emscripten_set_interval = (cb, msecs, userData) => {
      
      return setInterval(() => {
        callUserCallback(() => ((a1) => dynCall_vi(cb, a1))(userData));
      }, msecs);
    };

  
  
  
  var registerKeyEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
      JSEvents.keyEvent ||= _malloc(160);
  
      var keyEventHandlerFunc = (e) => {
        assert(e);
  
        var keyEventData = JSEvents.keyEvent;
        HEAPF64[((keyEventData)>>3)] = e.timeStamp;
  
        var idx = ((keyEventData)>>2);
  
        HEAP32[idx + 2] = e.location;
        HEAP8[keyEventData + 12] = e.ctrlKey;
        HEAP8[keyEventData + 13] = e.shiftKey;
        HEAP8[keyEventData + 14] = e.altKey;
        HEAP8[keyEventData + 15] = e.metaKey;
        HEAP8[keyEventData + 16] = e.repeat;
        HEAP32[idx + 5] = e.charCode;
        HEAP32[idx + 6] = e.keyCode;
        HEAP32[idx + 7] = e.which;
        stringToUTF8(e.key || '', keyEventData + 32, 32);
        stringToUTF8(e.code || '', keyEventData + 64, 32);
        stringToUTF8(e.char || '', keyEventData + 96, 32);
        stringToUTF8(e.locale || '', keyEventData + 128, 32);
  
        if (((a1, a2, a3) => dynCall_iiii(callbackfunc, a1, a2, a3))(eventTypeId, keyEventData, userData)) e.preventDefault();
      };
  
      var eventHandler = {
        target: findEventTarget(target),
        eventTypeString,
        callbackfunc,
        handlerFunc: keyEventHandlerFunc,
        useCapture
      };
      return JSEvents.registerOrRemoveHandler(eventHandler);
    };
  var _emscripten_set_keydown_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) =>
      registerKeyEventCallback(target, userData, useCapture, callbackfunc, 2, "keydown", targetThread);

  var _emscripten_set_keypress_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) =>
      registerKeyEventCallback(target, userData, useCapture, callbackfunc, 1, "keypress", targetThread);

  var _emscripten_set_keyup_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) =>
      registerKeyEventCallback(target, userData, useCapture, callbackfunc, 3, "keyup", targetThread);


  
  var fillMouseEventData = (eventStruct, e, target) => {
      assert(eventStruct % 4 == 0);
      HEAPF64[((eventStruct)>>3)] = e.timeStamp;
      var idx = ((eventStruct)>>2);
      HEAP32[idx + 2] = e.screenX;
      HEAP32[idx + 3] = e.screenY;
      HEAP32[idx + 4] = e.clientX;
      HEAP32[idx + 5] = e.clientY;
      HEAP8[eventStruct + 24] = e.ctrlKey;
      HEAP8[eventStruct + 25] = e.shiftKey;
      HEAP8[eventStruct + 26] = e.altKey;
      HEAP8[eventStruct + 27] = e.metaKey;
      HEAP16[idx*2 + 14] = e.button;
      HEAP16[idx*2 + 15] = e.buttons;
  
      HEAP32[idx + 8] = e["movementX"];
  
      HEAP32[idx + 9] = e["movementY"];
  
      // Note: rect contains doubles (truncated to placate SAFE_HEAP, which is the same behaviour when writing to HEAP32 anyway)
      var rect = getBoundingClientRect(target);
      HEAP32[idx + 10] = e.clientX - (rect.left | 0);
      HEAP32[idx + 11] = e.clientY - (rect.top  | 0);
    };
  
  
  var registerMouseEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
      JSEvents.mouseEvent ||= _malloc(64);
      target = findEventTarget(target);
  
      var mouseEventHandlerFunc = (e = event) => {
        // TODO: Make this access thread safe, or this could update live while app is reading it.
        fillMouseEventData(JSEvents.mouseEvent, e, target);
  
        if (((a1, a2, a3) => dynCall_iiii(callbackfunc, a1, a2, a3))(eventTypeId, JSEvents.mouseEvent, userData)) e.preventDefault();
      };
  
      var eventHandler = {
        target,
        allowsDeferredCalls: eventTypeString != 'mousemove' && eventTypeString != 'mouseenter' && eventTypeString != 'mouseleave', // Mouse move events do not allow fullscreen/pointer lock requests to be handled in them!
        eventTypeString,
        callbackfunc,
        handlerFunc: mouseEventHandlerFunc,
        useCapture
      };
      return JSEvents.registerOrRemoveHandler(eventHandler);
    };
  var _emscripten_set_mousedown_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) =>
      registerMouseEventCallback(target, userData, useCapture, callbackfunc, 5, "mousedown", targetThread);

  var _emscripten_set_mousemove_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) =>
      registerMouseEventCallback(target, userData, useCapture, callbackfunc, 8, "mousemove", targetThread);

  var _emscripten_set_mouseup_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) =>
      registerMouseEventCallback(target, userData, useCapture, callbackfunc, 6, "mouseup", targetThread);

  
  
  var fillPointerlockChangeEventData = (eventStruct) => {
      var pointerLockElement = document.pointerLockElement;
      var isPointerlocked = !!pointerLockElement;
      // Assigning a boolean to HEAP32 with expected type coercion.
      /** @suppress{checkTypes} */
      HEAP8[eventStruct] = isPointerlocked;
      var nodeName = JSEvents.getNodeNameForTarget(pointerLockElement);
      var id = pointerLockElement?.id || '';
      stringToUTF8(nodeName, eventStruct + 1, 128);
      stringToUTF8(id, eventStruct + 129, 128);
    };
  
  var registerPointerlockChangeEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
      JSEvents.pointerlockChangeEvent ||= _malloc(257);
  
      var pointerlockChangeEventHandlerFunc = (e = event) => {
        var pointerlockChangeEvent = JSEvents.pointerlockChangeEvent;
        fillPointerlockChangeEventData(pointerlockChangeEvent);
  
        if (((a1, a2, a3) => dynCall_iiii(callbackfunc, a1, a2, a3))(eventTypeId, pointerlockChangeEvent, userData)) e.preventDefault();
      };
  
      var eventHandler = {
        target,
        eventTypeString,
        callbackfunc,
        handlerFunc: pointerlockChangeEventHandlerFunc,
        useCapture
      };
      return JSEvents.registerOrRemoveHandler(eventHandler);
    };
  
  var _emscripten_set_pointerlockchange_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) => {
      if (!document.body?.requestPointerLock) {
        return -1;
      }
  
      target = findEventTarget(target);
      if (!target) return -4;
      return registerPointerlockChangeEventCallback(target, userData, useCapture, callbackfunc, 20, "pointerlockchange", targetThread);
    };

  
  
  
  var registerTouchEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
      JSEvents.touchEvent ||= _malloc(1552);
  
      target = findEventTarget(target);
  
      var touchEventHandlerFunc = (e) => {
        assert(e);
        var t, touches = {}, et = e.touches;
        // To ease marshalling different kinds of touches that browser reports (all touches are listed in e.touches,
        // only changed touches in e.changedTouches, and touches on target at a.targetTouches), mark a boolean in
        // each Touch object so that we can later loop only once over all touches we see to marshall over to Wasm.
  
        for (let t of et) {
          // Browser might recycle the generated Touch objects between each frame (Firefox on Android), so reset any
          // changed/target states we may have set from previous frame.
          t.isChanged = t.onTarget = 0;
          touches[t.identifier] = t;
        }
        // Mark which touches are part of the changedTouches list.
        for (let t of e.changedTouches) {
          t.isChanged = 1;
          touches[t.identifier] = t;
        }
        // Mark which touches are part of the targetTouches list.
        for (let t of e.targetTouches) {
          touches[t.identifier].onTarget = 1;
        }
  
        var touchEvent = JSEvents.touchEvent;
        HEAPF64[((touchEvent)>>3)] = e.timeStamp;
        HEAP8[touchEvent + 12] = e.ctrlKey;
        HEAP8[touchEvent + 13] = e.shiftKey;
        HEAP8[touchEvent + 14] = e.altKey;
        HEAP8[touchEvent + 15] = e.metaKey;
        var idx = touchEvent + 16;
        var targetRect = getBoundingClientRect(target);
        var numTouches = 0;
        for (let t of Object.values(touches)) {
          var idx32 = ((idx)>>2); // Pre-shift the ptr to index to HEAP32 to save code size
          HEAP32[idx32 + 0] = t.identifier;
          HEAP32[idx32 + 1] = t.screenX;
          HEAP32[idx32 + 2] = t.screenY;
          HEAP32[idx32 + 3] = t.clientX;
          HEAP32[idx32 + 4] = t.clientY;
          HEAP32[idx32 + 5] = t.pageX;
          HEAP32[idx32 + 6] = t.pageY;
          HEAP8[idx + 28] = t.isChanged;
          HEAP8[idx + 29] = t.onTarget;
          HEAP32[idx32 + 8] = t.clientX - (targetRect.left | 0);
          HEAP32[idx32 + 9] = t.clientY - (targetRect.top  | 0);
  
          idx += 48;
  
          if (++numTouches > 31) {
            break;
          }
        }
        HEAP32[(((touchEvent)+(8))>>2)] = numTouches;
  
        if (((a1, a2, a3) => dynCall_iiii(callbackfunc, a1, a2, a3))(eventTypeId, touchEvent, userData)) e.preventDefault();
      };
  
      var eventHandler = {
        target,
        allowsDeferredCalls: eventTypeString == 'touchstart' || eventTypeString == 'touchend',
        eventTypeString,
        callbackfunc,
        handlerFunc: touchEventHandlerFunc,
        useCapture
      };
      return JSEvents.registerOrRemoveHandler(eventHandler);
    };
  var _emscripten_set_touchcancel_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) =>
      registerTouchEventCallback(target, userData, useCapture, callbackfunc, 25, "touchcancel", targetThread);

  var _emscripten_set_touchend_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) =>
      registerTouchEventCallback(target, userData, useCapture, callbackfunc, 23, "touchend", targetThread);

  var _emscripten_set_touchmove_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) =>
      registerTouchEventCallback(target, userData, useCapture, callbackfunc, 24, "touchmove", targetThread);

  var _emscripten_set_touchstart_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) =>
      registerTouchEventCallback(target, userData, useCapture, callbackfunc, 22, "touchstart", targetThread);

  
  
  var registerWheelEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
      JSEvents.wheelEvent ||= _malloc(96);
  
      // The DOM Level 3 events spec event 'wheel'
      var wheelHandlerFunc = (e = event) => {
        var wheelEvent = JSEvents.wheelEvent;
        fillMouseEventData(wheelEvent, e, target);
        HEAPF64[(((wheelEvent)+(64))>>3)] = e["deltaX"];
        HEAPF64[(((wheelEvent)+(72))>>3)] = e["deltaY"];
        HEAPF64[(((wheelEvent)+(80))>>3)] = e["deltaZ"];
        HEAP32[(((wheelEvent)+(88))>>2)] = e["deltaMode"];
        if (((a1, a2, a3) => dynCall_iiii(callbackfunc, a1, a2, a3))(eventTypeId, wheelEvent, userData)) e.preventDefault();
      };
  
      var eventHandler = {
        target,
        allowsDeferredCalls: true,
        eventTypeString,
        callbackfunc,
        handlerFunc: wheelHandlerFunc,
        useCapture
      };
      return JSEvents.registerOrRemoveHandler(eventHandler);
    };
  
  var _emscripten_set_wheel_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) => {
      target = findEventTarget(target);
      if (!target) return -4;
      if (typeof target.onwheel != 'undefined') {
        return registerWheelEventCallback(target, userData, useCapture, callbackfunc, 9, "wheel", targetThread);
      } else {
        return -1;
      }
    };

  
  var webglPowerPreferences = ["default","low-power","high-performance"];
  
  
  var _emscripten_webgl_do_create_context = (target, attributes) => {
      assert(attributes);
      var attr32 = ((attributes)>>2);
      var powerPreference = HEAP32[attr32 + (8>>2)];
      var contextAttributes = {
        'alpha': !!HEAP8[attributes + 0],
        'depth': !!HEAP8[attributes + 1],
        'stencil': !!HEAP8[attributes + 2],
        'antialias': !!HEAP8[attributes + 3],
        'premultipliedAlpha': !!HEAP8[attributes + 4],
        'preserveDrawingBuffer': !!HEAP8[attributes + 5],
        'powerPreference': webglPowerPreferences[powerPreference],
        'failIfMajorPerformanceCaveat': !!HEAP8[attributes + 12],
        // The following are not predefined WebGL context attributes in the WebGL specification, so the property names can be minified by Closure.
        majorVersion: HEAP32[attr32 + (16>>2)],
        minorVersion: HEAP32[attr32 + (20>>2)],
        enableExtensionsByDefault: HEAP8[attributes + 24],
        explicitSwapControl: HEAP8[attributes + 25],
        proxyContextToMainThread: HEAP32[attr32 + (28>>2)],
        renderViaOffscreenBackBuffer: HEAP8[attributes + 32]
      };
  
      //  TODO: Make these into hard errors at some point in the future
      if (contextAttributes.majorVersion !== 1 && contextAttributes.majorVersion !== 2) {
        err(`Invalid WebGL version requested: ${contextAttributes.majorVersion}`);
      }
  
      var canvas = findCanvasEventTarget(target);
  
      if (!canvas) {
        return 0;
      }
  
      if (contextAttributes.explicitSwapControl) {
        return 0;
      }
  
      var contextHandle = GL.createContext(canvas, contextAttributes);
      return contextHandle;
    };
  var _emscripten_webgl_create_context = _emscripten_webgl_do_create_context;

  var _emscripten_webgl_destroy_context = (contextHandle) => {
      if (GL.currentContext == contextHandle) GL.currentContext = 0;
      GL.deleteContext(contextHandle);
    };

  
  
  
  
  
  
  
  
  
  
  var _emscripten_webgl_enable_extension = (contextHandle, extension) => {
      var context = GL.getContext(contextHandle);
      var extString = UTF8ToString(extension);
      if (extString.startsWith('GL_')) extString = extString.slice(3); // Allow enabling extensions both with "GL_" prefix and without.
  
      // Switch-board that pulls in code for all GL extensions, even if those are not used :/
      // Build with -sGL_SUPPORT_SIMPLE_ENABLE_EXTENSIONS=0 to avoid this.
  
      // Obtain function entry points to WebGL 1 extension related functions.
      if (extString == 'ANGLE_instanced_arrays') webgl_enable_ANGLE_instanced_arrays(GLctx);
      if (extString == 'OES_vertex_array_object') webgl_enable_OES_vertex_array_object(GLctx);
      if (extString == 'WEBGL_draw_buffers') webgl_enable_WEBGL_draw_buffers(GLctx);
  
      if (extString == 'WEBGL_draw_instanced_base_vertex_base_instance') webgl_enable_WEBGL_draw_instanced_base_vertex_base_instance(GLctx);
      if (extString == 'WEBGL_multi_draw_instanced_base_vertex_base_instance') webgl_enable_WEBGL_multi_draw_instanced_base_vertex_base_instance(GLctx);
  
      if (extString == 'WEBGL_multi_draw') webgl_enable_WEBGL_multi_draw(GLctx);
      if (extString == 'EXT_polygon_offset_clamp') webgl_enable_EXT_polygon_offset_clamp(GLctx);
      if (extString == 'EXT_clip_control') webgl_enable_EXT_clip_control(GLctx);
      if (extString == 'WEBGL_polygon_mode') webgl_enable_WEBGL_polygon_mode(GLctx);
  
      var ext = context.GLctx.getExtension(extString);
      return !!ext;
    };

  
  var _emscripten_webgl_do_get_current_context = () => GL.currentContext ? GL.currentContext.handle : 0;
  var _emscripten_webgl_get_current_context = _emscripten_webgl_do_get_current_context;

  var _emscripten_webgl_make_context_current = (contextHandle) => {
      var success = GL.makeContextCurrent(contextHandle);
      return success ? 0 : -5;
    };

  var ENV = {
  };
  
  var getExecutableName = () => thisProgram || './this.program';
  var getEnvStrings = () => {
      if (!getEnvStrings.strings) {
        // Default values.
        // Browser language detection #8751
        var lang = ((typeof navigator == 'object' && navigator.language) || 'C').replace('-', '_') + '.UTF-8';
        var env = {
          'USER': 'web_user',
          'LOGNAME': 'web_user',
          'PATH': '/',
          'PWD': '/',
          'HOME': '/home/web_user',
          'LANG': lang,
          '_': getExecutableName()
        };
        // Apply the user-provided values, if any.
        for (var x in ENV) {
          // x is a key in ENV; if ENV[x] is undefined, that means it was
          // explicitly set to be so. We allow user code to do that to
          // force variables with default values to remain unset.
          if (ENV[x] === undefined) delete env[x];
          else env[x] = ENV[x];
        }
        var strings = [];
        for (var x in env) {
          strings.push(`${x}=${env[x]}`);
        }
        getEnvStrings.strings = strings;
      }
      return getEnvStrings.strings;
    };
  
  var _environ_get = (__environ, environ_buf) => {
      var bufSize = 0;
      var envp = 0;
      for (var string of getEnvStrings()) {
        var ptr = environ_buf + bufSize;
        HEAPU32[(((__environ)+(envp))>>2)] = ptr;
        bufSize += stringToUTF8(string, ptr, Infinity) + 1;
        envp += 4;
      }
      return 0;
    };

  
  var _environ_sizes_get = (penviron_count, penviron_buf_size) => {
      var strings = getEnvStrings();
      HEAPU32[((penviron_count)>>2)] = strings.length;
      var bufSize = 0;
      for (var string of strings) {
        bufSize += lengthBytesUTF8(string) + 1;
      }
      HEAPU32[((penviron_buf_size)>>2)] = bufSize;
      return 0;
    };


  function _fd_close(fd) {
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      FS.close(stream);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  }

  function _fd_fdstat_get(fd, pbuf) {
  try {
  
      var rightsBase = 0;
      var rightsInheriting = 0;
      var flags = 0;
      {
        var stream = SYSCALLS.getStreamFromFD(fd);
        // All character devices are terminals (other things a Linux system would
        // assume is a character device, like the mouse, we have special APIs for).
        var type = stream.tty ? 2 :
                   FS.isDir(stream.mode) ? 3 :
                   FS.isLink(stream.mode) ? 7 :
                   4;
      }
      HEAP8[pbuf] = type;
      HEAP16[(((pbuf)+(2))>>1)] = flags;
      (tempI64 = [rightsBase>>>0,(tempDouble = rightsBase,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? (+(Math.floor((tempDouble)/4294967296.0)))>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)], HEAP32[(((pbuf)+(8))>>2)] = tempI64[0],HEAP32[(((pbuf)+(12))>>2)] = tempI64[1]);
      (tempI64 = [rightsInheriting>>>0,(tempDouble = rightsInheriting,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? (+(Math.floor((tempDouble)/4294967296.0)))>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)], HEAP32[(((pbuf)+(16))>>2)] = tempI64[0],HEAP32[(((pbuf)+(20))>>2)] = tempI64[1]);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  }

  /** @param {number=} offset */
  var doReadv = (stream, iov, iovcnt, offset) => {
      var ret = 0;
      for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[((iov)>>2)];
        var len = HEAPU32[(((iov)+(4))>>2)];
        iov += 8;
        var curr = FS.read(stream, HEAP8, ptr, len, offset);
        if (curr < 0) return -1;
        ret += curr;
        if (curr < len) break; // nothing more to read
        if (typeof offset != 'undefined') {
          offset += curr;
        }
      }
      return ret;
    };
  
  function _fd_read(fd, iov, iovcnt, pnum) {
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = doReadv(stream, iov, iovcnt);
      HEAPU32[((pnum)>>2)] = num;
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  }

  
  function _fd_seek(fd,offset_low, offset_high,whence,newOffset) {
    var offset = convertI32PairToI53Checked(offset_low, offset_high);
  
  
  try {
  
      if (isNaN(offset)) return 61;
      var stream = SYSCALLS.getStreamFromFD(fd);
      FS.llseek(stream, offset, whence);
      (tempI64 = [stream.position>>>0,(tempDouble = stream.position,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? (+(Math.floor((tempDouble)/4294967296.0)))>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)], HEAP32[((newOffset)>>2)] = tempI64[0],HEAP32[(((newOffset)+(4))>>2)] = tempI64[1]);
      if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null; // reset readdir state
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  ;
  }

  /** @param {number=} offset */
  var doWritev = (stream, iov, iovcnt, offset) => {
      var ret = 0;
      for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[((iov)>>2)];
        var len = HEAPU32[(((iov)+(4))>>2)];
        iov += 8;
        var curr = FS.write(stream, HEAP8, ptr, len, offset);
        if (curr < 0) return -1;
        ret += curr;
        if (curr < len) {
          // No more space to write.
          break;
        }
        if (typeof offset != 'undefined') {
          offset += curr;
        }
      }
      return ret;
    };
  
  function _fd_write(fd, iov, iovcnt, pnum) {
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = doWritev(stream, iov, iovcnt);
      HEAPU32[((pnum)>>2)] = num;
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  }

  
  
  var _getnameinfo = (sa, salen, node, nodelen, serv, servlen, flags) => {
      var info = readSockaddr(sa, salen);
      if (info.errno) {
        return -6;
      }
      var port = info.port;
      var addr = info.addr;
  
      var overflowed = false;
  
      if (node && nodelen) {
        var lookup;
        if ((flags & 1) || !(lookup = DNS.lookup_addr(addr))) {
          if (flags & 8) {
            return -2;
          }
        } else {
          addr = lookup;
        }
        var numBytesWrittenExclNull = stringToUTF8(addr, node, nodelen);
  
        if (numBytesWrittenExclNull+1 >= nodelen) {
          overflowed = true;
        }
      }
  
      if (serv && servlen) {
        port = '' + port;
        var numBytesWrittenExclNull = stringToUTF8(port, serv, servlen);
  
        if (numBytesWrittenExclNull+1 >= servlen) {
          overflowed = true;
        }
      }
  
      if (overflowed) {
        // Note: even when we overflow, getnameinfo() is specced to write out the truncated results.
        return -12;
      }
  
      return 0;
    };

  var _emscripten_glActiveTexture = (x0) => GLctx.activeTexture(x0);
  var _glActiveTexture = _emscripten_glActiveTexture;

  var _emscripten_glAttachShader = (program, shader) => {
      program = GL.programs[program];
      shader = GL.shaders[shader];
      program[shader.shaderType] = shader;
      GLctx.attachShader(program, shader);
    };
  var _glAttachShader = _emscripten_glAttachShader;

  var _emscripten_glBeginQuery = (target, id) => {
      GLctx.beginQuery(target, GL.queries[id]);
    };
  var _glBeginQuery = _emscripten_glBeginQuery;

  
  var _emscripten_glBindAttribLocation = (program, index, name) => {
      GLctx.bindAttribLocation(GL.programs[program], index, UTF8ToString(name));
    };
  var _glBindAttribLocation = _emscripten_glBindAttribLocation;

  var _emscripten_glBindBuffer = (target, buffer) => {
      // Calling glBindBuffer with an unknown buffer will implicitly create a
      // new one.  Here we bypass `GL.counter` and directly using the ID passed
      // in.
      if (buffer && !GL.buffers[buffer]) {
        var b = GLctx.createBuffer();
        b.name = buffer;
        GL.buffers[buffer] = b;
      }
      if (target == 0x8892 /*GL_ARRAY_BUFFER*/) {
        GLctx.currentArrayBufferBinding = buffer;
      } else if (target == 0x8893 /*GL_ELEMENT_ARRAY_BUFFER*/) {
        GLctx.currentElementArrayBufferBinding = buffer;
      }
  
      if (target == 0x88EB /*GL_PIXEL_PACK_BUFFER*/) {
        // In WebGL 2 glReadPixels entry point, we need to use a different WebGL 2
        // API function call when a buffer is bound to
        // GL_PIXEL_PACK_BUFFER_BINDING point, so must keep track whether that
        // binding point is non-null to know what is the proper API function to
        // call.
        GLctx.currentPixelPackBufferBinding = buffer;
      } else if (target == 0x88EC /*GL_PIXEL_UNPACK_BUFFER*/) {
        // In WebGL 2 gl(Compressed)Tex(Sub)Image[23]D entry points, we need to
        // use a different WebGL 2 API function call when a buffer is bound to
        // GL_PIXEL_UNPACK_BUFFER_BINDING point, so must keep track whether that
        // binding point is non-null to know what is the proper API function to
        // call.
        GLctx.currentPixelUnpackBufferBinding = buffer;
      }
      GLctx.bindBuffer(target, GL.buffers[buffer]);
    };
  var _glBindBuffer = _emscripten_glBindBuffer;

  var _emscripten_glBindBufferBase = (target, index, buffer) => {
      GLctx.bindBufferBase(target, index, GL.buffers[buffer]);
    };
  var _glBindBufferBase = _emscripten_glBindBufferBase;

  var _emscripten_glBindBufferRange = (target, index, buffer, offset, ptrsize) => {
      GLctx.bindBufferRange(target, index, GL.buffers[buffer], offset, ptrsize);
    };
  var _glBindBufferRange = _emscripten_glBindBufferRange;

  var _emscripten_glBindFramebuffer = (target, framebuffer) => {
  
      GLctx.bindFramebuffer(target, GL.framebuffers[framebuffer]);
  
    };
  var _glBindFramebuffer = _emscripten_glBindFramebuffer;

  var _emscripten_glBindRenderbuffer = (target, renderbuffer) => {
      GLctx.bindRenderbuffer(target, GL.renderbuffers[renderbuffer]);
    };
  var _glBindRenderbuffer = _emscripten_glBindRenderbuffer;

  var _emscripten_glBindSampler = (unit, sampler) => {
      GLctx.bindSampler(unit, GL.samplers[sampler]);
    };
  var _glBindSampler = _emscripten_glBindSampler;

  var _emscripten_glBindTexture = (target, texture) => {
      GLctx.bindTexture(target, GL.textures[texture]);
    };
  var _glBindTexture = _emscripten_glBindTexture;

  var _emscripten_glBindVertexArray = (vao) => {
      GLctx.bindVertexArray(GL.vaos[vao]);
      var ibo = GLctx.getParameter(0x8895 /*ELEMENT_ARRAY_BUFFER_BINDING*/);
      GLctx.currentElementArrayBufferBinding = ibo ? (ibo.name | 0) : 0;
    };
  var _glBindVertexArray = _emscripten_glBindVertexArray;

  var _emscripten_glBlendEquation = (x0) => GLctx.blendEquation(x0);
  var _glBlendEquation = _emscripten_glBlendEquation;

  var _emscripten_glBlendEquationSeparate = (x0, x1) => GLctx.blendEquationSeparate(x0, x1);
  var _glBlendEquationSeparate = _emscripten_glBlendEquationSeparate;

  var _emscripten_glBlendFuncSeparate = (x0, x1, x2, x3) => GLctx.blendFuncSeparate(x0, x1, x2, x3);
  var _glBlendFuncSeparate = _emscripten_glBlendFuncSeparate;

  var _emscripten_glBlitFramebuffer = (x0, x1, x2, x3, x4, x5, x6, x7, x8, x9) => GLctx.blitFramebuffer(x0, x1, x2, x3, x4, x5, x6, x7, x8, x9);
  var _glBlitFramebuffer = _emscripten_glBlitFramebuffer;

  var _emscripten_glBufferData = (target, size, data, usage) => {
  
      if (GL.currentContext.version >= 2) {
        // If size is zero, WebGL would interpret uploading the whole input
        // arraybuffer (starting from given offset), which would not make sense in
        // WebAssembly, so avoid uploading if size is zero. However we must still
        // call bufferData to establish a backing storage of zero bytes.
        if (data && size) {
          GLctx.bufferData(target, HEAPU8, usage, data, size);
        } else {
          GLctx.bufferData(target, size, usage);
        }
        return;
      }
      // N.b. here first form specifies a heap subarray, second form an integer
      // size, so the ?: code here is polymorphic. It is advised to avoid
      // randomly mixing both uses in calling code, to avoid any potential JS
      // engine JIT issues.
      GLctx.bufferData(target, data ? HEAPU8.subarray(data, data+size) : size, usage);
    };
  var _glBufferData = _emscripten_glBufferData;

  var _emscripten_glBufferSubData = (target, offset, size, data) => {
      if (GL.currentContext.version >= 2) {
        size && GLctx.bufferSubData(target, offset, HEAPU8, data, size);
        return;
      }
      GLctx.bufferSubData(target, offset, HEAPU8.subarray(data, data+size));
    };
  var _glBufferSubData = _emscripten_glBufferSubData;

  var _emscripten_glCheckFramebufferStatus = (x0) => GLctx.checkFramebufferStatus(x0);
  var _glCheckFramebufferStatus = _emscripten_glCheckFramebufferStatus;

  var _emscripten_glClear = (x0) => GLctx.clear(x0);
  var _glClear = _emscripten_glClear;

  var _emscripten_glClearBufferfi = (x0, x1, x2, x3) => GLctx.clearBufferfi(x0, x1, x2, x3);
  var _glClearBufferfi = _emscripten_glClearBufferfi;

  var _emscripten_glClearBufferfv = (buffer, drawbuffer, value) => {
  
      GLctx.clearBufferfv(buffer, drawbuffer, HEAPF32, ((value)>>2));
    };
  var _glClearBufferfv = _emscripten_glClearBufferfv;

  var _emscripten_glClearBufferuiv = (buffer, drawbuffer, value) => {
  
      GLctx.clearBufferuiv(buffer, drawbuffer, HEAPU32, ((value)>>2));
    };
  var _glClearBufferuiv = _emscripten_glClearBufferuiv;

  var _emscripten_glClearColor = (x0, x1, x2, x3) => GLctx.clearColor(x0, x1, x2, x3);
  var _glClearColor = _emscripten_glClearColor;

  var _emscripten_glClearDepthf = (x0) => GLctx.clearDepth(x0);
  var _glClearDepthf = _emscripten_glClearDepthf;

  var _emscripten_glClearStencil = (x0) => GLctx.clearStencil(x0);
  var _glClearStencil = _emscripten_glClearStencil;

  var convertI32PairToI53 = (lo, hi) => {
      // This function should not be getting called with too large unsigned numbers
      // in high part (if hi >= 0x7FFFFFFFF, one should have been calling
      // convertU32PairToI53())
      assert(hi === (hi|0));
      return (lo >>> 0) + hi * 4294967296;
    };
  var _emscripten_glClientWaitSync = (sync, flags, timeout_low, timeout_high) => {
      // WebGL2 vs GLES3 differences: in GLES3, the timeout parameter is a uint64, where 0xFFFFFFFFFFFFFFFFULL means GL_TIMEOUT_IGNORED.
      // In JS, there's no 64-bit value types, so instead timeout is taken to be signed, and GL_TIMEOUT_IGNORED is given value -1.
      // Inherently the value accepted in the timeout is lossy, and can't take in arbitrary u64 bit pattern (but most likely doesn't matter)
      // See https://www.khronos.org/registry/webgl/specs/latest/2.0/#5.15
      var timeout = convertI32PairToI53(timeout_low, timeout_high);
      return GLctx.clientWaitSync(GL.syncs[sync], flags, timeout);
    };
  var _glClientWaitSync = _emscripten_glClientWaitSync;

  var _emscripten_glColorMask = (red, green, blue, alpha) => {
      GLctx.colorMask(!!red, !!green, !!blue, !!alpha);
    };
  var _glColorMask = _emscripten_glColorMask;

  var _emscripten_glCompileShader = (shader) => {
      GLctx.compileShader(GL.shaders[shader]);
    };
  var _glCompileShader = _emscripten_glCompileShader;

  var _emscripten_glCompressedTexImage2D = (target, level, internalFormat, width, height, border, imageSize, data) => {
      // `data` may be null here, which means "allocate uniniitalized space but
      // don't upload" in GLES parlance, but `compressedTexImage2D` requires the
      // final data parameter, so we simply pass a heap view starting at zero
      // effectively uploading whatever happens to be near address zero.  See
      // https://github.com/emscripten-core/emscripten/issues/19300.
      if (GL.currentContext.version >= 2) {
        if (GLctx.currentPixelUnpackBufferBinding || !imageSize) {
          GLctx.compressedTexImage2D(target, level, internalFormat, width, height, border, imageSize, data);
          return;
        }
        GLctx.compressedTexImage2D(target, level, internalFormat, width, height, border, HEAPU8, data, imageSize);
        return;
      }
      GLctx.compressedTexImage2D(target, level, internalFormat, width, height, border, HEAPU8.subarray((data), data+imageSize));
    };
  var _glCompressedTexImage2D = _emscripten_glCompressedTexImage2D;

  var _emscripten_glCompressedTexImage3D = (target, level, internalFormat, width, height, depth, border, imageSize, data) => {
      if (GLctx.currentPixelUnpackBufferBinding) {
        GLctx.compressedTexImage3D(target, level, internalFormat, width, height, depth, border, imageSize, data);
      } else {
        GLctx.compressedTexImage3D(target, level, internalFormat, width, height, depth, border, HEAPU8, data, imageSize);
      }
    };
  var _glCompressedTexImage3D = _emscripten_glCompressedTexImage3D;

  var _emscripten_glCompressedTexSubImage2D = (target, level, xoffset, yoffset, width, height, format, imageSize, data) => {
      if (GL.currentContext.version >= 2) {
        if (GLctx.currentPixelUnpackBufferBinding || !imageSize) {
          GLctx.compressedTexSubImage2D(target, level, xoffset, yoffset, width, height, format, imageSize, data);
          return;
        }
        GLctx.compressedTexSubImage2D(target, level, xoffset, yoffset, width, height, format, HEAPU8, data, imageSize);
        return;
      }
      GLctx.compressedTexSubImage2D(target, level, xoffset, yoffset, width, height, format, HEAPU8.subarray((data), data+imageSize));
    };
  var _glCompressedTexSubImage2D = _emscripten_glCompressedTexSubImage2D;

  var _emscripten_glCompressedTexSubImage3D = (target, level, xoffset, yoffset, zoffset, width, height, depth, format, imageSize, data) => {
      if (GLctx.currentPixelUnpackBufferBinding) {
        GLctx.compressedTexSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, imageSize, data);
      } else {
        GLctx.compressedTexSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, HEAPU8, data, imageSize);
      }
    };
  var _glCompressedTexSubImage3D = _emscripten_glCompressedTexSubImage3D;

  var _emscripten_glCopyBufferSubData = (x0, x1, x2, x3, x4) => GLctx.copyBufferSubData(x0, x1, x2, x3, x4);
  var _glCopyBufferSubData = _emscripten_glCopyBufferSubData;

  var _emscripten_glCopyTexImage2D = (x0, x1, x2, x3, x4, x5, x6, x7) => GLctx.copyTexImage2D(x0, x1, x2, x3, x4, x5, x6, x7);
  var _glCopyTexImage2D = _emscripten_glCopyTexImage2D;

  var _emscripten_glCopyTexSubImage2D = (x0, x1, x2, x3, x4, x5, x6, x7) => GLctx.copyTexSubImage2D(x0, x1, x2, x3, x4, x5, x6, x7);
  var _glCopyTexSubImage2D = _emscripten_glCopyTexSubImage2D;

  var _emscripten_glCreateProgram = () => {
      var id = GL.getNewId(GL.programs);
      var program = GLctx.createProgram();
      // Store additional information needed for each shader program:
      program.name = id;
      // Lazy cache results of
      // glGetProgramiv(GL_ACTIVE_UNIFORM_MAX_LENGTH/GL_ACTIVE_ATTRIBUTE_MAX_LENGTH/GL_ACTIVE_UNIFORM_BLOCK_MAX_NAME_LENGTH)
      program.maxUniformLength = program.maxAttributeLength = program.maxUniformBlockNameLength = 0;
      program.uniformIdCounter = 1;
      GL.programs[id] = program;
      return id;
    };
  var _glCreateProgram = _emscripten_glCreateProgram;

  var _emscripten_glCreateShader = (shaderType) => {
      var id = GL.getNewId(GL.shaders);
      GL.shaders[id] = GLctx.createShader(shaderType);
  
      // GL_VERTEX_SHADER = 0x8B31, GL_FRAGMENT_SHADER = 0x8B30
      GL.shaders[id].shaderType = shaderType&1?'vs':'fs';
  
      return id;
    };
  var _glCreateShader = _emscripten_glCreateShader;

  var _emscripten_glCullFace = (x0) => GLctx.cullFace(x0);
  var _glCullFace = _emscripten_glCullFace;

  var _emscripten_glDeleteBuffers = (n, buffers) => {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(((buffers)+(i*4))>>2)];
        var buffer = GL.buffers[id];
  
        // From spec: "glDeleteBuffers silently ignores 0's and names that do not
        // correspond to existing buffer objects."
        if (!buffer) continue;
  
        GLctx.deleteBuffer(buffer);
        buffer.name = 0;
        GL.buffers[id] = null;
  
        if (id == GLctx.currentArrayBufferBinding) GLctx.currentArrayBufferBinding = 0;
        if (id == GLctx.currentElementArrayBufferBinding) GLctx.currentElementArrayBufferBinding = 0;
        if (id == GLctx.currentPixelPackBufferBinding) GLctx.currentPixelPackBufferBinding = 0;
        if (id == GLctx.currentPixelUnpackBufferBinding) GLctx.currentPixelUnpackBufferBinding = 0;
      }
    };
  var _glDeleteBuffers = _emscripten_glDeleteBuffers;

  var _emscripten_glDeleteFramebuffers = (n, framebuffers) => {
      for (var i = 0; i < n; ++i) {
        var id = HEAP32[(((framebuffers)+(i*4))>>2)];
        var framebuffer = GL.framebuffers[id];
        if (!framebuffer) continue; // GL spec: "glDeleteFramebuffers silently ignores 0s and names that do not correspond to existing framebuffer objects".
        GLctx.deleteFramebuffer(framebuffer);
        framebuffer.name = 0;
        GL.framebuffers[id] = null;
      }
    };
  var _glDeleteFramebuffers = _emscripten_glDeleteFramebuffers;

  var _emscripten_glDeleteProgram = (id) => {
      if (!id) return;
      var program = GL.programs[id];
      if (!program) {
        // glDeleteProgram actually signals an error when deleting a nonexisting
        // object, unlike some other GL delete functions.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      GLctx.deleteProgram(program);
      program.name = 0;
      GL.programs[id] = null;
    };
  var _glDeleteProgram = _emscripten_glDeleteProgram;

  var _emscripten_glDeleteQueries = (n, ids) => {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(((ids)+(i*4))>>2)];
        var query = GL.queries[id];
        if (!query) continue; // GL spec: "unused names in ids are ignored, as is the name zero."
        GLctx.deleteQuery(query);
        GL.queries[id] = null;
      }
    };
  var _glDeleteQueries = _emscripten_glDeleteQueries;

  var _emscripten_glDeleteRenderbuffers = (n, renderbuffers) => {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(((renderbuffers)+(i*4))>>2)];
        var renderbuffer = GL.renderbuffers[id];
        if (!renderbuffer) continue; // GL spec: "glDeleteRenderbuffers silently ignores 0s and names that do not correspond to existing renderbuffer objects".
        GLctx.deleteRenderbuffer(renderbuffer);
        renderbuffer.name = 0;
        GL.renderbuffers[id] = null;
      }
    };
  var _glDeleteRenderbuffers = _emscripten_glDeleteRenderbuffers;

  var _emscripten_glDeleteSamplers = (n, samplers) => {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(((samplers)+(i*4))>>2)];
        var sampler = GL.samplers[id];
        if (!sampler) continue;
        GLctx.deleteSampler(sampler);
        sampler.name = 0;
        GL.samplers[id] = null;
      }
    };
  var _glDeleteSamplers = _emscripten_glDeleteSamplers;

  var _emscripten_glDeleteShader = (id) => {
      if (!id) return;
      var shader = GL.shaders[id];
      if (!shader) {
        // glDeleteShader actually signals an error when deleting a nonexisting
        // object, unlike some other GL delete functions.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      GLctx.deleteShader(shader);
      GL.shaders[id] = null;
    };
  var _glDeleteShader = _emscripten_glDeleteShader;

  var _emscripten_glDeleteSync = (id) => {
      if (!id) return;
      var sync = GL.syncs[id];
      if (!sync) { // glDeleteSync signals an error when deleting a nonexisting object, unlike some other GL delete functions.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      GLctx.deleteSync(sync);
      sync.name = 0;
      GL.syncs[id] = null;
    };
  var _glDeleteSync = _emscripten_glDeleteSync;

  var _emscripten_glDeleteTextures = (n, textures) => {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(((textures)+(i*4))>>2)];
        var texture = GL.textures[id];
        // GL spec: "glDeleteTextures silently ignores 0s and names that do not
        // correspond to existing textures".
        if (!texture) continue;
        GLctx.deleteTexture(texture);
        texture.name = 0;
        GL.textures[id] = null;
      }
    };
  var _glDeleteTextures = _emscripten_glDeleteTextures;

  var _emscripten_glDeleteVertexArrays = (n, vaos) => {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(((vaos)+(i*4))>>2)];
        GLctx.deleteVertexArray(GL.vaos[id]);
        GL.vaos[id] = null;
      }
    };
  var _glDeleteVertexArrays = _emscripten_glDeleteVertexArrays;

  var _emscripten_glDepthFunc = (x0) => GLctx.depthFunc(x0);
  var _glDepthFunc = _emscripten_glDepthFunc;

  var _emscripten_glDepthMask = (flag) => {
      GLctx.depthMask(!!flag);
    };
  var _glDepthMask = _emscripten_glDepthMask;

  var _emscripten_glDetachShader = (program, shader) => {
      GLctx.detachShader(GL.programs[program], GL.shaders[shader]);
    };
  var _glDetachShader = _emscripten_glDetachShader;

  var _emscripten_glDisable = (x0) => GLctx.disable(x0);
  var _glDisable = _emscripten_glDisable;

  var _emscripten_glDisableVertexAttribArray = (index) => {
      var cb = GL.currentContext.clientBuffers[index];
      cb.enabled = false;
      GLctx.disableVertexAttribArray(index);
    };
  var _glDisableVertexAttribArray = _emscripten_glDisableVertexAttribArray;

  var _emscripten_glDrawArrays = (mode, first, count) => {
      // bind any client-side buffers
      GL.preDrawHandleClientVertexAttribBindings(first + count);
  
      GLctx.drawArrays(mode, first, count);
  
      GL.postDrawHandleClientVertexAttribBindings();
    };
  var _glDrawArrays = _emscripten_glDrawArrays;

  var _emscripten_glDrawArraysInstanced = (mode, first, count, primcount) => {
      GLctx.drawArraysInstanced(mode, first, count, primcount);
    };
  var _glDrawArraysInstanced = _emscripten_glDrawArraysInstanced;

  var tempFixedLengthArray = [];
  
  var _emscripten_glDrawBuffers = (n, bufs) => {
  
      var bufArray = tempFixedLengthArray[n];
      for (var i = 0; i < n; i++) {
        bufArray[i] = HEAP32[(((bufs)+(i*4))>>2)];
      }
  
      GLctx.drawBuffers(bufArray);
    };
  var _glDrawBuffers = _emscripten_glDrawBuffers;

  var _emscripten_glDrawElements = (mode, count, type, indices) => {
      var buf;
      var vertexes = 0;
      if (!GLctx.currentElementArrayBufferBinding) {
        var size = GL.calcBufLength(1, type, 0, count);
        buf = GL.getTempIndexBuffer(size);
        GLctx.bindBuffer(0x8893 /*GL_ELEMENT_ARRAY_BUFFER*/, buf);
        GLctx.bufferSubData(0x8893 /*GL_ELEMENT_ARRAY_BUFFER*/,
                            0,
                            HEAPU8.subarray(indices, indices + size));
        
        // Calculating vertex count if shader's attribute data is on client side
        if (count > 0) {
          for (var i = 0; i < GL.currentContext.maxVertexAttribs; ++i) {
            var cb = GL.currentContext.clientBuffers[i];
            if (cb.clientside && cb.enabled) {
              let arrayClass;
              switch(type) {
                case 0x1401 /* GL_UNSIGNED_BYTE */: arrayClass = Uint8Array; break;
                case 0x1403 /* GL_UNSIGNED_SHORT */: arrayClass = Uint16Array; break;
                case 0x1405 /* GL_UNSIGNED_INT */: arrayClass = Uint32Array; break;
                default:
                  GL.recordError(0x502 /* GL_INVALID_OPERATION */);
                  return;
              }
  
              vertexes = new arrayClass(HEAPU8.buffer, indices, count).reduce((max, current) => Math.max(max, current)) + 1;
              break;
            }
          }
        }
  
        // the index is now 0
        indices = 0;
      }
  
      // bind any client-side buffers
      GL.preDrawHandleClientVertexAttribBindings(vertexes);
  
      GLctx.drawElements(mode, count, type, indices);
  
      GL.postDrawHandleClientVertexAttribBindings(count);
  
      if (!GLctx.currentElementArrayBufferBinding) {
        GLctx.bindBuffer(0x8893 /*GL_ELEMENT_ARRAY_BUFFER*/, null);
      }
    };
  var _glDrawElements = _emscripten_glDrawElements;

  var _emscripten_glDrawElementsInstanced = (mode, count, type, indices, primcount) => {
      GLctx.drawElementsInstanced(mode, count, type, indices, primcount);
    };
  var _glDrawElementsInstanced = _emscripten_glDrawElementsInstanced;

  var _emscripten_glEnable = (x0) => GLctx.enable(x0);
  var _glEnable = _emscripten_glEnable;

  var _emscripten_glEnableVertexAttribArray = (index) => {
      var cb = GL.currentContext.clientBuffers[index];
      cb.enabled = true;
      GLctx.enableVertexAttribArray(index);
    };
  var _glEnableVertexAttribArray = _emscripten_glEnableVertexAttribArray;

  var _emscripten_glEndQuery = (x0) => GLctx.endQuery(x0);
  var _glEndQuery = _emscripten_glEndQuery;

  var _emscripten_glFenceSync = (condition, flags) => {
      var sync = GLctx.fenceSync(condition, flags);
      if (sync) {
        var id = GL.getNewId(GL.syncs);
        sync.name = id;
        GL.syncs[id] = sync;
        return id;
      }
      return 0; // Failed to create a sync object
    };
  var _glFenceSync = _emscripten_glFenceSync;

  var _emscripten_glFinish = () => GLctx.finish();
  var _glFinish = _emscripten_glFinish;

  var _emscripten_glFlush = () => GLctx.flush();
  var _glFlush = _emscripten_glFlush;

  var emscriptenWebGLGetBufferBinding = (target) => {
      switch (target) {
        case 0x8892 /*GL_ARRAY_BUFFER*/: target = 0x8894 /*GL_ARRAY_BUFFER_BINDING*/; break;
        case 0x8893 /*GL_ELEMENT_ARRAY_BUFFER*/: target = 0x8895 /*GL_ELEMENT_ARRAY_BUFFER_BINDING*/; break;
        case 0x88EB /*GL_PIXEL_PACK_BUFFER*/: target = 0x88ED /*GL_PIXEL_PACK_BUFFER_BINDING*/; break;
        case 0x88EC /*GL_PIXEL_UNPACK_BUFFER*/: target = 0x88EF /*GL_PIXEL_UNPACK_BUFFER_BINDING*/; break;
        case 0x8C8E /*GL_TRANSFORM_FEEDBACK_BUFFER*/: target = 0x8C8F /*GL_TRANSFORM_FEEDBACK_BUFFER_BINDING*/; break;
        case 0x8F36 /*GL_COPY_READ_BUFFER*/: target = 0x8F36 /*GL_COPY_READ_BUFFER_BINDING*/; break;
        case 0x8F37 /*GL_COPY_WRITE_BUFFER*/: target = 0x8F37 /*GL_COPY_WRITE_BUFFER_BINDING*/; break;
        case 0x8A11 /*GL_UNIFORM_BUFFER*/: target = 0x8A28 /*GL_UNIFORM_BUFFER_BINDING*/; break;
        // In default case, fall through and assume passed one of the _BINDING enums directly.
      }
      var buffer = GLctx.getParameter(target);
      if (buffer) return buffer.name|0;
      else return 0;
    };
  
  var emscriptenWebGLValidateMapBufferTarget = (target) => {
      switch (target) {
        case 0x8892: // GL_ARRAY_BUFFER
        case 0x8893: // GL_ELEMENT_ARRAY_BUFFER
        case 0x8F36: // GL_COPY_READ_BUFFER
        case 0x8F37: // GL_COPY_WRITE_BUFFER
        case 0x88EB: // GL_PIXEL_PACK_BUFFER
        case 0x88EC: // GL_PIXEL_UNPACK_BUFFER
        case 0x8C2A: // GL_TEXTURE_BUFFER
        case 0x8C8E: // GL_TRANSFORM_FEEDBACK_BUFFER
        case 0x8A11: // GL_UNIFORM_BUFFER
          return true;
        default:
          return false;
      }
    };
  
  var _emscripten_glFlushMappedBufferRange = (target, offset, length) => {
      if (!emscriptenWebGLValidateMapBufferTarget(target)) {
        GL.recordError(0x500/*GL_INVALID_ENUM*/);
        err('GL_INVALID_ENUM in glFlushMappedBufferRange');
        return;
      }
  
      var mapping = GL.mappedBuffers[emscriptenWebGLGetBufferBinding(target)];
      if (!mapping) {
        GL.recordError(0x502 /* GL_INVALID_OPERATION */);
        err('buffer was never mapped in glFlushMappedBufferRange');
        return;
      }
  
      if (!(mapping.access & 0x10)) {
        GL.recordError(0x502 /* GL_INVALID_OPERATION */);
        err('buffer was not mapped with GL_MAP_FLUSH_EXPLICIT_BIT in glFlushMappedBufferRange');
        return;
      }
      if (offset < 0 || length < 0 || offset + length > mapping.length) {
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        err('invalid range in glFlushMappedBufferRange');
        return;
      }
  
      GLctx.bufferSubData(
        target,
        mapping.offset,
        HEAPU8.subarray(mapping.mem + offset, mapping.mem + offset + length));
    };
  var _glFlushMappedBufferRange = _emscripten_glFlushMappedBufferRange;

  var _emscripten_glFramebufferRenderbuffer = (target, attachment, renderbuffertarget, renderbuffer) => {
      GLctx.framebufferRenderbuffer(target, attachment, renderbuffertarget,
                                         GL.renderbuffers[renderbuffer]);
    };
  var _glFramebufferRenderbuffer = _emscripten_glFramebufferRenderbuffer;

  var _emscripten_glFramebufferTexture2D = (target, attachment, textarget, texture, level) => {
      GLctx.framebufferTexture2D(target, attachment, textarget,
                                      GL.textures[texture], level);
    };
  var _glFramebufferTexture2D = _emscripten_glFramebufferTexture2D;

  var _emscripten_glFramebufferTextureLayer = (target, attachment, texture, level, layer) => {
      GLctx.framebufferTextureLayer(target, attachment, GL.textures[texture], level, layer);
    };
  var _glFramebufferTextureLayer = _emscripten_glFramebufferTextureLayer;

  var _emscripten_glFrontFace = (x0) => GLctx.frontFace(x0);
  var _glFrontFace = _emscripten_glFrontFace;

  var _emscripten_glGenBuffers = (n, buffers) => {
      GL.genObject(n, buffers, 'createBuffer', GL.buffers
        );
    };
  var _glGenBuffers = _emscripten_glGenBuffers;

  var _emscripten_glGenFramebuffers = (n, ids) => {
      GL.genObject(n, ids, 'createFramebuffer', GL.framebuffers
        );
    };
  var _glGenFramebuffers = _emscripten_glGenFramebuffers;

  var _emscripten_glGenQueries = (n, ids) => {
      GL.genObject(n, ids, 'createQuery', GL.queries
        );
    };
  var _glGenQueries = _emscripten_glGenQueries;

  var _emscripten_glGenRenderbuffers = (n, renderbuffers) => {
      GL.genObject(n, renderbuffers, 'createRenderbuffer', GL.renderbuffers
        );
    };
  var _glGenRenderbuffers = _emscripten_glGenRenderbuffers;

  var _emscripten_glGenSamplers = (n, samplers) => {
      GL.genObject(n, samplers, 'createSampler', GL.samplers
        );
    };
  var _glGenSamplers = _emscripten_glGenSamplers;

  var _emscripten_glGenTextures = (n, textures) => {
      GL.genObject(n, textures, 'createTexture', GL.textures
        );
    };
  var _glGenTextures = _emscripten_glGenTextures;

  var _emscripten_glGenVertexArrays = (n, arrays) => {
      GL.genObject(n, arrays, 'createVertexArray', GL.vaos
        );
    };
  var _glGenVertexArrays = _emscripten_glGenVertexArrays;

  var _emscripten_glGenerateMipmap = (x0) => GLctx.generateMipmap(x0);
  var _glGenerateMipmap = _emscripten_glGenerateMipmap;

  
  var __glGetActiveAttribOrUniform = (funcName, program, index, bufSize, length, size, type, name) => {
      program = GL.programs[program];
      var info = GLctx[funcName](program, index);
      if (info) {
        // If an error occurs, nothing will be written to length, size and type and name.
        var numBytesWrittenExclNull = name && stringToUTF8(info.name, name, bufSize);
        if (length) HEAP32[((length)>>2)] = numBytesWrittenExclNull;
        if (size) HEAP32[((size)>>2)] = info.size;
        if (type) HEAP32[((type)>>2)] = info.type;
      }
    };
  
  var _emscripten_glGetActiveAttrib = (program, index, bufSize, length, size, type, name) =>
      __glGetActiveAttribOrUniform('getActiveAttrib', program, index, bufSize, length, size, type, name);
  var _glGetActiveAttrib = _emscripten_glGetActiveAttrib;

  
  var _emscripten_glGetActiveUniform = (program, index, bufSize, length, size, type, name) =>
      __glGetActiveAttribOrUniform('getActiveUniform', program, index, bufSize, length, size, type, name);
  var _glGetActiveUniform = _emscripten_glGetActiveUniform;

  var _emscripten_glGetActiveUniformBlockName = (program, uniformBlockIndex, bufSize, length, uniformBlockName) => {
      program = GL.programs[program];
  
      var result = GLctx.getActiveUniformBlockName(program, uniformBlockIndex);
      if (!result) return; // If an error occurs, nothing will be written to uniformBlockName or length.
      if (uniformBlockName && bufSize > 0) {
        var numBytesWrittenExclNull = stringToUTF8(result, uniformBlockName, bufSize);
        if (length) HEAP32[((length)>>2)] = numBytesWrittenExclNull;
      } else {
        if (length) HEAP32[((length)>>2)] = 0;
      }
    };
  var _glGetActiveUniformBlockName = _emscripten_glGetActiveUniformBlockName;

  var _emscripten_glGetActiveUniformBlockiv = (program, uniformBlockIndex, pname, params) => {
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
        // if params == null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      program = GL.programs[program];
  
      if (pname == 0x8A41 /* GL_UNIFORM_BLOCK_NAME_LENGTH */) {
        var name = GLctx.getActiveUniformBlockName(program, uniformBlockIndex);
        HEAP32[((params)>>2)] = name.length+1;
        return;
      }
  
      var result = GLctx.getActiveUniformBlockParameter(program, uniformBlockIndex, pname);
      if (result === null) return; // If an error occurs, nothing should be written to params.
      if (pname == 0x8A43 /*GL_UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES*/) {
        for (var i = 0; i < result.length; i++) {
          HEAP32[(((params)+(i*4))>>2)] = result[i];
        }
      } else {
        HEAP32[((params)>>2)] = result;
      }
    };
  var _glGetActiveUniformBlockiv = _emscripten_glGetActiveUniformBlockiv;

  var _emscripten_glGetActiveUniformsiv = (program, uniformCount, uniformIndices, pname, params) => {
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
        // if params == null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      if (uniformCount > 0 && uniformIndices == 0) {
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      program = GL.programs[program];
      var ids = [];
      for (var i = 0; i < uniformCount; i++) {
        ids.push(HEAP32[(((uniformIndices)+(i*4))>>2)]);
      }
  
      var result = GLctx.getActiveUniforms(program, ids, pname);
      if (!result) return; // GL spec: If an error is generated, nothing is written out to params.
  
      var len = result.length;
      for (var i = 0; i < len; i++) {
        HEAP32[(((params)+(i*4))>>2)] = result[i];
      }
    };
  var _glGetActiveUniformsiv = _emscripten_glGetActiveUniformsiv;

  
  var _emscripten_glGetAttribLocation = (program, name) =>
      GLctx.getAttribLocation(GL.programs[program], UTF8ToString(name));
  var _glGetAttribLocation = _emscripten_glGetAttribLocation;

  var _emscripten_glGetBufferSubData = (target, offset, size, data) => {
      if (!data) {
        // GLES2 specification does not specify how to behave if data is a null pointer. Since calling this function does not make sense
        // if data == null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      size && GLctx.getBufferSubData(target, offset, HEAPU8, data, size);
    };
  var _glGetBufferSubData = _emscripten_glGetBufferSubData;

  var _emscripten_glGetError = () => {
      var error = GLctx.getError() || GL.lastError;
      GL.lastError = 0/*GL_NO_ERROR*/;
      return error;
    };
  var _glGetError = _emscripten_glGetError;

  var _emscripten_glGetFramebufferAttachmentParameteriv = (target, attachment, pname, params) => {
      var result = GLctx.getFramebufferAttachmentParameter(target, attachment, pname);
      if (result instanceof WebGLRenderbuffer ||
          result instanceof WebGLTexture) {
        result = result.name | 0;
      }
      HEAP32[((params)>>2)] = result;
    };
  var _glGetFramebufferAttachmentParameteriv = _emscripten_glGetFramebufferAttachmentParameteriv;

  
  var readI53FromU64 = (ptr) => {
      return HEAPU32[((ptr)>>2)] + HEAPU32[(((ptr)+(4))>>2)] * 4294967296;
    };
  var writeI53ToI64 = (ptr, num) => {
      HEAPU32[((ptr)>>2)] = num;
      var lower = HEAPU32[((ptr)>>2)];
      HEAPU32[(((ptr)+(4))>>2)] = (num - lower)/4294967296;
      var deserialized = (num >= 0) ? readI53FromU64(ptr) : readI53FromI64(ptr);
      var offset = ((ptr)>>2);
      if (deserialized != num) warnOnce(`writeI53ToI64() out of range: serialized JS Number ${num} to Wasm heap as bytes lo=${ptrToString(HEAPU32[offset])}, hi=${ptrToString(HEAPU32[offset+1])}, which deserializes back to ${deserialized} instead!`);
    };
  var emscriptenWebGLGetIndexed = (target, index, data, type) => {
      if (!data) {
        // GLES2 specification does not specify how to behave if data is a null pointer. Since calling this function does not make sense
        // if data == null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      var result = GLctx.getIndexedParameter(target, index);
      var ret;
      switch (typeof result) {
        case 'boolean':
          ret = result ? 1 : 0;
          break;
        case 'number':
          ret = result;
          break;
        case 'object':
          if (result === null) {
            switch (target) {
              case 0x8C8F: // TRANSFORM_FEEDBACK_BUFFER_BINDING
              case 0x8A28: // UNIFORM_BUFFER_BINDING
                ret = 0;
                break;
              default: {
                GL.recordError(0x500); // GL_INVALID_ENUM
                return;
              }
            }
          } else if (result instanceof WebGLBuffer) {
            ret = result.name | 0;
          } else {
            GL.recordError(0x500); // GL_INVALID_ENUM
            return;
          }
          break;
        default:
          GL.recordError(0x500); // GL_INVALID_ENUM
          return;
      }
  
      switch (type) {
        case 1: writeI53ToI64(data, ret); break;
        case 0: HEAP32[((data)>>2)] = ret; break;
        case 2: HEAPF32[((data)>>2)] = ret; break;
        case 4: HEAP8[data] = ret ? 1 : 0; break;
        default: abort('internal emscriptenWebGLGetIndexed() error, bad type: ' + type);
      }
    };
  var _emscripten_glGetIntegeri_v = (target, index, data) =>
      emscriptenWebGLGetIndexed(target, index, data, 0);
  var _glGetIntegeri_v = _emscripten_glGetIntegeri_v;

  
  
  var webglGetExtensions = () => {
      var exts = getEmscriptenSupportedExtensions(GLctx);
      exts = exts.concat(exts.map((e) => "GL_" + e));
      return exts;
    };
  
  var emscriptenWebGLGet = (name_, p, type) => {
      // Guard against user passing a null pointer.
      // Note that GLES2 spec does not say anything about how passing a null
      // pointer should be treated.  Testing on desktop core GL 3, the application
      // crashes on glGetIntegerv to a null pointer, but better to report an error
      // instead of doing anything random.
      if (!p) {
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      var ret = undefined;
      switch (name_) { // Handle a few trivial GLES values
        case 0x8DFA: // GL_SHADER_COMPILER
          ret = 1;
          break;
        case 0x8DF8: // GL_SHADER_BINARY_FORMATS
          if (type != 0 && type != 1) {
            GL.recordError(0x500); // GL_INVALID_ENUM
          }
          // Do not write anything to the out pointer, since no binary formats are
          // supported.
          return;
        case 0x87FE: // GL_NUM_PROGRAM_BINARY_FORMATS
        case 0x8DF9: // GL_NUM_SHADER_BINARY_FORMATS
          ret = 0;
          break;
        case 0x86A2: // GL_NUM_COMPRESSED_TEXTURE_FORMATS
          // WebGL doesn't have GL_NUM_COMPRESSED_TEXTURE_FORMATS (it's obsolete
          // since GL_COMPRESSED_TEXTURE_FORMATS returns a JS array that can be
          // queried for length), so implement it ourselves to allow C++ GLES2
          // code get the length.
          var formats = GLctx.getParameter(0x86A3 /*GL_COMPRESSED_TEXTURE_FORMATS*/);
          ret = formats ? formats.length : 0;
          break;
        case 0x826E: // GL_MAX_UNIFORM_LOCATIONS
          // This is an arbitrary limit, must be large enough to allow practical
          // use, but small enough to still keep a range for automatic uniform
          // locations, which get assigned numbers larger than this.
          ret = 1048576;
          break;
  
        case 0x821D: // GL_NUM_EXTENSIONS
          if (GL.currentContext.version < 2) {
            // Calling GLES3/WebGL2 function with a GLES2/WebGL1 context
            GL.recordError(0x502 /* GL_INVALID_OPERATION */);
            return;
          }
          ret = webglGetExtensions().length;
          break;
        case 0x821B: // GL_MAJOR_VERSION
        case 0x821C: // GL_MINOR_VERSION
          if (GL.currentContext.version < 2) {
            GL.recordError(0x500); // GL_INVALID_ENUM
            return;
          }
          ret = name_ == 0x821B ? 3 : 0; // return version 3.0
          break;
      }
  
      if (ret === undefined) {
        var result = GLctx.getParameter(name_);
        switch (typeof result) {
          case "number":
            ret = result;
            break;
          case "boolean":
            ret = result ? 1 : 0;
            break;
          case "string":
            GL.recordError(0x500); // GL_INVALID_ENUM
            return;
          case "object":
            if (result === null) {
              // null is a valid result for some (e.g., which buffer is bound -
              // perhaps nothing is bound), but otherwise can mean an invalid
              // name_, which we need to report as an error
              switch (name_) {
                case 0x8894: // ARRAY_BUFFER_BINDING
                case 0x8B8D: // CURRENT_PROGRAM
                case 0x8895: // ELEMENT_ARRAY_BUFFER_BINDING
                case 0x8CA6: // FRAMEBUFFER_BINDING or DRAW_FRAMEBUFFER_BINDING
                case 0x8CA7: // RENDERBUFFER_BINDING
                case 0x8069: // TEXTURE_BINDING_2D
                case 0x85B5: // WebGL 2 GL_VERTEX_ARRAY_BINDING, or WebGL 1 extension OES_vertex_array_object GL_VERTEX_ARRAY_BINDING_OES
                case 0x8F36: // COPY_READ_BUFFER_BINDING or COPY_READ_BUFFER
                case 0x8F37: // COPY_WRITE_BUFFER_BINDING or COPY_WRITE_BUFFER
                case 0x88ED: // PIXEL_PACK_BUFFER_BINDING
                case 0x88EF: // PIXEL_UNPACK_BUFFER_BINDING
                case 0x8CAA: // READ_FRAMEBUFFER_BINDING
                case 0x8919: // SAMPLER_BINDING
                case 0x8C1D: // TEXTURE_BINDING_2D_ARRAY
                case 0x806A: // TEXTURE_BINDING_3D
                case 0x8E25: // TRANSFORM_FEEDBACK_BINDING
                case 0x8C8F: // TRANSFORM_FEEDBACK_BUFFER_BINDING
                case 0x8A28: // UNIFORM_BUFFER_BINDING
                case 0x8514: { // TEXTURE_BINDING_CUBE_MAP
                  ret = 0;
                  break;
                }
                default: {
                  GL.recordError(0x500); // GL_INVALID_ENUM
                  return;
                }
              }
            } else if (result instanceof Float32Array ||
                       result instanceof Uint32Array ||
                       result instanceof Int32Array ||
                       result instanceof Array) {
              for (var i = 0; i < result.length; ++i) {
                switch (type) {
                  case 0: HEAP32[(((p)+(i*4))>>2)] = result[i]; break;
                  case 2: HEAPF32[(((p)+(i*4))>>2)] = result[i]; break;
                  case 4: HEAP8[(p)+(i)] = result[i] ? 1 : 0; break;
                }
              }
              return;
            } else {
              try {
                ret = result.name | 0;
              } catch(e) {
                GL.recordError(0x500); // GL_INVALID_ENUM
                err(`GL_INVALID_ENUM in glGet${type}v: Unknown object returned from WebGL getParameter(${name_})! (error: ${e})`);
                return;
              }
            }
            break;
          default:
            GL.recordError(0x500); // GL_INVALID_ENUM
            err(`GL_INVALID_ENUM in glGet${type}v: Native code calling glGet${type}v(${name_}) and it returns ${result} of type ${typeof(result)}!`);
            return;
        }
      }
  
      switch (type) {
        case 1: writeI53ToI64(p, ret); break;
        case 0: HEAP32[((p)>>2)] = ret; break;
        case 2:   HEAPF32[((p)>>2)] = ret; break;
        case 4: HEAP8[p] = ret ? 1 : 0; break;
      }
    };
  
  var _emscripten_glGetIntegerv = (name_, p) => emscriptenWebGLGet(name_, p, 0);
  var _glGetIntegerv = _emscripten_glGetIntegerv;

  var _emscripten_glGetInternalformativ = (target, internalformat, pname, bufSize, params) => {
      if (bufSize < 0) {
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      if (!params) {
        // GLES3 specification does not specify how to behave if values is a null pointer. Since calling this function does not make sense
        // if values == null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      var ret = GLctx.getInternalformatParameter(target, internalformat, pname);
      if (ret === null) return;
      for (var i = 0; i < ret.length && i < bufSize; ++i) {
        HEAP32[(((params)+(i*4))>>2)] = ret[i];
      }
    };
  var _glGetInternalformativ = _emscripten_glGetInternalformativ;

  var _emscripten_glGetProgramBinary = (program, bufSize, length, binaryFormat, binary) => {
      GL.recordError(0x502/*GL_INVALID_OPERATION*/);
    };
  var _glGetProgramBinary = _emscripten_glGetProgramBinary;

  var _emscripten_glGetProgramInfoLog = (program, maxLength, length, infoLog) => {
      var log = GLctx.getProgramInfoLog(GL.programs[program]);
      if (log === null) log = '(unknown error)';
      var numBytesWrittenExclNull = (maxLength > 0 && infoLog) ? stringToUTF8(log, infoLog, maxLength) : 0;
      if (length) HEAP32[((length)>>2)] = numBytesWrittenExclNull;
    };
  var _glGetProgramInfoLog = _emscripten_glGetProgramInfoLog;

  var _emscripten_glGetProgramiv = (program, pname, p) => {
      if (!p) {
        // GLES2 specification does not specify how to behave if p is a null
        // pointer. Since calling this function does not make sense if p == null,
        // issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
  
      if (program >= GL.counter) {
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
  
      program = GL.programs[program];
  
      if (pname == 0x8B84) { // GL_INFO_LOG_LENGTH
        var log = GLctx.getProgramInfoLog(program);
        if (log === null) log = '(unknown error)';
        HEAP32[((p)>>2)] = log.length + 1;
      } else if (pname == 0x8B87 /* GL_ACTIVE_UNIFORM_MAX_LENGTH */) {
        if (!program.maxUniformLength) {
          var numActiveUniforms = GLctx.getProgramParameter(program, 0x8B86/*GL_ACTIVE_UNIFORMS*/);
          for (var i = 0; i < numActiveUniforms; ++i) {
            program.maxUniformLength = Math.max(program.maxUniformLength, GLctx.getActiveUniform(program, i).name.length+1);
          }
        }
        HEAP32[((p)>>2)] = program.maxUniformLength;
      } else if (pname == 0x8B8A /* GL_ACTIVE_ATTRIBUTE_MAX_LENGTH */) {
        if (!program.maxAttributeLength) {
          var numActiveAttributes = GLctx.getProgramParameter(program, 0x8B89/*GL_ACTIVE_ATTRIBUTES*/);
          for (var i = 0; i < numActiveAttributes; ++i) {
            program.maxAttributeLength = Math.max(program.maxAttributeLength, GLctx.getActiveAttrib(program, i).name.length+1);
          }
        }
        HEAP32[((p)>>2)] = program.maxAttributeLength;
      } else if (pname == 0x8A35 /* GL_ACTIVE_UNIFORM_BLOCK_MAX_NAME_LENGTH */) {
        if (!program.maxUniformBlockNameLength) {
          var numActiveUniformBlocks = GLctx.getProgramParameter(program, 0x8A36/*GL_ACTIVE_UNIFORM_BLOCKS*/);
          for (var i = 0; i < numActiveUniformBlocks; ++i) {
            program.maxUniformBlockNameLength = Math.max(program.maxUniformBlockNameLength, GLctx.getActiveUniformBlockName(program, i).length+1);
          }
        }
        HEAP32[((p)>>2)] = program.maxUniformBlockNameLength;
      } else {
        HEAP32[((p)>>2)] = GLctx.getProgramParameter(program, pname);
      }
    };
  var _glGetProgramiv = _emscripten_glGetProgramiv;

  var _emscripten_glGetQueryObjectuiv = (id, pname, params) => {
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
        // if p == null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      var query = GL.queries[id];
      var param = GLctx.getQueryParameter(query, pname);
      var ret;
      if (typeof param == 'boolean') {
        ret = param ? 1 : 0;
      } else {
        ret = param;
      }
      HEAP32[((params)>>2)] = ret;
    };
  var _glGetQueryObjectuiv = _emscripten_glGetQueryObjectuiv;

  var _emscripten_glGetQueryiv = (target, pname, params) => {
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
        // if p == null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      HEAP32[((params)>>2)] = GLctx.getQuery(target, pname);
    };
  var _glGetQueryiv = _emscripten_glGetQueryiv;

  var _emscripten_glGetRenderbufferParameteriv = (target, pname, params) => {
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
        // if params == null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      HEAP32[((params)>>2)] = GLctx.getRenderbufferParameter(target, pname);
    };
  var _glGetRenderbufferParameteriv = _emscripten_glGetRenderbufferParameteriv;

  
  var _emscripten_glGetShaderInfoLog = (shader, maxLength, length, infoLog) => {
      var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
      if (log === null) log = '(unknown error)';
      var numBytesWrittenExclNull = (maxLength > 0 && infoLog) ? stringToUTF8(log, infoLog, maxLength) : 0;
      if (length) HEAP32[((length)>>2)] = numBytesWrittenExclNull;
    };
  var _glGetShaderInfoLog = _emscripten_glGetShaderInfoLog;

  var _emscripten_glGetShaderPrecisionFormat = (shaderType, precisionType, range, precision) => {
      var result = GLctx.getShaderPrecisionFormat(shaderType, precisionType);
      HEAP32[((range)>>2)] = result.rangeMin;
      HEAP32[(((range)+(4))>>2)] = result.rangeMax;
      HEAP32[((precision)>>2)] = result.precision;
    };
  var _glGetShaderPrecisionFormat = _emscripten_glGetShaderPrecisionFormat;

  var _emscripten_glGetShaderSource = (shader, bufSize, length, source) => {
      var result = GLctx.getShaderSource(GL.shaders[shader]);
      if (!result) return; // If an error occurs, nothing will be written to length or source.
      var numBytesWrittenExclNull = (bufSize > 0 && source) ? stringToUTF8(result, source, bufSize) : 0;
      if (length) HEAP32[((length)>>2)] = numBytesWrittenExclNull;
    };
  var _glGetShaderSource = _emscripten_glGetShaderSource;

  var _emscripten_glGetShaderiv = (shader, pname, p) => {
      if (!p) {
        // GLES2 specification does not specify how to behave if p is a null
        // pointer. Since calling this function does not make sense if p == null,
        // issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      if (pname == 0x8B84) { // GL_INFO_LOG_LENGTH
        var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
        if (log === null) log = '(unknown error)';
        // The GLES2 specification says that if the shader has an empty info log,
        // a value of 0 is returned. Otherwise the log has a null char appended.
        // (An empty string is falsey, so we can just check that instead of
        // looking at log.length.)
        var logLength = log ? log.length + 1 : 0;
        HEAP32[((p)>>2)] = logLength;
      } else if (pname == 0x8B88) { // GL_SHADER_SOURCE_LENGTH
        var source = GLctx.getShaderSource(GL.shaders[shader]);
        // source may be a null, or the empty string, both of which are falsey
        // values that we report a 0 length for.
        var sourceLength = source ? source.length + 1 : 0;
        HEAP32[((p)>>2)] = sourceLength;
      } else {
        HEAP32[((p)>>2)] = GLctx.getShaderParameter(GL.shaders[shader], pname);
      }
    };
  var _glGetShaderiv = _emscripten_glGetShaderiv;

  
  
  var _emscripten_glGetString = (name_) => {
      var ret = GL.stringCache[name_];
      if (!ret) {
        switch (name_) {
          case 0x1F03 /* GL_EXTENSIONS */:
            ret = stringToNewUTF8(webglGetExtensions().join(' '));
            break;
          case 0x1F00 /* GL_VENDOR */:
          case 0x1F01 /* GL_RENDERER */:
          case 0x9245 /* UNMASKED_VENDOR_WEBGL */:
          case 0x9246 /* UNMASKED_RENDERER_WEBGL */:
            var s = GLctx.getParameter(name_);
            if (!s) {
              GL.recordError(0x500/*GL_INVALID_ENUM*/);
            }
            ret = s ? stringToNewUTF8(s) : 0;
            break;
  
          case 0x1F02 /* GL_VERSION */:
            var webGLVersion = GLctx.getParameter(0x1F02 /*GL_VERSION*/);
            // return GLES version string corresponding to the version of the WebGL context
            var glVersion = `OpenGL ES 2.0 (${webGLVersion})`;
            if (GL.currentContext.version >= 2) glVersion = `OpenGL ES 3.0 (${webGLVersion})`;
            ret = stringToNewUTF8(glVersion);
            break;
          case 0x8B8C /* GL_SHADING_LANGUAGE_VERSION */:
            var glslVersion = GLctx.getParameter(0x8B8C /*GL_SHADING_LANGUAGE_VERSION*/);
            // extract the version number 'N.M' from the string 'WebGL GLSL ES N.M ...'
            var ver_re = /^WebGL GLSL ES ([0-9]\.[0-9][0-9]?)(?:$| .*)/;
            var ver_num = glslVersion.match(ver_re);
            if (ver_num !== null) {
              if (ver_num[1].length == 3) ver_num[1] = ver_num[1] + '0'; // ensure minor version has 2 digits
              glslVersion = `OpenGL ES GLSL ES ${ver_num[1]} (${glslVersion})`;
            }
            ret = stringToNewUTF8(glslVersion);
            break;
          default:
            GL.recordError(0x500/*GL_INVALID_ENUM*/);
            // fall through
        }
        GL.stringCache[name_] = ret;
      }
      return ret;
    };
  var _glGetString = _emscripten_glGetString;

  
  var _emscripten_glGetStringi = (name, index) => {
      if (GL.currentContext.version < 2) {
        GL.recordError(0x502 /* GL_INVALID_OPERATION */); // Calling GLES3/WebGL2 function with a GLES2/WebGL1 context
        return 0;
      }
      var stringiCache = GL.stringiCache[name];
      if (stringiCache) {
        if (index < 0 || index >= stringiCache.length) {
          GL.recordError(0x501/*GL_INVALID_VALUE*/);
          return 0;
        }
        return stringiCache[index];
      }
      switch (name) {
        case 0x1F03 /* GL_EXTENSIONS */:
          var exts = webglGetExtensions().map(stringToNewUTF8);
          stringiCache = GL.stringiCache[name] = exts;
          if (index < 0 || index >= stringiCache.length) {
            GL.recordError(0x501/*GL_INVALID_VALUE*/);
            return 0;
          }
          return stringiCache[index];
        default:
          GL.recordError(0x500/*GL_INVALID_ENUM*/);
          return 0;
      }
    };
  var _glGetStringi = _emscripten_glGetStringi;

  var _emscripten_glGetTexParameteriv = (target, pname, params) => {
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null
        // pointer. Since calling this function does not make sense if p == null,
        // issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      HEAP32[((params)>>2)] = GLctx.getTexParameter(target, pname);
    };
  var _glGetTexParameteriv = _emscripten_glGetTexParameteriv;

  var _emscripten_glGetUniformBlockIndex = (program, uniformBlockName) => {
      return GLctx.getUniformBlockIndex(GL.programs[program], UTF8ToString(uniformBlockName));
    };
  var _glGetUniformBlockIndex = _emscripten_glGetUniformBlockIndex;

  var _emscripten_glGetUniformIndices = (program, uniformCount, uniformNames, uniformIndices) => {
      if (!uniformIndices) {
        // GLES2 specification does not specify how to behave if uniformIndices is a null pointer. Since calling this function does not make sense
        // if uniformIndices == null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      if (uniformCount > 0 && (uniformNames == 0 || uniformIndices == 0)) {
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      program = GL.programs[program];
      var names = [];
      for (var i = 0; i < uniformCount; i++)
        names.push(UTF8ToString(HEAP32[(((uniformNames)+(i*4))>>2)]));
  
      var result = GLctx.getUniformIndices(program, names);
      if (!result) return; // GL spec: If an error is generated, nothing is written out to uniformIndices.
  
      var len = result.length;
      for (var i = 0; i < len; i++) {
        HEAP32[(((uniformIndices)+(i*4))>>2)] = result[i];
      }
    };
  var _glGetUniformIndices = _emscripten_glGetUniformIndices;

  /** @suppress {checkTypes} */
  var jstoi_q = (str) => parseInt(str);
  
  /** @noinline */
  var webglGetLeftBracePos = (name) => name.slice(-1) == ']' && name.lastIndexOf('[');
  
  var webglPrepareUniformLocationsBeforeFirstUse = (program) => {
      var uniformLocsById = program.uniformLocsById, // Maps GLuint -> WebGLUniformLocation
        uniformSizeAndIdsByName = program.uniformSizeAndIdsByName, // Maps name -> [uniform array length, GLuint]
        i, j;
  
      // On the first time invocation of glGetUniformLocation on this shader program:
      // initialize cache data structures and discover which uniforms are arrays.
      if (!uniformLocsById) {
        // maps GLint integer locations to WebGLUniformLocations
        program.uniformLocsById = uniformLocsById = {};
        // maps integer locations back to uniform name strings, so that we can lazily fetch uniform array locations
        program.uniformArrayNamesById = {};
  
        var numActiveUniforms = GLctx.getProgramParameter(program, 0x8B86/*GL_ACTIVE_UNIFORMS*/);
        for (i = 0; i < numActiveUniforms; ++i) {
          var u = GLctx.getActiveUniform(program, i);
          var nm = u.name;
          var sz = u.size;
          var lb = webglGetLeftBracePos(nm);
          var arrayName = lb > 0 ? nm.slice(0, lb) : nm;
  
          // Acquire the preset location from the explicit uniform location if one was specified, or
          // programmatically assign a new one if not.
          var id = uniformSizeAndIdsByName[arrayName] ? uniformSizeAndIdsByName[arrayName][1] : program.uniformIdCounter;
          program.uniformIdCounter = Math.max(id + sz, program.uniformIdCounter);
          // Eagerly get the location of the uniformArray[0] base element.
          // The remaining indices >0 will be left for lazy evaluation to
          // improve performance. Those may never be needed to fetch, if the
          // application fills arrays always in full starting from the first
          // element of the array.
          uniformSizeAndIdsByName[arrayName] = [sz, id];
  
          // Store placeholder integers in place that highlight that these
          // >0 index locations are array indices pending population.
          for (j = 0; j < sz; ++j) {
            uniformLocsById[id] = j;
            program.uniformArrayNamesById[id++] = arrayName;
          }
        }
      }
    };
  
  
  
  var _emscripten_glGetUniformLocation = (program, name) => {
  
      name = UTF8ToString(name);
  
      if (program = GL.programs[program]) {
        webglPrepareUniformLocationsBeforeFirstUse(program);
        var uniformLocsById = program.uniformLocsById; // Maps GLuint -> WebGLUniformLocation
        var arrayIndex = 0;
        var uniformBaseName = name;
  
        // Invariant: when populating integer IDs for uniform locations, we must
        // maintain the precondition that arrays reside in contiguous addresses,
        // i.e. for a 'vec4 colors[10];', colors[4] must be at location
        // colors[0]+4.  However, user might call glGetUniformLocation(program,
        // "colors") for an array, so we cannot discover based on the user input
        // arguments whether the uniform we are dealing with is an array. The only
        // way to discover which uniforms are arrays is to enumerate over all the
        // active uniforms in the program.
        var leftBrace = webglGetLeftBracePos(name);
  
        // If user passed an array accessor "[index]", parse the array index off the accessor.
        if (leftBrace > 0) {
          arrayIndex = jstoi_q(name.slice(leftBrace + 1)) >>> 0; // "index]", coerce parseInt(']') with >>>0 to treat "foo[]" as "foo[0]" and foo[-1] as unsigned out-of-bounds.
          uniformBaseName = name.slice(0, leftBrace);
        }
  
        // Have we cached the location of this uniform before?
        // A pair [array length, GLint of the uniform location]
        var sizeAndId = program.uniformSizeAndIdsByName[uniformBaseName];
  
        // If an uniform with this name exists, and if its index is within the
        // array limits (if it's even an array), query the WebGLlocation, or
        // return an existing cached location.
        if (sizeAndId && arrayIndex < sizeAndId[0]) {
          arrayIndex += sizeAndId[1]; // Add the base location of the uniform to the array index offset.
          if ((uniformLocsById[arrayIndex] = uniformLocsById[arrayIndex] || GLctx.getUniformLocation(program, name))) {
            return arrayIndex;
          }
        }
      }
      else {
        // N.b. we are currently unable to distinguish between GL program IDs that
        // never existed vs GL program IDs that have been deleted, so report
        // GL_INVALID_VALUE in both cases.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
      }
      return -1;
    };
  var _glGetUniformLocation = _emscripten_glGetUniformLocation;

  var webglGetUniformLocation = (location) => {
      var p = GLctx.currentProgram;
  
      if (p) {
        var webglLoc = p.uniformLocsById[location];
        // p.uniformLocsById[location] stores either an integer, or a
        // WebGLUniformLocation.
        // If an integer, we have not yet bound the location, so do it now. The
        // integer value specifies the array index we should bind to.
        if (typeof webglLoc == 'number') {
          p.uniformLocsById[location] = webglLoc = GLctx.getUniformLocation(p, p.uniformArrayNamesById[location] + (webglLoc > 0 ? `[${webglLoc}]` : ''));
        }
        // Else an already cached WebGLUniformLocation, return it.
        return webglLoc;
      } else {
        GL.recordError(0x502/*GL_INVALID_OPERATION*/);
      }
    };
  
  
  /** @suppress{checkTypes} */
  var emscriptenWebGLGetUniform = (program, location, params, type) => {
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null
        // pointer. Since calling this function does not make sense if params ==
        // null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      program = GL.programs[program];
      webglPrepareUniformLocationsBeforeFirstUse(program);
      var data = GLctx.getUniform(program, webglGetUniformLocation(location));
      if (typeof data == 'number' || typeof data == 'boolean') {
        switch (type) {
          case 0: HEAP32[((params)>>2)] = data; break;
          case 2: HEAPF32[((params)>>2)] = data; break;
        }
      } else {
        for (var i = 0; i < data.length; i++) {
          switch (type) {
            case 0: HEAP32[(((params)+(i*4))>>2)] = data[i]; break;
            case 2: HEAPF32[(((params)+(i*4))>>2)] = data[i]; break;
          }
        }
      }
    };
  
  var _emscripten_glGetUniformiv = (program, location, params) => {
      emscriptenWebGLGetUniform(program, location, params, 0);
    };
  var _glGetUniformiv = _emscripten_glGetUniformiv;

  /** @suppress{checkTypes} */
  var emscriptenWebGLGetVertexAttrib = (index, pname, params, type) => {
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null
        // pointer. Since calling this function does not make sense if params ==
        // null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      if (GL.currentContext.clientBuffers[index].enabled) {
        err("glGetVertexAttrib*v on client-side array: not supported, bad data returned");
      }
      var data = GLctx.getVertexAttrib(index, pname);
      if (pname == 0x889F/*VERTEX_ATTRIB_ARRAY_BUFFER_BINDING*/) {
        HEAP32[((params)>>2)] = data && data["name"];
      } else if (typeof data == 'number' || typeof data == 'boolean') {
        switch (type) {
          case 0: HEAP32[((params)>>2)] = data; break;
          case 2: HEAPF32[((params)>>2)] = data; break;
          case 5: HEAP32[((params)>>2)] = Math.fround(data); break;
        }
      } else {
        for (var i = 0; i < data.length; i++) {
          switch (type) {
            case 0: HEAP32[(((params)+(i*4))>>2)] = data[i]; break;
            case 2: HEAPF32[(((params)+(i*4))>>2)] = data[i]; break;
            case 5: HEAP32[(((params)+(i*4))>>2)] = Math.fround(data[i]); break;
          }
        }
      }
    };
  
  var _emscripten_glGetVertexAttribiv = (index, pname, params) => {
      // N.B. This function may only be called if the vertex attribute was
      // specified using the function glVertexAttrib*f(), otherwise the results
      // are undefined. (GLES3 spec 6.1.12)
      emscriptenWebGLGetVertexAttrib(index, pname, params, 5);
    };
  var _glGetVertexAttribiv = _emscripten_glGetVertexAttribiv;

  var _emscripten_glInvalidateFramebuffer = (target, numAttachments, attachments) => {
      var list = tempFixedLengthArray[numAttachments];
      for (var i = 0; i < numAttachments; i++) {
        list[i] = HEAP32[(((attachments)+(i*4))>>2)];
      }
  
      GLctx.invalidateFramebuffer(target, list);
    };
  var _glInvalidateFramebuffer = _emscripten_glInvalidateFramebuffer;

  var _emscripten_glIsEnabled = (x0) => GLctx.isEnabled(x0);
  var _glIsEnabled = _emscripten_glIsEnabled;

  var _emscripten_glIsVertexArray = (array) => {
  
      var vao = GL.vaos[array];
      if (!vao) return 0;
      return GLctx.isVertexArray(vao);
    };
  var _glIsVertexArray = _emscripten_glIsVertexArray;

  var _emscripten_glLinkProgram = (program) => {
      program = GL.programs[program];
      GLctx.linkProgram(program);
      // Invalidate earlier computed uniform->ID mappings, those have now become stale
      program.uniformLocsById = 0; // Mark as null-like so that glGetUniformLocation() knows to populate this again.
      program.uniformSizeAndIdsByName = {};
  
      // Collect explicit uniform locations from the vertex and fragment shaders.
      for (var s of [program['vs'], program['fs']]) {
        for (var [shaderLocation, loc] of Object.entries(s.explicitUniformLocations)) {
          // Record each explicit uniform location temporarily as a non-array uniform
          // with size=1. This is not true, but on the first glGetUniformLocation() call
          // the array sizes will get populated to correct sizes.
          program.uniformSizeAndIdsByName[shaderLocation] = [1, loc];
  
          // Make sure we will never automatically assign locations within the range
          // used for explicit layout(location=x) variables.
          program.uniformIdCounter = Math.max(program.uniformIdCounter, loc + 1);
        }
      }
  
      function copyKeys(dst, src) {
        for (var key of Object.keys(src)) { dst[key] = src[key] };
      }
      // Collect sampler and ubo binding locations from the vertex and fragment shaders.
      program.explicitUniformBindings = {};
      program.explicitSamplerBindings = {};
      for (var s of [program['vs'], program['fs']]) {
        copyKeys(program.explicitUniformBindings, s.explicitUniformBindings);
        copyKeys(program.explicitSamplerBindings, s.explicitSamplerBindings);
      }
      // Record that we need to apply these explicit bindings when glUseProgram() is
      // first called on this program.
      program.explicitProgramBindingsApplied = 0;
    };
  var _glLinkProgram = _emscripten_glLinkProgram;

  
  
  
  var _emscripten_glMapBufferRange = (target, offset, length, access) => {
      if ((access & (0x1/*GL_MAP_READ_BIT*/ | 0x20/*GL_MAP_UNSYNCHRONIZED_BIT*/)) != 0) {
        err("glMapBufferRange access does not support MAP_READ or MAP_UNSYNCHRONIZED");
        return 0;
      }
  
      if ((access & 0x2/*GL_MAP_WRITE_BIT*/) == 0) {
        err("glMapBufferRange access must include MAP_WRITE");
        return 0;
      }
  
      if ((access & (0x4/*GL_MAP_INVALIDATE_BUFFER_BIT*/ | 0x8/*GL_MAP_INVALIDATE_RANGE_BIT*/)) == 0) {
        err("glMapBufferRange access must include INVALIDATE_BUFFER or INVALIDATE_RANGE");
        return 0;
      }
  
      if (!emscriptenWebGLValidateMapBufferTarget(target)) {
        GL.recordError(0x500/*GL_INVALID_ENUM*/);
        err('GL_INVALID_ENUM in glMapBufferRange');
        return 0;
      }
  
      var mem = _malloc(length), binding = emscriptenWebGLGetBufferBinding(target);
      if (!mem) return 0;
  
      binding = GL.mappedBuffers[binding] ??= {};
      binding.offset = offset;
      binding.length = length;
      binding.mem = mem;
      binding.access = access;
      return mem;
    };
  var _glMapBufferRange = _emscripten_glMapBufferRange;

  var _glPixelStorei = (pname, param) => {
      if (pname == 3317) {
        GL.unpackAlignment = param;
      } else if (pname == 3314) {
        GL.unpackRowLength = param;
      } else if (pname == 0x0D02 /*GL_PACK_ROW_LENGTH*/) {
        GL.packRowLength = param;
      }
      GLctx.pixelStorei(pname, param);
    };

  var _emscripten_glPolygonOffset = (x0, x1) => GLctx.polygonOffset(x0, x1);
  var _glPolygonOffset = _emscripten_glPolygonOffset;

  var _emscripten_glProgramBinary = (program, binaryFormat, binary, length) => {
      GL.recordError(0x500/*GL_INVALID_ENUM*/);
    };
  var _glProgramBinary = _emscripten_glProgramBinary;

  var _emscripten_glProgramParameteri = (program, pname, value) => {
      GL.recordError(0x500/*GL_INVALID_ENUM*/);
    };
  var _glProgramParameteri = _emscripten_glProgramParameteri;

  var _emscripten_glReadBuffer = (x0) => GLctx.readBuffer(x0);
  var _glReadBuffer = _emscripten_glReadBuffer;

  var _glReadPixels = (x, y, width, height, format, type, pixels) => {
      if (GL.currentContext.version >= 2) {
        if (GLctx.currentPixelPackBufferBinding) {
          GLctx.readPixels(x, y, width, height, format, type, pixels);
          return;
        }
        const heap = heapObjectForWebGLType(type);
        const target = toTypedArrayIndex(pixels, heap);
        GLctx.readPixels(x, y, width, height, format, type, heap, target);
        return;
      }
      const stride = Math.max(width, GL.packRowLength | 0);
      const pixelData = emscriptenWebGLGetTexPixelData(type, format, stride, height, pixels);
      if (!pixelData) {
        GL.recordError(0x500/*GL_INVALID_ENUM*/);
        return;
      }
      GLctx.readPixels(x, y, width, height, format, type, pixelData);
    };

  var _emscripten_glRenderbufferStorage = (x0, x1, x2, x3) => GLctx.renderbufferStorage(x0, x1, x2, x3);
  var _glRenderbufferStorage = _emscripten_glRenderbufferStorage;

  var _emscripten_glRenderbufferStorageMultisample = (x0, x1, x2, x3, x4) => GLctx.renderbufferStorageMultisample(x0, x1, x2, x3, x4);
  var _glRenderbufferStorageMultisample = _emscripten_glRenderbufferStorageMultisample;

  var _emscripten_glSamplerParameteri = (sampler, pname, param) => {
      GLctx.samplerParameteri(GL.samplers[sampler], pname, param);
    };
  var _glSamplerParameteri = _emscripten_glSamplerParameteri;

  var _emscripten_glScissor = (x0, x1, x2, x3) => GLctx.scissor(x0, x1, x2, x3);
  var _glScissor = _emscripten_glScissor;

  var find_closing_parens_index = (arr, i, opening='(', closing=')') => {
      for (var nesting = 0; i < arr.length; ++i) {
        if (arr[i] == opening) ++nesting;
        if (arr[i] == closing && --nesting == 0) {
          return i;
        }
      }
    };
  function preprocess_c_code(code, defs = {}) {
      var i = 0, // iterator over the input string
        len = code.length, // cache input length
        out = '', // generates the preprocessed output string
        stack = [1]; // preprocessing stack (state of active/inactive #ifdef/#else blocks we are currently inside)
      // a mapping 'symbolname' -> function(args) which evaluates the given cpp macro, e.g. #define FOO(x) x+10.
      defs['defined'] = (args) => { // built-in "#if defined(x)"" macro.
        assert(args.length == 1);
        assert(/^[A-Za-z0-9_$]+$/.test(args[0].trim())); // Test that a C preprocessor identifier contains only valid characters (we likely parsed wrong if this fails)
        return defs[args[0].trim()] ? 1 : 0;
      };
  
      // Returns true if str[i] is whitespace.
      function isWhitespace(str, i) {
        return !(str.charCodeAt(i) > 32); // Compare as negation to treat end-of-string undefined as whitespace
      }
  
      // Returns index to the next whitespace character starting at str[i].
      function nextWhitespace(str, i) {
        while (!isWhitespace(str, i)) ++i;
        return i;
      }
  
      // Returns an integer ID classification of the character at str[idx], used for tokenization purposes.
      function classifyChar(str, idx) {
        var cc = str.charCodeAt(idx);
        assert(!(cc > 127), "Only 7-bit ASCII can be used in preprocessor #if/#ifdef/#define statements!");
        if (cc > 32) {
          if (cc < 48) return 1; // an operator symbol, any of !"#$%&'()*+,-./
          if (cc < 58) return 2; // a number 0123456789
          if (cc < 65) return 1; // an operator symbol, any of :;<=>?@
          if (cc < 91 || cc == 95/*_*/) return 3; // a character, any of A-Z or _
          if (cc < 97) return 1; // an operator symbol, any of [\]^`
          if (cc < 123) return 3; // a character, any of a-z
          return 1; // an operator symbol, any of {|}~
        }
        return cc < 33 ? 0 : 4; // 0=whitespace, 4=end-of-string
      }
  
      // Returns a tokenized array of the given string expression, i.e. "FOO > BAR && BAZ" -> ["FOO", ">", "BAR", "&&", "BAZ"]
      // Optionally keeps whitespace as tokens to be able to reconstruct the original input string.
      function tokenize(exprString, keepWhitespace) {
        var out = [], len = exprString.length;
        for (var i = 0; i <= len; ++i) {
          var kind = classifyChar(exprString, i);
          if (kind == 2/*0-9*/ || kind == 3/*a-z*/) { // a character or a number
            for (var j = i+1; j <= len; ++j) {
              var kind2 = classifyChar(exprString, j);
              if (kind2 != kind && (kind2 != 2/*0-9*/ || kind != 3/*a-z*/)) { // parse number sequence "423410", and identifier sequence "FOO32BAR"
                out.push(exprString.substring(i, j));
                i = j-1;
                break;
              }
            }
          } else if (kind == 1/*operator symbol*/) {
            // Lookahead for two-character operators.
            var op2 = exprString.slice(i, i + 2);
            if (['<=', '>=', '==', '!=', '&&', '||'].includes(op2)) {
              out.push(op2);
              ++i;
            } else {
              out.push(exprString[i]);
            }
          }
        }
        return out;
      }
  
      // Expands preprocessing macros on substring str[lineStart...lineEnd]
      function expandMacros(str, lineStart, lineEnd) {
        if (lineEnd === undefined) lineEnd = str.length;
        var len = str.length;
        var out = '';
        for (var i = lineStart; i < lineEnd; ++i) {
          var kind = classifyChar(str, i);
          if (kind == 3/*a-z*/) {
            for (var j = i + 1; j <= lineEnd; ++j) {
              var kind2 = classifyChar(str, j);
              if (kind2 != 2/*0-9*/ && kind2 != 3/*a-z*/) {
                var symbol = str.substring(i, j);
                var pp = defs[symbol];
                if (pp) {
                  var expanded = str.substring(lineStart, i);
                  if (pp.length) { // Expanding a macro? (#define FOO(X) ...)
                    while (isWhitespace(str, j)) ++j;
                    if (str[j] == '(') {
                      var closeParens = find_closing_parens_index(str, j);
                      // N.b. this has a limitation that multiparameter macros cannot nest with other multiparameter macros
                      // e.g. FOO(a, BAR(b, c)) is not supported.
                      expanded += pp(str.substring(j+1, closeParens).split(',')) + str.substring(closeParens+1, lineEnd);
                    } else {
                      var j2 = nextWhitespace(str, j);
                      expanded += pp([str.substring(j, j2)]) + str.substring(j2, lineEnd);
                    }
                  } else { // Expanding a non-macro (#define FOO BAR)
                    expanded += pp() + str.substring(j, lineEnd);
                  }
                  return expandMacros(expanded, 0);
                }
                out += symbol;
                i = j-1;
                break;
              }
            }
          } else {
            out += str[i];
          }
        }
        return out;
      }
  
      // Given a token list e.g. ['2', '>', '1'], returns a function that evaluates that token list.
      function buildExprTree(tokens) {
        // Consume tokens array into a function tree until the tokens array is exhausted
        // to a single root node that evaluates it.
        while (tokens.length > 1 || typeof tokens[0] != 'function') {
          tokens = ((tokens) => {
            // Find the index 'i' of the operator we should evaluate next:
            var i, j, p, operatorAndPriority = -2;
            for (j = 0; j < tokens.length; ++j) {
              if ((p = ['*', '/', '+', '-', '!', '<', '<=', '>', '>=', '==', '!=', '&&', '||', '('].indexOf(tokens[j])) > operatorAndPriority) {
                i = j;
                operatorAndPriority = p;
              }
            }
  
            if (operatorAndPriority == 13 /* parens '(' */) {
              // Find the closing parens position
              var j = find_closing_parens_index(tokens, i);
              if (j) {
                tokens.splice(i, j+1-i, buildExprTree(tokens.slice(i+1, j)));
                return tokens;
              }
            }
  
            if (operatorAndPriority == 4 /* unary ! */) {
              // Special case: the unary operator ! needs to evaluate right-to-left.
              i = tokens.lastIndexOf('!');
              var innerExpr = buildExprTree(tokens.slice(i+1, i+2));
              tokens.splice(i, 2, function() { return !innerExpr(); })
              return tokens;
            }
  
            // A binary operator:
            if (operatorAndPriority >= 0) {
              var left = buildExprTree(tokens.slice(0, i));
              var right = buildExprTree(tokens.slice(i+1));
              switch(tokens[i]) {
                case '&&': return [function() { return left() && right(); }];
                case '||': return [function() { return left() || right(); }];
                case '==': return [function() { return left() == right(); }];
                case '!=': return [function() { return left() != right(); }];
                case '<' : return [function() { return left() <  right(); }];
                case '<=': return [function() { return left() <= right(); }];
                case '>' : return [function() { return left() >  right(); }];
                case '>=': return [function() { return left() >= right(); }];
                case  '+': return [function() { return left()  + right(); }];
                case  '-': return [function() { return left()  - right(); }];
                case  '*': return [function() { return left()  * right(); }];
                case  '/': return [function() { return Math.floor(left() / right()); }];
              }
            }
            // else a number:
            assert(tokens[i] !== ')', 'Parsing failure, mismatched parentheses in parsing!' + tokens.toString());
            assert(operatorAndPriority == -1);
            var num = Number(tokens[i]);
            return [function() { return num; }]
          })(tokens);
        }
        return tokens[0];
      }
  
      // Preprocess the input one line at a time.
      for (; i < len; ++i) {
        // Find the start of the current line.
        var lineStart = i;
  
        // Seek iterator to end of current line.
        i = code.indexOf('\n', i);
        if (i < 0) i = len;
  
        // Find the first non-whitespace character on the line.
        for (var j = lineStart; j < i && isWhitespace(code, j); ++j);
  
        // Is this a non-preprocessor directive line?
        var thisLineIsInActivePreprocessingBlock = stack[stack.length-1];
        if (code[j] != '#') { // non-preprocessor line?
          if (thisLineIsInActivePreprocessingBlock) {
            out += expandMacros(code, lineStart, i) + '\n';
          }
          continue;
        }
        // This is a preprocessor directive line, e.g. #ifdef or #define.
  
        // Parse the line as #<directive> <expression>
        var space = nextWhitespace(code, j);
        var directive = code.substring(j+1, space);
        var expression = code.substring(space, i).trim();
        switch(directive) {
        case 'if':
          var tokens = tokenize(expandMacros(expression, 0));
          var exprTree = buildExprTree(tokens);
          var evaluated = exprTree();
          stack.push(!!evaluated * stack[stack.length-1]);
          break;
        case 'ifdef': stack.push(!!defs[expression] * stack[stack.length-1]); break;
        case 'ifndef': stack.push(!defs[expression] * stack[stack.length-1]); break;
        case 'else': stack[stack.length-1] = (1-stack[stack.length-1]) * stack[stack.length-2]; break;
        case 'endif': stack.pop(); break;
        case 'define':
          if (thisLineIsInActivePreprocessingBlock) {
            // This could either be a macro with input args (#define MACRO(x,y) x+y), or a direct expansion #define FOO 2,
            // figure out which.
            var macroStart = expression.indexOf('(');
            var firstWs = nextWhitespace(expression, 0);
            if (firstWs < macroStart) macroStart = 0;
            if (macroStart > 0) { // #define MACRO( x , y , z ) <statement of x,y and z>
              var macroEnd = expression.indexOf(')', macroStart);
              let params = expression.substring(macroStart+1, macroEnd).split(',').map(x => x.trim());
              let value = tokenize(expression.substring(macroEnd+1).trim())
              defs[expression.substring(0, macroStart)] = (args) => {
                var ret = '';
                value.forEach((x) => {
                  var argIndex = params.indexOf(x);
                  ret += (argIndex >= 0) ? args[argIndex] : x;
                });
                return ret;
              };
            } else { // #define FOO (x + y + z)
              let value = expandMacros(expression.substring(firstWs+1).trim(), 0);
              defs[expression.substring(0, firstWs)] = () => value;
            }
          }
          break;
        case 'undef': if (thisLineIsInActivePreprocessingBlock) delete defs[expression]; break;
        default:
          if (directive != 'version' && directive != 'pragma' && directive != 'extension' && directive != 'line') { // GLSL shader compiler specific #directives.
            err('Unrecognized preprocessor directive #' + directive + '!');
          }
  
          // Unknown preprocessor macro, just pass through the line to output.
          out += expandMacros(code, lineStart, i) + '\n';
        }
      }
      return out;
    }
  
  var remove_cpp_comments_in_shaders = (code) => {
      var i = 0, out = '', ch, next, len = code.length;
      for (; i < len; ++i) {
        ch = code[i];
        if (ch == '/') {
          next = code[i+1];
          if (next == '/') {
            while (i < len && code[i+1] != '\n') ++i;
          } else if (next == '*') {
            while (i < len && (code[i-1] != '*' || code[i] != '/')) ++i;
          } else {
            out += ch;
          }
        } else {
          out += ch;
        }
      }
      return out;
    };
  
  
  
  var _emscripten_glShaderSource = (shader, count, string, length) => {
      var source = GL.getSource(shader, count, string, length);
  
      // These are not expected to be meaningful in WebGL, but issue a warning if
      // they are present, to give some diagnostics about if they are present.
      if (source.includes('__FILE__')) warnOnce(`When compiling shader: ${source}: Preprocessor variable __FILE__ is not handled by -sGL_EXPLICIT_UNIFORM_LOCATION/-sGL_EXPLICIT_UNIFORM_BINDING options!`);
      if (source.includes('__LINE__')) warnOnce(`When compiling shader: ${source}: Preprocessor variable __LINE__ is not handled by -sGL_EXPLICIT_UNIFORM_LOCATION/-sGL_EXPLICIT_UNIFORM_BINDING options!`);
      // Remove comments and C-preprocess the input shader first, so that we can
      // appropriately parse the layout location directives.
      source = preprocess_c_code(remove_cpp_comments_in_shaders(source), {
        'GL_FRAGMENT_PRECISION_HIGH': () => 1,
        'GL_ES': () => 1,
        '__VERSION__': () => source.includes('#version 300') ? 300 : 100
      });
  
      // Extract the layout(location = x) directives.
      var regex = /layout\s*\(\s*location\s*=\s*(-?\d+)\s*\)\s*(uniform\s+((lowp|mediump|highp)\s+)?\w+\s+(\w+))/g, explicitUniformLocations = {}, match;
      while (match = regex.exec(source)) {
        explicitUniformLocations[match[5]] = Number(match[1]);
        if (!(explicitUniformLocations[match[5]] >= 0 && explicitUniformLocations[match[5]] < 1048576)) {
          err(`Specified an out of range layout(location=x) directive "${explicitUniformLocations[match[5]]}"! (${match[0]})`);
          GL.recordError(0x501 /* GL_INVALID_VALUE */);
          return;
        }
      }
  
      // Remove all the layout(location = x) directives so that they do not make
      // their way to the actual WebGL shader compiler.
      source = source.replace(regex, '$2');
  
      // Remember all the directives to be handled after glLinkProgram is called.
      GL.shaders[shader].explicitUniformLocations = explicitUniformLocations;
  
      // Extract the layout(binding = x) directives. Four types we need to handle:
      // layout(binding = 3) uniform sampler2D mainTexture;
      // layout(binding = 1, std140) uniform MainBlock { ... };
      // layout(std140, binding = 1) uniform MainBlock { ... };
      // layout(binding = 1) uniform MainBlock { ... };
      var bindingRegex = /layout\s*\(.*?binding\s*=\s*(-?\d+).*?\)\s*uniform\s+(\w+)\s+(\w+)?/g, samplerBindings = {}, uniformBindings = {}, bindingMatch;
      while (bindingMatch = bindingRegex.exec(source)) {
        // We have a layout(binding=x) enabled uniform. Parse the array length of
        // that uniform, if it is an array, i.e. a
        //    layout(binding = 3) uniform sampler2D mainTexture[arrayLength];
        // or
        //    layout(binding = 1, std140) uniform MainBlock { ... } name[arrayLength];
        var arrayLength = 1;
        for (var i = bindingMatch.index; i < source.length && source[i] != ';'; ++i) {
          if (source[i] == '[') {
            arrayLength = jstoi_q(source.slice(i+1));
            break;
          }
          if (source[i] == '{') i = find_closing_parens_index(source, i, '{', '}') - 1;
        }
        var binding = jstoi_q(bindingMatch[1]);
        var bindingsType = 0x8872/*GL_MAX_TEXTURE_IMAGE_UNITS*/;
        if (bindingMatch[3] && bindingMatch[2].indexOf('sampler') != -1) {
          samplerBindings[bindingMatch[3]] = [binding, arrayLength];
        } else {
          bindingsType = 0x8A2E/*GL_MAX_COMBINED_UNIFORM_BLOCKS*/;
          uniformBindings[bindingMatch[2]] = [binding, arrayLength];
        }
        var numBindingPoints = GLctx.getParameter(bindingsType);
        if (!(binding >= 0 && binding + arrayLength <= numBindingPoints)) {
          err(`Specified an out of range layout(binding=x) directive "${binding}"! (${bindingMatch[0]}). Valid range is [0, ${numBindingPoints}-1]`);
          GL.recordError(0x501 /* GL_INVALID_VALUE */);
          return;
        }
      }
  
      // Remove all the layout(binding = x) directives so that they do not make
      // their way to the actual WebGL shader compiler. These regexes get quite
      // hairy, check against https://regex101.com/ when working on these.
      source = source.replace(/layout\s*\(.*?binding\s*=\s*([-\d]+).*?\)/g, ''); // "layout(binding = 3)" -> ""
      source = source.replace(/(layout\s*\((.*?)),\s*binding\s*=\s*([-\d]+)\)/g, '$1)'); // "layout(std140, binding = 1)" -> "layout(std140)"
      source = source.replace(/layout\s*\(\s*binding\s*=\s*([-\d]+)\s*,(.*?)\)/g, 'layout($2)'); // "layout(binding = 1, std140)" -> "layout(std140)"
  
      // Remember all the directives to be handled after glLinkProgram is called.
      GL.shaders[shader].explicitSamplerBindings = samplerBindings;
      GL.shaders[shader].explicitUniformBindings = uniformBindings;
  
      GLctx.shaderSource(GL.shaders[shader], source);
    };
  var _glShaderSource = _emscripten_glShaderSource;

  var _emscripten_glStencilFuncSeparate = (x0, x1, x2, x3) => GLctx.stencilFuncSeparate(x0, x1, x2, x3);
  var _glStencilFuncSeparate = _emscripten_glStencilFuncSeparate;

  var _emscripten_glStencilMask = (x0) => GLctx.stencilMask(x0);
  var _glStencilMask = _emscripten_glStencilMask;

  var _emscripten_glStencilOpSeparate = (x0, x1, x2, x3) => GLctx.stencilOpSeparate(x0, x1, x2, x3);
  var _glStencilOpSeparate = _emscripten_glStencilOpSeparate;

  var computeUnpackAlignedImageSize = (width, height, sizePerPixel) => {
      function roundedToNextMultipleOf(x, y) {
        return (x + y - 1) & -y;
      }
      var plainRowSize = (GL.unpackRowLength || width) * sizePerPixel;
      var alignedRowSize = roundedToNextMultipleOf(plainRowSize, GL.unpackAlignment);
      return height * alignedRowSize;
    };
  
  var colorChannelsInGlTextureFormat = (format) => {
      // Micro-optimizations for size: map format to size by subtracting smallest
      // enum value (0x1902) from all values first.  Also omit the most common
      // size value (1) from the list, which is assumed by formats not on the
      // list.
      var colorChannels = {
        // 0x1902 /* GL_DEPTH_COMPONENT */ - 0x1902: 1,
        // 0x1906 /* GL_ALPHA */ - 0x1902: 1,
        5: 3,
        6: 4,
        // 0x1909 /* GL_LUMINANCE */ - 0x1902: 1,
        8: 2,
        29502: 3,
        29504: 4,
        // 0x1903 /* GL_RED */ - 0x1902: 1,
        26917: 2,
        26918: 2,
        // 0x8D94 /* GL_RED_INTEGER */ - 0x1902: 1,
        29846: 3,
        29847: 4
      };
      return colorChannels[format - 0x1902]||1;
    };
  
  var heapObjectForWebGLType = (type) => {
      // Micro-optimization for size: Subtract lowest GL enum number (0x1400/* GL_BYTE */) from type to compare
      // smaller values for the heap, for shorter generated code size.
      // Also the type HEAPU16 is not tested for explicitly, but any unrecognized type will return out HEAPU16.
      // (since most types are HEAPU16)
      type -= 0x1400;
      if (type == 0) return HEAP8;
  
      if (type == 1) return HEAPU8;
  
      if (type == 2) return HEAP16;
  
      if (type == 4) return HEAP32;
  
      if (type == 6) return HEAPF32;
  
      if (type == 5
        || type == 28922
        || type == 28520
        || type == 30779
        || type == 30782
        )
        return HEAPU32;
  
      return HEAPU16;
    };
  
  var toTypedArrayIndex = (pointer, heap) =>
      pointer >>> (31 - Math.clz32(heap.BYTES_PER_ELEMENT));
  
  var emscriptenWebGLGetTexPixelData = (type, format, width, height, pixels, internalFormat) => {
      var heap = heapObjectForWebGLType(type);
      var sizePerPixel = colorChannelsInGlTextureFormat(format) * heap.BYTES_PER_ELEMENT;
      var bytes = computeUnpackAlignedImageSize(width, height, sizePerPixel);
      return heap.subarray(toTypedArrayIndex(pixels, heap), toTypedArrayIndex(pixels + bytes, heap));
    };
  
  
  
  var _emscripten_glTexImage2D = (target, level, internalFormat, width, height, border, format, type, pixels) => {
      if (GL.currentContext.version >= 2) {
        if (GLctx.currentPixelUnpackBufferBinding) {
          GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels);
          return;
        }
        if (pixels) {
          var heap = heapObjectForWebGLType(type);
          var index = toTypedArrayIndex(pixels, heap);
          GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, heap, index);
          return;
        }
      }
      var pixelData = pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) : null;
      GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixelData);
    };
  var _glTexImage2D = _emscripten_glTexImage2D;

  
  var _emscripten_glTexImage3D = (target, level, internalFormat, width, height, depth, border, format, type, pixels) => {
      if (GLctx.currentPixelUnpackBufferBinding) {
        GLctx.texImage3D(target, level, internalFormat, width, height, depth, border, format, type, pixels);
      } else if (pixels) {
        var heap = heapObjectForWebGLType(type);
        GLctx.texImage3D(target, level, internalFormat, width, height, depth, border, format, type, heap, toTypedArrayIndex(pixels, heap));
      } else {
        GLctx.texImage3D(target, level, internalFormat, width, height, depth, border, format, type, null);
      }
    };
  var _glTexImage3D = _emscripten_glTexImage3D;

  var _emscripten_glTexParameterf = (x0, x1, x2) => GLctx.texParameterf(x0, x1, x2);
  var _glTexParameterf = _emscripten_glTexParameterf;

  var _emscripten_glTexParameteri = (x0, x1, x2) => GLctx.texParameteri(x0, x1, x2);
  var _glTexParameteri = _emscripten_glTexParameteri;

  var _emscripten_glTexParameteriv = (target, pname, params) => {
      var param = HEAP32[((params)>>2)];
      GLctx.texParameteri(target, pname, param);
    };
  var _glTexParameteriv = _emscripten_glTexParameteriv;

  var _emscripten_glTexStorage2D = (x0, x1, x2, x3, x4) => GLctx.texStorage2D(x0, x1, x2, x3, x4);
  var _glTexStorage2D = _emscripten_glTexStorage2D;

  var _emscripten_glTexStorage3D = (x0, x1, x2, x3, x4, x5) => GLctx.texStorage3D(x0, x1, x2, x3, x4, x5);
  var _glTexStorage3D = _emscripten_glTexStorage3D;

  
  
  
  var _emscripten_glTexSubImage2D = (target, level, xoffset, yoffset, width, height, format, type, pixels) => {
      if (GL.currentContext.version >= 2) {
        if (GLctx.currentPixelUnpackBufferBinding) {
          GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels);
          return;
        }
        if (pixels) {
          var heap = heapObjectForWebGLType(type);
          GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, heap, toTypedArrayIndex(pixels, heap));
          return;
        }
      }
      var pixelData = pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, 0) : null;
      GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixelData);
    };
  var _glTexSubImage2D = _emscripten_glTexSubImage2D;

  
  var _glTexSubImage3D = (target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, pixels) => {
          if (GLctx.currentPixelUnpackBufferBinding) {
              GLctx.texSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, pixels);
          } else if (pixels) {
              const heap = heapObjectForWebGLType(type);
              GLctx.texSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, heap, toTypedArrayIndex(pixels, heap));
          } else {
              GLctx.texSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, null);
          }
      };

  
  var miniTempWebGLFloatBuffers = [];
  
  var _emscripten_glUniform1fv = (location, count, value) => {
  
      if (GL.currentContext.version >= 2) {
        count && GLctx.uniform1fv(webglGetUniformLocation(location), HEAPF32, ((value)>>2), count);
        return;
      }
  
      if (count <= 288) {
        // avoid allocation when uploading few enough uniforms
        var view = miniTempWebGLFloatBuffers[count];
        for (var i = 0; i < count; ++i) {
          view[i] = HEAPF32[(((value)+(4*i))>>2)];
        }
      } else
      {
        var view = HEAPF32.subarray((((value)>>2)), ((value+count*4)>>2));
      }
      GLctx.uniform1fv(webglGetUniformLocation(location), view);
    };
  var _glUniform1fv = _emscripten_glUniform1fv;

  
  var _emscripten_glUniform1i = (location, v0) => {
      GLctx.uniform1i(webglGetUniformLocation(location), v0);
    };
  var _glUniform1i = _emscripten_glUniform1i;

  
  var miniTempWebGLIntBuffers = [];
  
  var _emscripten_glUniform1iv = (location, count, value) => {
  
      if (GL.currentContext.version >= 2) {
        count && GLctx.uniform1iv(webglGetUniformLocation(location), HEAP32, ((value)>>2), count);
        return;
      }
  
      if (count <= 288) {
        // avoid allocation when uploading few enough uniforms
        var view = miniTempWebGLIntBuffers[count];
        for (var i = 0; i < count; ++i) {
          view[i] = HEAP32[(((value)+(4*i))>>2)];
        }
      } else
      {
        var view = HEAP32.subarray((((value)>>2)), ((value+count*4)>>2));
      }
      GLctx.uniform1iv(webglGetUniformLocation(location), view);
    };
  var _glUniform1iv = _emscripten_glUniform1iv;

  var _emscripten_glUniform1uiv = (location, count, value) => {
      count && GLctx.uniform1uiv(webglGetUniformLocation(location), HEAPU32, ((value)>>2), count);
    };
  var _glUniform1uiv = _emscripten_glUniform1uiv;

  
  
  var _emscripten_glUniform2fv = (location, count, value) => {
  
      if (GL.currentContext.version >= 2) {
        count && GLctx.uniform2fv(webglGetUniformLocation(location), HEAPF32, ((value)>>2), count*2);
        return;
      }
  
      if (count <= 144) {
        // avoid allocation when uploading few enough uniforms
        count *= 2;
        var view = miniTempWebGLFloatBuffers[count];
        for (var i = 0; i < count; i += 2) {
          view[i] = HEAPF32[(((value)+(4*i))>>2)];
          view[i+1] = HEAPF32[(((value)+(4*i+4))>>2)];
        }
      } else
      {
        var view = HEAPF32.subarray((((value)>>2)), ((value+count*8)>>2));
      }
      GLctx.uniform2fv(webglGetUniformLocation(location), view);
    };
  var _glUniform2fv = _emscripten_glUniform2fv;

  
  
  var _emscripten_glUniform2iv = (location, count, value) => {
  
      if (GL.currentContext.version >= 2) {
        count && GLctx.uniform2iv(webglGetUniformLocation(location), HEAP32, ((value)>>2), count*2);
        return;
      }
  
      if (count <= 144) {
        // avoid allocation when uploading few enough uniforms
        count *= 2;
        var view = miniTempWebGLIntBuffers[count];
        for (var i = 0; i < count; i += 2) {
          view[i] = HEAP32[(((value)+(4*i))>>2)];
          view[i+1] = HEAP32[(((value)+(4*i+4))>>2)];
        }
      } else
      {
        var view = HEAP32.subarray((((value)>>2)), ((value+count*8)>>2));
      }
      GLctx.uniform2iv(webglGetUniformLocation(location), view);
    };
  var _glUniform2iv = _emscripten_glUniform2iv;

  var _emscripten_glUniform2uiv = (location, count, value) => {
      count && GLctx.uniform2uiv(webglGetUniformLocation(location), HEAPU32, ((value)>>2), count*2);
    };
  var _glUniform2uiv = _emscripten_glUniform2uiv;

  
  
  var _emscripten_glUniform3fv = (location, count, value) => {
  
      if (GL.currentContext.version >= 2) {
        count && GLctx.uniform3fv(webglGetUniformLocation(location), HEAPF32, ((value)>>2), count*3);
        return;
      }
  
      if (count <= 96) {
        // avoid allocation when uploading few enough uniforms
        count *= 3;
        var view = miniTempWebGLFloatBuffers[count];
        for (var i = 0; i < count; i += 3) {
          view[i] = HEAPF32[(((value)+(4*i))>>2)];
          view[i+1] = HEAPF32[(((value)+(4*i+4))>>2)];
          view[i+2] = HEAPF32[(((value)+(4*i+8))>>2)];
        }
      } else
      {
        var view = HEAPF32.subarray((((value)>>2)), ((value+count*12)>>2));
      }
      GLctx.uniform3fv(webglGetUniformLocation(location), view);
    };
  var _glUniform3fv = _emscripten_glUniform3fv;

  
  
  var _emscripten_glUniform3iv = (location, count, value) => {
  
      if (GL.currentContext.version >= 2) {
        count && GLctx.uniform3iv(webglGetUniformLocation(location), HEAP32, ((value)>>2), count*3);
        return;
      }
  
      if (count <= 96) {
        // avoid allocation when uploading few enough uniforms
        count *= 3;
        var view = miniTempWebGLIntBuffers[count];
        for (var i = 0; i < count; i += 3) {
          view[i] = HEAP32[(((value)+(4*i))>>2)];
          view[i+1] = HEAP32[(((value)+(4*i+4))>>2)];
          view[i+2] = HEAP32[(((value)+(4*i+8))>>2)];
        }
      } else
      {
        var view = HEAP32.subarray((((value)>>2)), ((value+count*12)>>2));
      }
      GLctx.uniform3iv(webglGetUniformLocation(location), view);
    };
  var _glUniform3iv = _emscripten_glUniform3iv;

  var _emscripten_glUniform3uiv = (location, count, value) => {
      count && GLctx.uniform3uiv(webglGetUniformLocation(location), HEAPU32, ((value)>>2), count*3);
    };
  var _glUniform3uiv = _emscripten_glUniform3uiv;

  
  
  var _emscripten_glUniform4fv = (location, count, value) => {
  
      if (GL.currentContext.version >= 2) {
        count && GLctx.uniform4fv(webglGetUniformLocation(location), HEAPF32, ((value)>>2), count*4);
        return;
      }
  
      if (count <= 72) {
        // avoid allocation when uploading few enough uniforms
        var view = miniTempWebGLFloatBuffers[4*count];
        // hoist the heap out of the loop for size and for pthreads+growth.
        var heap = HEAPF32;
        value = ((value)>>2);
        count *= 4;
        for (var i = 0; i < count; i += 4) {
          var dst = value + i;
          view[i] = heap[dst];
          view[i + 1] = heap[dst + 1];
          view[i + 2] = heap[dst + 2];
          view[i + 3] = heap[dst + 3];
        }
      } else
      {
        var view = HEAPF32.subarray((((value)>>2)), ((value+count*16)>>2));
      }
      GLctx.uniform4fv(webglGetUniformLocation(location), view);
    };
  var _glUniform4fv = _emscripten_glUniform4fv;

  
  
  var _emscripten_glUniform4iv = (location, count, value) => {
  
      if (GL.currentContext.version >= 2) {
        count && GLctx.uniform4iv(webglGetUniformLocation(location), HEAP32, ((value)>>2), count*4);
        return;
      }
  
      if (count <= 72) {
        // avoid allocation when uploading few enough uniforms
        count *= 4;
        var view = miniTempWebGLIntBuffers[count];
        for (var i = 0; i < count; i += 4) {
          view[i] = HEAP32[(((value)+(4*i))>>2)];
          view[i+1] = HEAP32[(((value)+(4*i+4))>>2)];
          view[i+2] = HEAP32[(((value)+(4*i+8))>>2)];
          view[i+3] = HEAP32[(((value)+(4*i+12))>>2)];
        }
      } else
      {
        var view = HEAP32.subarray((((value)>>2)), ((value+count*16)>>2));
      }
      GLctx.uniform4iv(webglGetUniformLocation(location), view);
    };
  var _glUniform4iv = _emscripten_glUniform4iv;

  var _emscripten_glUniform4uiv = (location, count, value) => {
      count && GLctx.uniform4uiv(webglGetUniformLocation(location), HEAPU32, ((value)>>2), count*4);
    };
  var _glUniform4uiv = _emscripten_glUniform4uiv;

  var _emscripten_glUniformBlockBinding = (program, uniformBlockIndex, uniformBlockBinding) => {
      program = GL.programs[program];
  
      GLctx.uniformBlockBinding(program, uniformBlockIndex, uniformBlockBinding);
    };
  var _glUniformBlockBinding = _emscripten_glUniformBlockBinding;

  
  
  var _emscripten_glUniformMatrix3fv = (location, count, transpose, value) => {
  
      if (GL.currentContext.version >= 2) {
        count && GLctx.uniformMatrix3fv(webglGetUniformLocation(location), !!transpose, HEAPF32, ((value)>>2), count*9);
        return;
      }
  
      if (count <= 32) {
        // avoid allocation when uploading few enough uniforms
        count *= 9;
        var view = miniTempWebGLFloatBuffers[count];
        for (var i = 0; i < count; i += 9) {
          view[i] = HEAPF32[(((value)+(4*i))>>2)];
          view[i+1] = HEAPF32[(((value)+(4*i+4))>>2)];
          view[i+2] = HEAPF32[(((value)+(4*i+8))>>2)];
          view[i+3] = HEAPF32[(((value)+(4*i+12))>>2)];
          view[i+4] = HEAPF32[(((value)+(4*i+16))>>2)];
          view[i+5] = HEAPF32[(((value)+(4*i+20))>>2)];
          view[i+6] = HEAPF32[(((value)+(4*i+24))>>2)];
          view[i+7] = HEAPF32[(((value)+(4*i+28))>>2)];
          view[i+8] = HEAPF32[(((value)+(4*i+32))>>2)];
        }
      } else
      {
        var view = HEAPF32.subarray((((value)>>2)), ((value+count*36)>>2));
      }
      GLctx.uniformMatrix3fv(webglGetUniformLocation(location), !!transpose, view);
    };
  var _glUniformMatrix3fv = _emscripten_glUniformMatrix3fv;

  
  
  var _emscripten_glUniformMatrix4fv = (location, count, transpose, value) => {
  
      if (GL.currentContext.version >= 2) {
        count && GLctx.uniformMatrix4fv(webglGetUniformLocation(location), !!transpose, HEAPF32, ((value)>>2), count*16);
        return;
      }
  
      if (count <= 18) {
        // avoid allocation when uploading few enough uniforms
        var view = miniTempWebGLFloatBuffers[16*count];
        // hoist the heap out of the loop for size and for pthreads+growth.
        var heap = HEAPF32;
        value = ((value)>>2);
        count *= 16;
        for (var i = 0; i < count; i += 16) {
          var dst = value + i;
          view[i] = heap[dst];
          view[i + 1] = heap[dst + 1];
          view[i + 2] = heap[dst + 2];
          view[i + 3] = heap[dst + 3];
          view[i + 4] = heap[dst + 4];
          view[i + 5] = heap[dst + 5];
          view[i + 6] = heap[dst + 6];
          view[i + 7] = heap[dst + 7];
          view[i + 8] = heap[dst + 8];
          view[i + 9] = heap[dst + 9];
          view[i + 10] = heap[dst + 10];
          view[i + 11] = heap[dst + 11];
          view[i + 12] = heap[dst + 12];
          view[i + 13] = heap[dst + 13];
          view[i + 14] = heap[dst + 14];
          view[i + 15] = heap[dst + 15];
        }
      } else
      {
        var view = HEAPF32.subarray((((value)>>2)), ((value+count*64)>>2));
      }
      GLctx.uniformMatrix4fv(webglGetUniformLocation(location), !!transpose, view);
    };
  var _glUniformMatrix4fv = _emscripten_glUniformMatrix4fv;

  
  
  
  var _emscripten_glUnmapBuffer = (target) => {
      if (!emscriptenWebGLValidateMapBufferTarget(target)) {
        GL.recordError(0x500/*GL_INVALID_ENUM*/);
        err('GL_INVALID_ENUM in glUnmapBuffer');
        return 0;
      }
  
      var buffer = emscriptenWebGLGetBufferBinding(target);
      var mapping = GL.mappedBuffers[buffer];
      if (!mapping || !mapping.mem) {
        GL.recordError(0x502 /* GL_INVALID_OPERATION */);
        err('buffer was never mapped in glUnmapBuffer');
        return 0;
      }
  
      if (!(mapping.access & 0x10)) { /* GL_MAP_FLUSH_EXPLICIT_BIT */
        if (GL.currentContext.version >= 2) {
          GLctx.bufferSubData(target, mapping.offset, HEAPU8, mapping.mem, mapping.length);
        } else
        GLctx.bufferSubData(target, mapping.offset, HEAPU8.subarray(mapping.mem, mapping.mem+mapping.length));
      }
      _free(mapping.mem);
      mapping.mem = 0;
      return 1;
    };
  var _glUnmapBuffer = _emscripten_glUnmapBuffer;

  var webglApplyExplicitProgramBindings = () => {
      var p = GLctx.currentProgram;
      if (!p.explicitProgramBindingsApplied) {
        if (GL.currentContext.version >= 2) {
          for (var [ubo, bindings] of Object.entries(p.explicitUniformBindings)) {
            for (var i = 0; i < bindings[1]; ++i) {
              var blockIndex = GLctx.getUniformBlockIndex(p, ubo + (bindings[1] > 1 ? `[${i}]` : ''));
              GLctx.uniformBlockBinding(p, blockIndex, bindings[0]+i);
            }
          }
        }
        for (var [sampler, bindings] of Object.entries(p.explicitSamplerBindings)) {
          for (var i = 0; i < bindings[1]; ++i) {
            GLctx.uniform1i(GLctx.getUniformLocation(p, sampler + (i ? `[${i}]` : '')), bindings[0]+i);
          }
        }
        p.explicitProgramBindingsApplied = 1;
      }
    };
  
  var _emscripten_glUseProgram = (program) => {
      program = GL.programs[program];
      GLctx.useProgram(program);
      // Record the currently active program so that we can access the uniform
      // mapping table of that program.
      if ((GLctx.currentProgram = program)) {
        webglApplyExplicitProgramBindings();
      }
    };
  var _glUseProgram = _emscripten_glUseProgram;

  var _emscripten_glValidateProgram = (program) => {
      GLctx.validateProgram(GL.programs[program]);
    };
  var _glValidateProgram = _emscripten_glValidateProgram;

  var _emscripten_glVertexAttrib4f = (x0, x1, x2, x3, x4) => GLctx.vertexAttrib4f(x0, x1, x2, x3, x4);
  var _glVertexAttrib4f = _emscripten_glVertexAttrib4f;

  var _emscripten_glVertexAttrib4fv = (index, v) => {
  
      GLctx.vertexAttrib4f(index, HEAPF32[v>>2], HEAPF32[v+4>>2], HEAPF32[v+8>>2], HEAPF32[v+12>>2]);
    };
  var _glVertexAttrib4fv = _emscripten_glVertexAttrib4fv;

  var _emscripten_glVertexAttribIPointer = (index, size, type, stride, ptr) => {
      var cb = GL.currentContext.clientBuffers[index];
      if (!GLctx.currentArrayBufferBinding) {
        cb.size = size;
        cb.type = type;
        cb.normalized = false;
        cb.stride = stride;
        cb.ptr = ptr;
        cb.clientside = true;
        cb.vertexAttribPointerAdaptor = function(index, size, type, normalized, stride, ptr) {
          this.vertexAttribIPointer(index, size, type, stride, ptr);
        };
        return;
      }
      cb.clientside = false;
      GLctx.vertexAttribIPointer(index, size, type, stride, ptr);
    };
  var _glVertexAttribIPointer = _emscripten_glVertexAttribIPointer;

  var _emscripten_glVertexAttribPointer = (index, size, type, normalized, stride, ptr) => {
      var cb = GL.currentContext.clientBuffers[index];
      if (!GLctx.currentArrayBufferBinding) {
        cb.size = size;
        cb.type = type;
        cb.normalized = normalized;
        cb.stride = stride;
        cb.ptr = ptr;
        cb.clientside = true;
        cb.vertexAttribPointerAdaptor = function(index, size, type, normalized, stride, ptr) {
          this.vertexAttribPointer(index, size, type, normalized, stride, ptr);
        };
        return;
      }
      cb.clientside = false;
      GLctx.vertexAttribPointer(index, size, type, !!normalized, stride, ptr);
    };
  var _glVertexAttribPointer = _emscripten_glVertexAttribPointer;

  var _emscripten_glViewport = (x0, x1, x2, x3) => GLctx.viewport(x0, x1, x2, x3);
  var _glViewport = _emscripten_glViewport;

  var _llvm_eh_typeid_for = (type) => type;

  var GPUTextureAndVertexFormats = [,"r8unorm","r8snorm","r8uint","r8sint","r16unorm","r16snorm","r16uint","r16sint","r16float","rg8unorm","rg8snorm","rg8uint","rg8sint","r32uint","r32sint","r32float","rg16unorm","rg16snorm","rg16uint","rg16sint","rg16float","rgba8unorm","rgba8unorm-srgb","rgba8snorm","rgba8uint","rgba8sint","bgra8unorm","bgra8unorm-srgb","rgb9e5ufloat","rgb10a2uint","rgb10a2unorm","rg11b10ufloat","rg32uint","rg32sint","rg32float","rgba16unorm","rgba16snorm","rgba16uint","rgba16sint","rgba16float","rgba32uint","rgba32sint","rgba32float","stencil8","depth16unorm","depth24plus","depth24plus-stencil8","depth32float","depth32float-stencil8","bc1-rgba-unorm","bc1-rgba-unorm-srgb","bc2-rgba-unorm","bc2-rgba-unorm-srgb","bc3-rgba-unorm","bc3-rgba-unorm-srgb","bc4-r-unorm","bc4-r-snorm","bc5-rg-unorm","bc5-rg-snorm","bc6h-rgb-ufloat","bc6h-rgb-float","bc7-rgba-unorm","bc7-rgba-unorm-srgb","etc2-rgb8unorm","etc2-rgb8unorm-srgb","etc2-rgb8a1unorm","etc2-rgb8a1unorm-srgb","etc2-rgba8unorm","etc2-rgba8unorm-srgb","eac-r11unorm","eac-r11snorm","eac-rg11unorm","eac-rg11snorm","astc-4x4-unorm","astc-4x4-unorm-srgb","astc-5x4-unorm","astc-5x4-unorm-srgb","astc-5x5-unorm","astc-5x5-unorm-srgb","astc-6x5-unorm","astc-6x5-unorm-srgb","astc-6x6-unorm","astc-6x6-unorm-srgb","astc-8x5-unorm","astc-8x5-unorm-srgb","astc-8x6-unorm","astc-8x6-unorm-srgb","astc-8x8-unorm","astc-8x8-unorm-srgb","astc-10x5-unorm","astc-10x5-unorm-srgb","astc-10x6-unorm","astc-10x6-unorm-srgb","astc-10x8-unorm","astc-10x8-unorm-srgb","astc-10x10-unorm","astc-10x10-unorm-srgb","astc-12x10-unorm","astc-12x10-unorm-srgb","astc-12x12-unorm","astc-12x12-unorm-srgb","uint8","uint8x2","uint8x4","sint8","sint8x2","sint8x4","unorm8","unorm8x2","unorm8x4","snorm8","snorm8x2","snorm8x4","uint16","uint16x2","uint16x4","sint16","sint16x2","sint16x4","unorm16","unorm16x2","unorm16x4","snorm16","snorm16x2","snorm16x4","float16","float16x2","float16x4","float32","float32x2","float32x3","float32x4","uint32","uint32x2","uint32x3","uint32x4","sint32","sint32x2","sint32x3","sint32x4","unorm10-10-10-2","unorm8x4-bgra"];
  function _navigator_gpu_get_preferred_canvas_format() {
      
      assert(navigator["gpu"], "Your browser does not support WebGPU!", "assert(navigator['gpu'], 'Your browser does not support WebGPU!') failed!");
  
      assert(GPUTextureAndVertexFormats.includes(navigator["gpu"]["getPreferredCanvasFormat"]()), "assert(GPUTextureAndVertexFormats.includes(navigator['gpu']['getPreferredCanvasFormat']())) failed!");
      return GPUTextureAndVertexFormats.indexOf(navigator['gpu']['getPreferredCanvasFormat']());
    }

  
  var wgpuIdCounter = 2;
  function wgpuStore(object) {
      if (object) {
        // WebGPU renderer usage can burn through a lot of object IDs each rendered frame
        // (a number of GPUCommandEncoder, GPUTexture, GPUTextureView, GPURenderPassEncoder,
        // GPUCommandBuffer objects are created each application frame)
        // If we assume an upper bound of 1000 object IDs created per rendered frame, and a
        // new mobile device with 120hz display, a signed int32 state space is exhausted in
        // 2147483646 / 1000 / 120 / 60 / 60 = 4.97 hours, which is realistic for a page to
        // stay open for that long. Therefore handle wraparound of the ID counter generation,
        // and find free gaps in the object IDs for new objects.
        while(wgpu[wgpuIdCounter]) wgpuIdCounter = wgpuIdCounter < 2147483647 ? wgpuIdCounter + 1 : 2;
  
        wgpu[wgpuIdCounter] = object;
  
        // Each persisted objects gets a custom 'wid' field (wasm ID) which stores the ID that
        // this object is known by on Wasm side.
        object.wid = wgpuIdCounter;
  
        ;
  
        return wgpuIdCounter++;
      }
      // Implicit return undefined to marshal ID 0 over to Wasm.
    }
  
  var _wgpuMuteJsExceptions = function(fn) {
      return (p) => { // only support one argument to function fn (we could do ...params, but we only ever need one arg so that's fine)
        try {
          return fn(p);
        } catch(e) {
          
        }
      }
    };
  
  function wgpuReadAdapterOptions(options) {
      return options ? {
        'featureLevel': [, 'compatibility'][HEAPU32[options]], // 'core' is omitted intentionally, since the spec says it is the default value.
        'powerPreference': [, 'low-power', 'high-performance'][HEAPU32[options+1]],
        'forceFallbackAdapter': !!HEAPU32[options+2],
        'xrCompatible': !!HEAPU32[options+3]
      } : {};
    }
  /** @suppress{checkTypes} */
  var _navigator_gpu_request_adapter_async = function(options, adapterCallback, userData) {
      
      assert(adapterCallback, "must pass a callback function to navigator_gpu_request_adapter_async!", "assert(adapterCallback, 'must pass a callback function to navigator_gpu_request_adapter_async!') failed!");
      assert(navigator["gpu"], "Your browser does not support WebGPU!", "assert(navigator['gpu'], 'Your browser does not support WebGPU!') failed!");
      assert(options != 0, "assert(options != 0) failed!");
  
      assert(options % 4 == 0, 'Unaligned pointer fault!');
  options >>= 2;
  
      let gpu = navigator['gpu'], opts = wgpuReadAdapterOptions(options);
  
      if (gpu) {
        
        let cb = adapter => {
          
          ((a1, a2) => dynCall_vii(adapterCallback, a1, a2))(wgpuStore(adapter), userData);
        };
        gpu['requestAdapter'](opts)
          .then(_wgpuMuteJsExceptions(cb))
          .catch(
          (e)=>{console.error(`navigator.gpu.requestAdapter() Promise rejected: ${e}`); cb(/*intentionally omit arg to pass undefined*/)}
        );
        return 1/*WGPU_TRUE*/;
      }
      
      // Implicit return WGPU_FALSE, WebGPU is not supported.
    };

  var _wgpuFeatures = ["core-features-and-limits","depth-clip-control","depth32float-stencil8","texture-compression-bc","texture-compression-bc-sliced-3d","texture-compression-etc2","texture-compression-astc","texture-compression-astc-sliced-3d","timestamp-query","indirect-first-instance","shader-f16","rg11b10ufloat-renderable","bgra8unorm-storage","float32-filterable","float32-blendable","clip-distances","dual-source-blending","subgroups","texture-formats-tier1","texture-formats-tier2","primitive-index","texture-component-swizzle"];
  var _wgpu_adapter_or_device_get_features = function(adapterOrDevice) {
      
      assert(adapterOrDevice != 0, "assert(adapterOrDevice != 0) failed!");
      assert(wgpu[adapterOrDevice], "assert(wgpu[adapterOrDevice]) failed!");
      assert(wgpu[adapterOrDevice] instanceof GPUAdapter || wgpu[adapterOrDevice] instanceof GPUDevice, "assert(wgpu[adapterOrDevice] instanceof GPUAdapter || wgpu[adapterOrDevice] instanceof GPUDevice) failed!");
      let featuresBitMask = 0;
  
      
  
      _wgpuFeatures.forEach((feature, i) => {
        if (wgpu[adapterOrDevice]['features'].has(feature)) {
          
          featuresBitMask |= 1 << i;
        }
      });
      return featuresBitMask;
    };

  var _wgpu32BitLimitNames = ["maxTextureDimension1D","maxTextureDimension2D","maxTextureDimension3D","maxTextureArrayLayers","maxBindGroups","maxBindGroupsPlusVertexBuffers","maxImmediateSize","maxBindingsPerBindGroup","maxDynamicUniformBuffersPerPipelineLayout","maxDynamicStorageBuffersPerPipelineLayout","maxSampledTexturesPerShaderStage","maxSamplersPerShaderStage","maxStorageBuffersPerShaderStage","maxStorageBuffersInVertexStage","maxStorageBuffersInFragmentStage","maxStorageTexturesPerShaderStage","maxStorageTexturesInVertexStage","maxStorageTexturesInFragmentStage","maxUniformBuffersPerShaderStage","minUniformBufferOffsetAlignment","minStorageBufferOffsetAlignment","maxVertexBuffers","maxVertexAttributes","maxVertexBufferArrayStride","maxInterStageShaderVariables","maxColorAttachments","maxColorAttachmentBytesPerSample","maxComputeWorkgroupStorageSize","maxComputeInvocationsPerWorkgroup","maxComputeWorkgroupSizeX","maxComputeWorkgroupSizeY","maxComputeWorkgroupSizeZ","maxComputeWorkgroupsPerDimension"];
  
  var _wgpu64BitLimitNames = ["maxUniformBufferBindingSize","maxStorageBufferBindingSize","maxBufferSize"];
  
  function wgpuWriteI53ToU64HeapIdx(heap32Idx, number) {
      assert(heap32Idx != 0, "assert(heap32Idx != 0) failed!");
      HEAPU32[heap32Idx] = number;
      HEAPU32[heap32Idx+1] = number / 4294967296;
    }
  function _wgpu_adapter_or_device_get_limits(adapterOrDevice, limits) {
      
      assert(limits != 0, "passed a null limits struct pointer", "assert(limits != 0, 'passed a null limits struct pointer') failed!");
      assert(adapterOrDevice != 0, "assert(adapterOrDevice != 0) failed!");
      assert(wgpu[adapterOrDevice], "assert(wgpu[adapterOrDevice]) failed!");
      assert(wgpu[adapterOrDevice] instanceof GPUAdapter || wgpu[adapterOrDevice] instanceof GPUDevice, "assert(wgpu[adapterOrDevice] instanceof GPUAdapter || wgpu[adapterOrDevice] instanceof GPUDevice) failed!");
  
      let l = wgpu[adapterOrDevice]['limits'];
  
      assert(limits % 4 == 0, 'Unaligned pointer fault!');
  limits >>= 2;
      for(let limitName of _wgpu64BitLimitNames) {
        assert(l[limitName] !== undefined, `Browser WebGPU implementation incorrect: it should advertise limit ${limitName}`, "assert(l[limitName] !== undefined, `Browser WebGPU implementation incorrect: it should advertise limit ${limitName}`) failed!");
        wgpuWriteI53ToU64HeapIdx(limits, l[limitName]);
        limits += 2;
      }
  
      for(let limitName of _wgpu32BitLimitNames) {
        HEAPU32[limits++] = l[limitName];
      }
    }

  
  function wgpuLinkParentAndChild(parent, childId, child) {
      child.parentObject = parent; // Link child->parent
  
      // WebGPU objects form an object hierarchy, and deleting an object (adapter, device, texture, etc.) will
      // destroy all child objects in the hierarchy)
      // N.b. Chrome has been observed to exhibit really poor performance (~100-1000x slower) if a {} is used
      // as an associative container here, so it is critical to use a Map(), which is observed to make
      // this function wgpuLinkParentAndChild() vanish from Chrome's performance profile traces altogether.
      (parent.derivedObjects ??= new Map()).set(childId, child); // Link parent->child
    }
  function wgpuStoreAndSetParent(object, parent) {
      if (object) {
        var objectId = wgpuStore(object);
        wgpuLinkParentAndChild(parent, objectId, object);
        return objectId;
      }
    }
  
  
  
  
  function wgpuReadI53FromU64HeapIdx(heap32Idx) {
      assert(heap32Idx != 0, "assert(heap32Idx != 0) failed!");
      return HEAPU32[heap32Idx] + HEAPU32[heap32Idx+1] * 4294967296;
    }
  function wgpuReadSupportedLimits(heap32Idx) {
      let requiredLimits = {}, v;
  
      // Assertion in lib_webgpu.h below struct WGpuSupportedLimits must match:
      assert(_wgpu64BitLimitNames.length == 3, `Internal error: Number of uint64_t limit fields is not correct.`, "assert(_wgpu64BitLimitNames.length == 3, `Internal error: Number of uint64_t limit fields is not correct.`) failed!");
      assert(_wgpu32BitLimitNames.length == 33, `Internal error: Number of uint32_t limit fields is not correct.`, "assert(_wgpu32BitLimitNames.length == 33, `Internal error: Number of uint32_t limit fields is not correct.`) failed!");
  
      // Marshal all the complex 64-bit quantities first ..
      for(let limitName of _wgpu64BitLimitNames) {
        if ((v = wgpuReadI53FromU64HeapIdx(heap32Idx))) requiredLimits[limitName] = v;
        heap32Idx += 2;
      }
  
      // .. followed by the 32-bit quantities.
      for(let limitName of _wgpu32BitLimitNames) {
        if ((v = HEAPU32[heap32Idx++])) requiredLimits[limitName] = v;
      }
      return requiredLimits;
    }
  
  function wgpuReadQueueDescriptor(heap32Idx) {
      let v = HEAPU32[heap32Idx]; return v ? { 'label': utf8(v) } : void 0;
    }
  
  var wgpuReadFeaturesBitfield = function(heap32Idx) {
      let requiredFeatures = [], v = HEAPU32[heap32Idx];
  
      assert(_wgpuFeatures.length == 22, "assert(_wgpuFeatures.length == 22) failed!"); // Do not emit _wgpuFeatures.length in code below, to micro-optimize code size. Assert here this invariant holds.
      assert(_wgpuFeatures.length <= 30, "assert(_wgpuFeatures.length <= 30) failed!"); // We can only do up to 30 distinct feature bits here with the current code.
      
      _wgpuFeatures.forEach((f, i) => { if (v & (1 << i)) requiredFeatures.push(f); });
      return requiredFeatures;
    };
  function wgpuReadDeviceDescriptor(descriptor) {
      assert(descriptor != 0, "assert(descriptor != 0) failed!");
      assert(descriptor % 4 == 0, 'Unaligned pointer fault!');
  descriptor >>= 2;
  
      return {
        'requiredLimits': wgpuReadSupportedLimits(descriptor),
        'defaultQueue': wgpuReadQueueDescriptor(descriptor+40/*sizeof(WGpuSupportedLimits)*/), // TODO: Check code size here, redundant for release builds?
        'requiredFeatures': wgpuReadFeaturesBitfield(descriptor+42/*sizeof(WGpuSupportedLimits)+sizeof(WGpuQueueDescriptor)*/)
      };
    }
  /** @suppress{checkTypes} */
  var _wgpu_adapter_request_device_async = function(adapter, descriptor, deviceCallback, userData) {
      
      assert(adapter != 0, "assert(adapter != 0) failed!");
      assert(wgpu[adapter], "assert(wgpu[adapter]) failed!");
      assert(wgpu[adapter] instanceof GPUAdapter, "assert(wgpu[adapter] instanceof GPUAdapter) failed!");
  
      adapter = wgpu[adapter];
      let cb = device => {
        // If device is non-null, initialization succeeded.
        
        // Register an ID for the queue of this newly created device (using a ?. if device initialization succeeded)
        wgpuStoreAndSetParent(device?.['queue'], device);
        ((a1, a2) => dynCall_vii(deviceCallback, a1, a2))(wgpuStoreAndSetParent(device, adapter), userData);
      };
  
      let desc = wgpuReadDeviceDescriptor(descriptor);
  
      ;
      adapter['requestDevice'](desc)
        .then(_wgpuMuteJsExceptions(cb))
        .catch(
        (e)=>{console.error(`GPUAdapter.requestDevice() Promise rejected: ${e}`); cb(/*intentionally omit arg to pass undefined*/)}
      );
    };

  function _wgpu_buffer_get_mapped_range(gpuBuffer, offset, size) {
      
      assert(gpuBuffer != 0, "assert(gpuBuffer != 0) failed!");
      assert(wgpu[gpuBuffer], "assert(wgpu[gpuBuffer]) failed!");
      assert(wgpu[gpuBuffer] instanceof GPUBuffer, "assert(wgpu[gpuBuffer] instanceof GPUBuffer) failed!");
      assert(Number.isSafeInteger(offset), "assert(Number.isSafeInteger(offset)) failed!");
      assert(offset >= 0, "assert(offset >= 0) failed!");
      assert(Number.isSafeInteger(size), "assert(Number.isSafeInteger(size)) failed!");
      assert(size >= -1, "assert(size >= -1) failed!");
  
      
      gpuBuffer = wgpu[gpuBuffer];
      try {
        gpuBuffer.mappedRanges[offset] = gpuBuffer['getMappedRange'](offset, size < 0 ? void 0 : size);
      } catch(e) {
        // E.g. if the GPU ran out of memory when creating a new buffer, this can fail. 
        
        return -1;
      }
      
      return offset;
    }

  var _wgpu_buffer_map_async = function(buffer, callback, userData, mode, offset, size) {
      
      assert(buffer != 0, "assert(buffer != 0) failed!");
      assert(wgpu[buffer], "assert(wgpu[buffer]) failed!");
      assert(wgpu[buffer] instanceof GPUBuffer, "assert(wgpu[buffer] instanceof GPUBuffer) failed!");
      assert(Number.isSafeInteger(offset), "assert(Number.isSafeInteger(offset)) failed!");
      assert(offset >= 0, "assert(offset >= 0) failed!");
      assert(Number.isSafeInteger(size), "assert(Number.isSafeInteger(size)) failed!");
      assert(size >= -1, "assert(size >= -1) failed!");
  
      // N.b. mapAsync() is broken in Firefox <= 151. https://bugzil.la/1994733
      wgpu[buffer]['mapAsync'](mode, offset, size < 0 ? void 0 : size).then(() => ((a1, a2, a3, a4, a5) => dynCall_viiidd(callback, a1, a2, a3, a4, a5))(buffer, userData, mode, offset, size));
    };

  function _wgpu_buffer_read_mapped_range(gpuBuffer, startOffset, subOffset, dst, size) {
      
      assert(gpuBuffer != 0, "assert(gpuBuffer != 0) failed!");
      assert(wgpu[gpuBuffer], "assert(wgpu[gpuBuffer]) failed!");
      assert(wgpu[gpuBuffer] instanceof GPUBuffer, "assert(wgpu[gpuBuffer] instanceof GPUBuffer) failed!");
      assert(wgpu[gpuBuffer].mappedRanges[startOffset], "assert(wgpu[gpuBuffer].mappedRanges[startOffset]) failed!");
      assert(Number.isSafeInteger(startOffset), "assert(Number.isSafeInteger(startOffset)) failed!");
      assert(startOffset >= 0, "assert(startOffset >= 0) failed!");
      assert(Number.isSafeInteger(subOffset), "assert(Number.isSafeInteger(subOffset)) failed!");
      assert(subOffset >= 0, "assert(subOffset >= 0) failed!");
      assert(Number.isSafeInteger(size), "assert(Number.isSafeInteger(size)) failed!");
      assert(size >= 0, "assert(size >= 0) failed!");
      assert(dst || size == 0, "assert(dst || size == 0) failed!");
  
      // N.b. this generates garbage because JavaScript does not allow ArrayBufferView.set(ArrayBuffer, offset, size, dst)
      // but must create a dummy view.
      HEAPU8.set(new Uint8Array(wgpu[gpuBuffer].mappedRanges[startOffset], subOffset, size), wgpu_checked_shift(dst, 0) );
    }

  function _wgpu_buffer_unmap(gpuBuffer) {
      
      assert(gpuBuffer != 0, "assert(gpuBuffer != 0) failed!");
      assert(wgpu[gpuBuffer], "assert(wgpu[gpuBuffer]) failed!");
      assert(wgpu[gpuBuffer] instanceof GPUBuffer, "assert(wgpu[gpuBuffer] instanceof GPUBuffer) failed!");
      gpuBuffer = wgpu[gpuBuffer];
      gpuBuffer['unmap']();
  
      // Let GC reclaim all previous getMappedRange()s for this buffer.
      gpuBuffer.mappedRanges = {};
    }

  
  var HTMLPredefinedColorSpaces = [,"srgb","srgb-linear","display-p3","display-p3-linear"];
  
  function wgpuReadArrayOfItemsMaybeNull(itemDict, ptr, numItems) {
      assert(numItems >= 0, "assert(numItems >= 0) failed!");
      assert(ptr != 0 || numItems == 0, "assert(ptr != 0 || numItems == 0) failed!"); // Must be non-null pointer
      assert(ptr % 4 == 0, 'Unaligned pointer fault!');
  ptr >>= 2;
  
      return Array.from({length: numItems}, () => itemDict[HEAPU32[ptr++]]);
    }
  function wgpuReadArrayOfItems(itemDict, ptr, numItems) {
      var idx = wgpu_checked_shift(ptr, 2);
      for(var i = 0; i < numItems; ++i) {
        assert(HEAPU32[idx+i], "assert(HEAPU32[idx+i]) failed!"); // Must reference a nonzero item
        assert(itemDict[HEAPU32[idx+i]], "assert(itemDict[HEAPU32[idx+i]]) failed!"); // Must reference a valid item in the array
      }
      return wgpuReadArrayOfItemsMaybeNull(itemDict, ptr, numItems);
    }
  
  var GPUCanvasToneMappingModes = [,"standard","extended"];
  
  var GPUCanvasAlphaModes = [,"opaque","premultiplied"];
  function _wgpu_canvas_context_configure(canvasContext, config) {
      
      assert(canvasContext != 0, "assert(canvasContext != 0) failed!");
      assert(wgpu[canvasContext], "assert(wgpu[canvasContext]) failed!");
      assert(wgpu[canvasContext] instanceof GPUCanvasContext, "assert(wgpu[canvasContext] instanceof GPUCanvasContext) failed!");
      assert(config != 0, "assert(config != 0) failed!"); // Must be non-null
  
      assert(config % 4 == 0, 'Unaligned pointer fault!');
  config >>= 2;
  
      let desc = {
        'device': wgpu[HEAPU32[config]],
        'format': GPUTextureAndVertexFormats[HEAPU32[config+1]],
        'usage': HEAPU32[config+2],
        'viewFormats': wgpuReadArrayOfItems(GPUTextureAndVertexFormats, HEAPU32[config  + 4], HEAPU32[config+3]),
        'colorSpace': HTMLPredefinedColorSpaces[HEAPU32[config+6]],
        'toneMapping': {
          'mode': GPUCanvasToneMappingModes[HEAPU32[config+7]]
        },
        'alphaMode': GPUCanvasAlphaModes[HEAPU32[config+8]]
      };
  
      ;
      wgpu[canvasContext]['configure'](desc);
    }

  var _wgpu_object_destroy = function(object) {
      let o = wgpu[object];
      assert(o || !wgpu.hasOwnProperty(object), 'wgpu dictionary should never be storing key-values with null/undefined value in it', "assert(o || !wgpu.hasOwnProperty(object), 'wgpu dictionary should never be storing key-values with null/undefined value in it') failed!");
      if (o) {
        // Make sure if there might exist any other references to this JS object, that they will no longer see the .wid
        // field, since this object no longer exists in the wgpu table.
        o.wid = 0;
        // WebGPU objects of type GPUDevice, GPUBuffer, GPUTexture and GPUQuerySet have an explicit .destroy() function. Call that if applicable.
        o['destroy']?.();
        // If the given object has derived objects (GPUTexture -> GPUTextureViews), delete those in a hierarchy as well.
        o.derivedObjects?.forEach((_,k) => _wgpu_object_destroy(k));
        // If this object has a parent, unlink this object from its parent.
        o.parentObject?.derivedObjects.delete(object);
        // Finally erase reference to this object.
        delete wgpu[object];
      }
      assert(!wgpu.hasOwnProperty(object), 'object should have gotten deleted', "assert(!wgpu.hasOwnProperty(object), 'object should have gotten deleted') failed!");
    };
  
  function _wgpu_canvas_context_get_current_texture(canvasContext) {
      
      assert(canvasContext != 0, "assert(canvasContext != 0) failed!");
      assert(wgpu[canvasContext], "assert(wgpu[canvasContext]) failed!");
      assert(wgpu[canvasContext] instanceof GPUCanvasContext, "assert(wgpu[canvasContext] instanceof GPUCanvasContext) failed!");
  
      canvasContext = wgpu[canvasContext];
      // The canvas context texture is a special texture that automatically invalidates itself after the current rAF()
      // callback if over. Therefore when a new swap chain texture is produced, we need to delete the old one to avoid
      // accumulating references to stale textures from each frame.
  
      // Acquire the new canvas context texture..
      var canvasTexture = canvasContext['getCurrentTexture']();
      assert(canvasTexture, "assert(canvasTexture) failed!");
      if (canvasTexture != wgpu[1]) {
        // ... and destroy previous special canvas context texture, if it was an old one.
        _wgpu_object_destroy(1);
        wgpu[1] = canvasTexture;
        canvasTexture.wid = 1;
        wgpuLinkParentAndChild(canvasContext, 1, canvasTexture);
      }
      // The canvas context texture is hardcoded the special ID 1. Return that ID to caller.
      return 1;
    }

  function _wgpu_canvas_get_webgpu_context(canvasSelector) {
      
      assert(canvasSelector, "assert(canvasSelector) failed!");
  
      // Search Canvas elements in DOM.
      let canvas = document.querySelector(utf8(canvasSelector));
      ;
  
      let ctx = canvas.getContext('webgpu');
      ;
  
      if (ctx.wid) return ctx.wid; // Return existing ID if user has called wgpu_canvas_get_webgpu_context() multiple times on the same canvas.
  
      return wgpuStore(ctx);
    }

  function wgpuReadTimestampWrites(timestampWritesIndex) {
      let querySet = HEAPU32[timestampWritesIndex];
      if (querySet) {
        let timestampWrites = { 'querySet': wgpu[querySet] }, i;
        if ((i = HEAP32[timestampWritesIndex+1]) >= 0) timestampWrites['beginningOfPassWriteIndex'] = i;
        if ((i = HEAP32[timestampWritesIndex+2]) >= 0) timestampWrites['endOfPassWriteIndex'] = i;
        return timestampWrites;
      }
    }
  
  function _wgpu_command_encoder_begin_compute_pass(commandEncoder, descriptor) {
      
      assert(commandEncoder != 0, "assert(commandEncoder != 0) failed!");
      assert(wgpu[commandEncoder], "assert(wgpu[commandEncoder]) failed!");
      assert(wgpu[commandEncoder] instanceof GPUCommandEncoder, "assert(wgpu[commandEncoder] instanceof GPUCommandEncoder) failed!");
      // descriptor may be a null pointer
  
      commandEncoder = wgpu[commandEncoder];
      assert(descriptor % 4 == 0, 'Unaligned pointer fault!');
  descriptor >>= 2;
  
      let desc = descriptor ? {
        'timestampWrites': wgpuReadTimestampWrites(descriptor)
      } : void 0;
  
      
      return wgpuStore(commandEncoder['beginComputePass'](desc));
    }

  var GPULoadOps = [,"load","clear"];
  
  var GPUStoreOps = [,"store","discard"];
  
  
  function wgpuReadRenderPassDepthStencilAttachment(heap32Idx) {
      let v = HEAPU32[heap32Idx]; return v ? {
          'view': wgpu[v],
          'depthLoadOp': GPULoadOps[HEAPU32[heap32Idx+1]],
          'depthClearValue': HEAPF32[heap32Idx+2],
          'depthStoreOp': GPUStoreOps[HEAPU32[heap32Idx+3]],
          'depthReadOnly': !!HEAPU32[heap32Idx+4],
          'stencilLoadOp': GPULoadOps[HEAPU32[heap32Idx+5]],
          'stencilClearValue': HEAPU32[heap32Idx+6],
          'stencilStoreOp': GPUStoreOps[HEAPU32[heap32Idx+7]],
          'stencilReadOnly': !!HEAPU32[heap32Idx+8],
        } : void 0;
    }
  
  function _wgpu_command_encoder_begin_render_pass(commandEncoder, descriptor) {
      
      assert(commandEncoder != 0, "assert(commandEncoder != 0) failed!");
      assert(wgpu[commandEncoder], "assert(wgpu[commandEncoder]) failed!");
      assert(wgpu[commandEncoder] instanceof GPUCommandEncoder, "assert(wgpu[commandEncoder] instanceof GPUCommandEncoder) failed!");
      assert(descriptor != 0, "assert(descriptor != 0) failed!");
  
      assert(descriptor % 4 == 0, 'Unaligned pointer fault!');
  descriptor >>= 2;
  
      let colorAttachments = [],
        numColorAttachments = HEAP32[descriptor+4],
        colorAttachmentsIdx = wgpu_checked_shift(HEAPU32[descriptor+2], 2),
        colorAttachmentsIdxDbl = colorAttachmentsIdx + 6 >> 1, // Alias the view for HEAPF64.
        maxDrawCount = HEAPF64[descriptor >> 1],
        depthStencilAttachment = HEAPU32[descriptor+5];
  
      assert(Number.isSafeInteger(maxDrawCount), "assert(Number.isSafeInteger(maxDrawCount)) failed!"); // 'maxDrawCount' is a double_int53_t
      assert(maxDrawCount >= 0, "assert(maxDrawCount >= 0) failed!");
  
      assert(colorAttachmentsIdx % 2 == 0, "assert(colorAttachmentsIdx % 2 == 0) failed!"); // Must be aligned at double boundary
      assert(depthStencilAttachment == 0 || wgpu[depthStencilAttachment] instanceof GPUTexture || wgpu[depthStencilAttachment] instanceof GPUTextureView, "assert(depthStencilAttachment == 0 || wgpu[depthStencilAttachment] instanceof GPUTexture || wgpu[depthStencilAttachment] instanceof GPUTextureView) failed!"); // Must point to a valid WebGPU texture or texture view object if nonzero
  
      assert(numColorAttachments >= 0, "assert(numColorAttachments >= 0) failed!");
      while(numColorAttachments--) {
        // If view is 0, then this attachment is to be sparse.
        let v = HEAPU32[colorAttachmentsIdx], ds = HEAP32[colorAttachmentsIdx+1];
        colorAttachments.push(v ? {
          'view': wgpu[v],
          'depthSlice': ds < 0 ? void 0 : ds, // Awkward polymorphism: spec does not allow 'depthSlice' to be given a value (even 0) if attachment is not a 3D texture.
          'resolveTarget': wgpu[HEAPU32[colorAttachmentsIdx+2]],
          'storeOp': GPUStoreOps[HEAPU32[colorAttachmentsIdx+3]],
          'loadOp': GPULoadOps[HEAPU32[colorAttachmentsIdx+4]],
          'clearValue': [HEAPF64[colorAttachmentsIdxDbl  ], HEAPF64[colorAttachmentsIdxDbl+1],
                         HEAPF64[colorAttachmentsIdxDbl+2], HEAPF64[colorAttachmentsIdxDbl+3]]
        } : null);
  
        colorAttachmentsIdx += 14; // sizeof(WGpuRenderPassColorAttachment)
        colorAttachmentsIdxDbl += 7; // sizeof(WGpuRenderPassColorAttachment)/2
      }
  
      let desc = {
        'colorAttachments': colorAttachments,
        // Awkward polymorphism: cannot specify 'view': undefined if no depth-stencil attachment
        // is to be present, but must pass undefined as the whole attachment object.
        'depthStencilAttachment': wgpuReadRenderPassDepthStencilAttachment(descriptor+5),
        'occlusionQuerySet': wgpu[HEAPU32[descriptor+14]], // 5 + 9==sizeof(WGpuRenderPassDepthStencilAttachment)
        // If maxDrawCount is set to zero, pass in undefined to use the default value
        // (likely 50 million, but omit it in case the spec might change in the future)
        'maxDrawCount': maxDrawCount || void 0,
        'timestampWrites': wgpuReadTimestampWrites(descriptor+15) // 5 + 9==sizeof(WGpuRenderPassDepthStencilAttachment) + 1==sizeof(WGpuQuerySet)
      };
      ;
      return wgpuStore(wgpu[commandEncoder]['beginRenderPass'](desc));
    }

  function _wgpu_command_encoder_copy_buffer_to_buffer(commandEncoder, source, sourceOffset, destination, destinationOffset, size) {
      
      assert(commandEncoder != 0, "assert(commandEncoder != 0) failed!");
      assert(wgpu[commandEncoder], "assert(wgpu[commandEncoder]) failed!");
      assert(wgpu[commandEncoder] instanceof GPUCommandEncoder, "assert(wgpu[commandEncoder] instanceof GPUCommandEncoder) failed!");
      assert(wgpu[source] instanceof GPUBuffer, "assert(wgpu[source] instanceof GPUBuffer) failed!");
      assert(wgpu[destination] instanceof GPUBuffer, "assert(wgpu[destination] instanceof GPUBuffer) failed!");
      assert(Number.isSafeInteger(sourceOffset), "assert(Number.isSafeInteger(sourceOffset)) failed!");
      assert(sourceOffset >= 0, "assert(sourceOffset >= 0) failed!");
      assert(Number.isSafeInteger(destinationOffset), "assert(Number.isSafeInteger(destinationOffset)) failed!");
      assert(destinationOffset >= 0, "assert(destinationOffset >= 0) failed!");
      assert(Number.isSafeInteger(size) || size == Infinity, "assert(Number.isSafeInteger(size) || size == Infinity) failed!");
      assert(size >= 0, "assert(size >= 0) failed!");
      wgpu[commandEncoder]['copyBufferToBuffer'](wgpu[source], sourceOffset, wgpu[destination], destinationOffset, size < 1/0 ? size : void 0);
    }

  var GPUTextureAspects = [,"all","stencil-only","depth-only"];
  function wgpuReadGpuTexelCopyTextureInfo(ptr) {
      assert(ptr, "assert(ptr) failed!");
      assert(ptr % 4 == 0, 'Unaligned pointer fault!');
  ptr >>= 2;
      return {
        'texture': wgpu[HEAPU32[ptr]],
        'mipLevel': HEAP32[ptr+1],
        'origin': [HEAP32[ptr+2], HEAP32[ptr+3], HEAP32[ptr+4]],
        'aspect': GPUTextureAspects[HEAPU32[ptr+5]]
      };
    }
  
  function wgpuReadGpuTexelCopyBufferInfo(ptr) {
      assert(ptr != 0, "assert(ptr != 0) failed!");
      assert(ptr % 4 == 0, 'Unaligned pointer fault!');
  ptr >>= 2;
      return {
        'offset': wgpuReadI53FromU64HeapIdx(ptr),
        'bytesPerRow': HEAP32[ptr+2],
        'rowsPerImage': HEAP32[ptr+3],
        'buffer': wgpu[HEAPU32[ptr+4]]
      };
    }
  function _wgpu_command_encoder_copy_texture_to_buffer(commandEncoder, source, destination, copyWidth, copyHeight, copyDepthOrArrayLayers) {
      
      assert(commandEncoder != 0, "assert(commandEncoder != 0) failed!");
      assert(wgpu[commandEncoder], "assert(wgpu[commandEncoder]) failed!");
      assert(wgpu[commandEncoder] instanceof GPUCommandEncoder, "assert(wgpu[commandEncoder] instanceof GPUCommandEncoder) failed!");
      assert(source, "assert(source) failed!");
      assert(destination, "assert(destination) failed!");
      wgpu[commandEncoder]['copyTextureToBuffer'](wgpuReadGpuTexelCopyTextureInfo(source), wgpuReadGpuTexelCopyBufferInfo(destination), [copyWidth, copyHeight, copyDepthOrArrayLayers]);
    }

  function _wgpu_command_encoder_copy_texture_to_texture(commandEncoder, source, destination, copyWidth, copyHeight, copyDepthOrArrayLayers) {
      
      assert(commandEncoder != 0, "assert(commandEncoder != 0) failed!");
      assert(wgpu[commandEncoder], "assert(wgpu[commandEncoder]) failed!");
      assert(wgpu[commandEncoder] instanceof GPUCommandEncoder, "assert(wgpu[commandEncoder] instanceof GPUCommandEncoder) failed!");
      assert(source, "assert(source) failed!");
      assert(destination, "assert(destination) failed!");
      wgpu[commandEncoder]['copyTextureToTexture'](wgpuReadGpuTexelCopyTextureInfo(source), wgpuReadGpuTexelCopyTextureInfo(destination), [copyWidth, copyHeight, copyDepthOrArrayLayers]);
    }

  function _wgpu_compute_pass_encoder_dispatch_workgroups(encoder, workgroupCountX, workgroupCountY, workgroupCountZ) {
      
      assert(encoder != 0, "assert(encoder != 0) failed!");
      assert(wgpu[encoder], "assert(wgpu[encoder]) failed!");
      assert(wgpu[encoder] instanceof GPUComputePassEncoder, "assert(wgpu[encoder] instanceof GPUComputePassEncoder) failed!");
      wgpu[encoder]['dispatchWorkgroups'](workgroupCountX, workgroupCountY, workgroupCountZ);
    }

  function _wgpu_compute_pass_encoder_dispatch_workgroups_indirect(encoder, indirectBuffer, indirectOffset) {
      
      assert(encoder != 0, "assert(encoder != 0) failed!");
      assert(wgpu[encoder], "assert(wgpu[encoder]) failed!");
      assert(wgpu[encoder] instanceof GPUComputePassEncoder, "assert(wgpu[encoder] instanceof GPUComputePassEncoder) failed!");
      assert(indirectBuffer != 0, "assert(indirectBuffer != 0) failed!");
      assert(wgpu[indirectBuffer], "assert(wgpu[indirectBuffer]) failed!");
      assert(wgpu[indirectBuffer] instanceof GPUBuffer, "assert(wgpu[indirectBuffer] instanceof GPUBuffer) failed!");
      assert(Number.isSafeInteger(indirectOffset), "assert(Number.isSafeInteger(indirectOffset)) failed!");
      assert(indirectOffset >= 0, "assert(indirectOffset >= 0) failed!");
      wgpu[encoder]['dispatchWorkgroupsIndirect'](wgpu[indirectBuffer], indirectOffset);
    }

  
  function _wgpu_device_create_bind_group(device, layout, entries, numEntries) {
      
      assert(device != 0, "assert(device != 0) failed!");
      assert(wgpu[device], "assert(wgpu[device]) failed!");
      assert(wgpu[device] instanceof GPUDevice, "assert(wgpu[device] instanceof GPUDevice) failed!");
      assert(layout != 0, "assert(layout != 0) failed!"); // Must be a valid BindGroupLayout
      assert(layout > 1, "assert(layout > 1) failed!"); // Cannot pass WGPU_AUTO_LAYOUT_MODE_NO_HINT or WGPU_AUTO_LAYOUT_MODE_AUTO to this function
      assert(wgpu[layout], "assert(wgpu[layout]) failed!");
      assert(wgpu[layout] instanceof GPUBindGroupLayout, "assert(wgpu[layout] instanceof GPUBindGroupLayout) failed!");
      assert(numEntries >= 0, "assert(numEntries >= 0) failed!");
      assert(entries != 0 || numEntries == 0, "assert(entries != 0 || numEntries == 0) failed!"); // Must be non-null pointer
      device = wgpu[device];
      assert(entries % 4 == 0, 'Unaligned pointer fault!');
  entries >>= 2;
      let e = [];
      while(numEntries--) {
        let resource = wgpu[HEAPU32[entries + 1]];
        assert(resource, "assert(resource) failed!");
        e.push({
          'binding': HEAPU32[entries],
          'resource': resource.isBuffer ? {
            'buffer': resource,
            'offset': wgpuReadI53FromU64HeapIdx(entries + 2),
            'size': wgpuReadI53FromU64HeapIdx(entries + 4) || void 0 // Awkward polymorphism: convert size=0 to 'undefined' to mean to bind the whole buffer.
          } : resource,
        });
        entries += 6;
      }
  
      let desc = {
        'layout': wgpu[layout],
        'entries': e
      };
      ;
      return wgpuStoreAndSetParent(device['createBindGroup'](desc), device);
    }

  
  var GPUBufferBindingTypes = [,"uniform","storage","read-only-storage"];
  
  
  var GPUSamplerBindingTypes = [,"filtering","non-filtering","comparison"];
  
  var GPUTextureSampleTypes = [,"float","unfilterable-float","depth","sint","uint"];
  
  var GPUTextureViewDimensions = [,"1d","2d","2d-array","cube","cube-array","3d"];
  
  
  var GPUStorageTextureSampleTypes = [,"write-only","read-only","read-write"];
  function wgpuReadBindGroupLayoutDescriptor(entries, numEntries) {
      assert(numEntries >= 0, "assert(numEntries >= 0) failed!");
      assert(entries != 0 || numEntries == 0, "assert(entries != 0 || numEntries == 0) failed!"); // Must be non-null pointer
  
      assert(entries % 4 == 0, 'Unaligned pointer fault!');
  entries >>= 2;
      let e = [];
      while(numEntries--) {
        let entry = {
          'binding': HEAPU32[entries],
          'visibility': HEAPU32[entries+1],
        }, type = HEAPU32[entries+2];
        entries += 4;
        assert(type >= 1 && type <= 5, "assert(type >= 1 && type <= 5) failed!");
        if (type == 1/*WGPU_BIND_GROUP_LAYOUT_TYPE_BUFFER*/) {
          entry['buffer'] = {
            'type': GPUBufferBindingTypes[HEAPU32[entries]],
            'hasDynamicOffset': !!HEAPU32[entries+1],
            'minBindingSize': wgpuReadI53FromU64HeapIdx(entries+2)
          };
        } else if (type == 2/*WGPU_BIND_GROUP_LAYOUT_TYPE_SAMPLER*/) {
          entry['sampler'] = {
            'type': GPUSamplerBindingTypes[HEAPU32[entries]]
          };
        } else if (type == 3/*WGPU_BIND_GROUP_LAYOUT_TYPE_TEXTURE*/) {
          entry['texture'] = {
            'sampleType': GPUTextureSampleTypes[HEAPU32[entries]],
            'viewDimension': GPUTextureViewDimensions[HEAPU32[entries+1]],
            'multisampled': !!HEAPU32[entries+2]
          };
        } else if (type == 4/*WGPU_BIND_GROUP_LAYOUT_TYPE_STORAGE_TEXTURE*/) {
          entry['storageTexture'] = {
            'access': GPUStorageTextureSampleTypes[HEAPU32[entries]],
            'format': GPUTextureAndVertexFormats[HEAPU32[entries+1]],
            'viewDimension': GPUTextureViewDimensions[HEAPU32[entries+2]]
          };
        } else { // type == 5/*WGPU_BIND_GROUP_LAYOUT_TYPE_EXTERNAL_TEXTURE*/ {
          entry['externalTexture'] = {};
        }
        entries += 4;
        e.push(entry);
      }
      return {
        'entries': e
      }
    }
  function _wgpu_device_create_bind_group_layout(device, entries, numEntries) {
      
      assert(device != 0, "assert(device != 0) failed!");
      assert(wgpu[device], "assert(wgpu[device]) failed!");
      assert(wgpu[device] instanceof GPUDevice, "assert(wgpu[device] instanceof GPUDevice) failed!");
      device = wgpu[device];
  
      let desc = wgpuReadBindGroupLayoutDescriptor(entries, numEntries);
      
      return wgpuStoreAndSetParent(device['createBindGroupLayout'](desc), device);
    }

  
  function _wgpu_device_create_buffer(device, descriptor) {
      
      assert(device != 0, "assert(device != 0) failed!");
      assert(wgpu[device], "assert(wgpu[device]) failed!");
      assert(wgpu[device] instanceof GPUDevice, "assert(wgpu[device] instanceof GPUDevice) failed!");
      assert(descriptor != 0, "assert(descriptor != 0) failed!");
      device = wgpu[device];
      assert(descriptor % 4 == 0, 'Unaligned pointer fault!');
  descriptor >>= 2;
  
      let desc = {
        'size': wgpuReadI53FromU64HeapIdx(descriptor),
        'usage': HEAPU32[descriptor+2],
        'mappedAtCreation': !!HEAPU32[descriptor+3]
      };
      ;
      let buffer = device['createBuffer'](desc);
  
      // Add tracking space for mapped ranges
      buffer.mappedRanges = {};
      // Mark this object to be of type GPUBuffer for wgpu_device_create_bind_group().
      buffer.isBuffer = 1;
      return wgpuStoreAndSetParent(buffer, device);
    }

  function _wgpu_device_create_command_encoder(device, descriptor) {
      
      assert(device != 0, "assert(device != 0) failed!");
      assert(wgpu[device], "assert(wgpu[device]) failed!");
      assert(wgpu[device] instanceof GPUDevice, "assert(wgpu[device] instanceof GPUDevice) failed!");
      device = wgpu[device];
      return wgpuStoreAndSetParent(device['createCommandEncoder'](), device);
    }

  function _wgpu_device_create_command_encoder_simple(device) {
      device = wgpu[device];
      return wgpuStoreAndSetParent(device['createCommandEncoder'](), device);
    }

  
  function wgpuReadConstants(constants, numConstants) {
      assert(numConstants >= 0, "assert(numConstants >= 0) failed!");
      assert(constants != 0 || numConstants == 0, "assert(constants != 0 || numConstants == 0) failed!");
  
      let c = {};
      while(numConstants--) {
        c[utf8(HEAPU32[constants  >> 2])] = HEAPF64[wgpu_checked_shift(constants + 8, 3)];
        constants += 16;
      }
      return c;
    }
  
  var GPUAutoLayoutMode = "auto";
  function wgpuReadComputePipelineDescriptor(computeModule, entryPoint, layout, constants, numConstants) {
      return {
        'layout': layout > 1 ? wgpu[layout] : GPUAutoLayoutMode,
        'compute': {
          'module': wgpu[computeModule],
          'entryPoint': utf8(entryPoint) || void 0, // If null pointer was passed to use the default entry point name, then utf8() would return '', but spec requires undefined.
          'constants': wgpuReadConstants(constants, numConstants)
        }
      };
    }
  function _wgpu_device_create_compute_pipeline(device, computeModule, entryPoint, layout, constants, numConstants) {
      
      assert(device != 0, "assert(device != 0) failed!");
      assert(wgpu[device], "assert(wgpu[device]) failed!");
      assert(wgpu[device] instanceof GPUDevice, "assert(wgpu[device] instanceof GPUDevice) failed!");
      assert(computeModule != 0, "assert(computeModule != 0) failed!");
      assert(wgpu[computeModule], "assert(wgpu[computeModule]) failed!");
      assert(wgpu[computeModule] instanceof GPUShaderModule, "assert(wgpu[computeModule] instanceof GPUShaderModule) failed!");
      assert(layout <= 1/*"auto"*/ || wgpu[layout], "assert(layout <= 1/*'auto'*/ || wgpu[layout]) failed!");
      assert(layout <= 1/*"auto"*/ || wgpu[layout] instanceof GPUPipelineLayout, "assert(layout <= 1/*'auto'*/ || wgpu[layout] instanceof GPUPipelineLayout) failed!");
      assert(numConstants >= 0, "assert(numConstants >= 0) failed!");
      assert(numConstants == 0 || constants, "assert(numConstants == 0 || constants) failed!");
      assert(!entryPoint || utf8(entryPoint).length > 0, "assert(!entryPoint || utf8(entryPoint).length > 0) failed!"); // If entry point string is provided, it must be a nonempty JS string
      device = wgpu[device];
  
      let desc = wgpuReadComputePipelineDescriptor(computeModule, entryPoint, layout, constants, numConstants);
      ;
      return wgpuStoreAndSetParent(device['createComputePipeline'](desc), device);
    }

  
  function _wgpu_device_create_pipeline_layout(device, layouts, numLayouts, immediateSize) {
      
      assert(device != 0, "assert(device != 0) failed!");
      assert(wgpu[device], "assert(wgpu[device]) failed!");
      assert(wgpu[device] instanceof GPUDevice, "assert(wgpu[device] instanceof GPUDevice) failed!");
      device = wgpu[device];
  
      let desc = {
        'bindGroupLayouts': wgpuReadArrayOfItemsMaybeNull(wgpu, layouts, numLayouts),
        'immediateSize': immediateSize
      };
      ;
      return wgpuStoreAndSetParent(device['createPipelineLayout'](desc), device);
    }

  var GPUCompareFunctions = [,"never","less","equal","less-equal","greater","not-equal","greater-equal","always"];
  
  var GPUStencilOperations = [,"keep","zero","replace","invert","increment-clamp","decrement-clamp","increment-wrap","decrement-wrap"];
  function wgpuReadGpuStencilFaceState(idx) {
      assert(idx != 0, "assert(idx != 0) failed!");
      return {
        'compare': GPUCompareFunctions[HEAPU32[idx]],
        'failOp': GPUStencilOperations[HEAPU32[idx+1]],
        'depthFailOp': GPUStencilOperations[HEAPU32[idx+2]],
        'passOp': GPUStencilOperations[HEAPU32[idx+3]]
      };
    }
  
  var GPUBlendOperations = [,"add","subtract","reverse-subtract","min","max"];
  
  var GPUBlendFactors = [,"zero","one","src","one-minus-src","src-alpha","one-minus-src-alpha","dst","one-minus-dst","dst-alpha","one-minus-dst-alpha","src-alpha-saturated","constant","one-minus-constant","src1","one-minus-src1","src1-alpha","one-minus-src1-alpha"];
  function wgpuReadGpuBlendComponent(idx) {
      assert(idx != 0, "assert(idx != 0) failed!");
      assert(GPUBlendOperations[HEAPU32[idx]], "assert(GPUBlendOperations[HEAPU32[idx]]) failed!");
      assert(GPUBlendFactors[HEAPU32[idx+1]], "assert(GPUBlendFactors[HEAPU32[idx+1]]) failed!");
      assert(GPUBlendFactors[HEAPU32[idx+2]], "assert(GPUBlendFactors[HEAPU32[idx+2]]) failed!");
      return {
        'operation': GPUBlendOperations[HEAPU32[idx]],
        'srcFactor': GPUBlendFactors[HEAPU32[idx+1]],
        'dstFactor': GPUBlendFactors[HEAPU32[idx+2]]
      };
    }
  
  
  
  var GPUIndexFormats = [,"uint16","uint32"];
  
  
  
  var GPUPrimitiveTopologys = [,"point-list","line-list","line-strip","triangle-list","triangle-strip"];
  
  function wgpuReadRenderPipelineDescriptor(descriptor) {
      assert(descriptor != 0, "assert(descriptor != 0) failed!");
      assert(descriptor % 4 == 0, 'Unaligned pointer fault!');
  descriptor >>= 2;
  
      let vertexBuffers = [],
          targets = [],
          vertexIdx = descriptor,
          numVertexBuffers = HEAP32[vertexIdx+7], // +7 == WGpuVertexState.numBuffers
          vertexBuffersIdx = wgpu_checked_shift(HEAPU32[vertexIdx+2], 2), // +2 == WGpuVertexState.buffers
          primitiveIdx = vertexIdx + 10, // sizeof(WGpuVertexState)
          depthStencilIdx = primitiveIdx + 5, // sizeof(WGpuPrimitiveState)
          multisampleIdx = depthStencilIdx + 17, // sizeof(WGpuDepthStencilState)
          fragmentIdx = multisampleIdx + 4, // sizeof(WGpuMultisampleState) + 1 for unused padding
          numTargets = HEAP32[fragmentIdx+7], // +7 == WGpuFragmentState.numTargets
          targetsIdx = wgpu_checked_shift(HEAPU32[fragmentIdx+2], 2), // +2 == WGpuFragmentState.targets
          depthStencilFormat = HEAPU32[depthStencilIdx],
          multisampleCount = HEAPU32[multisampleIdx],
          fragmentModule = HEAPU32[fragmentIdx+6],
          pipelineLayoutId = HEAPU32[fragmentIdx+10], // sizeof(WGpuPipelineLayout)
          desc;
  
      assert(pipelineLayoutId <= 1/*"auto"*/ || wgpu[pipelineLayoutId], "assert(pipelineLayoutId <= 1/*'auto'*/ || wgpu[pipelineLayoutId]) failed!");
      assert(pipelineLayoutId <= 1/*"auto"*/ || wgpu[pipelineLayoutId] instanceof GPUPipelineLayout, "assert(pipelineLayoutId <= 1/*'auto'*/ || wgpu[pipelineLayoutId] instanceof GPUPipelineLayout) failed!");
  
      // Read GPUVertexState
      assert(numVertexBuffers >= 0, "assert(numVertexBuffers >= 0) failed!");
      while(numVertexBuffers--) {
        let attributes = [],
            numAttributes = HEAP32[vertexBuffersIdx+2],
            attributesIdx = wgpu_checked_shift(HEAPU32[vertexBuffersIdx], 2);
        assert(numAttributes >= 0, "assert(numAttributes >= 0) failed!");
        while(numAttributes--) {
          attributes.push({
            'offset': wgpuReadI53FromU64HeapIdx(attributesIdx),
            'shaderLocation': HEAPU32[attributesIdx+2],
            'format': GPUTextureAndVertexFormats[HEAPU32[attributesIdx+3]]
          });
          attributesIdx += 4;
        }
        vertexBuffers.push({
          'arrayStride': wgpuReadI53FromU64HeapIdx(vertexBuffersIdx+4),
          'stepMode': [, 'vertex', 'instance'][HEAPU32[vertexBuffersIdx+3]],
          'attributes': attributes
        });
        vertexBuffersIdx += 6; // sizeof(WGpuVertexBufferLayout)
      }
  
      assert(numTargets >= 0, "assert(numTargets >= 0) failed!");
      while(numTargets--) {
        // If target format is 0 (WGPU_TEXTURE_FORMAT_INVALID), then this target
        // is sparse and specified as 'null'.
        let fmt = HEAPU32[targetsIdx];
        targets.push(fmt ? {
          'format': GPUTextureAndVertexFormats[fmt],
          'blend': HEAPU32[targetsIdx+1] ? {
            'color': wgpuReadGpuBlendComponent(targetsIdx+1),
            'alpha': wgpuReadGpuBlendComponent(targetsIdx+4)
          } : void 0,
          'writeMask': HEAPU32[targetsIdx+7]
        } : null);
        targetsIdx += 8;
      }
  
      desc = {
        'vertex': {
          'module': wgpu[HEAPU32[vertexIdx+6]],
          // If null pointer was passed to use the default entry point name, then utf8() would return '', but spec requires undefined.
          'entryPoint': utf8(HEAPU32[vertexIdx ]) || void 0,
          'buffers': vertexBuffers,
          'constants': wgpuReadConstants(HEAPU32[vertexIdx+4 ], HEAP32[vertexIdx+8])
        },
        'fragment': fragmentModule ? {
          'module': wgpu[fragmentModule],
          // If null pointer was passed to use the default entry point name, then utf8() would return '', but spec requires undefined.
          'entryPoint': utf8(HEAPU32[fragmentIdx ]) || void 0,
          'targets': targets,
          'constants': wgpuReadConstants(HEAPU32[fragmentIdx+4 ], HEAP32[fragmentIdx+8])
        } : void 0,
        'primitive': {
          'topology': GPUPrimitiveTopologys[HEAPU32[primitiveIdx]],
          'stripIndexFormat': GPUIndexFormats[HEAPU32[primitiveIdx+1]],
          'frontFace': [, 'ccw', 'cw'][HEAPU32[primitiveIdx+2]],
          'cullMode': [, 'none', 'front', 'back'][HEAPU32[primitiveIdx+3]],
          'unclippedDepth': !!HEAPU32[primitiveIdx+4]
        },
        'depthStencil': depthStencilFormat ? {
          'format': GPUTextureAndVertexFormats[depthStencilFormat],
          'depthWriteEnabled': !!HEAPU32[depthStencilIdx+1],
          'depthCompare': GPUCompareFunctions[HEAPU32[depthStencilIdx+2]],
          'stencilReadMask': HEAPU32[depthStencilIdx+3],
          'stencilWriteMask': HEAPU32[depthStencilIdx+4],
          'depthBias': HEAP32[depthStencilIdx+5],
          'depthBiasSlopeScale': HEAPF32[depthStencilIdx+6],
          'depthBiasClamp': HEAPF32[depthStencilIdx+7],
          'stencilFront': wgpuReadGpuStencilFaceState(depthStencilIdx+8),
          'stencilBack': wgpuReadGpuStencilFaceState(depthStencilIdx+12),
          'clampDepth': !!HEAPU32[depthStencilIdx+16],
        } : void 0,
        'multisample': multisampleCount ? {
          'count': multisampleCount,
          'mask': HEAPU32[multisampleIdx+1],
          'alphaToCoverageEnabled': !!HEAPU32[multisampleIdx+2]
        } : void 0,
        'layout': pipelineLayoutId > 1 ? wgpu[pipelineLayoutId] : GPUAutoLayoutMode
      };
  
      return desc;
    }
  
  function _wgpu_device_create_render_pipeline(device, descriptor) {
      
      assert(device != 0, "assert(device != 0) failed!");
      assert(wgpu[device], "assert(wgpu[device]) failed!");
      assert(wgpu[device] instanceof GPUDevice, "assert(wgpu[device] instanceof GPUDevice) failed!");
      assert(descriptor, "assert(descriptor) failed!");
  
      device = wgpu[device];
      let desc = wgpuReadRenderPipelineDescriptor(descriptor);
      ;
      return wgpuStoreAndSetParent(device['createRenderPipeline'](desc), device);
    }

  
  var GPUAddressModes = [,"clamp-to-edge","repeat","mirror-repeat"];
  
  var GPUFilterModes = [,"nearest","linear"];
  
  function _wgpu_device_create_sampler(device, descriptor) {
      
      assert(device != 0, "assert(device != 0) failed!");
      assert(wgpu[device], "assert(wgpu[device]) failed!");
      assert(wgpu[device] instanceof GPUDevice, "assert(wgpu[device] instanceof GPUDevice) failed!");
      device = wgpu[device];
  
      assert(descriptor % 4 == 0, 'Unaligned pointer fault!');
  descriptor >>= 2;
      let desc = descriptor ? {
        'addressModeU': GPUAddressModes[HEAPU32[descriptor]],
        'addressModeV': GPUAddressModes[HEAPU32[descriptor+1]],
        'addressModeW': GPUAddressModes[HEAPU32[descriptor+2]],
        'magFilter': GPUFilterModes[HEAPU32[descriptor+3]],
        'minFilter': GPUFilterModes[HEAPU32[descriptor+4]],
        // N.b. The field below technically uses '$GPUMipmapFilterModes', but use '$GPUFilterModes' instead to save code size, since these two have identical contents
        'mipmapFilter': GPUFilterModes[HEAPU32[descriptor+5]],
        'lodMinClamp': HEAPF32[descriptor+6],
        'lodMaxClamp': HEAPF32[descriptor+7],
        'compare': GPUCompareFunctions[HEAPU32[descriptor+8]],
        'maxAnisotropy': HEAPU32[descriptor+9]
      } : void 0;
      
  
      return wgpuStoreAndSetParent(device['createSampler'](desc), device);
    }

  
  function wgpuReadShaderModuleCompilationHints(index) {
      let numHints = HEAP32[index+2],
        hints = [],
        hintsIndex = wgpu_checked_shift(HEAPU32[index], 2),
        layout;
      assert(numHints >= 0, "assert(numHints >= 0) failed!");
      while(numHints--) {
        layout = HEAPU32[hintsIndex+2];
        // layout == 0 (WGPU_AUTO_LAYOUT_MODE_NO_HINT) means no compilation hints are passed,
        // layout == 1 (WGPU_AUTO_LAYOUT_MODE_AUTO) means { layout: 'auto' } hint will be passed.
        // layout > 1: A handle to a given GPUPipelineLayout object is specified as a hint for creating the shader.
        // See https://github.com/gpuweb/gpuweb/pull/2876#issuecomment-1218341636
        assert(layout <= 1 || wgpu[layout], "assert(layout <= 1 || wgpu[layout]) failed!");
        assert(layout <= 1 || wgpu[layout] instanceof GPUPipelineLayout, "assert(layout <= 1 || wgpu[layout] instanceof GPUPipelineLayout) failed!");
        hints.push({
          'entryPoint': utf8(HEAPU32[hintsIndex ]),
          'layout': layout > 1 ? wgpu[layout] : (layout ? GPUAutoLayoutMode : void 0)
        });
        hintsIndex += 4;
      }
      return hints;
    }
  function wgpuReadShaderModuleDescriptor(descriptor) {
      assert(descriptor != 0, "assert(descriptor != 0) failed!");
      assert(descriptor % 4 == 0, 'Unaligned pointer fault!');
  descriptor >>= 2;
      return {
        'code': utf8(HEAPU32[descriptor]),
        'compilationHints': wgpuReadShaderModuleCompilationHints(descriptor+2)
      }
    }
  function _wgpu_device_create_shader_module(device, descriptor) {
      
      assert(device != 0, "assert(device != 0) failed!");
      assert(wgpu[device], "assert(wgpu[device]) failed!");
      assert(wgpu[device] instanceof GPUDevice, "assert(wgpu[device] instanceof GPUDevice) failed!");
  
      device = wgpu[device];
      let desc = wgpuReadShaderModuleDescriptor(descriptor);
      ;
      return wgpuStoreAndSetParent(device['createShaderModule'](desc), device);
    }

  
  
  
  function _wgpu_device_create_texture(device, descriptor) {
      
      assert(device != 0, "assert(device != 0) failed!");
      assert(wgpu[device], "assert(wgpu[device]) failed!");
      assert(wgpu[device] instanceof GPUDevice, "assert(wgpu[device] instanceof GPUDevice) failed!");
      assert(descriptor != 0, "assert(descriptor != 0) failed!"); // Must be non-null
      device = wgpu[device];
  
      assert(descriptor % 4 == 0, 'Unaligned pointer fault!');
  descriptor >>= 2;
      assert(HEAPU32[descriptor+8] >= 1, "assert(HEAPU32[descriptor+8] >= 1) failed!"); // 'dimension' must be one of 1d, 2d or 3d.
      assert(HEAPU32[descriptor+8] <= 3, "assert(HEAPU32[descriptor+8] <= 3) failed!"); // 'dimension' must be one of 1d, 2d or 3d.
      
      let desc = {
        'viewFormats': wgpuReadArrayOfItems(GPUTextureAndVertexFormats, HEAPU32[descriptor ], HEAPU32[descriptor+2]),
        'size': [HEAP32[descriptor+3], HEAP32[descriptor+4], HEAP32[descriptor+5]],
        'mipLevelCount': HEAP32[descriptor+6],
        'sampleCount': HEAP32[descriptor+7],
        'dimension': HEAPU32[descriptor+8] + 'd',
        'format': GPUTextureAndVertexFormats[HEAPU32[descriptor+9]],
        'usage': HEAPU32[descriptor+10],
        'textureBindingViewDimension': GPUTextureViewDimensions[HEAPU32[descriptor+11]] // Only used in WebGPU compatibility mode, ignored by core devices.
      };
      
      let texture = device['createTexture'](desc);
  
      return wgpuStoreAndSetParent(texture, device);
    }

  function _wgpu_device_get_queue(device) {
      
      assert(device != 0, "assert(device != 0) failed!");
      assert(wgpu[device], "assert(wgpu[device]) failed!");
      assert(wgpu[device] instanceof GPUDevice, "assert(wgpu[device] instanceof GPUDevice) failed!");
      assert(wgpu[device].wid == device, "assert(wgpu[device].wid == device) failed!");
      assert(wgpu[device]["queue"].wid, "assert(wgpu[device]['queue'].wid) failed!");
      return wgpu[device]['queue'].wid;
    }

  
  
  
  
  function _wgpuReportErrorCodeAndMessage(device, callback, errorCode, stringMessage, userData) {
      if (stringMessage) {
        // n.b. these variables deliberately rely on 'var' scope.
        var stackTop = stackSave(),
          len = lengthBytesUTF8(stringMessage)+1,
          errorMessage = stackAlloc(len);
        stringToUTF8(stringMessage, errorMessage, len);
      }
      ((a1, a2, a3, a4) => dynCall_viiii(callback, a1, a2, a3, a4))(device, errorCode, errorMessage, userData);
      if (stackTop) stackRestore(stackTop);
    }
  
  function _wgpuErrorObjectToErrorType(error) {
      return error
          ? (error instanceof GPUInternalError    ? 3/*WGPU_ERROR_TYPE_INTERNAL*/
          : (error instanceof GPUValidationError  ? 2/*WGPU_ERROR_TYPE_VALIDATION*/
          : (error instanceof GPUOutOfMemoryError ? 1/*WGPU_ERROR_TYPE_OUT_OF_MEMORY*/
          : 4/*WGPU_ERROR_TYPE_UNKNOWN*/)))
          : 0/*WGPU_ERROR_TYPE_NO_ERROR*/;
    }
  function _wgpuDispatchWebGpuErrorEvent(device, callback, error, userData) {
      // Awkward WebGPU spec: errors do not contain a data-driven error code that
      // could be used to identify the error type in a general forward compatible
      // fashion, but must do an 'instanceof' check to look at the types of the
      // errors. If new error types are introduced in the future, their types won't
      // be recognized! (and code size creeps by having to do an 'instanceof' on every
      // error type)
      _wgpuReportErrorCodeAndMessage(device,
        callback,
        _wgpuErrorObjectToErrorType(error),
        error?.['message'],
        userData);
    }
  
  var _wgpu_device_pop_error_scope_async = function(device, callback, userData) {
      assert(device != 0, "assert(device != 0) failed!");
      assert(wgpu[device], "assert(wgpu[device]) failed!");
      assert(wgpu[device] instanceof GPUDevice, "assert(wgpu[device] instanceof GPUDevice) failed!");
      assert(callback, "assert(callback) failed!");
  
      let d = error => _wgpuDispatchWebGpuErrorEvent(device, callback, error, userData);
      wgpu[device]['popErrorScope']().then(_wgpuMuteJsExceptions(d)).catch(d);
    };

  function _wgpu_device_push_error_scope(device, filter) {
      assert(device != 0, "assert(device != 0) failed!");
      assert(wgpu[device], "assert(wgpu[device]) failed!");
      assert(wgpu[device] instanceof GPUDevice, "assert(wgpu[device] instanceof GPUDevice) failed!");
      wgpu[device]['pushErrorScope']([, 'out-of-memory', 'validation', 'internal'][filter]);
    }

  function _wgpu_device_set_uncapturederror_callback(device, callback, userData) {
      assert(device != 0, "assert(device != 0) failed!");
      assert(wgpu[device], "assert(wgpu[device]) failed!");
      assert(wgpu[device] instanceof GPUDevice, "assert(wgpu[device] instanceof GPUDevice) failed!");
      wgpu[device]['onuncapturederror'] = callback ? function(uncapturedError) {
        
        _wgpuDispatchWebGpuErrorEvent(device, callback, uncapturedError['error'], userData);
      } : null;
    }

  function _wgpu_encoder_end(encoder) {
      
      assert(encoder != 0, "assert(encoder != 0) failed!");
      assert(wgpu[encoder], "assert(wgpu[encoder]) failed!");
      assert(wgpu[encoder] instanceof GPUComputePassEncoder || wgpu[encoder] instanceof GPURenderPassEncoder, "assert(wgpu[encoder] instanceof GPUComputePassEncoder || wgpu[encoder] instanceof GPURenderPassEncoder) failed!");
  
      wgpu[encoder]['end']();
  
      /* https://gpuweb.github.io/gpuweb/#render-pass-encoder-finalization:
        "The render pass encoder can be ended by calling end() once the user has
        finished recording commands for the pass. Once end() has been called the
        render pass encoder can no longer be used."
  
        Hence to help make C/C++ side code read easier, immediately release all references
        to the pass encoder after end() occurs, so that C/C++ side code does not need
        to release references manually. */
      _wgpu_object_destroy(encoder);
    }

  
  function _wgpu_encoder_finish(encoder) {
      
      assert(encoder != 0, "assert(encoder != 0) failed!");
      assert(wgpu[encoder], "assert(wgpu[encoder]) failed!");
      assert(wgpu[encoder] instanceof GPUCommandEncoder || wgpu[encoder] instanceof GPURenderBundleEncoder, "assert(wgpu[encoder] instanceof GPUCommandEncoder || wgpu[encoder] instanceof GPURenderBundleEncoder) failed!");
  
      
      let cmdBuffer = wgpu[encoder]['finish']();
  
      /* https://gpuweb.github.io/gpuweb/#command-encoder-finalization:
        "A GPUCommandBuffer containing the commands recorded by the GPUCommandEncoder can be
        created by calling finish(). Once finish() has been called the command encoder can no
        longer be used."
  
        Hence to help make C/C++ side code read easier, immediately release all references to
        the command encoder after finish() occurs, so that C/C++ side code does not need to
        release references manually. */
      _wgpu_object_destroy(encoder);
  
      return wgpuStore(cmdBuffer);
    }

  function _wgpu_encoder_pop_debug_group(encoder) {
      
      assert(encoder != 0, "assert(encoder != 0) failed!");
      assert(wgpu[encoder], "assert(wgpu[encoder]) failed!");
      assert(wgpu[encoder] instanceof GPUCommandEncoder || wgpu[encoder] instanceof GPUComputePassEncoder || wgpu[encoder] instanceof GPURenderPassEncoder || wgpu[encoder] instanceof GPURenderBundleEncoder, "assert(wgpu[encoder] instanceof GPUCommandEncoder || wgpu[encoder] instanceof GPUComputePassEncoder || wgpu[encoder] instanceof GPURenderPassEncoder || wgpu[encoder] instanceof GPURenderBundleEncoder) failed!");
      wgpu[encoder]['popDebugGroup']();
    }

  function _wgpu_encoder_push_debug_group(encoder, groupLabel) {
      
      assert(encoder != 0, "assert(encoder != 0) failed!");
      assert(wgpu[encoder], "assert(wgpu[encoder]) failed!");
      assert(wgpu[encoder] instanceof GPUCommandEncoder || wgpu[encoder] instanceof GPUComputePassEncoder || wgpu[encoder] instanceof GPURenderPassEncoder || wgpu[encoder] instanceof GPURenderBundleEncoder, "assert(wgpu[encoder] instanceof GPUCommandEncoder || wgpu[encoder] instanceof GPUComputePassEncoder || wgpu[encoder] instanceof GPURenderPassEncoder || wgpu[encoder] instanceof GPURenderBundleEncoder) failed!");
      assert(groupLabel != 0, "assert(groupLabel != 0) failed!");
      wgpu[encoder]['pushDebugGroup'](utf8(groupLabel));
    }

  function _wgpu_encoder_set_bind_group(encoder, index, /*nullable*/ bindGroup, dynamicOffsets, numDynamicOffsets) {
      
      assert(encoder != 0, "assert(encoder != 0) failed!");
      assert(wgpu[encoder], "assert(wgpu[encoder]) failed!");
      assert(wgpu[encoder] instanceof GPUComputePassEncoder || wgpu[encoder] instanceof GPURenderPassEncoder || wgpu[encoder] instanceof GPURenderBundleEncoder, "assert(wgpu[encoder] instanceof GPUComputePassEncoder || wgpu[encoder] instanceof GPURenderPassEncoder || wgpu[encoder] instanceof GPURenderBundleEncoder) failed!");
      // N.b. bindGroup may be null here, in which case the existing bind group is intended to be unbound.
      assert(bindGroup == 0 || wgpu[bindGroup], "assert(bindGroup == 0 || wgpu[bindGroup]) failed!");
      assert(bindGroup == 0 || wgpu[bindGroup] instanceof GPUBindGroup, "assert(bindGroup == 0 || wgpu[bindGroup] instanceof GPUBindGroup) failed!");
      assert(dynamicOffsets != 0 || numDynamicOffsets == 0, "assert(dynamicOffsets != 0 || numDynamicOffsets == 0) failed!");
      wgpu[encoder]['setBindGroup'](index, wgpu[bindGroup], HEAPU32, wgpu_checked_shift(dynamicOffsets, 2), numDynamicOffsets);
    }

  function _wgpu_encoder_set_pipeline(encoder, pipeline) {
      
      assert(encoder != 0, "assert(encoder != 0) failed!");
      assert(wgpu[encoder], "assert(wgpu[encoder]) failed!");
      assert(wgpu[encoder] instanceof GPUComputePassEncoder || wgpu[encoder] instanceof GPURenderPassEncoder || wgpu[encoder] instanceof GPURenderBundleEncoder, "assert(wgpu[encoder] instanceof GPUComputePassEncoder || wgpu[encoder] instanceof GPURenderPassEncoder || wgpu[encoder] instanceof GPURenderBundleEncoder) failed!");
      assert(wgpu[pipeline] instanceof GPURenderPipeline || wgpu[pipeline] instanceof GPUComputePipeline, "assert(wgpu[pipeline] instanceof GPURenderPipeline || wgpu[pipeline] instanceof GPUComputePipeline) failed!");
      assert((wgpu[encoder] instanceof GPUComputePassEncoder) == (wgpu[pipeline] instanceof GPUComputePipeline), "assert((wgpu[encoder] instanceof GPUComputePassEncoder) == (wgpu[pipeline] instanceof GPUComputePipeline)) failed!");
      wgpu[encoder]['setPipeline'](wgpu[pipeline]);
    }

  function _wgpu_is_valid_object(o) { return !!wgpu[o]; }


  function _wgpu_object_set_label(o, label) {
      assert(wgpu[o], "assert(wgpu[o]) failed!");
      wgpu[o]['label'] = utf8(label);
    }

  
  function _wgpu_queue_submit_multiple_and_destroy(queue, commandBuffers, numCommandBuffers) {
      
      assert(queue != 0, "assert(queue != 0) failed!");
      assert(wgpu[queue], "assert(wgpu[queue]) failed!");
      assert(wgpu[queue] instanceof GPUQueue, "assert(wgpu[queue] instanceof GPUQueue) failed!");
      wgpu[queue]['submit'](wgpuReadArrayOfItems(wgpu, commandBuffers, numCommandBuffers));
  
      assert(commandBuffers % 4 == 0, 'Unaligned pointer fault!');
  commandBuffers >>= 2;
      while(numCommandBuffers--) _wgpu_object_destroy(HEAPU32[commandBuffers++]);
    }

  function _wgpu_queue_submit_one_and_destroy(queue, commandBuffer) {
      
      assert(queue != 0, "assert(queue != 0) failed!");
      assert(wgpu[queue], "assert(wgpu[queue]) failed!");
      assert(wgpu[queue] instanceof GPUQueue, "assert(wgpu[queue] instanceof GPUQueue) failed!");
      assert(commandBuffer != 0, "assert(commandBuffer != 0) failed!");
      assert(wgpu[commandBuffer], "assert(wgpu[commandBuffer]) failed!");
      assert(wgpu[commandBuffer] instanceof GPUCommandBuffer, "assert(wgpu[commandBuffer] instanceof GPUCommandBuffer) failed!");
      wgpu[queue]['submit']([wgpu[commandBuffer]]);
      _wgpu_object_destroy(commandBuffer);
    }

  function _wgpu_queue_write_buffer(queue, buffer, bufferOffset, data, size) {
      
      assert(queue != 0, "assert(queue != 0) failed!");
      assert(wgpu[queue], "assert(wgpu[queue]) failed!");
      assert(wgpu[queue] instanceof GPUQueue, "assert(wgpu[queue] instanceof GPUQueue) failed!");
      assert(buffer != 0, "assert(buffer != 0) failed!");
      assert(wgpu[buffer], "assert(wgpu[buffer]) failed!");
      assert(wgpu[buffer] instanceof GPUBuffer, "assert(wgpu[buffer] instanceof GPUBuffer) failed!");
      wgpu[queue]['writeBuffer'](wgpu[buffer], bufferOffset, HEAPU8, wgpu_checked_shift(data, 0), size);
    }

  function _wgpu_queue_write_texture(queue, destination, data, bytesPerBlockRow, blockRowsPerImage, writeWidth, writeHeight, writeDepthOrArrayLayers) {
      
      assert(queue != 0, "assert(queue != 0) failed!");
      assert(wgpu[queue], "assert(wgpu[queue]) failed!");
      assert(wgpu[queue] instanceof GPUQueue, "assert(wgpu[queue] instanceof GPUQueue) failed!");
      assert(destination, "assert(destination) failed!");
      wgpu[queue]['writeTexture'](wgpuReadGpuTexelCopyTextureInfo(destination), HEAPU8,
        { 'offset': wgpu_checked_shift(data, 0),
          'bytesPerRow': bytesPerBlockRow,
          'rowsPerImage': blockRowsPerImage
        }, [writeWidth, writeHeight, writeDepthOrArrayLayers]);
    }

  function _wgpu_render_commands_mixin_draw(passEncoder, vertexCount, instanceCount, firstVertex, firstInstance) {
      
      assert(passEncoder != 0, "assert(passEncoder != 0) failed!");
      assert(wgpu[passEncoder], "assert(wgpu[passEncoder]) failed!");
      assert(wgpu[passEncoder] instanceof GPURenderPassEncoder || wgpu[passEncoder] instanceof GPURenderBundleEncoder, "assert(wgpu[passEncoder] instanceof GPURenderPassEncoder || wgpu[passEncoder] instanceof GPURenderBundleEncoder) failed!");
  
      wgpu[passEncoder]['draw'](vertexCount, instanceCount, firstVertex, firstInstance);
    }

  function _wgpu_render_commands_mixin_draw_indexed(passEncoder, indexCount, instanceCount, firstIndex, baseVertex, firstInstance) {
      
      assert(passEncoder != 0, "assert(passEncoder != 0) failed!");
      assert(wgpu[passEncoder], "assert(wgpu[passEncoder]) failed!");
      assert(wgpu[passEncoder] instanceof GPURenderPassEncoder || wgpu[passEncoder] instanceof GPURenderBundleEncoder, "assert(wgpu[passEncoder] instanceof GPURenderPassEncoder || wgpu[passEncoder] instanceof GPURenderBundleEncoder) failed!");
  
      wgpu[passEncoder]['drawIndexed'](indexCount, instanceCount, firstIndex, baseVertex, firstInstance);
    }

  function _wgpu_render_commands_mixin_draw_indexed_indirect(passEncoder, indirectBuffer, indirectOffset) {
      
      assert(passEncoder != 0, "assert(passEncoder != 0) failed!");
      assert(wgpu[passEncoder], "assert(wgpu[passEncoder]) failed!");
      assert(wgpu[passEncoder] instanceof GPURenderPassEncoder || wgpu[passEncoder] instanceof GPURenderBundleEncoder, "assert(wgpu[passEncoder] instanceof GPURenderPassEncoder || wgpu[passEncoder] instanceof GPURenderBundleEncoder) failed!");
      assert(wgpu[indirectBuffer] instanceof GPUBuffer, "assert(wgpu[indirectBuffer] instanceof GPUBuffer) failed!");
      assert(Number.isSafeInteger(indirectOffset), "assert(Number.isSafeInteger(indirectOffset)) failed!");
      assert(indirectOffset >= 0, "assert(indirectOffset >= 0) failed!");
  
      wgpu[passEncoder]['drawIndexedIndirect'](wgpu[indirectBuffer], indirectOffset);
    }

  function _wgpu_render_commands_mixin_draw_indirect(passEncoder, indirectBuffer, indirectOffset) {
      
      assert(passEncoder != 0, "assert(passEncoder != 0) failed!");
      assert(wgpu[passEncoder], "assert(wgpu[passEncoder]) failed!");
      assert(wgpu[passEncoder] instanceof GPURenderPassEncoder || wgpu[passEncoder] instanceof GPURenderBundleEncoder, "assert(wgpu[passEncoder] instanceof GPURenderPassEncoder || wgpu[passEncoder] instanceof GPURenderBundleEncoder) failed!");
      assert(wgpu[indirectBuffer] instanceof GPUBuffer, "assert(wgpu[indirectBuffer] instanceof GPUBuffer) failed!");
      assert(Number.isSafeInteger(indirectOffset), "assert(Number.isSafeInteger(indirectOffset)) failed!");
      assert(indirectOffset >= 0, "assert(indirectOffset >= 0) failed!");
  
      wgpu[passEncoder]['drawIndirect'](wgpu[indirectBuffer], indirectOffset);
    }

  function _wgpu_render_commands_mixin_set_index_buffer(passEncoder, buffer, indexFormat, offset, size) {
      
      assert(passEncoder != 0, "assert(passEncoder != 0) failed!");
      assert(wgpu[passEncoder], "assert(wgpu[passEncoder]) failed!");
      assert(wgpu[passEncoder] instanceof GPURenderPassEncoder || wgpu[passEncoder] instanceof GPURenderBundleEncoder, "assert(wgpu[passEncoder] instanceof GPURenderPassEncoder || wgpu[passEncoder] instanceof GPURenderBundleEncoder) failed!");
      assert(wgpu[buffer] instanceof GPUBuffer, "assert(wgpu[buffer] instanceof GPUBuffer) failed!");
      assert(Number.isSafeInteger(offset), "assert(Number.isSafeInteger(offset)) failed!");
      assert(offset >= 0, "assert(offset >= 0) failed!");
      assert(Number.isSafeInteger(size), "assert(Number.isSafeInteger(size)) failed!");
      assert(size >= -1, "assert(size >= -1) failed!");
  
      wgpu[passEncoder]['setIndexBuffer'](wgpu[buffer], GPUIndexFormats[indexFormat], offset, size < 0 ? void 0 : size);
    }

  function _wgpu_render_commands_mixin_set_vertex_buffer(passEncoder, slot, buffer, offset, size) {
      
      assert(passEncoder != 0, "assert(passEncoder != 0) failed!");
      assert(wgpu[passEncoder], "assert(wgpu[passEncoder]) failed!");
      assert(wgpu[passEncoder] instanceof GPURenderPassEncoder || wgpu[passEncoder] instanceof GPURenderBundleEncoder, "assert(wgpu[passEncoder] instanceof GPURenderPassEncoder || wgpu[passEncoder] instanceof GPURenderBundleEncoder) failed!");
      // N.b. buffer may be null here, in which case the existing buffer is intended to be unbound.
      assert(buffer == 0 || wgpu[buffer], "assert(buffer == 0 || wgpu[buffer]) failed!");
      assert(buffer == 0 || wgpu[buffer] instanceof GPUBuffer, "assert(buffer == 0 || wgpu[buffer] instanceof GPUBuffer) failed!");
      assert(buffer != 0 || offset == 0, "assert(buffer != 0 || offset == 0) failed!");
      assert(buffer != 0 || size <= 0, "assert(buffer != 0 || size <= 0) failed!");
      assert(Number.isSafeInteger(offset), "assert(Number.isSafeInteger(offset)) failed!");
      assert(offset >= 0, "assert(offset >= 0) failed!");
      assert(Number.isSafeInteger(size), "assert(Number.isSafeInteger(size)) failed!");
      assert(size >= -1, "assert(size >= -1) failed!");
  
      wgpu[passEncoder]['setVertexBuffer'](slot, wgpu[buffer], offset, size < 0 ? void 0 : size);
    }

  function _wgpu_render_pass_encoder_set_scissor_rect(encoder, x, y, width, height) {
      
      assert(encoder != 0, "assert(encoder != 0) failed!");
      assert(wgpu[encoder], "assert(wgpu[encoder]) failed!");
      assert(wgpu[encoder] instanceof GPURenderPassEncoder, "assert(wgpu[encoder] instanceof GPURenderPassEncoder) failed!");
      wgpu[encoder]['setScissorRect'](x, y, width, height);
    }

  function _wgpu_render_pass_encoder_set_stencil_reference(encoder, stencilValue) {
      
      assert(encoder != 0, "assert(encoder != 0) failed!");
      assert(wgpu[encoder], "assert(wgpu[encoder]) failed!");
      assert(wgpu[encoder] instanceof GPURenderPassEncoder, "assert(wgpu[encoder] instanceof GPURenderPassEncoder) failed!");
      wgpu[encoder]['setStencilReference'](stencilValue);
    }

  function _wgpu_render_pass_encoder_set_viewport(encoder, x, y, width, height, minDepth, maxDepth) {
      
      assert(encoder != 0, "assert(encoder != 0) failed!");
      assert(wgpu[encoder], "assert(wgpu[encoder]) failed!");
      assert(wgpu[encoder] instanceof GPURenderPassEncoder, "assert(wgpu[encoder] instanceof GPURenderPassEncoder) failed!");
      wgpu[encoder]['setViewport'](x, y, width, height, minDepth, maxDepth);
    }

  
  
  
  
  function _wgpu_texture_create_view(texture, descriptor) {
      
      assert(texture != 0, "assert(texture != 0) failed!");
      assert(wgpu[texture], "assert(wgpu[texture]) failed!");
      assert(wgpu[texture] instanceof GPUTexture, "assert(wgpu[texture] instanceof GPUTexture) failed!");
      texture = wgpu[texture];
  
      var descriptorIdx = wgpu_checked_shift(descriptor, 2),
        descriptorByteIdx = wgpu_checked_shift(descriptor, 0);
  
      let desc = descriptorIdx ? {
        'format': GPUTextureAndVertexFormats[HEAPU32[descriptorIdx]],
        'dimension': GPUTextureViewDimensions[HEAPU32[descriptorIdx+1]],
        'usage': HEAPU32[descriptorIdx+2],
        'aspect': GPUTextureAspects[HEAPU32[descriptorIdx+3]],
        'baseMipLevel': HEAP32[descriptorIdx+4],
        'mipLevelCount': HEAP32[descriptorIdx+5],
        'baseArrayLayer': HEAP32[descriptorIdx+6],
        'arrayLayerCount': HEAP32[descriptorIdx+7],
        'swizzle': UTF8ToString(descriptorByteIdx + 32) || 'rgba'
      } : void 0;
      ;
      return wgpuStoreAndSetParent(texture['createView'](desc), texture);
    }

  function _wgpu_texture_create_view_simple(texture) {
      
      assert(texture != 0, "assert(texture != 0) failed!");
      assert(wgpu[texture], "assert(wgpu[texture]) failed!");
      assert(wgpu[texture] instanceof GPUTexture, "assert(wgpu[texture] instanceof GPUTexture) failed!");
      texture = wgpu[texture];
      return wgpuStoreAndSetParent(texture['createView'](), texture);
    }




  var wasmTableMirror = [];
  
  
  var getWasmTableEntry = (funcPtr) => {
      var func = wasmTableMirror[funcPtr];
      if (!func) {
        /** @suppress {checkTypes} */
        wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
      }
      /** @suppress {checkTypes} */
      assert(wasmTable.get(funcPtr) == func, 'JavaScript-side Wasm function table mirror is out of date!');
      return func;
    };



  var FS_createPath = (...args) => FS.createPath(...args);


  var getCFunc = (ident) => {
      var func = Module['_' + ident]; // closure exported function
      assert(func, 'Cannot call unknown function ' + ident + ', make sure it is exported');
      return func;
    };
  
  var writeArrayToMemory = (array, buffer) => {
      assert(array.length >= 0, 'writeArrayToMemory array must have a length (should be an array or typed array)')
      HEAP8.set(array, buffer);
    };
  
  
  
  
  
  
    /**
     * @param {string|null=} returnType
     * @param {Array=} argTypes
     * @param {Array=} args
     * @param {Object=} opts
     */
  var ccall = (ident, returnType, argTypes, args, opts) => {
      // For fast lookup of conversion functions
      var toC = {
        'string': (str) => {
          var ret = 0;
          if (str !== null && str !== undefined && str !== 0) { // null string
            ret = stringToUTF8OnStack(str);
          }
          return ret;
        },
        'array': (arr) => {
          var ret = stackAlloc(arr.length);
          writeArrayToMemory(arr, ret);
          return ret;
        }
      };
  
      function convertReturnValue(ret) {
        if (returnType === 'string') {
          return UTF8ToString(ret);
        }
        if (returnType === 'boolean') return Boolean(ret);
        return ret;
      }
  
      var func = getCFunc(ident);
      var cArgs = [];
      var stack = 0;
      assert(returnType !== 'array', 'Return type should not be "array".');
      if (args) {
        for (var i = 0; i < args.length; i++) {
          var converter = toC[argTypes[i]];
          if (converter) {
            if (stack === 0) stack = stackSave();
            cArgs[i] = converter(args[i]);
          } else {
            cArgs[i] = args[i];
          }
        }
      }
      var ret = func(...cArgs);
      function onDone(ret) {
        if (stack !== 0) stackRestore(stack);
        return convertReturnValue(ret);
      }
  
      ret = onDone(ret);
      return ret;
    };

  
    /**
     * @param {string=} returnType
     * @param {Array=} argTypes
     * @param {Object=} opts
     */
  var cwrap = (ident, returnType, argTypes, opts) => {
      return (...args) => ccall(ident, returnType, argTypes, args, opts);
    };

  
  var stackTrace = () => {
      var js = jsStackTrace();
      if (Module['extraStackTrace']) js += '\n' + Module['extraStackTrace']();
      return js;
    };

  var incrementExceptionRefcount = (ptr) => ___cxa_increment_exception_refcount(ptr);

  var decrementExceptionRefcount = (ptr) => ___cxa_decrement_exception_refcount(ptr);

  
  
  
  
  
  var getExceptionMessageCommon = (ptr) => {
      var sp = stackSave();
      var type_addr_addr = stackAlloc(4);
      var message_addr_addr = stackAlloc(4);
      ___get_exception_message(ptr, type_addr_addr, message_addr_addr);
      var type_addr = HEAPU32[((type_addr_addr)>>2)];
      var message_addr = HEAPU32[((message_addr_addr)>>2)];
      var type = UTF8ToString(type_addr);
      _free(type_addr);
      var message;
      if (message_addr) {
        message = UTF8ToString(message_addr);
        _free(message_addr);
      }
      stackRestore(sp);
      return [type, message];
    };
  var getExceptionMessage = (ptr) => getExceptionMessageCommon(ptr);

      Module['requestAnimationFrame'] = MainLoop.requestAnimationFrame;
      Module['pauseMainLoop'] = MainLoop.pause;
      Module['resumeMainLoop'] = MainLoop.resume;
      MainLoop.init();;

  FS.createPreloadedFile = FS_createPreloadedFile;
  FS.preloadFile = FS_preloadFile;
  FS.staticInit();;

      // Signal GL rendering layer that processing of a new frame is about to
      // start. This helps it optimize VBO double-buffering and reduce GPU stalls.
      registerPreMainLoop(() => GL.newRenderingFrameStarted());
    ;
for (let i = 0; i < 32; ++i) tempFixedLengthArray.push(new Array(i));;
var miniTempWebGLFloatBuffersStorage = new Float32Array(288);
  // Create GL_POOL_TEMP_BUFFERS_SIZE+1 temporary buffers, for uploads of size 0 through GL_POOL_TEMP_BUFFERS_SIZE inclusive
  for (/**@suppress{duplicate}*/var i = 0; i <= 288; ++i) {
    miniTempWebGLFloatBuffers[i] = miniTempWebGLFloatBuffersStorage.subarray(0, i);
  };
var miniTempWebGLIntBuffersStorage = new Int32Array(288);
  // Create GL_POOL_TEMP_BUFFERS_SIZE+1 temporary buffers, for uploads of size 0 through GL_POOL_TEMP_BUFFERS_SIZE inclusive
  for (/**@suppress{duplicate}*/var i = 0; i <= 288; ++i) {
    miniTempWebGLIntBuffers[i] = miniTempWebGLIntBuffersStorage.subarray(0, i);
  };
// End JS library code

// include: postlibrary.js
// This file is included after the automatically-generated JS library code
// but before the wasm module is created.

{

  // Begin ATMODULES hooks
  if (Module['noExitRuntime']) noExitRuntime = Module['noExitRuntime'];
if (Module['preloadPlugins']) preloadPlugins = Module['preloadPlugins'];
if (Module['print']) out = Module['print'];
if (Module['printErr']) err = Module['printErr'];
if (Module['wasmBinary']) wasmBinary = Module['wasmBinary'];
  // End ATMODULES hooks

  checkIncomingModuleAPI();

  if (Module['arguments']) arguments_ = Module['arguments'];
  if (Module['thisProgram']) thisProgram = Module['thisProgram'];

  // Assertions on removed incoming Module JS APIs.
  assert(typeof Module['memoryInitializerPrefixURL'] == 'undefined', 'Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead');
  assert(typeof Module['pthreadMainPrefixURL'] == 'undefined', 'Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead');
  assert(typeof Module['cdInitializerPrefixURL'] == 'undefined', 'Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead');
  assert(typeof Module['filePackagePrefixURL'] == 'undefined', 'Module.filePackagePrefixURL option was removed, use Module.locateFile instead');
  assert(typeof Module['read'] == 'undefined', 'Module.read option was removed');
  assert(typeof Module['readAsync'] == 'undefined', 'Module.readAsync option was removed (modify readAsync in JS)');
  assert(typeof Module['readBinary'] == 'undefined', 'Module.readBinary option was removed (modify readBinary in JS)');
  assert(typeof Module['setWindowTitle'] == 'undefined', 'Module.setWindowTitle option was removed (modify emscripten_set_window_title in JS)');
  assert(typeof Module['TOTAL_MEMORY'] == 'undefined', 'Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY');
  assert(typeof Module['ENVIRONMENT'] == 'undefined', 'Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -sENVIRONMENT=web or -sENVIRONMENT=node)');
  assert(typeof Module['STACK_SIZE'] == 'undefined', 'STACK_SIZE can no longer be set at runtime.  Use -sSTACK_SIZE at link time')
  // If memory is defined in wasm, the user can't provide it, or set INITIAL_MEMORY
  assert(typeof Module['wasmMemory'] == 'undefined', 'Use of `wasmMemory` detected.  Use -sIMPORTED_MEMORY to define wasmMemory externally');
  assert(typeof Module['INITIAL_MEMORY'] == 'undefined', 'Detected runtime INITIAL_MEMORY setting.  Use -sIMPORTED_MEMORY to define wasmMemory dynamically');

  if (Module['preInit']) {
    if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
    while (Module['preInit'].length > 0) {
      Module['preInit'].shift()();
    }
  }
  consumedModuleProp('preInit');
}

// Begin runtime exports
  Module['addRunDependency'] = addRunDependency;
  Module['removeRunDependency'] = removeRunDependency;
  Module['ccall'] = ccall;
  Module['cwrap'] = cwrap;
  Module['FS_createPath'] = FS_createPath;
  Module['FS_createDataFile'] = FS_createDataFile;
  Module['stackTrace'] = stackTrace;
  var missingLibrarySymbols = [
  'writeI53ToI64Clamped',
  'writeI53ToI64Signaling',
  'writeI53ToU64Clamped',
  'writeI53ToU64Signaling',
  'convertU32PairToI53',
  'getTempRet0',
  'createNamedFunction',
  'withStackSave',
  'readEmAsmArgs',
  'autoResumeAudioContext',
  'getDynCaller',
  'runtimeKeepalivePush',
  'runtimeKeepalivePop',
  'asmjsMangle',
  'HandleAllocator',
  'addOnInit',
  'addOnPostCtor',
  'addOnPreMain',
  'STACK_SIZE',
  'STACK_ALIGN',
  'POINTER_SIZE',
  'ASSERTIONS',
  'convertJsFunctionToWasm',
  'getEmptyTableSlot',
  'updateTableMap',
  'getFunctionAddress',
  'addFunction',
  'removeFunction',
  'intArrayToString',
  'AsciiToString',
  'stringToAscii',
  'UTF16ToString',
  'stringToUTF16',
  'lengthBytesUTF16',
  'UTF32ToString',
  'stringToUTF32',
  'lengthBytesUTF32',
  'registerUiEventCallback',
  'fillDeviceOrientationEventData',
  'registerDeviceOrientationEventCallback',
  'fillDeviceMotionEventData',
  'registerDeviceMotionEventCallback',
  'screenOrientation',
  'fillOrientationChangeEventData',
  'registerOrientationChangeEventCallback',
  'hideEverythingExceptGivenElement',
  'restoreHiddenElements',
  'softFullscreenResizeWebGLRenderTarget',
  'registerPointerlockErrorEventCallback',
  'fillVisibilityChangeEventData',
  'registerVisibilityChangeEventCallback',
  'registerBeforeUnloadEventCallback',
  'fillBatteryEventData',
  'registerBatteryEventCallback',
  'convertPCtoSourceLocation',
  'wasiRightsToMuslOFlags',
  'wasiOFlagsToMuslOFlags',
  'safeSetTimeout',
  'setImmediateWrapped',
  'safeRequestAnimationFrame',
  'clearImmediateWrapped',
  'registerPostMainLoop',
  'getPromise',
  'makePromise',
  'idsToPromises',
  'makePromiseCallback',
  'Browser_asyncPrepareDataCounter',
  'arraySum',
  'addDays',
  'FS_mkdirTree',
  '_setNetworkCallback',
  'writeGLArray',
  'registerWebGlEventCallback',
  'runAndAbortIfError',
  'ALLOC_NORMAL',
  'ALLOC_STACK',
  'allocate',
  'writeStringToMemory',
  'writeAsciiToMemory',
  'allocateUTF8',
  'allocateUTF8OnStack',
  'demangle',
  'getNativeTypeSize',
  'wgpuPipelineCreationFailed',
  'wgpuOffscreenCanvasListener',
  'geolocationId',
  'JS_DeviceOrientationPermissions',
  'JS_CalculateHeading',
  'JS_OrientationEventHandler',
  'JS_RegisterCompass',
  'Microphone_UpdateDevices',
  'videoInstanceIdCounter',
  'jsVideoEnded',
  'jsVideoAllAudioTracksAreDisabled',
  'jsVideoAddPendingBlockedVideo',
  'jsVideoPlayPendingBlockedVideo',
  'jsVideoRemovePendingBlockedVideo',
  'jsVideoAttemptToPlayBlockedVideos',
  'jsVideoCreateTexture2D',
  'jsIsWebkit',
  'cameraAccess',
  'webgpu_LoadCache',
  'getStringHash',
  'storeWebGPUObjectCache',
];
missingLibrarySymbols.forEach(missingLibrarySymbol)

  var unexportedSymbols = [
  'run',
  'out',
  'err',
  'callMain',
  'abort',
  'wasmExports',
  'HEAPF32',
  'HEAP8',
  'HEAPU8',
  'HEAP16',
  'HEAPU16',
  'HEAP32',
  'HEAP64',
  'HEAPU64',
  'writeStackCookie',
  'checkStackCookie',
  'writeI53ToI64',
  'readI53FromI64',
  'readI53FromU64',
  'convertI32PairToI53',
  'convertI32PairToI53Checked',
  'stackSave',
  'stackRestore',
  'stackAlloc',
  'setTempRet0',
  'ptrToString',
  'zeroMemory',
  'exitJS',
  'getHeapMax',
  'abortOnCannotGrowMemory',
  'growMemory',
  'ENV',
  'ERRNO_CODES',
  'strError',
  'inetPton4',
  'inetNtop4',
  'inetPton6',
  'inetNtop6',
  'readSockaddr',
  'writeSockaddr',
  'DNS',
  'Protocols',
  'Sockets',
  'timers',
  'warnOnce',
  'readEmAsmArgsArray',
  'jstoi_q',
  'getExecutableName',
  'dynCallLegacy',
  'dynCall',
  'handleException',
  'keepRuntimeAlive',
  'callUserCallback',
  'maybeExit',
  'asyncLoad',
  'alignMemory',
  'mmapAlloc',
  'wasmTable',
  'wasmMemory',
  'getUniqueRunDependency',
  'noExitRuntime',
  'addOnPreRun',
  'addOnExit',
  'addOnPostRun',
  'freeTableIndexes',
  'functionsInTableMap',
  'setValue',
  'getValue',
  'PATH',
  'PATH_FS',
  'UTF8Decoder',
  'UTF8ArrayToString',
  'UTF8ToString',
  'stringToUTF8Array',
  'stringToUTF8',
  'lengthBytesUTF8',
  'intArrayFromString',
  'UTF16Decoder',
  'stringToNewUTF8',
  'stringToUTF8OnStack',
  'writeArrayToMemory',
  'JSEvents',
  'registerKeyEventCallback',
  'specialHTMLTargets',
  'maybeCStringToJsString',
  'findEventTarget',
  'findCanvasEventTarget',
  'getBoundingClientRect',
  'fillMouseEventData',
  'registerMouseEventCallback',
  'registerWheelEventCallback',
  'registerFocusEventCallback',
  'fillFullscreenChangeEventData',
  'registerFullscreenChangeEventCallback',
  'JSEvents_requestFullscreen',
  'JSEvents_resizeCanvasForFullscreen',
  'registerRestoreOldStyle',
  'setLetterbox',
  'currentFullscreenStrategy',
  'restoreOldWindowedStyle',
  'doRequestFullscreen',
  'fillPointerlockChangeEventData',
  'registerPointerlockChangeEventCallback',
  'requestPointerLock',
  'registerTouchEventCallback',
  'fillGamepadEventData',
  'registerGamepadEventCallback',
  'setCanvasElementSize',
  'getCanvasElementSize',
  'jsStackTrace',
  'getCallstack',
  'UNWIND_CACHE',
  'ExitStatus',
  'getEnvStrings',
  'checkWasiClock',
  'doReadv',
  'doWritev',
  'initRandomFill',
  'randomFill',
  'emSetImmediate',
  'emClearImmediate_deps',
  'emClearImmediate',
  'registerPreMainLoop',
  'promiseMap',
  'uncaughtExceptionCount',
  'exceptionLast',
  'exceptionCaught',
  'ExceptionInfo',
  'findMatchingCatch',
  'getExceptionMessageCommon',
  'Browser',
  'requestFullscreen',
  'requestFullScreen',
  'setCanvasSize',
  'getUserMedia',
  'createContext',
  'getPreloadedImageData__data',
  'wget',
  'MONTH_DAYS_REGULAR',
  'MONTH_DAYS_LEAP',
  'MONTH_DAYS_REGULAR_CUMULATIVE',
  'MONTH_DAYS_LEAP_CUMULATIVE',
  'isLeapYear',
  'ydayFromDate',
  'SYSCALLS',
  'getSocketFromFD',
  'getSocketAddress',
  'preloadPlugins',
  'FS_createPreloadedFile',
  'FS_preloadFile',
  'FS_modeStringToFlags',
  'FS_getMode',
  'FS_stdin_getChar_buffer',
  'FS_stdin_getChar',
  'FS_unlink',
  'FS_createDevice',
  'FS_readFile',
  'FS',
  'FS_root',
  'FS_mounts',
  'FS_devices',
  'FS_streams',
  'FS_nextInode',
  'FS_nameTable',
  'FS_currentPath',
  'FS_initialized',
  'FS_ignorePermissions',
  'FS_filesystems',
  'FS_syncFSRequests',
  'FS_readFiles',
  'FS_lookupPath',
  'FS_getPath',
  'FS_hashName',
  'FS_hashAddNode',
  'FS_hashRemoveNode',
  'FS_lookupNode',
  'FS_createNode',
  'FS_destroyNode',
  'FS_isRoot',
  'FS_isMountpoint',
  'FS_isFile',
  'FS_isDir',
  'FS_isLink',
  'FS_isChrdev',
  'FS_isBlkdev',
  'FS_isFIFO',
  'FS_isSocket',
  'FS_flagsToPermissionString',
  'FS_nodePermissions',
  'FS_mayLookup',
  'FS_mayCreate',
  'FS_mayDelete',
  'FS_mayOpen',
  'FS_checkOpExists',
  'FS_nextfd',
  'FS_getStreamChecked',
  'FS_getStream',
  'FS_createStream',
  'FS_closeStream',
  'FS_dupStream',
  'FS_doSetAttr',
  'FS_chrdev_stream_ops',
  'FS_major',
  'FS_minor',
  'FS_makedev',
  'FS_registerDevice',
  'FS_getDevice',
  'FS_getMounts',
  'FS_syncfs',
  'FS_mount',
  'FS_unmount',
  'FS_lookup',
  'FS_mknod',
  'FS_statfs',
  'FS_statfsStream',
  'FS_statfsNode',
  'FS_create',
  'FS_mkdir',
  'FS_mkdev',
  'FS_symlink',
  'FS_rename',
  'FS_rmdir',
  'FS_readdir',
  'FS_readlink',
  'FS_stat',
  'FS_fstat',
  'FS_lstat',
  'FS_doChmod',
  'FS_chmod',
  'FS_lchmod',
  'FS_fchmod',
  'FS_doChown',
  'FS_chown',
  'FS_lchown',
  'FS_fchown',
  'FS_doTruncate',
  'FS_truncate',
  'FS_ftruncate',
  'FS_utime',
  'FS_open',
  'FS_close',
  'FS_isClosed',
  'FS_llseek',
  'FS_read',
  'FS_write',
  'FS_mmap',
  'FS_msync',
  'FS_ioctl',
  'FS_writeFile',
  'FS_cwd',
  'FS_chdir',
  'FS_createDefaultDirectories',
  'FS_createDefaultDevices',
  'FS_createSpecialDirectories',
  'FS_createStandardStreams',
  'FS_staticInit',
  'FS_init',
  'FS_quit',
  'FS_findObject',
  'FS_analyzePath',
  'FS_createFile',
  'FS_forceLoadFile',
  'FS_createLazyFile',
  'FS_absolutePath',
  'FS_createFolder',
  'FS_createLink',
  'FS_joinPath',
  'FS_mmapAlloc',
  'FS_standardizePath',
  'MEMFS',
  'TTY',
  'PIPEFS',
  'SOCKFS',
  'tempFixedLengthArray',
  'miniTempWebGLFloatBuffers',
  'miniTempWebGLIntBuffers',
  'heapObjectForWebGLType',
  'toTypedArrayIndex',
  'webgl_enable_ANGLE_instanced_arrays',
  'webgl_enable_OES_vertex_array_object',
  'webgl_enable_WEBGL_draw_buffers',
  'webgl_enable_WEBGL_multi_draw',
  'webgl_enable_EXT_polygon_offset_clamp',
  'webgl_enable_EXT_clip_control',
  'webgl_enable_WEBGL_polygon_mode',
  'GL',
  'emscriptenWebGLGet',
  'computeUnpackAlignedImageSize',
  'colorChannelsInGlTextureFormat',
  'emscriptenWebGLGetTexPixelData',
  'emscriptenWebGLGetUniform',
  'webglGetUniformLocation',
  'webglPrepareUniformLocationsBeforeFirstUse',
  'webglGetLeftBracePos',
  'emscriptenWebGLGetVertexAttrib',
  '__glGetActiveAttribOrUniform',
  'webglApplyExplicitProgramBindings',
  'emscriptenWebGLGetBufferBinding',
  'emscriptenWebGLValidateMapBufferTarget',
  'AL',
  'GLUT',
  'EGL',
  'GLEW',
  'IDBStore',
  'SDL',
  'SDL_gfx',
  'emscriptenWebGLGetIndexed',
  'webgl_enable_WEBGL_draw_instanced_base_vertex_base_instance',
  'webgl_enable_WEBGL_multi_draw_instanced_base_vertex_base_instance',
  'remove_cpp_comments_in_shaders',
  'find_closing_parens_index',
  'preprocess_c_code',
  'print',
  'printErr',
  'jstoi_s',
  'WEBAudio',
  'jsAudioMixinSetPitch',
  'jsAudioGetMimeTypeFromType',
  'jsAudioCreateCompressedSoundClip',
  'jsAudioCreateUncompressedSoundClip',
  'jsAudioCreateUncompressedSoundClipFromPCM',
  'jsAudioCreateUncompressedSoundClipFromCompressedAudio',
  'jsAudioCreateChannel',
  'jsDomCssEscapeId',
  'jsCanvasSelector',
  'jsGetFileNameWithoutExtension',
  'jsIsDataUrlDownloaded',
  'jsGetSharedAssetsResourcePath',
  'wgpu',
  'wgpuOffscreenCanvases',
  'wgpuIdCounter',
  'wgpuStore',
  'wgpuLinkParentAndChild',
  'wgpuStoreAndSetParent',
  'wgpuReadArrayOfItemsMaybeNull',
  'wgpuReadArrayOfItems',
  'wgpuReadI53FromU64HeapIdx',
  'wgpuWriteI53ToU64HeapIdx',
  'wgpu_checked_shift',
  'utf8',
  'GPUTextureAndVertexFormats',
  'GPUBlendFactors',
  'GPUStencilOperations',
  'GPUCompareFunctions',
  'GPUBlendOperations',
  'GPUIndexFormats',
  'GPUTextureDimensions',
  'GPUTextureViewDimensions',
  'GPUStorageTextureSampleTypes',
  'GPUAddressModes',
  'GPUTextureAspects',
  'GPUPrimitiveTopologys',
  'GPUBufferBindingTypes',
  'GPUSamplerBindingTypes',
  'GPUTextureSampleTypes',
  'GPUQueryTypes',
  'HTMLPredefinedColorSpaces',
  'GPUFilterModes',
  'GPULoadOps',
  'GPUStoreOps',
  'GPUCanvasToneMappingModes',
  'GPUCanvasAlphaModes',
  'GPUAutoLayoutMode',
  'wgpuReadAdapterOptions',
  'wgpuReadSupportedLimits',
  'wgpuReadQueueDescriptor',
  'wgpuReadFeaturesBitfield',
  'wgpuReadDeviceDescriptor',
  'wgpuReadShaderModuleCompilationHints',
  'wgpuReadShaderModuleDescriptor',
  'wgpuReadGpuStencilFaceState',
  'wgpuReadGpuBlendComponent',
  'wgpuReadRenderPipelineDescriptor',
  'wgpuReadBindGroupLayoutDescriptor',
  'wgpuReadConstants',
  'wgpuReadComputePipelineDescriptor',
  'wgpuReadTimestampWrites',
  'wgpuReadRenderPassDepthStencilAttachment',
  'wgpuReadGpuTexelCopyBufferInfo',
  'wgpuReadGpuTexelCopyTextureInfo',
  'orientationEventHandler',
  'unregisterCompass',
  'isPushedToDeinitializer',
  'LogErrorWithAdditionalInformation',
  'ExceptionsSeen',
  'MediaAccessState',
  'Microphone_Access',
  'Microphone_DeviceChangeHandlerAttached',
  'Microphones',
  'Microphone_GetMediaStream',
  'Microphone_CopyAudioBuffer',
  'Microphone_DecompressAudioBuffer',
  'Microphone_CreateSoundClipForRecording',
  'mobile_input',
  'mobile_input_text',
  'mobile_input_hide_delay',
  'mobile_input_ignore_blur_event',
  'ConnectToProfiler',
  'JS_ScreenOrientation_callback',
  'JS_ScreenOrientation_eventHandler',
  'JS_ScreenOrientation_requestedLockType',
  'JS_ScreenOrientation_appliedLockType',
  'JS_ScreenOrientation_timeoutID',
  'SendMessage',
  'JS_OrientationSensor_frequencyRequest',
  'JS_OrientationSensor_callback',
  'JS_OrientationSensor',
  'JS_Accelerometer_frequencyRequest',
  'JS_Accelerometer_callback',
  'JS_Accelerometer',
  'JS_Accelerometer_multiplier',
  'JS_LinearAccelerationSensor_frequencyRequest',
  'JS_LinearAccelerationSensor_callback',
  'JS_LinearAccelerationSensor',
  'JS_GravitySensor_frequencyRequest',
  'JS_GravitySensor_callback',
  'JS_GravitySensor',
  'JS_Accelerometer_frequency',
  'JS_Accelerometer_lastValue',
  'JS_LinearAccelerationSensor_frequency',
  'JS_Gyroscope_frequencyRequest',
  'JS_Gyroscope_callback',
  'JS_Gyroscope',
  'JS_DeviceSensorPermissions',
  'JS_DefineAccelerometerMultiplier',
  'JS_RequestDeviceSensorPermissions',
  'JS_OrientationSensor_eventHandler',
  'JS_Accelerometer_eventHandler',
  'JS_ComputeGravity',
  'JS_LinearAccelerationSensor_eventHandler',
  'JS_GravitySensor_eventHandler',
  'JS_Gyroscope_eventHandler',
  'JS_DeviceOrientation_eventHandler',
  'JS_DeviceMotion_eventHandler',
  'JS_DeviceMotion_add',
  'JS_DeviceMotion_remove',
  'videoInstances',
  'hasSRGBATextures',
  's2lTexture',
  's2lFBO',
  's2lVBO',
  's2lProgram',
  's2lVertexPositionNDC',
  'jsVideoPendingBlockedVideos',
  'jsSupportedVideoFormats',
  'jsUnsupportedVideoFormats',
  'activeWebCams',
  'webgpu_cache_database',
  'webgpu_cache',
  'webgpu_buildID',
  'wr',
  'jsWebRequestGetResponseHeaderString',
  'IDBFS',
];
unexportedSymbols.forEach(unexportedRuntimeSymbol);

  // End runtime exports
  // Begin JS library exports
  Module['incrementExceptionRefcount'] = incrementExceptionRefcount;
  Module['decrementExceptionRefcount'] = decrementExceptionRefcount;
  Module['getExceptionMessage'] = getExceptionMessage;
  // End JS library exports

// end include: postlibrary.js

function checkIncomingModuleAPI() {
  ignoredModuleProp('fetchSettings');
}

// Imports from the Wasm binary.
var _GetFakemodTimeInSeconds = Module['_GetFakemodTimeInSeconds'] = makeInvalidEarlyAccess('_GetFakemodTimeInSeconds');
var _ConnectToProfiler = Module['_ConnectToProfiler'] = makeInvalidEarlyAccess('_ConnectToProfiler');
var _StopProfiling = Module['_StopProfiling'] = makeInvalidEarlyAccess('_StopProfiling');
var _IsConnectedToProfiler = Module['_IsConnectedToProfiler'] = makeInvalidEarlyAccess('_IsConnectedToProfiler');
var _ReleaseKeys = Module['_ReleaseKeys'] = makeInvalidEarlyAccess('_ReleaseKeys');
var _GetCopyBufferAsCStr = Module['_GetCopyBufferAsCStr'] = makeInvalidEarlyAccess('_GetCopyBufferAsCStr');
var _GetMetricsInfo = Module['_GetMetricsInfo'] = makeInvalidEarlyAccess('_GetMetricsInfo');
var _main = Module['_main'] = makeInvalidEarlyAccess('_main');
var _SendMessageNumber = Module['_SendMessageNumber'] = makeInvalidEarlyAccess('_SendMessageNumber');
var _SendMessageString = Module['_SendMessageString'] = makeInvalidEarlyAccess('_SendMessageString');
var _SendMessage = Module['_SendMessage'] = makeInvalidEarlyAccess('_SendMessage');
var _SetFullscreen = Module['_SetFullscreen'] = makeInvalidEarlyAccess('_SetFullscreen');
var _SendPasteEvent = Module['_SendPasteEvent'] = makeInvalidEarlyAccess('_SendPasteEvent');
var _fflush = makeInvalidEarlyAccess('_fflush');
var _htonl = makeInvalidEarlyAccess('_htonl');
var _htons = makeInvalidEarlyAccess('_htons');
var _ntohs = makeInvalidEarlyAccess('_ntohs');
var _strerror = makeInvalidEarlyAccess('_strerror');
var _malloc = makeInvalidEarlyAccess('_malloc');
var _free = makeInvalidEarlyAccess('_free');
var _setThrew = makeInvalidEarlyAccess('_setThrew');
var __emscripten_tempret_set = makeInvalidEarlyAccess('__emscripten_tempret_set');
var _emscripten_stack_init = makeInvalidEarlyAccess('_emscripten_stack_init');
var _emscripten_stack_get_free = makeInvalidEarlyAccess('_emscripten_stack_get_free');
var _emscripten_stack_get_base = makeInvalidEarlyAccess('_emscripten_stack_get_base');
var _emscripten_stack_get_end = makeInvalidEarlyAccess('_emscripten_stack_get_end');
var __emscripten_stack_restore = makeInvalidEarlyAccess('__emscripten_stack_restore');
var __emscripten_stack_alloc = makeInvalidEarlyAccess('__emscripten_stack_alloc');
var _emscripten_stack_get_current = makeInvalidEarlyAccess('_emscripten_stack_get_current');
var ___cxa_free_exception = makeInvalidEarlyAccess('___cxa_free_exception');
var ___cxa_increment_exception_refcount = makeInvalidEarlyAccess('___cxa_increment_exception_refcount');
var ___cxa_decrement_exception_refcount = makeInvalidEarlyAccess('___cxa_decrement_exception_refcount');
var ___get_exception_message = makeInvalidEarlyAccess('___get_exception_message');
var ___cxa_can_catch = makeInvalidEarlyAccess('___cxa_can_catch');
var ___cxa_get_exception_ptr = makeInvalidEarlyAccess('___cxa_get_exception_ptr');
var dynCall_ii = makeInvalidEarlyAccess('dynCall_ii');
var dynCall_iiii = makeInvalidEarlyAccess('dynCall_iiii');
var dynCall_jiji = makeInvalidEarlyAccess('dynCall_jiji');
var dynCall_iidiiii = makeInvalidEarlyAccess('dynCall_iidiiii');
var dynCall_vii = makeInvalidEarlyAccess('dynCall_vii');
var dynCall_v = makeInvalidEarlyAccess('dynCall_v');
var dynCall_vi = makeInvalidEarlyAccess('dynCall_vi');
var dynCall_viiii = makeInvalidEarlyAccess('dynCall_viiii');
var dynCall_iii = makeInvalidEarlyAccess('dynCall_iii');
var dynCall_viii = makeInvalidEarlyAccess('dynCall_viii');
var dynCall_viiiiiii = makeInvalidEarlyAccess('dynCall_viiiiiii');
var dynCall_iiiiii = makeInvalidEarlyAccess('dynCall_iiiiii');
var dynCall_viiiii = makeInvalidEarlyAccess('dynCall_viiiii');
var dynCall_iiiiiiii = makeInvalidEarlyAccess('dynCall_iiiiiiii');
var dynCall_iiiiiiiiiii = makeInvalidEarlyAccess('dynCall_iiiiiiiiiii');
var dynCall_iiiii = makeInvalidEarlyAccess('dynCall_iiiii');
var dynCall_jiiii = makeInvalidEarlyAccess('dynCall_jiiii');
var dynCall_iiiiiiiiiiiii = makeInvalidEarlyAccess('dynCall_iiiiiiiiiiiii');
var dynCall_fiii = makeInvalidEarlyAccess('dynCall_fiii');
var dynCall_diii = makeInvalidEarlyAccess('dynCall_diii');
var dynCall_i = makeInvalidEarlyAccess('dynCall_i');
var dynCall_iiiiiii = makeInvalidEarlyAccess('dynCall_iiiiiii');
var dynCall_iiiiiiiiiiii = makeInvalidEarlyAccess('dynCall_iiiiiiiiiiii');
var dynCall_viiiiiiiiii = makeInvalidEarlyAccess('dynCall_viiiiiiiiii');
var dynCall_viiiiiiiiiiiiiii = makeInvalidEarlyAccess('dynCall_viiiiiiiiiiiiiii');
var dynCall_iiiiiiiii = makeInvalidEarlyAccess('dynCall_iiiiiiiii');
var dynCall_iiiiij = makeInvalidEarlyAccess('dynCall_iiiiij');
var dynCall_iiiiid = makeInvalidEarlyAccess('dynCall_iiiiid');
var dynCall_iiiiijj = makeInvalidEarlyAccess('dynCall_iiiiijj');
var dynCall_iiiiiijj = makeInvalidEarlyAccess('dynCall_iiiiiijj');
var dynCall_viiiiii = makeInvalidEarlyAccess('dynCall_viiiiii');
var dynCall_viijii = makeInvalidEarlyAccess('dynCall_viijii');
var dynCall_iiijiii = makeInvalidEarlyAccess('dynCall_iiijiii');
var dynCall_iij = makeInvalidEarlyAccess('dynCall_iij');
var dynCall_jii = makeInvalidEarlyAccess('dynCall_jii');
var dynCall_viiiiiiii = makeInvalidEarlyAccess('dynCall_viiiiiiii');
var dynCall_j = makeInvalidEarlyAccess('dynCall_j');
var dynCall_iiiijii = makeInvalidEarlyAccess('dynCall_iiiijii');
var dynCall_iji = makeInvalidEarlyAccess('dynCall_iji');
var dynCall_jjji = makeInvalidEarlyAccess('dynCall_jjji');
var dynCall_jiiiii = makeInvalidEarlyAccess('dynCall_jiiiii');
var dynCall_iijiii = makeInvalidEarlyAccess('dynCall_iijiii');
var dynCall_vijii = makeInvalidEarlyAccess('dynCall_vijii');
var dynCall_fifi = makeInvalidEarlyAccess('dynCall_fifi');
var dynCall_vifi = makeInvalidEarlyAccess('dynCall_vifi');
var dynCall_viifi = makeInvalidEarlyAccess('dynCall_viifi');
var dynCall_iiiidii = makeInvalidEarlyAccess('dynCall_iiiidii');
var dynCall_fii = makeInvalidEarlyAccess('dynCall_fii');
var dynCall_viji = makeInvalidEarlyAccess('dynCall_viji');
var dynCall_viiji = makeInvalidEarlyAccess('dynCall_viiji');
var dynCall_vidi = makeInvalidEarlyAccess('dynCall_vidi');
var dynCall_viidi = makeInvalidEarlyAccess('dynCall_viidi');
var dynCall_viiifi = makeInvalidEarlyAccess('dynCall_viiifi');
var dynCall_viiiiiiiii = makeInvalidEarlyAccess('dynCall_viiiiiiiii');
var dynCall_ffii = makeInvalidEarlyAccess('dynCall_ffii');
var dynCall_viiiiiiiiiiiii = makeInvalidEarlyAccess('dynCall_viiiiiiiiiiiii');
var dynCall_iiiiifi = makeInvalidEarlyAccess('dynCall_iiiiifi');
var dynCall_iffi = makeInvalidEarlyAccess('dynCall_iffi');
var dynCall_viiiiifi = makeInvalidEarlyAccess('dynCall_viiiiifi');
var dynCall_viiiiiiiiiiiffiiiiiiiiii = makeInvalidEarlyAccess('dynCall_viiiiiiiiiiiffiiiiiiiiii');
var dynCall_viffi = makeInvalidEarlyAccess('dynCall_viffi');
var dynCall_ffi = makeInvalidEarlyAccess('dynCall_ffi');
var dynCall_viiffffi = makeInvalidEarlyAccess('dynCall_viiffffi');
var dynCall_fi = makeInvalidEarlyAccess('dynCall_fi');
var dynCall_iiji = makeInvalidEarlyAccess('dynCall_iiji');
var dynCall_iiiiiiifiiii = makeInvalidEarlyAccess('dynCall_iiiiiiifiiii');
var dynCall_iiiifiiii = makeInvalidEarlyAccess('dynCall_iiiifiiii');
var dynCall_iiiifii = makeInvalidEarlyAccess('dynCall_iiiifii');
var dynCall_iiifii = makeInvalidEarlyAccess('dynCall_iiifii');
var dynCall_viiiifii = makeInvalidEarlyAccess('dynCall_viiiifii');
var dynCall_dddi = makeInvalidEarlyAccess('dynCall_dddi');
var dynCall_fffi = makeInvalidEarlyAccess('dynCall_fffi');
var dynCall_viffiiiii = makeInvalidEarlyAccess('dynCall_viffiiiii');
var dynCall_viiidi = makeInvalidEarlyAccess('dynCall_viiidi');
var dynCall_viiiiiiiiiii = makeInvalidEarlyAccess('dynCall_viiiiiiiiiii');
var dynCall_iiiiiffiffiiiiiiiiiiii = makeInvalidEarlyAccess('dynCall_iiiiiffiffiiiiiiiiiiii');
var dynCall_viiiiffiiifiiii = makeInvalidEarlyAccess('dynCall_viiiiffiiifiiii');
var dynCall_vffi = makeInvalidEarlyAccess('dynCall_vffi');
var dynCall_iifii = makeInvalidEarlyAccess('dynCall_iifii');
var dynCall_vfi = makeInvalidEarlyAccess('dynCall_vfi');
var dynCall_fiiii = makeInvalidEarlyAccess('dynCall_fiiii');
var dynCall_dii = makeInvalidEarlyAccess('dynCall_dii');
var dynCall_iiifiiiiiii = makeInvalidEarlyAccess('dynCall_iiifiiiiiii');
var dynCall_iidi = makeInvalidEarlyAccess('dynCall_iidi');
var dynCall_iifi = makeInvalidEarlyAccess('dynCall_iifi');
var dynCall_ddiii = makeInvalidEarlyAccess('dynCall_ddiii');
var dynCall_iiiiiiiiii = makeInvalidEarlyAccess('dynCall_iiiiiiiiii');
var dynCall_vifiiiii = makeInvalidEarlyAccess('dynCall_vifiiiii');
var dynCall_viffffffi = makeInvalidEarlyAccess('dynCall_viffffffi');
var dynCall_viiifii = makeInvalidEarlyAccess('dynCall_viiifii');
var dynCall_viiiiiiifiiiiii = makeInvalidEarlyAccess('dynCall_viiiiiiifiiiiii');
var dynCall_iiijii = makeInvalidEarlyAccess('dynCall_iiijii');
var dynCall_iiifi = makeInvalidEarlyAccess('dynCall_iiifi');
var dynCall_fiffffi = makeInvalidEarlyAccess('dynCall_fiffffi');
var dynCall_jiii = makeInvalidEarlyAccess('dynCall_jiii');
var dynCall_iiddi = makeInvalidEarlyAccess('dynCall_iiddi');
var dynCall_iijji = makeInvalidEarlyAccess('dynCall_iijji');
var dynCall_iiffi = makeInvalidEarlyAccess('dynCall_iiffi');
var dynCall_viififiii = makeInvalidEarlyAccess('dynCall_viififiii');
var dynCall_fiiffi = makeInvalidEarlyAccess('dynCall_fiiffi');
var dynCall_viififiiii = makeInvalidEarlyAccess('dynCall_viififiiii');
var dynCall_vififiiii = makeInvalidEarlyAccess('dynCall_vififiiii');
var dynCall_fiffi = makeInvalidEarlyAccess('dynCall_fiffi');
var dynCall_iiiifi = makeInvalidEarlyAccess('dynCall_iiiifi');
var dynCall_iiiffi = makeInvalidEarlyAccess('dynCall_iiiffi');
var dynCall_viiiifi = makeInvalidEarlyAccess('dynCall_viiiifi');
var dynCall_fiiiii = makeInvalidEarlyAccess('dynCall_fiiiii');
var dynCall_vifii = makeInvalidEarlyAccess('dynCall_vifii');
var dynCall_iiiiiiiiiiiiii = makeInvalidEarlyAccess('dynCall_iiiiiiiiiiiiii');
var dynCall_di = makeInvalidEarlyAccess('dynCall_di');
var dynCall_viiiji = makeInvalidEarlyAccess('dynCall_viiiji');
var dynCall_viiffi = makeInvalidEarlyAccess('dynCall_viiffi');
var dynCall_viidiji = makeInvalidEarlyAccess('dynCall_viidiji');
var dynCall_viidjii = makeInvalidEarlyAccess('dynCall_viidjii');
var dynCall_jijii = makeInvalidEarlyAccess('dynCall_jijii');
var dynCall_iiiiiiiiiji = makeInvalidEarlyAccess('dynCall_iiiiiiiiiji');
var dynCall_vji = makeInvalidEarlyAccess('dynCall_vji');
var dynCall_diiii = makeInvalidEarlyAccess('dynCall_diiii');
var dynCall_iiidii = makeInvalidEarlyAccess('dynCall_iiidii');
var dynCall_jiijii = makeInvalidEarlyAccess('dynCall_jiijii');
var dynCall_viijiii = makeInvalidEarlyAccess('dynCall_viijiii');
var dynCall_viiijiii = makeInvalidEarlyAccess('dynCall_viiijiii');
var dynCall_jiiji = makeInvalidEarlyAccess('dynCall_jiiji');
var dynCall_jiiijii = makeInvalidEarlyAccess('dynCall_jiiijii');
var dynCall_viiiidi = makeInvalidEarlyAccess('dynCall_viiiidi');
var dynCall_iiiiiiidii = makeInvalidEarlyAccess('dynCall_iiiiiiidii');
var dynCall_viiidiii = makeInvalidEarlyAccess('dynCall_viiidiii');
var dynCall_iiiiidii = makeInvalidEarlyAccess('dynCall_iiiiidii');
var dynCall_viiiiidi = makeInvalidEarlyAccess('dynCall_viiiiidi');
var dynCall_ji = makeInvalidEarlyAccess('dynCall_ji');
var dynCall_viiiifiiii = makeInvalidEarlyAccess('dynCall_viiiifiiii');
var dynCall_viiiiifiiii = makeInvalidEarlyAccess('dynCall_viiiiifiiii');
var dynCall_diiiii = makeInvalidEarlyAccess('dynCall_diiiii');
var dynCall_vijiii = makeInvalidEarlyAccess('dynCall_vijiii');
var dynCall_ijji = makeInvalidEarlyAccess('dynCall_ijji');
var dynCall_vjjjiiii = makeInvalidEarlyAccess('dynCall_vjjjiiii');
var dynCall_vjiiiii = makeInvalidEarlyAccess('dynCall_vjiiiii');
var dynCall_iijii = makeInvalidEarlyAccess('dynCall_iijii');
var dynCall_iiffii = makeInvalidEarlyAccess('dynCall_iiffii');
var dynCall_iiifiii = makeInvalidEarlyAccess('dynCall_iiifiii');
var dynCall_iiififii = makeInvalidEarlyAccess('dynCall_iiififii');
var dynCall_iiifiiiii = makeInvalidEarlyAccess('dynCall_iiifiiiii');
var dynCall_iiffifiiii = makeInvalidEarlyAccess('dynCall_iiffifiiii');
var dynCall_iifiifiiii = makeInvalidEarlyAccess('dynCall_iifiifiiii');
var dynCall_iiiifiii = makeInvalidEarlyAccess('dynCall_iiiifiii');
var dynCall_iiifiiii = makeInvalidEarlyAccess('dynCall_iiifiiii');
var dynCall_iiiffiii = makeInvalidEarlyAccess('dynCall_iiiffiii');
var dynCall_iiiiifii = makeInvalidEarlyAccess('dynCall_iiiiifii');
var dynCall_iiifffffii = makeInvalidEarlyAccess('dynCall_iiifffffii');
var dynCall_jji = makeInvalidEarlyAccess('dynCall_jji');
var dynCall_viffiii = makeInvalidEarlyAccess('dynCall_viffiii');
var dynCall_ijiiiii = makeInvalidEarlyAccess('dynCall_ijiiiii');
var dynCall_iijiiii = makeInvalidEarlyAccess('dynCall_iijiiii');
var dynCall_viiiiijijii = makeInvalidEarlyAccess('dynCall_viiiiijijii');
var dynCall_viiijii = makeInvalidEarlyAccess('dynCall_viiijii');
var dynCall_viiiiiijijii = makeInvalidEarlyAccess('dynCall_viiiiiijijii');
var dynCall_viijji = makeInvalidEarlyAccess('dynCall_viijji');
var dynCall_vijji = makeInvalidEarlyAccess('dynCall_vijji');
var dynCall_vijiji = makeInvalidEarlyAccess('dynCall_vijiji');
var dynCall_iiffffiii = makeInvalidEarlyAccess('dynCall_iiffffiii');
var dynCall_iiidfi = makeInvalidEarlyAccess('dynCall_iiidfi');
var dynCall_iiijfi = makeInvalidEarlyAccess('dynCall_iiijfi');
var dynCall_iiiffii = makeInvalidEarlyAccess('dynCall_iiiffii');
var dynCall_iifffi = makeInvalidEarlyAccess('dynCall_iifffi');
var dynCall_iiiififi = makeInvalidEarlyAccess('dynCall_iiiififi');
var dynCall_iiiffifiiii = makeInvalidEarlyAccess('dynCall_iiiffifiiii');
var dynCall_iiifiifiii = makeInvalidEarlyAccess('dynCall_iiifiifiii');
var dynCall_iiifiifiiiii = makeInvalidEarlyAccess('dynCall_iiifiifiiiii');
var dynCall_ifii = makeInvalidEarlyAccess('dynCall_ifii');
var dynCall_ifffii = makeInvalidEarlyAccess('dynCall_ifffii');
var dynCall_ffffii = makeInvalidEarlyAccess('dynCall_ffffii');
var dynCall_ffffifi = makeInvalidEarlyAccess('dynCall_ffffifi');
var dynCall_ffffiffi = makeInvalidEarlyAccess('dynCall_ffffiffi');
var dynCall_viiififi = makeInvalidEarlyAccess('dynCall_viiififi');
var dynCall_viiififfi = makeInvalidEarlyAccess('dynCall_viiififfi');
var dynCall_ifiii = makeInvalidEarlyAccess('dynCall_ifiii');
var dynCall_vifiii = makeInvalidEarlyAccess('dynCall_vifiii');
var dynCall_iifiiiiii = makeInvalidEarlyAccess('dynCall_iifiiiiii');
var dynCall_iifiiiii = makeInvalidEarlyAccess('dynCall_iifiiiii');
var dynCall_iiffiiiii = makeInvalidEarlyAccess('dynCall_iiffiiiii');
var dynCall_iiffifiii = makeInvalidEarlyAccess('dynCall_iiffifiii');
var dynCall_iifiifiii = makeInvalidEarlyAccess('dynCall_iifiifiii');
var dynCall_iififi = makeInvalidEarlyAccess('dynCall_iififi');
var dynCall_iiififi = makeInvalidEarlyAccess('dynCall_iiififi');
var dynCall_iifiii = makeInvalidEarlyAccess('dynCall_iifiii');
var dynCall_iiiiifiiii = makeInvalidEarlyAccess('dynCall_iiiiifiiii');
var dynCall_fiifii = makeInvalidEarlyAccess('dynCall_fiifii');
var dynCall_viiiiiifiifiiii = makeInvalidEarlyAccess('dynCall_viiiiiifiifiiii');
var dynCall_viidiii = makeInvalidEarlyAccess('dynCall_viidiii');
var dynCall_diidi = makeInvalidEarlyAccess('dynCall_diidi');
var dynCall_fiifdi = makeInvalidEarlyAccess('dynCall_fiifdi');
var dynCall_viiiiiifddfiiii = makeInvalidEarlyAccess('dynCall_viiiiiifddfiiii');
var dynCall_fiifji = makeInvalidEarlyAccess('dynCall_fiifji');
var dynCall_viiiiiifjjfiiii = makeInvalidEarlyAccess('dynCall_viiiiiifjjfiiii');
var dynCall_viiiifiii = makeInvalidEarlyAccess('dynCall_viiiifiii');
var dynCall_viifiii = makeInvalidEarlyAccess('dynCall_viifiii');
var dynCall_fiifi = makeInvalidEarlyAccess('dynCall_fiifi');
var dynCall_viiiiiiffffiiii = makeInvalidEarlyAccess('dynCall_viiiiiiffffiiii');
var dynCall_viifiiii = makeInvalidEarlyAccess('dynCall_viifiiii');
var dynCall_viifii = makeInvalidEarlyAccess('dynCall_viifii');
var dynCall_iiiiifiii = makeInvalidEarlyAccess('dynCall_iiiiifiii');
var dynCall_fffffi = makeInvalidEarlyAccess('dynCall_fffffi');
var dynCall_fiiffffi = makeInvalidEarlyAccess('dynCall_fiiffffi');
var dynCall_fffifffi = makeInvalidEarlyAccess('dynCall_fffifffi');
var dynCall_viiiiffi = makeInvalidEarlyAccess('dynCall_viiiiffi');
var dynCall_viiiffi = makeInvalidEarlyAccess('dynCall_viiiffi');
var dynCall_viffffi = makeInvalidEarlyAccess('dynCall_viffffi');
var dynCall_viifiifi = makeInvalidEarlyAccess('dynCall_viifiifi');
var dynCall_vifiifi = makeInvalidEarlyAccess('dynCall_vifiifi');
var dynCall_viffii = makeInvalidEarlyAccess('dynCall_viffii');
var dynCall_viiffii = makeInvalidEarlyAccess('dynCall_viiffii');
var dynCall_viddfffi = makeInvalidEarlyAccess('dynCall_viddfffi');
var dynCall_viidfffi = makeInvalidEarlyAccess('dynCall_viidfffi');
var dynCall_vidifffi = makeInvalidEarlyAccess('dynCall_vidifffi');
var dynCall_viiifffi = makeInvalidEarlyAccess('dynCall_viiifffi');
var dynCall_viddi = makeInvalidEarlyAccess('dynCall_viddi');
var dynCall_vidii = makeInvalidEarlyAccess('dynCall_vidii');
var dynCall_viiiiiiifi = makeInvalidEarlyAccess('dynCall_viiiiiiifi');
var dynCall_viiiiffffffffii = makeInvalidEarlyAccess('dynCall_viiiiffffffffii');
var dynCall_viidii = makeInvalidEarlyAccess('dynCall_viidii');
var dynCall_iddi = makeInvalidEarlyAccess('dynCall_iddi');
var dynCall_ifi = makeInvalidEarlyAccess('dynCall_ifi');
var dynCall_idi = makeInvalidEarlyAccess('dynCall_idi');
var dynCall_ffffi = makeInvalidEarlyAccess('dynCall_ffffi');
var dynCall_ddddi = makeInvalidEarlyAccess('dynCall_ddddi');
var dynCall_ddi = makeInvalidEarlyAccess('dynCall_ddi');
var dynCall_iiiji = makeInvalidEarlyAccess('dynCall_iiiji');
var dynCall_viiiiiiiiiiiiii = makeInvalidEarlyAccess('dynCall_viiiiiiiiiiiiii');
var dynCall_iiiiji = makeInvalidEarlyAccess('dynCall_iiiiji');
var dynCall_iiiiiji = makeInvalidEarlyAccess('dynCall_iiiiiji');
var dynCall_ifiiifiiiiiii = makeInvalidEarlyAccess('dynCall_ifiiifiiiiiii');
var dynCall_jjii = makeInvalidEarlyAccess('dynCall_jjii');
var dynCall_ijiiiiiiiii = makeInvalidEarlyAccess('dynCall_ijiiiiiiiii');
var dynCall_viiidii = makeInvalidEarlyAccess('dynCall_viiidii');
var dynCall_ijiii = makeInvalidEarlyAccess('dynCall_ijiii');
var dynCall_ijjiii = makeInvalidEarlyAccess('dynCall_ijjiii');
var dynCall_jjjii = makeInvalidEarlyAccess('dynCall_jjjii');
var dynCall_fji = makeInvalidEarlyAccess('dynCall_fji');
var dynCall_dji = makeInvalidEarlyAccess('dynCall_dji');
var dynCall_vjii = makeInvalidEarlyAccess('dynCall_vjii');
var dynCall_ijii = makeInvalidEarlyAccess('dynCall_ijii');
var dynCall_ijiiii = makeInvalidEarlyAccess('dynCall_ijiiii');
var dynCall_iiiifiiiiii = makeInvalidEarlyAccess('dynCall_iiiifiiiiii');
var dynCall_iiiifiiiii = makeInvalidEarlyAccess('dynCall_iiiifiiiii');
var dynCall_iffffi = makeInvalidEarlyAccess('dynCall_iffffi');
var dynCall_viiiiiiiiiiii = makeInvalidEarlyAccess('dynCall_viiiiiiiiiiii');
var dynCall_vfffi = makeInvalidEarlyAccess('dynCall_vfffi');
var dynCall_vifffi = makeInvalidEarlyAccess('dynCall_vifffi');
var dynCall_vffffi = makeInvalidEarlyAccess('dynCall_vffffi');
var dynCall_viiiffii = makeInvalidEarlyAccess('dynCall_viiiffii');
var dynCall_vffffffii = makeInvalidEarlyAccess('dynCall_vffffffii');
var dynCall_vffffii = makeInvalidEarlyAccess('dynCall_vffffii');
var dynCall_vfiii = makeInvalidEarlyAccess('dynCall_vfiii');
var dynCall_fdi = makeInvalidEarlyAccess('dynCall_fdi');
var dynCall_vfii = makeInvalidEarlyAccess('dynCall_vfii');
var dynCall_vjiiii = makeInvalidEarlyAccess('dynCall_vjiiii');
var dynCall_viifffi = makeInvalidEarlyAccess('dynCall_viifffi');
var dynCall_vijiiii = makeInvalidEarlyAccess('dynCall_vijiiii');
var dynCall_viiijiiii = makeInvalidEarlyAccess('dynCall_viiijiiii');
var dynCall_viiiijiii = makeInvalidEarlyAccess('dynCall_viiiijiii');
var dynCall_vijjii = makeInvalidEarlyAccess('dynCall_vijjii');
var dynCall_vjji = makeInvalidEarlyAccess('dynCall_vjji');
var dynCall_viiiiiiiijijiiiii = makeInvalidEarlyAccess('dynCall_viiiiiiiijijiiiii');
var dynCall_viiiiiiiiiiifii = makeInvalidEarlyAccess('dynCall_viiiiiiiiiiifii');
var dynCall_viiiiiiiiiifiii = makeInvalidEarlyAccess('dynCall_viiiiiiiiiifiii');
var dynCall_viiiiidddddii = makeInvalidEarlyAccess('dynCall_viiiiidddddii');
var dynCall_viiiiiiiiidddddii = makeInvalidEarlyAccess('dynCall_viiiiiiiiidddddii');
var dynCall_ifffi = makeInvalidEarlyAccess('dynCall_ifffi');
var dynCall_ifffffi = makeInvalidEarlyAccess('dynCall_ifffffi');
var dynCall_viiiiiffii = makeInvalidEarlyAccess('dynCall_viiiiiffii');
var dynCall_viffffiii = makeInvalidEarlyAccess('dynCall_viffffiii');
var dynCall_viffffii = makeInvalidEarlyAccess('dynCall_viffffii');
var dynCall_vifffffffffi = makeInvalidEarlyAccess('dynCall_vifffffffffi');
var dynCall_jdi = makeInvalidEarlyAccess('dynCall_jdi');
var dynCall_viffffffffffffffffi = makeInvalidEarlyAccess('dynCall_viffffffffffffffffi');
var dynCall_viiifiii = makeInvalidEarlyAccess('dynCall_viiifiii');
var dynCall_viiffiiii = makeInvalidEarlyAccess('dynCall_viiffiiii');
var dynCall_viiffiiiiii = makeInvalidEarlyAccess('dynCall_viiffiiiiii');
var dynCall_viiffiiiii = makeInvalidEarlyAccess('dynCall_viiffiiiii');
var dynCall_viiiiiiffi = makeInvalidEarlyAccess('dynCall_viiiiiiffi');
var dynCall_viiiffiii = makeInvalidEarlyAccess('dynCall_viiiffiii');
var dynCall_viiiiiifi = makeInvalidEarlyAccess('dynCall_viiiiiifi');
var dynCall_iiiiiifi = makeInvalidEarlyAccess('dynCall_iiiiiifi');
var dynCall_vifffffi = makeInvalidEarlyAccess('dynCall_vifffffi');
var dynCall_iiiiiiiiiiifiii = makeInvalidEarlyAccess('dynCall_iiiiiiiiiiifiii');
var dynCall_viffiiii = makeInvalidEarlyAccess('dynCall_viffiiii');
var dynCall_viiiffffiiii = makeInvalidEarlyAccess('dynCall_viiiffffiiii');
var dynCall_viifffffffiiiii = makeInvalidEarlyAccess('dynCall_viifffffffiiiii');
var dynCall_iiiiiiffiiiiiiiiiffffiiii = makeInvalidEarlyAccess('dynCall_iiiiiiffiiiiiiiiiffffiiii');
var dynCall_iiiiiiffiiiiiiiiiiiiiii = makeInvalidEarlyAccess('dynCall_iiiiiiffiiiiiiiiiiiiiii');
var dynCall_iiffiiiiiiiiii = makeInvalidEarlyAccess('dynCall_iiffiiiiiiiiii');
var dynCall_viiiiiiiiiiffiii = makeInvalidEarlyAccess('dynCall_viiiiiiiiiiffiii');
var dynCall_viiiiiiifffiii = makeInvalidEarlyAccess('dynCall_viiiiiiifffiii');
var dynCall_fffffffi = makeInvalidEarlyAccess('dynCall_fffffffi');
var dynCall_viffifi = makeInvalidEarlyAccess('dynCall_viffifi');
var dynCall_fifffi = makeInvalidEarlyAccess('dynCall_fifffi');
var dynCall_viiffifi = makeInvalidEarlyAccess('dynCall_viiffifi');
var dynCall_viiiiiiifiiiii = makeInvalidEarlyAccess('dynCall_viiiiiiifiiiii');
var dynCall_viifiiiii = makeInvalidEarlyAccess('dynCall_viifiiiii');
var dynCall_iiiffiiii = makeInvalidEarlyAccess('dynCall_iiiffiiii');
var dynCall_viififii = makeInvalidEarlyAccess('dynCall_viififii');
var dynCall_vififiii = makeInvalidEarlyAccess('dynCall_vififiii');
var dynCall_viifiiiiii = makeInvalidEarlyAccess('dynCall_viifiiiiii');
var dynCall_vifiiiiii = makeInvalidEarlyAccess('dynCall_vifiiiiii');
var dynCall_iiiifiiiiiii = makeInvalidEarlyAccess('dynCall_iiiifiiiiiii');
var dynCall_viiiffiiiiii = makeInvalidEarlyAccess('dynCall_viiiffiiiiii');
var dynCall_viiiffiiiii = makeInvalidEarlyAccess('dynCall_viiiffiiiii');
var dynCall_viiffiiiiiii = makeInvalidEarlyAccess('dynCall_viiffiiiiiii');
var dynCall_iiiiffiiii = makeInvalidEarlyAccess('dynCall_iiiiffiiii');
var dynCall_vffifi = makeInvalidEarlyAccess('dynCall_vffifi');
var dynCall_viiififiii = makeInvalidEarlyAccess('dynCall_viiififiii');
var dynCall_viiififii = makeInvalidEarlyAccess('dynCall_viiififii');
var dynCall_viiifififi = makeInvalidEarlyAccess('dynCall_viiifififi');
var dynCall_iijjjiii = makeInvalidEarlyAccess('dynCall_iijjjiii');
var dynCall_viiiiiffiii = makeInvalidEarlyAccess('dynCall_viiiiiffiii');
var dynCall_viiifiiii = makeInvalidEarlyAccess('dynCall_viiifiiii');
var dynCall_fifii = makeInvalidEarlyAccess('dynCall_fifii');
var dynCall_fiiifii = makeInvalidEarlyAccess('dynCall_fiiifii');
var dynCall_fiiiifi = makeInvalidEarlyAccess('dynCall_fiiiifi');
var dynCall_viiiiiffi = makeInvalidEarlyAccess('dynCall_viiiiiffi');
var dynCall_fiiiiiii = makeInvalidEarlyAccess('dynCall_fiiiiiii');
var dynCall_jjiji = makeInvalidEarlyAccess('dynCall_jjiji');
var dynCall_jjijji = makeInvalidEarlyAccess('dynCall_jjijji');
var dynCall_jjijii = makeInvalidEarlyAccess('dynCall_jjijii');
var dynCall_vjiii = makeInvalidEarlyAccess('dynCall_vjiii');
var dynCall_didii = makeInvalidEarlyAccess('dynCall_didii');
var dynCall_iidii = makeInvalidEarlyAccess('dynCall_iidii');
var dynCall_iijjii = makeInvalidEarlyAccess('dynCall_iijjii');
var dynCall_iiddii = makeInvalidEarlyAccess('dynCall_iiddii');
var dynCall_viiffiii = makeInvalidEarlyAccess('dynCall_viiffiii');
var dynCall_viifffii = makeInvalidEarlyAccess('dynCall_viifffii');
var dynCall_viififfi = makeInvalidEarlyAccess('dynCall_viififfi');
var dynCall_viififi = makeInvalidEarlyAccess('dynCall_viififi');
var dynCall_iijjijii = makeInvalidEarlyAccess('dynCall_iijjijii');
var dynCall_iijjiijii = makeInvalidEarlyAccess('dynCall_iijjiijii');
var dynCall_iiiiijji = makeInvalidEarlyAccess('dynCall_iiiiijji');
var dynCall_viiiijii = makeInvalidEarlyAccess('dynCall_viiiijii');
var dynCall_viiijji = makeInvalidEarlyAccess('dynCall_viiijji');
var dynCall_jiijiji = makeInvalidEarlyAccess('dynCall_jiijiji');
var dynCall_viijijii = makeInvalidEarlyAccess('dynCall_viijijii');
var dynCall_jijiji = makeInvalidEarlyAccess('dynCall_jijiji');
var dynCall_vijijii = makeInvalidEarlyAccess('dynCall_vijijii');
var dynCall_viiiiiji = makeInvalidEarlyAccess('dynCall_viiiiiji');
var dynCall_iiiijiiii = makeInvalidEarlyAccess('dynCall_iiiijiiii');
var dynCall_iiiijiiiii = makeInvalidEarlyAccess('dynCall_iiiijiiiii');
var dynCall_jijji = makeInvalidEarlyAccess('dynCall_jijji');
var dynCall_viiiidii = makeInvalidEarlyAccess('dynCall_viiiidii');
var dynCall_vidiiiii = makeInvalidEarlyAccess('dynCall_vidiiiii');
var dynCall_viiidjii = makeInvalidEarlyAccess('dynCall_viiidjii');
var dynCall_viijijji = makeInvalidEarlyAccess('dynCall_viijijji');
var dynCall_vijijji = makeInvalidEarlyAccess('dynCall_vijijji');
var dynCall_vifdi = makeInvalidEarlyAccess('dynCall_vifdi');
var dynCall_viiiiifffiii = makeInvalidEarlyAccess('dynCall_viiiiifffiii');
var dynCall_viiiiffiffiiiiiiiii = makeInvalidEarlyAccess('dynCall_viiiiffiffiiiiiiiii');
var dynCall_viiiiffiiiiiiii = makeInvalidEarlyAccess('dynCall_viiiiffiiiiiiii');
var dynCall_viiiiiffiffiiiiiiiiiiii = makeInvalidEarlyAccess('dynCall_viiiiiffiffiiiiiiiiiiii');
var dynCall_viiffiiiiiiiiiiiiiii = makeInvalidEarlyAccess('dynCall_viiffiiiiiiiiiiiiiii');
var dynCall_viifffffi = makeInvalidEarlyAccess('dynCall_viifffffi');
var dynCall_viiiiiffiiiii = makeInvalidEarlyAccess('dynCall_viiiiiffiiiii');
var dynCall_viiiiiiiifii = makeInvalidEarlyAccess('dynCall_viiiiiiiifii');
var dynCall_viiiiiiji = makeInvalidEarlyAccess('dynCall_viiiiiiji');
var dynCall_iiiiiiiji = makeInvalidEarlyAccess('dynCall_iiiiiiiji');
var dynCall_iiiiiiiiiiiiiiifiiiiiiii = makeInvalidEarlyAccess('dynCall_iiiiiiiiiiiiiiifiiiiiiii');
var dynCall_iiiiiiiiiiiiiifiiiiiiii = makeInvalidEarlyAccess('dynCall_iiiiiiiiiiiiiifiiiiiiii');
var dynCall_iiiiiiiiiiiiiiiiifiiiiiiii = makeInvalidEarlyAccess('dynCall_iiiiiiiiiiiiiiiiifiiiiiiii');
var dynCall_iiiiiiiiiiiiiiiifiiiiiiii = makeInvalidEarlyAccess('dynCall_iiiiiiiiiiiiiiiifiiiiiiii');
var dynCall_iiiiiiiiiiiiiiiifiiiiiiiii = makeInvalidEarlyAccess('dynCall_iiiiiiiiiiiiiiiifiiiiiiiii');
var dynCall_iiiiiiiiiiiiifiiiiiiii = makeInvalidEarlyAccess('dynCall_iiiiiiiiiiiiifiiiiiiii');
var dynCall_iiiiiiiiiiiiiifiiiiiiiii = makeInvalidEarlyAccess('dynCall_iiiiiiiiiiiiiifiiiiiiiii');
var dynCall_iiiiiifii = makeInvalidEarlyAccess('dynCall_iiiiiifii');
var dynCall_viiiiifii = makeInvalidEarlyAccess('dynCall_viiiiifii');
var dynCall_iiiiiiiiiiiifiiiiiiii = makeInvalidEarlyAccess('dynCall_iiiiiiiiiiiifiiiiiiii');
var dynCall_iiiiiiifii = makeInvalidEarlyAccess('dynCall_iiiiiiifii');
var dynCall_iiiijiii = makeInvalidEarlyAccess('dynCall_iiiijiii');
var dynCall_vijjjji = makeInvalidEarlyAccess('dynCall_vijjjji');
var dynCall_iijjjji = makeInvalidEarlyAccess('dynCall_iijjjji');
var dynCall_viiiffffi = makeInvalidEarlyAccess('dynCall_viiiffffi');
var dynCall_ffiiifffi = makeInvalidEarlyAccess('dynCall_ffiiifffi');
var dynCall_fifiii = makeInvalidEarlyAccess('dynCall_fifiii');
var dynCall_viiiifffi = makeInvalidEarlyAccess('dynCall_viiiifffi');
var dynCall_vifffii = makeInvalidEarlyAccess('dynCall_vifffii');
var dynCall_iiiiiiiiiiiiiiiiii = makeInvalidEarlyAccess('dynCall_iiiiiiiiiiiiiiiiii');
var dynCall_viiiiiiiiiiiiiiiii = makeInvalidEarlyAccess('dynCall_viiiiiiiiiiiiiiiii');
var dynCall_viiiiiiiiiiiiiiiiiiii = makeInvalidEarlyAccess('dynCall_viiiiiiiiiiiiiiiiiiii');
var dynCall_iiidi = makeInvalidEarlyAccess('dynCall_iiidi');
var dynCall_iijjjjiii = makeInvalidEarlyAccess('dynCall_iijjjjiii');
var dynCall_iiiidi = makeInvalidEarlyAccess('dynCall_iiiidi');
var dynCall_viifffifi = makeInvalidEarlyAccess('dynCall_viifffifi');
var dynCall_viifiiiiiii = makeInvalidEarlyAccess('dynCall_viifiiiiiii');
var dynCall_iiiiiifiiiiii = makeInvalidEarlyAccess('dynCall_iiiiiifiiiiii');
var dynCall_iiiiiiiifii = makeInvalidEarlyAccess('dynCall_iiiiiiiifii');
var dynCall_iiiiiiiifiiiii = makeInvalidEarlyAccess('dynCall_iiiiiiiifiiiii');
var dynCall_iiiiiiiifiii = makeInvalidEarlyAccess('dynCall_iiiiiiiifiii');
var dynCall_iiiiifiiiii = makeInvalidEarlyAccess('dynCall_iiiiifiiiii');
var dynCall_vffiii = makeInvalidEarlyAccess('dynCall_vffiii');
var dynCall_vifffiii = makeInvalidEarlyAccess('dynCall_vifffiii');
var dynCall_ifiiiifiii = makeInvalidEarlyAccess('dynCall_ifiiiifiii');
var dynCall_viiffffiiiii = makeInvalidEarlyAccess('dynCall_viiffffiiiii');
var dynCall_vifiifiifi = makeInvalidEarlyAccess('dynCall_vifiifiifi');
var dynCall_viiffffffi = makeInvalidEarlyAccess('dynCall_viiffffffi');
var dynCall_viifffffffi = makeInvalidEarlyAccess('dynCall_viifffffffi');
var dynCall_viiffffffffi = makeInvalidEarlyAccess('dynCall_viiffffffffi');
var dynCall_vifiiii = makeInvalidEarlyAccess('dynCall_vifiiii');
var dynCall_vidiii = makeInvalidEarlyAccess('dynCall_vidiii');
var dynCall_viifffffffiii = makeInvalidEarlyAccess('dynCall_viifffffffiii');
var dynCall_viiiiffffii = makeInvalidEarlyAccess('dynCall_viiiiffffii');
var dynCall_fiiiiii = makeInvalidEarlyAccess('dynCall_fiiiiii');
var dynCall_idiiii = makeInvalidEarlyAccess('dynCall_idiiii');
var dynCall_vijiiiiiii = makeInvalidEarlyAccess('dynCall_vijiiiiiii');
var dynCall_vijiiiiiiii = makeInvalidEarlyAccess('dynCall_vijiiiiiiii');
var dynCall_jijiii = makeInvalidEarlyAccess('dynCall_jijiii');
var dynCall_jjiiii = makeInvalidEarlyAccess('dynCall_jjiiii');
var dynCall_jjiiiii = makeInvalidEarlyAccess('dynCall_jjiiiii');
var dynCall_viijiiiiii = makeInvalidEarlyAccess('dynCall_viijiiiiii');
var dynCall_iijiiiiii = makeInvalidEarlyAccess('dynCall_iijiiiiii');
var dynCall_iiiijjii = makeInvalidEarlyAccess('dynCall_iiiijjii');
var dynCall_jijjji = makeInvalidEarlyAccess('dynCall_jijjji');
var dynCall_jijjjii = makeInvalidEarlyAccess('dynCall_jijjjii');
var dynCall_jjiii = makeInvalidEarlyAccess('dynCall_jjiii');
var dynCall_ijijiiiii = makeInvalidEarlyAccess('dynCall_ijijiiiii');
var dynCall_ijjjiii = makeInvalidEarlyAccess('dynCall_ijjjiii');
var dynCall_vijjjiijii = makeInvalidEarlyAccess('dynCall_vijjjiijii');
var dynCall_ijjjiijii = makeInvalidEarlyAccess('dynCall_ijjjiijii');
var dynCall_vijiiiiii = makeInvalidEarlyAccess('dynCall_vijiiiiii');
var dynCall_jfi = makeInvalidEarlyAccess('dynCall_jfi');
var dynCall_dfi = makeInvalidEarlyAccess('dynCall_dfi');
var dynCall_jidii = makeInvalidEarlyAccess('dynCall_jidii');
var dynCall_jidi = makeInvalidEarlyAccess('dynCall_jidi');
var dynCall_ijiijii = makeInvalidEarlyAccess('dynCall_ijiijii');
var dynCall_vjjiiiii = makeInvalidEarlyAccess('dynCall_vjjiiiii');
var dynCall_vjjii = makeInvalidEarlyAccess('dynCall_vjjii');
var dynCall_ijiiji = makeInvalidEarlyAccess('dynCall_ijiiji');
var dynCall_ijiiiiji = makeInvalidEarlyAccess('dynCall_ijiiiiji');
var dynCall_ddii = makeInvalidEarlyAccess('dynCall_ddii');
var dynCall_idiii = makeInvalidEarlyAccess('dynCall_idiii');
var dynCall_idiiiii = makeInvalidEarlyAccess('dynCall_idiiiii');
var dynCall_iidiii = makeInvalidEarlyAccess('dynCall_iidiii');
var dynCall_ifiiiii = makeInvalidEarlyAccess('dynCall_ifiiiii');
var dynCall_vdiii = makeInvalidEarlyAccess('dynCall_vdiii');
var dynCall_jdii = makeInvalidEarlyAccess('dynCall_jdii');
var dynCall_iijjji = makeInvalidEarlyAccess('dynCall_iijjji');
var dynCall_viijjji = makeInvalidEarlyAccess('dynCall_viijjji');
var dynCall_vdii = makeInvalidEarlyAccess('dynCall_vdii');
var dynCall_diddi = makeInvalidEarlyAccess('dynCall_diddi');
var dynCall_didi = makeInvalidEarlyAccess('dynCall_didi');
var dynCall_viijijiii = makeInvalidEarlyAccess('dynCall_viijijiii');
var dynCall_viijiijiii = makeInvalidEarlyAccess('dynCall_viijiijiii');
var dynCall_viiiijiiii = makeInvalidEarlyAccess('dynCall_viiiijiiii');
var dynCall_jiiiiii = makeInvalidEarlyAccess('dynCall_jiiiiii');
var dynCall_vijjji = makeInvalidEarlyAccess('dynCall_vijjji');
var dynCall_jiiiiiiiiii = makeInvalidEarlyAccess('dynCall_jiiiiiiiiii');
var dynCall_viijjii = makeInvalidEarlyAccess('dynCall_viijjii');
var dynCall_fiff = makeInvalidEarlyAccess('dynCall_fiff');
var dynCall_iiff = makeInvalidEarlyAccess('dynCall_iiff');
var dynCall_iiiiiiiiiiiiiii = makeInvalidEarlyAccess('dynCall_iiiiiiiiiiiiiii');
var dynCall_iiiiiiiiiiiiiiii = makeInvalidEarlyAccess('dynCall_iiiiiiiiiiiiiiii');
var dynCall_iiiiijii = makeInvalidEarlyAccess('dynCall_iiiiijii');
var dynCall_iiidiii = makeInvalidEarlyAccess('dynCall_iiidiii');
var dynCall_jiiiiiii = makeInvalidEarlyAccess('dynCall_jiiiiiii');
var dynCall_iidfii = makeInvalidEarlyAccess('dynCall_iidfii');
var dynCall_iidfi = makeInvalidEarlyAccess('dynCall_iidfi');
var dynCall_iiddfi = makeInvalidEarlyAccess('dynCall_iiddfi');
var dynCall_iijfii = makeInvalidEarlyAccess('dynCall_iijfii');
var dynCall_iijfi = makeInvalidEarlyAccess('dynCall_iijfi');
var dynCall_iijjfi = makeInvalidEarlyAccess('dynCall_iijjfi');
var dynCall_viiiddi = makeInvalidEarlyAccess('dynCall_viiiddi');
var dynCall_iiiiiiffidi = makeInvalidEarlyAccess('dynCall_iiiiiiffidi');
var dynCall_iiiiffffidi = makeInvalidEarlyAccess('dynCall_iiiiffffidi');
var dynCall_vjjiii = makeInvalidEarlyAccess('dynCall_vjjiii');
var dynCall_iiidfii = makeInvalidEarlyAccess('dynCall_iiidfii');
var dynCall_iiijfii = makeInvalidEarlyAccess('dynCall_iiijfii');
var dynCall_iiiiiidi = makeInvalidEarlyAccess('dynCall_iiiiiidi');
var dynCall_iiiiiiji = makeInvalidEarlyAccess('dynCall_iiiiiiji');
var dynCall_iiiiffiiiii = makeInvalidEarlyAccess('dynCall_iiiiffiiiii');
var dynCall_iiiidfii = makeInvalidEarlyAccess('dynCall_iiiidfii');
var dynCall_iiiijfii = makeInvalidEarlyAccess('dynCall_iiiijfii');
var dynCall_iiiiffii = makeInvalidEarlyAccess('dynCall_iiiiffii');
var dynCall_jijiiii = makeInvalidEarlyAccess('dynCall_jijiiii');
var dynCall_viijiiii = makeInvalidEarlyAccess('dynCall_viijiiii');
var dynCall_vidiji = makeInvalidEarlyAccess('dynCall_vidiji');
var dynCall_vidjii = makeInvalidEarlyAccess('dynCall_vidjii');
var dynCall_vdi = makeInvalidEarlyAccess('dynCall_vdi');
var dynCall_iiiij = makeInvalidEarlyAccess('dynCall_iiiij');
var dynCall_vif = makeInvalidEarlyAccess('dynCall_vif');
var dynCall_viif = makeInvalidEarlyAccess('dynCall_viif');
var dynCall_viij = makeInvalidEarlyAccess('dynCall_viij');
var dynCall_ijj = makeInvalidEarlyAccess('dynCall_ijj');
var dynCall_fff = makeInvalidEarlyAccess('dynCall_fff');
var dynCall_viiiiijii = makeInvalidEarlyAccess('dynCall_viiiiijii');
var dynCall_viffff = makeInvalidEarlyAccess('dynCall_viffff');
var dynCall_vj = makeInvalidEarlyAccess('dynCall_vj');
var dynCall_vf = makeInvalidEarlyAccess('dynCall_vf');
var dynCall_vffff = makeInvalidEarlyAccess('dynCall_vffff');
var dynCall_vff = makeInvalidEarlyAccess('dynCall_vff');
var dynCall_iiij = makeInvalidEarlyAccess('dynCall_iiij');
var dynCall_viiiiiif = makeInvalidEarlyAccess('dynCall_viiiiiif');
var dynCall_iiijiiiiiiiiii = makeInvalidEarlyAccess('dynCall_iiijiiiiiiiiii');
var dynCall_viiiiif = makeInvalidEarlyAccess('dynCall_viiiiif');
var dynCall_viiff = makeInvalidEarlyAccess('dynCall_viiff');
var dynCall_viiiiiiiiiiiiiiiiii = makeInvalidEarlyAccess('dynCall_viiiiiiiiiiiiiiiiii');
var dynCall_vifff = makeInvalidEarlyAccess('dynCall_vifff');
var dynCall_viifff = makeInvalidEarlyAccess('dynCall_viifff');
var dynCall_viff = makeInvalidEarlyAccess('dynCall_viff');
var dynCall_vij = makeInvalidEarlyAccess('dynCall_vij');
var dynCall_viiidd = makeInvalidEarlyAccess('dynCall_viiidd');
var dynCall_vjiiiiiii = makeInvalidEarlyAccess('dynCall_vjiiiiiii');
var dynCall_ij = makeInvalidEarlyAccess('dynCall_ij');
var dynCall_vid = makeInvalidEarlyAccess('dynCall_vid');
var dynCall_viijj = makeInvalidEarlyAccess('dynCall_viijj');
var dynCall_iiijj = makeInvalidEarlyAccess('dynCall_iiijj');
var dynCall_viiiif = makeInvalidEarlyAccess('dynCall_viiiif');
var dynCall_iiif = makeInvalidEarlyAccess('dynCall_iiif');
var dynCall_fif = makeInvalidEarlyAccess('dynCall_fif');
var dynCall_iiijji = makeInvalidEarlyAccess('dynCall_iiijji');
var dynCall_ijjiiiii = makeInvalidEarlyAccess('dynCall_ijjiiiii');
var dynCall_iiiiiifffiiifiii = makeInvalidEarlyAccess('dynCall_iiiiiifffiiifiii');
var dynCall_viiiffffffi = makeInvalidEarlyAccess('dynCall_viiiffffffi');
var dynCall_iijjiii = makeInvalidEarlyAccess('dynCall_iijjiii');
var dynCall_vijjjii = makeInvalidEarlyAccess('dynCall_vijjjii');
var dynCall_viid = makeInvalidEarlyAccess('dynCall_viid');
var dynCall_viiif = makeInvalidEarlyAccess('dynCall_viiif');
var dynCall_ffjfj = makeInvalidEarlyAccess('dynCall_ffjfj');
var dynCall_fiiiif = makeInvalidEarlyAccess('dynCall_fiiiif');
var dynCall_iiiiiifff = makeInvalidEarlyAccess('dynCall_iiiiiifff');
var dynCall_iiiiiifiif = makeInvalidEarlyAccess('dynCall_iiiiiifiif');
var dynCall_iiiiiifiii = makeInvalidEarlyAccess('dynCall_iiiiiifiii');
var dynCall_iiiiiiifiif = makeInvalidEarlyAccess('dynCall_iiiiiiifiif');
var dynCall_fiiiiiifiifif = makeInvalidEarlyAccess('dynCall_fiiiiiifiifif');
var dynCall_fiiiiiifiiiif = makeInvalidEarlyAccess('dynCall_fiiiiiifiiiif');
var dynCall_iifiiiijii = makeInvalidEarlyAccess('dynCall_iifiiiijii');
var dynCall_vifif = makeInvalidEarlyAccess('dynCall_vifif');
var dynCall_vifijii = makeInvalidEarlyAccess('dynCall_vifijii');
var dynCall_iiiifffiii = makeInvalidEarlyAccess('dynCall_iiiifffiii');
var dynCall_iiiifffffi = makeInvalidEarlyAccess('dynCall_iiiifffffi');
var dynCall_viffiiiif = makeInvalidEarlyAccess('dynCall_viffiiiif');
var dynCall_viffiifffffiii = makeInvalidEarlyAccess('dynCall_viffiifffffiii');
var dynCall_viffffiifffiiiiif = makeInvalidEarlyAccess('dynCall_viffffiifffiiiiif');
var dynCall_iiiifffffii = makeInvalidEarlyAccess('dynCall_iiiifffffii');
var dynCall_iiiiifiiiiif = makeInvalidEarlyAccess('dynCall_iiiiifiiiiif');
var dynCall_viiifiiiii = makeInvalidEarlyAccess('dynCall_viiifiiiii');
var dynCall_viiiifiiiiif = makeInvalidEarlyAccess('dynCall_viiiifiiiiif');
var dynCall_iifff = makeInvalidEarlyAccess('dynCall_iifff');
var dynCall_viijijj = makeInvalidEarlyAccess('dynCall_viijijj');
var dynCall_viiiij = makeInvalidEarlyAccess('dynCall_viiiij');
var dynCall_viffffffffffffiiii = makeInvalidEarlyAccess('dynCall_viffffffffffffiiii');
var dynCall_iif = makeInvalidEarlyAccess('dynCall_iif');
var dynCall_jiij = makeInvalidEarlyAccess('dynCall_jiij');
var dynCall_ijjii = makeInvalidEarlyAccess('dynCall_ijjii');
var dynCall_f = makeInvalidEarlyAccess('dynCall_f');
var dynCall_vfff = makeInvalidEarlyAccess('dynCall_vfff');
var dynCall_vffffffi = makeInvalidEarlyAccess('dynCall_vffffffi');
var dynCall_ff = makeInvalidEarlyAccess('dynCall_ff');
var dynCall_if = makeInvalidEarlyAccess('dynCall_if');
var dynCall_d = makeInvalidEarlyAccess('dynCall_d');
var dynCall_iiiiiiifiii = makeInvalidEarlyAccess('dynCall_iiiiiiifiii');
var dynCall_viiiiiiiiiifii = makeInvalidEarlyAccess('dynCall_viiiiiiiiiifii');
var dynCall_viiiiiiiiidddddi = makeInvalidEarlyAccess('dynCall_viiiiiiiiidddddi');
var dynCall_fiif = makeInvalidEarlyAccess('dynCall_fiif');
var dynCall_iiiiiiffiiiiiiiiiffffiii = makeInvalidEarlyAccess('dynCall_iiiiiiffiiiiiiiiiffffiii');
var dynCall_iiiiiiiiiiifii = makeInvalidEarlyAccess('dynCall_iiiiiiiiiiifii');
var dynCall_viiiiiiiiji = makeInvalidEarlyAccess('dynCall_viiiiiiiiji');
var memory = makeInvalidEarlyAccess('memory');
var __indirect_function_table = makeInvalidEarlyAccess('__indirect_function_table');
var wasmMemory = makeInvalidEarlyAccess('wasmMemory');
var wasmTable = makeInvalidEarlyAccess('wasmTable');

function assignWasmExports(wasmExports) {
  assert(typeof wasmExports['GetFakemodTimeInSeconds'] != 'undefined', 'missing Wasm export: GetFakemodTimeInSeconds');
  _GetFakemodTimeInSeconds = Module['_GetFakemodTimeInSeconds'] = createExportWrapper('GetFakemodTimeInSeconds', 0);
  assert(typeof wasmExports['ConnectToProfiler'] != 'undefined', 'missing Wasm export: ConnectToProfiler');
  _ConnectToProfiler = Module['_ConnectToProfiler'] = createExportWrapper('ConnectToProfiler', 1);
  assert(typeof wasmExports['StopProfiling'] != 'undefined', 'missing Wasm export: StopProfiling');
  _StopProfiling = Module['_StopProfiling'] = createExportWrapper('StopProfiling', 0);
  assert(typeof wasmExports['IsConnectedToProfiler'] != 'undefined', 'missing Wasm export: IsConnectedToProfiler');
  _IsConnectedToProfiler = Module['_IsConnectedToProfiler'] = createExportWrapper('IsConnectedToProfiler', 0);
  assert(typeof wasmExports['ReleaseKeys'] != 'undefined', 'missing Wasm export: ReleaseKeys');
  _ReleaseKeys = Module['_ReleaseKeys'] = createExportWrapper('ReleaseKeys', 0);
  assert(typeof wasmExports['GetCopyBufferAsCStr'] != 'undefined', 'missing Wasm export: GetCopyBufferAsCStr');
  _GetCopyBufferAsCStr = Module['_GetCopyBufferAsCStr'] = createExportWrapper('GetCopyBufferAsCStr', 0);
  assert(typeof wasmExports['GetMetricsInfo'] != 'undefined', 'missing Wasm export: GetMetricsInfo');
  _GetMetricsInfo = Module['_GetMetricsInfo'] = createExportWrapper('GetMetricsInfo', 0);
  assert(typeof wasmExports['__main_argc_argv'] != 'undefined', 'missing Wasm export: __main_argc_argv');
  _main = Module['_main'] = createExportWrapper('__main_argc_argv', 2);
  assert(typeof wasmExports['SendMessageNumber'] != 'undefined', 'missing Wasm export: SendMessageNumber');
  _SendMessageNumber = Module['_SendMessageNumber'] = createExportWrapper('SendMessageNumber', 3);
  assert(typeof wasmExports['SendMessageString'] != 'undefined', 'missing Wasm export: SendMessageString');
  _SendMessageString = Module['_SendMessageString'] = createExportWrapper('SendMessageString', 3);
  assert(typeof wasmExports['SendMessage'] != 'undefined', 'missing Wasm export: SendMessage');
  _SendMessage = Module['_SendMessage'] = createExportWrapper('SendMessage', 2);
  assert(typeof wasmExports['SetFullscreen'] != 'undefined', 'missing Wasm export: SetFullscreen');
  _SetFullscreen = Module['_SetFullscreen'] = createExportWrapper('SetFullscreen', 1);
  assert(typeof wasmExports['SendPasteEvent'] != 'undefined', 'missing Wasm export: SendPasteEvent');
  _SendPasteEvent = Module['_SendPasteEvent'] = createExportWrapper('SendPasteEvent', 1);
  assert(typeof wasmExports['fflush'] != 'undefined', 'missing Wasm export: fflush');
  _fflush = createExportWrapper('fflush', 1);
  assert(typeof wasmExports['htonl'] != 'undefined', 'missing Wasm export: htonl');
  _htonl = createExportWrapper('htonl', 1);
  assert(typeof wasmExports['htons'] != 'undefined', 'missing Wasm export: htons');
  _htons = createExportWrapper('htons', 1);
  assert(typeof wasmExports['ntohs'] != 'undefined', 'missing Wasm export: ntohs');
  _ntohs = createExportWrapper('ntohs', 1);
  assert(typeof wasmExports['strerror'] != 'undefined', 'missing Wasm export: strerror');
  _strerror = createExportWrapper('strerror', 1);
  assert(typeof wasmExports['malloc'] != 'undefined', 'missing Wasm export: malloc');
  _malloc = createExportWrapper('malloc', 1);
  assert(typeof wasmExports['free'] != 'undefined', 'missing Wasm export: free');
  _free = createExportWrapper('free', 1);
  assert(typeof wasmExports['setThrew'] != 'undefined', 'missing Wasm export: setThrew');
  _setThrew = createExportWrapper('setThrew', 2);
  assert(typeof wasmExports['_emscripten_tempret_set'] != 'undefined', 'missing Wasm export: _emscripten_tempret_set');
  __emscripten_tempret_set = createExportWrapper('_emscripten_tempret_set', 1);
  assert(typeof wasmExports['emscripten_stack_init'] != 'undefined', 'missing Wasm export: emscripten_stack_init');
  _emscripten_stack_init = wasmExports['emscripten_stack_init'];
  assert(typeof wasmExports['emscripten_stack_get_free'] != 'undefined', 'missing Wasm export: emscripten_stack_get_free');
  _emscripten_stack_get_free = wasmExports['emscripten_stack_get_free'];
  assert(typeof wasmExports['emscripten_stack_get_base'] != 'undefined', 'missing Wasm export: emscripten_stack_get_base');
  _emscripten_stack_get_base = wasmExports['emscripten_stack_get_base'];
  assert(typeof wasmExports['emscripten_stack_get_end'] != 'undefined', 'missing Wasm export: emscripten_stack_get_end');
  _emscripten_stack_get_end = wasmExports['emscripten_stack_get_end'];
  assert(typeof wasmExports['_emscripten_stack_restore'] != 'undefined', 'missing Wasm export: _emscripten_stack_restore');
  __emscripten_stack_restore = wasmExports['_emscripten_stack_restore'];
  assert(typeof wasmExports['_emscripten_stack_alloc'] != 'undefined', 'missing Wasm export: _emscripten_stack_alloc');
  __emscripten_stack_alloc = wasmExports['_emscripten_stack_alloc'];
  assert(typeof wasmExports['emscripten_stack_get_current'] != 'undefined', 'missing Wasm export: emscripten_stack_get_current');
  _emscripten_stack_get_current = wasmExports['emscripten_stack_get_current'];
  assert(typeof wasmExports['__cxa_free_exception'] != 'undefined', 'missing Wasm export: __cxa_free_exception');
  ___cxa_free_exception = createExportWrapper('__cxa_free_exception', 1);
  assert(typeof wasmExports['__cxa_increment_exception_refcount'] != 'undefined', 'missing Wasm export: __cxa_increment_exception_refcount');
  ___cxa_increment_exception_refcount = createExportWrapper('__cxa_increment_exception_refcount', 1);
  assert(typeof wasmExports['__cxa_decrement_exception_refcount'] != 'undefined', 'missing Wasm export: __cxa_decrement_exception_refcount');
  ___cxa_decrement_exception_refcount = createExportWrapper('__cxa_decrement_exception_refcount', 1);
  assert(typeof wasmExports['__get_exception_message'] != 'undefined', 'missing Wasm export: __get_exception_message');
  ___get_exception_message = createExportWrapper('__get_exception_message', 3);
  assert(typeof wasmExports['__cxa_can_catch'] != 'undefined', 'missing Wasm export: __cxa_can_catch');
  ___cxa_can_catch = createExportWrapper('__cxa_can_catch', 3);
  assert(typeof wasmExports['__cxa_get_exception_ptr'] != 'undefined', 'missing Wasm export: __cxa_get_exception_ptr');
  ___cxa_get_exception_ptr = createExportWrapper('__cxa_get_exception_ptr', 1);
  assert(typeof wasmExports['dynCall_ii'] != 'undefined', 'missing Wasm export: dynCall_ii');
  dynCall_ii = dynCalls['ii'] = createExportWrapper('dynCall_ii', 2);
  assert(typeof wasmExports['dynCall_iiii'] != 'undefined', 'missing Wasm export: dynCall_iiii');
  dynCall_iiii = dynCalls['iiii'] = createExportWrapper('dynCall_iiii', 4);
  assert(typeof wasmExports['dynCall_jiji'] != 'undefined', 'missing Wasm export: dynCall_jiji');
  dynCall_jiji = dynCalls['jiji'] = createExportWrapper('dynCall_jiji', 5);
  assert(typeof wasmExports['dynCall_iidiiii'] != 'undefined', 'missing Wasm export: dynCall_iidiiii');
  dynCall_iidiiii = dynCalls['iidiiii'] = createExportWrapper('dynCall_iidiiii', 7);
  assert(typeof wasmExports['dynCall_vii'] != 'undefined', 'missing Wasm export: dynCall_vii');
  dynCall_vii = dynCalls['vii'] = createExportWrapper('dynCall_vii', 3);
  assert(typeof wasmExports['dynCall_v'] != 'undefined', 'missing Wasm export: dynCall_v');
  dynCall_v = dynCalls['v'] = createExportWrapper('dynCall_v', 1);
  assert(typeof wasmExports['dynCall_vi'] != 'undefined', 'missing Wasm export: dynCall_vi');
  dynCall_vi = dynCalls['vi'] = createExportWrapper('dynCall_vi', 2);
  assert(typeof wasmExports['dynCall_viiii'] != 'undefined', 'missing Wasm export: dynCall_viiii');
  dynCall_viiii = dynCalls['viiii'] = createExportWrapper('dynCall_viiii', 5);
  assert(typeof wasmExports['dynCall_iii'] != 'undefined', 'missing Wasm export: dynCall_iii');
  dynCall_iii = dynCalls['iii'] = createExportWrapper('dynCall_iii', 3);
  assert(typeof wasmExports['dynCall_viii'] != 'undefined', 'missing Wasm export: dynCall_viii');
  dynCall_viii = dynCalls['viii'] = createExportWrapper('dynCall_viii', 4);
  assert(typeof wasmExports['dynCall_viiiiiii'] != 'undefined', 'missing Wasm export: dynCall_viiiiiii');
  dynCall_viiiiiii = dynCalls['viiiiiii'] = createExportWrapper('dynCall_viiiiiii', 8);
  assert(typeof wasmExports['dynCall_iiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiii');
  dynCall_iiiiii = dynCalls['iiiiii'] = createExportWrapper('dynCall_iiiiii', 6);
  assert(typeof wasmExports['dynCall_viiiii'] != 'undefined', 'missing Wasm export: dynCall_viiiii');
  dynCall_viiiii = dynCalls['viiiii'] = createExportWrapper('dynCall_viiiii', 6);
  assert(typeof wasmExports['dynCall_iiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiiii');
  dynCall_iiiiiiii = dynCalls['iiiiiiii'] = createExportWrapper('dynCall_iiiiiiii', 8);
  assert(typeof wasmExports['dynCall_iiiiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiiiiiii');
  dynCall_iiiiiiiiiii = dynCalls['iiiiiiiiiii'] = createExportWrapper('dynCall_iiiiiiiiiii', 11);
  assert(typeof wasmExports['dynCall_iiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiii');
  dynCall_iiiii = dynCalls['iiiii'] = createExportWrapper('dynCall_iiiii', 5);
  assert(typeof wasmExports['dynCall_jiiii'] != 'undefined', 'missing Wasm export: dynCall_jiiii');
  dynCall_jiiii = dynCalls['jiiii'] = createExportWrapper('dynCall_jiiii', 5);
  assert(typeof wasmExports['dynCall_iiiiiiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiiiiiiiii');
  dynCall_iiiiiiiiiiiii = dynCalls['iiiiiiiiiiiii'] = createExportWrapper('dynCall_iiiiiiiiiiiii', 13);
  assert(typeof wasmExports['dynCall_fiii'] != 'undefined', 'missing Wasm export: dynCall_fiii');
  dynCall_fiii = dynCalls['fiii'] = createExportWrapper('dynCall_fiii', 4);
  assert(typeof wasmExports['dynCall_diii'] != 'undefined', 'missing Wasm export: dynCall_diii');
  dynCall_diii = dynCalls['diii'] = createExportWrapper('dynCall_diii', 4);
  assert(typeof wasmExports['dynCall_i'] != 'undefined', 'missing Wasm export: dynCall_i');
  dynCall_i = dynCalls['i'] = createExportWrapper('dynCall_i', 1);
  assert(typeof wasmExports['dynCall_iiiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiii');
  dynCall_iiiiiii = dynCalls['iiiiiii'] = createExportWrapper('dynCall_iiiiiii', 7);
  assert(typeof wasmExports['dynCall_iiiiiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiiiiiiii');
  dynCall_iiiiiiiiiiii = dynCalls['iiiiiiiiiiii'] = createExportWrapper('dynCall_iiiiiiiiiiii', 12);
  assert(typeof wasmExports['dynCall_viiiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_viiiiiiiiii');
  dynCall_viiiiiiiiii = dynCalls['viiiiiiiiii'] = createExportWrapper('dynCall_viiiiiiiiii', 11);
  assert(typeof wasmExports['dynCall_viiiiiiiiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_viiiiiiiiiiiiiii');
  dynCall_viiiiiiiiiiiiiii = dynCalls['viiiiiiiiiiiiiii'] = createExportWrapper('dynCall_viiiiiiiiiiiiiii', 16);
  assert(typeof wasmExports['dynCall_iiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiiiii');
  dynCall_iiiiiiiii = dynCalls['iiiiiiiii'] = createExportWrapper('dynCall_iiiiiiiii', 9);
  assert(typeof wasmExports['dynCall_iiiiij'] != 'undefined', 'missing Wasm export: dynCall_iiiiij');
  dynCall_iiiiij = dynCalls['iiiiij'] = createExportWrapper('dynCall_iiiiij', 7);
  assert(typeof wasmExports['dynCall_iiiiid'] != 'undefined', 'missing Wasm export: dynCall_iiiiid');
  dynCall_iiiiid = dynCalls['iiiiid'] = createExportWrapper('dynCall_iiiiid', 6);
  assert(typeof wasmExports['dynCall_iiiiijj'] != 'undefined', 'missing Wasm export: dynCall_iiiiijj');
  dynCall_iiiiijj = dynCalls['iiiiijj'] = createExportWrapper('dynCall_iiiiijj', 9);
  assert(typeof wasmExports['dynCall_iiiiiijj'] != 'undefined', 'missing Wasm export: dynCall_iiiiiijj');
  dynCall_iiiiiijj = dynCalls['iiiiiijj'] = createExportWrapper('dynCall_iiiiiijj', 10);
  assert(typeof wasmExports['dynCall_viiiiii'] != 'undefined', 'missing Wasm export: dynCall_viiiiii');
  dynCall_viiiiii = dynCalls['viiiiii'] = createExportWrapper('dynCall_viiiiii', 7);
  assert(typeof wasmExports['dynCall_viijii'] != 'undefined', 'missing Wasm export: dynCall_viijii');
  dynCall_viijii = dynCalls['viijii'] = createExportWrapper('dynCall_viijii', 7);
  assert(typeof wasmExports['dynCall_iiijiii'] != 'undefined', 'missing Wasm export: dynCall_iiijiii');
  dynCall_iiijiii = dynCalls['iiijiii'] = createExportWrapper('dynCall_iiijiii', 8);
  assert(typeof wasmExports['dynCall_iij'] != 'undefined', 'missing Wasm export: dynCall_iij');
  dynCall_iij = dynCalls['iij'] = createExportWrapper('dynCall_iij', 4);
  assert(typeof wasmExports['dynCall_jii'] != 'undefined', 'missing Wasm export: dynCall_jii');
  dynCall_jii = dynCalls['jii'] = createExportWrapper('dynCall_jii', 3);
  assert(typeof wasmExports['dynCall_viiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_viiiiiiii');
  dynCall_viiiiiiii = dynCalls['viiiiiiii'] = createExportWrapper('dynCall_viiiiiiii', 9);
  assert(typeof wasmExports['dynCall_j'] != 'undefined', 'missing Wasm export: dynCall_j');
  dynCall_j = dynCalls['j'] = createExportWrapper('dynCall_j', 1);
  assert(typeof wasmExports['dynCall_iiiijii'] != 'undefined', 'missing Wasm export: dynCall_iiiijii');
  dynCall_iiiijii = dynCalls['iiiijii'] = createExportWrapper('dynCall_iiiijii', 8);
  assert(typeof wasmExports['dynCall_iji'] != 'undefined', 'missing Wasm export: dynCall_iji');
  dynCall_iji = dynCalls['iji'] = createExportWrapper('dynCall_iji', 4);
  assert(typeof wasmExports['dynCall_jjji'] != 'undefined', 'missing Wasm export: dynCall_jjji');
  dynCall_jjji = dynCalls['jjji'] = createExportWrapper('dynCall_jjji', 6);
  assert(typeof wasmExports['dynCall_jiiiii'] != 'undefined', 'missing Wasm export: dynCall_jiiiii');
  dynCall_jiiiii = dynCalls['jiiiii'] = createExportWrapper('dynCall_jiiiii', 6);
  assert(typeof wasmExports['dynCall_iijiii'] != 'undefined', 'missing Wasm export: dynCall_iijiii');
  dynCall_iijiii = dynCalls['iijiii'] = createExportWrapper('dynCall_iijiii', 7);
  assert(typeof wasmExports['dynCall_vijii'] != 'undefined', 'missing Wasm export: dynCall_vijii');
  dynCall_vijii = dynCalls['vijii'] = createExportWrapper('dynCall_vijii', 6);
  assert(typeof wasmExports['dynCall_fifi'] != 'undefined', 'missing Wasm export: dynCall_fifi');
  dynCall_fifi = dynCalls['fifi'] = createExportWrapper('dynCall_fifi', 4);
  assert(typeof wasmExports['dynCall_vifi'] != 'undefined', 'missing Wasm export: dynCall_vifi');
  dynCall_vifi = dynCalls['vifi'] = createExportWrapper('dynCall_vifi', 4);
  assert(typeof wasmExports['dynCall_viifi'] != 'undefined', 'missing Wasm export: dynCall_viifi');
  dynCall_viifi = dynCalls['viifi'] = createExportWrapper('dynCall_viifi', 5);
  assert(typeof wasmExports['dynCall_iiiidii'] != 'undefined', 'missing Wasm export: dynCall_iiiidii');
  dynCall_iiiidii = dynCalls['iiiidii'] = createExportWrapper('dynCall_iiiidii', 7);
  assert(typeof wasmExports['dynCall_fii'] != 'undefined', 'missing Wasm export: dynCall_fii');
  dynCall_fii = dynCalls['fii'] = createExportWrapper('dynCall_fii', 3);
  assert(typeof wasmExports['dynCall_viji'] != 'undefined', 'missing Wasm export: dynCall_viji');
  dynCall_viji = dynCalls['viji'] = createExportWrapper('dynCall_viji', 5);
  assert(typeof wasmExports['dynCall_viiji'] != 'undefined', 'missing Wasm export: dynCall_viiji');
  dynCall_viiji = dynCalls['viiji'] = createExportWrapper('dynCall_viiji', 6);
  assert(typeof wasmExports['dynCall_vidi'] != 'undefined', 'missing Wasm export: dynCall_vidi');
  dynCall_vidi = dynCalls['vidi'] = createExportWrapper('dynCall_vidi', 4);
  assert(typeof wasmExports['dynCall_viidi'] != 'undefined', 'missing Wasm export: dynCall_viidi');
  dynCall_viidi = dynCalls['viidi'] = createExportWrapper('dynCall_viidi', 5);
  assert(typeof wasmExports['dynCall_viiifi'] != 'undefined', 'missing Wasm export: dynCall_viiifi');
  dynCall_viiifi = dynCalls['viiifi'] = createExportWrapper('dynCall_viiifi', 6);
  assert(typeof wasmExports['dynCall_viiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_viiiiiiiii');
  dynCall_viiiiiiiii = dynCalls['viiiiiiiii'] = createExportWrapper('dynCall_viiiiiiiii', 10);
  assert(typeof wasmExports['dynCall_ffii'] != 'undefined', 'missing Wasm export: dynCall_ffii');
  dynCall_ffii = dynCalls['ffii'] = createExportWrapper('dynCall_ffii', 4);
  assert(typeof wasmExports['dynCall_viiiiiiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_viiiiiiiiiiiii');
  dynCall_viiiiiiiiiiiii = dynCalls['viiiiiiiiiiiii'] = createExportWrapper('dynCall_viiiiiiiiiiiii', 14);
  assert(typeof wasmExports['dynCall_iiiiifi'] != 'undefined', 'missing Wasm export: dynCall_iiiiifi');
  dynCall_iiiiifi = dynCalls['iiiiifi'] = createExportWrapper('dynCall_iiiiifi', 7);
  assert(typeof wasmExports['dynCall_iffi'] != 'undefined', 'missing Wasm export: dynCall_iffi');
  dynCall_iffi = dynCalls['iffi'] = createExportWrapper('dynCall_iffi', 4);
  assert(typeof wasmExports['dynCall_viiiiifi'] != 'undefined', 'missing Wasm export: dynCall_viiiiifi');
  dynCall_viiiiifi = dynCalls['viiiiifi'] = createExportWrapper('dynCall_viiiiifi', 8);
  assert(typeof wasmExports['dynCall_viiiiiiiiiiiffiiiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_viiiiiiiiiiiffiiiiiiiiii');
  dynCall_viiiiiiiiiiiffiiiiiiiiii = dynCalls['viiiiiiiiiiiffiiiiiiiiii'] = createExportWrapper('dynCall_viiiiiiiiiiiffiiiiiiiiii', 24);
  assert(typeof wasmExports['dynCall_viffi'] != 'undefined', 'missing Wasm export: dynCall_viffi');
  dynCall_viffi = dynCalls['viffi'] = createExportWrapper('dynCall_viffi', 5);
  assert(typeof wasmExports['dynCall_ffi'] != 'undefined', 'missing Wasm export: dynCall_ffi');
  dynCall_ffi = dynCalls['ffi'] = createExportWrapper('dynCall_ffi', 3);
  assert(typeof wasmExports['dynCall_viiffffi'] != 'undefined', 'missing Wasm export: dynCall_viiffffi');
  dynCall_viiffffi = dynCalls['viiffffi'] = createExportWrapper('dynCall_viiffffi', 8);
  assert(typeof wasmExports['dynCall_fi'] != 'undefined', 'missing Wasm export: dynCall_fi');
  dynCall_fi = dynCalls['fi'] = createExportWrapper('dynCall_fi', 2);
  assert(typeof wasmExports['dynCall_iiji'] != 'undefined', 'missing Wasm export: dynCall_iiji');
  dynCall_iiji = dynCalls['iiji'] = createExportWrapper('dynCall_iiji', 5);
  assert(typeof wasmExports['dynCall_iiiiiiifiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiiifiiii');
  dynCall_iiiiiiifiiii = dynCalls['iiiiiiifiiii'] = createExportWrapper('dynCall_iiiiiiifiiii', 12);
  assert(typeof wasmExports['dynCall_iiiifiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiifiiii');
  dynCall_iiiifiiii = dynCalls['iiiifiiii'] = createExportWrapper('dynCall_iiiifiiii', 9);
  assert(typeof wasmExports['dynCall_iiiifii'] != 'undefined', 'missing Wasm export: dynCall_iiiifii');
  dynCall_iiiifii = dynCalls['iiiifii'] = createExportWrapper('dynCall_iiiifii', 7);
  assert(typeof wasmExports['dynCall_iiifii'] != 'undefined', 'missing Wasm export: dynCall_iiifii');
  dynCall_iiifii = dynCalls['iiifii'] = createExportWrapper('dynCall_iiifii', 6);
  assert(typeof wasmExports['dynCall_viiiifii'] != 'undefined', 'missing Wasm export: dynCall_viiiifii');
  dynCall_viiiifii = dynCalls['viiiifii'] = createExportWrapper('dynCall_viiiifii', 8);
  assert(typeof wasmExports['dynCall_dddi'] != 'undefined', 'missing Wasm export: dynCall_dddi');
  dynCall_dddi = dynCalls['dddi'] = createExportWrapper('dynCall_dddi', 4);
  assert(typeof wasmExports['dynCall_fffi'] != 'undefined', 'missing Wasm export: dynCall_fffi');
  dynCall_fffi = dynCalls['fffi'] = createExportWrapper('dynCall_fffi', 4);
  assert(typeof wasmExports['dynCall_viffiiiii'] != 'undefined', 'missing Wasm export: dynCall_viffiiiii');
  dynCall_viffiiiii = dynCalls['viffiiiii'] = createExportWrapper('dynCall_viffiiiii', 9);
  assert(typeof wasmExports['dynCall_viiidi'] != 'undefined', 'missing Wasm export: dynCall_viiidi');
  dynCall_viiidi = dynCalls['viiidi'] = createExportWrapper('dynCall_viiidi', 6);
  assert(typeof wasmExports['dynCall_viiiiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_viiiiiiiiiii');
  dynCall_viiiiiiiiiii = dynCalls['viiiiiiiiiii'] = createExportWrapper('dynCall_viiiiiiiiiii', 12);
  assert(typeof wasmExports['dynCall_iiiiiffiffiiiiiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiffiffiiiiiiiiiiii');
  dynCall_iiiiiffiffiiiiiiiiiiii = dynCalls['iiiiiffiffiiiiiiiiiiii'] = createExportWrapper('dynCall_iiiiiffiffiiiiiiiiiiii', 22);
  assert(typeof wasmExports['dynCall_viiiiffiiifiiii'] != 'undefined', 'missing Wasm export: dynCall_viiiiffiiifiiii');
  dynCall_viiiiffiiifiiii = dynCalls['viiiiffiiifiiii'] = createExportWrapper('dynCall_viiiiffiiifiiii', 15);
  assert(typeof wasmExports['dynCall_vffi'] != 'undefined', 'missing Wasm export: dynCall_vffi');
  dynCall_vffi = dynCalls['vffi'] = createExportWrapper('dynCall_vffi', 4);
  assert(typeof wasmExports['dynCall_iifii'] != 'undefined', 'missing Wasm export: dynCall_iifii');
  dynCall_iifii = dynCalls['iifii'] = createExportWrapper('dynCall_iifii', 5);
  assert(typeof wasmExports['dynCall_vfi'] != 'undefined', 'missing Wasm export: dynCall_vfi');
  dynCall_vfi = dynCalls['vfi'] = createExportWrapper('dynCall_vfi', 3);
  assert(typeof wasmExports['dynCall_fiiii'] != 'undefined', 'missing Wasm export: dynCall_fiiii');
  dynCall_fiiii = dynCalls['fiiii'] = createExportWrapper('dynCall_fiiii', 5);
  assert(typeof wasmExports['dynCall_dii'] != 'undefined', 'missing Wasm export: dynCall_dii');
  dynCall_dii = dynCalls['dii'] = createExportWrapper('dynCall_dii', 3);
  assert(typeof wasmExports['dynCall_iiifiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiifiiiiiii');
  dynCall_iiifiiiiiii = dynCalls['iiifiiiiiii'] = createExportWrapper('dynCall_iiifiiiiiii', 11);
  assert(typeof wasmExports['dynCall_iidi'] != 'undefined', 'missing Wasm export: dynCall_iidi');
  dynCall_iidi = dynCalls['iidi'] = createExportWrapper('dynCall_iidi', 4);
  assert(typeof wasmExports['dynCall_iifi'] != 'undefined', 'missing Wasm export: dynCall_iifi');
  dynCall_iifi = dynCalls['iifi'] = createExportWrapper('dynCall_iifi', 4);
  assert(typeof wasmExports['dynCall_ddiii'] != 'undefined', 'missing Wasm export: dynCall_ddiii');
  dynCall_ddiii = dynCalls['ddiii'] = createExportWrapper('dynCall_ddiii', 5);
  assert(typeof wasmExports['dynCall_iiiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiiiiii');
  dynCall_iiiiiiiiii = dynCalls['iiiiiiiiii'] = createExportWrapper('dynCall_iiiiiiiiii', 10);
  assert(typeof wasmExports['dynCall_vifiiiii'] != 'undefined', 'missing Wasm export: dynCall_vifiiiii');
  dynCall_vifiiiii = dynCalls['vifiiiii'] = createExportWrapper('dynCall_vifiiiii', 8);
  assert(typeof wasmExports['dynCall_viffffffi'] != 'undefined', 'missing Wasm export: dynCall_viffffffi');
  dynCall_viffffffi = dynCalls['viffffffi'] = createExportWrapper('dynCall_viffffffi', 9);
  assert(typeof wasmExports['dynCall_viiifii'] != 'undefined', 'missing Wasm export: dynCall_viiifii');
  dynCall_viiifii = dynCalls['viiifii'] = createExportWrapper('dynCall_viiifii', 7);
  assert(typeof wasmExports['dynCall_viiiiiiifiiiiii'] != 'undefined', 'missing Wasm export: dynCall_viiiiiiifiiiiii');
  dynCall_viiiiiiifiiiiii = dynCalls['viiiiiiifiiiiii'] = createExportWrapper('dynCall_viiiiiiifiiiiii', 15);
  assert(typeof wasmExports['dynCall_iiijii'] != 'undefined', 'missing Wasm export: dynCall_iiijii');
  dynCall_iiijii = dynCalls['iiijii'] = createExportWrapper('dynCall_iiijii', 7);
  assert(typeof wasmExports['dynCall_iiifi'] != 'undefined', 'missing Wasm export: dynCall_iiifi');
  dynCall_iiifi = dynCalls['iiifi'] = createExportWrapper('dynCall_iiifi', 5);
  assert(typeof wasmExports['dynCall_fiffffi'] != 'undefined', 'missing Wasm export: dynCall_fiffffi');
  dynCall_fiffffi = dynCalls['fiffffi'] = createExportWrapper('dynCall_fiffffi', 7);
  assert(typeof wasmExports['dynCall_jiii'] != 'undefined', 'missing Wasm export: dynCall_jiii');
  dynCall_jiii = dynCalls['jiii'] = createExportWrapper('dynCall_jiii', 4);
  assert(typeof wasmExports['dynCall_iiddi'] != 'undefined', 'missing Wasm export: dynCall_iiddi');
  dynCall_iiddi = dynCalls['iiddi'] = createExportWrapper('dynCall_iiddi', 5);
  assert(typeof wasmExports['dynCall_iijji'] != 'undefined', 'missing Wasm export: dynCall_iijji');
  dynCall_iijji = dynCalls['iijji'] = createExportWrapper('dynCall_iijji', 7);
  assert(typeof wasmExports['dynCall_iiffi'] != 'undefined', 'missing Wasm export: dynCall_iiffi');
  dynCall_iiffi = dynCalls['iiffi'] = createExportWrapper('dynCall_iiffi', 5);
  assert(typeof wasmExports['dynCall_viififiii'] != 'undefined', 'missing Wasm export: dynCall_viififiii');
  dynCall_viififiii = dynCalls['viififiii'] = createExportWrapper('dynCall_viififiii', 9);
  assert(typeof wasmExports['dynCall_fiiffi'] != 'undefined', 'missing Wasm export: dynCall_fiiffi');
  dynCall_fiiffi = dynCalls['fiiffi'] = createExportWrapper('dynCall_fiiffi', 6);
  assert(typeof wasmExports['dynCall_viififiiii'] != 'undefined', 'missing Wasm export: dynCall_viififiiii');
  dynCall_viififiiii = dynCalls['viififiiii'] = createExportWrapper('dynCall_viififiiii', 10);
  assert(typeof wasmExports['dynCall_vififiiii'] != 'undefined', 'missing Wasm export: dynCall_vififiiii');
  dynCall_vififiiii = dynCalls['vififiiii'] = createExportWrapper('dynCall_vififiiii', 9);
  assert(typeof wasmExports['dynCall_fiffi'] != 'undefined', 'missing Wasm export: dynCall_fiffi');
  dynCall_fiffi = dynCalls['fiffi'] = createExportWrapper('dynCall_fiffi', 5);
  assert(typeof wasmExports['dynCall_iiiifi'] != 'undefined', 'missing Wasm export: dynCall_iiiifi');
  dynCall_iiiifi = dynCalls['iiiifi'] = createExportWrapper('dynCall_iiiifi', 6);
  assert(typeof wasmExports['dynCall_iiiffi'] != 'undefined', 'missing Wasm export: dynCall_iiiffi');
  dynCall_iiiffi = dynCalls['iiiffi'] = createExportWrapper('dynCall_iiiffi', 6);
  assert(typeof wasmExports['dynCall_viiiifi'] != 'undefined', 'missing Wasm export: dynCall_viiiifi');
  dynCall_viiiifi = dynCalls['viiiifi'] = createExportWrapper('dynCall_viiiifi', 7);
  assert(typeof wasmExports['dynCall_fiiiii'] != 'undefined', 'missing Wasm export: dynCall_fiiiii');
  dynCall_fiiiii = dynCalls['fiiiii'] = createExportWrapper('dynCall_fiiiii', 6);
  assert(typeof wasmExports['dynCall_vifii'] != 'undefined', 'missing Wasm export: dynCall_vifii');
  dynCall_vifii = dynCalls['vifii'] = createExportWrapper('dynCall_vifii', 5);
  assert(typeof wasmExports['dynCall_iiiiiiiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiiiiiiiiii');
  dynCall_iiiiiiiiiiiiii = dynCalls['iiiiiiiiiiiiii'] = createExportWrapper('dynCall_iiiiiiiiiiiiii', 14);
  assert(typeof wasmExports['dynCall_di'] != 'undefined', 'missing Wasm export: dynCall_di');
  dynCall_di = dynCalls['di'] = createExportWrapper('dynCall_di', 2);
  assert(typeof wasmExports['dynCall_viiiji'] != 'undefined', 'missing Wasm export: dynCall_viiiji');
  dynCall_viiiji = dynCalls['viiiji'] = createExportWrapper('dynCall_viiiji', 7);
  assert(typeof wasmExports['dynCall_viiffi'] != 'undefined', 'missing Wasm export: dynCall_viiffi');
  dynCall_viiffi = dynCalls['viiffi'] = createExportWrapper('dynCall_viiffi', 6);
  assert(typeof wasmExports['dynCall_viidiji'] != 'undefined', 'missing Wasm export: dynCall_viidiji');
  dynCall_viidiji = dynCalls['viidiji'] = createExportWrapper('dynCall_viidiji', 8);
  assert(typeof wasmExports['dynCall_viidjii'] != 'undefined', 'missing Wasm export: dynCall_viidjii');
  dynCall_viidjii = dynCalls['viidjii'] = createExportWrapper('dynCall_viidjii', 8);
  assert(typeof wasmExports['dynCall_jijii'] != 'undefined', 'missing Wasm export: dynCall_jijii');
  dynCall_jijii = dynCalls['jijii'] = createExportWrapper('dynCall_jijii', 6);
  assert(typeof wasmExports['dynCall_iiiiiiiiiji'] != 'undefined', 'missing Wasm export: dynCall_iiiiiiiiiji');
  dynCall_iiiiiiiiiji = dynCalls['iiiiiiiiiji'] = createExportWrapper('dynCall_iiiiiiiiiji', 12);
  assert(typeof wasmExports['dynCall_vji'] != 'undefined', 'missing Wasm export: dynCall_vji');
  dynCall_vji = dynCalls['vji'] = createExportWrapper('dynCall_vji', 4);
  assert(typeof wasmExports['dynCall_diiii'] != 'undefined', 'missing Wasm export: dynCall_diiii');
  dynCall_diiii = dynCalls['diiii'] = createExportWrapper('dynCall_diiii', 5);
  assert(typeof wasmExports['dynCall_iiidii'] != 'undefined', 'missing Wasm export: dynCall_iiidii');
  dynCall_iiidii = dynCalls['iiidii'] = createExportWrapper('dynCall_iiidii', 6);
  assert(typeof wasmExports['dynCall_jiijii'] != 'undefined', 'missing Wasm export: dynCall_jiijii');
  dynCall_jiijii = dynCalls['jiijii'] = createExportWrapper('dynCall_jiijii', 7);
  assert(typeof wasmExports['dynCall_viijiii'] != 'undefined', 'missing Wasm export: dynCall_viijiii');
  dynCall_viijiii = dynCalls['viijiii'] = createExportWrapper('dynCall_viijiii', 8);
  assert(typeof wasmExports['dynCall_viiijiii'] != 'undefined', 'missing Wasm export: dynCall_viiijiii');
  dynCall_viiijiii = dynCalls['viiijiii'] = createExportWrapper('dynCall_viiijiii', 9);
  assert(typeof wasmExports['dynCall_jiiji'] != 'undefined', 'missing Wasm export: dynCall_jiiji');
  dynCall_jiiji = dynCalls['jiiji'] = createExportWrapper('dynCall_jiiji', 6);
  assert(typeof wasmExports['dynCall_jiiijii'] != 'undefined', 'missing Wasm export: dynCall_jiiijii');
  dynCall_jiiijii = dynCalls['jiiijii'] = createExportWrapper('dynCall_jiiijii', 8);
  assert(typeof wasmExports['dynCall_viiiidi'] != 'undefined', 'missing Wasm export: dynCall_viiiidi');
  dynCall_viiiidi = dynCalls['viiiidi'] = createExportWrapper('dynCall_viiiidi', 7);
  assert(typeof wasmExports['dynCall_iiiiiiidii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiiidii');
  dynCall_iiiiiiidii = dynCalls['iiiiiiidii'] = createExportWrapper('dynCall_iiiiiiidii', 10);
  assert(typeof wasmExports['dynCall_viiidiii'] != 'undefined', 'missing Wasm export: dynCall_viiidiii');
  dynCall_viiidiii = dynCalls['viiidiii'] = createExportWrapper('dynCall_viiidiii', 8);
  assert(typeof wasmExports['dynCall_iiiiidii'] != 'undefined', 'missing Wasm export: dynCall_iiiiidii');
  dynCall_iiiiidii = dynCalls['iiiiidii'] = createExportWrapper('dynCall_iiiiidii', 8);
  assert(typeof wasmExports['dynCall_viiiiidi'] != 'undefined', 'missing Wasm export: dynCall_viiiiidi');
  dynCall_viiiiidi = dynCalls['viiiiidi'] = createExportWrapper('dynCall_viiiiidi', 8);
  assert(typeof wasmExports['dynCall_ji'] != 'undefined', 'missing Wasm export: dynCall_ji');
  dynCall_ji = dynCalls['ji'] = createExportWrapper('dynCall_ji', 2);
  assert(typeof wasmExports['dynCall_viiiifiiii'] != 'undefined', 'missing Wasm export: dynCall_viiiifiiii');
  dynCall_viiiifiiii = dynCalls['viiiifiiii'] = createExportWrapper('dynCall_viiiifiiii', 10);
  assert(typeof wasmExports['dynCall_viiiiifiiii'] != 'undefined', 'missing Wasm export: dynCall_viiiiifiiii');
  dynCall_viiiiifiiii = dynCalls['viiiiifiiii'] = createExportWrapper('dynCall_viiiiifiiii', 11);
  assert(typeof wasmExports['dynCall_diiiii'] != 'undefined', 'missing Wasm export: dynCall_diiiii');
  dynCall_diiiii = dynCalls['diiiii'] = createExportWrapper('dynCall_diiiii', 6);
  assert(typeof wasmExports['dynCall_vijiii'] != 'undefined', 'missing Wasm export: dynCall_vijiii');
  dynCall_vijiii = dynCalls['vijiii'] = createExportWrapper('dynCall_vijiii', 7);
  assert(typeof wasmExports['dynCall_ijji'] != 'undefined', 'missing Wasm export: dynCall_ijji');
  dynCall_ijji = dynCalls['ijji'] = createExportWrapper('dynCall_ijji', 6);
  assert(typeof wasmExports['dynCall_vjjjiiii'] != 'undefined', 'missing Wasm export: dynCall_vjjjiiii');
  dynCall_vjjjiiii = dynCalls['vjjjiiii'] = createExportWrapper('dynCall_vjjjiiii', 11);
  assert(typeof wasmExports['dynCall_vjiiiii'] != 'undefined', 'missing Wasm export: dynCall_vjiiiii');
  dynCall_vjiiiii = dynCalls['vjiiiii'] = createExportWrapper('dynCall_vjiiiii', 8);
  assert(typeof wasmExports['dynCall_iijii'] != 'undefined', 'missing Wasm export: dynCall_iijii');
  dynCall_iijii = dynCalls['iijii'] = createExportWrapper('dynCall_iijii', 6);
  assert(typeof wasmExports['dynCall_iiffii'] != 'undefined', 'missing Wasm export: dynCall_iiffii');
  dynCall_iiffii = dynCalls['iiffii'] = createExportWrapper('dynCall_iiffii', 6);
  assert(typeof wasmExports['dynCall_iiifiii'] != 'undefined', 'missing Wasm export: dynCall_iiifiii');
  dynCall_iiifiii = dynCalls['iiifiii'] = createExportWrapper('dynCall_iiifiii', 7);
  assert(typeof wasmExports['dynCall_iiififii'] != 'undefined', 'missing Wasm export: dynCall_iiififii');
  dynCall_iiififii = dynCalls['iiififii'] = createExportWrapper('dynCall_iiififii', 8);
  assert(typeof wasmExports['dynCall_iiifiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiifiiiii');
  dynCall_iiifiiiii = dynCalls['iiifiiiii'] = createExportWrapper('dynCall_iiifiiiii', 9);
  assert(typeof wasmExports['dynCall_iiffifiiii'] != 'undefined', 'missing Wasm export: dynCall_iiffifiiii');
  dynCall_iiffifiiii = dynCalls['iiffifiiii'] = createExportWrapper('dynCall_iiffifiiii', 10);
  assert(typeof wasmExports['dynCall_iifiifiiii'] != 'undefined', 'missing Wasm export: dynCall_iifiifiiii');
  dynCall_iifiifiiii = dynCalls['iifiifiiii'] = createExportWrapper('dynCall_iifiifiiii', 10);
  assert(typeof wasmExports['dynCall_iiiifiii'] != 'undefined', 'missing Wasm export: dynCall_iiiifiii');
  dynCall_iiiifiii = dynCalls['iiiifiii'] = createExportWrapper('dynCall_iiiifiii', 8);
  assert(typeof wasmExports['dynCall_iiifiiii'] != 'undefined', 'missing Wasm export: dynCall_iiifiiii');
  dynCall_iiifiiii = dynCalls['iiifiiii'] = createExportWrapper('dynCall_iiifiiii', 8);
  assert(typeof wasmExports['dynCall_iiiffiii'] != 'undefined', 'missing Wasm export: dynCall_iiiffiii');
  dynCall_iiiffiii = dynCalls['iiiffiii'] = createExportWrapper('dynCall_iiiffiii', 8);
  assert(typeof wasmExports['dynCall_iiiiifii'] != 'undefined', 'missing Wasm export: dynCall_iiiiifii');
  dynCall_iiiiifii = dynCalls['iiiiifii'] = createExportWrapper('dynCall_iiiiifii', 8);
  assert(typeof wasmExports['dynCall_iiifffffii'] != 'undefined', 'missing Wasm export: dynCall_iiifffffii');
  dynCall_iiifffffii = dynCalls['iiifffffii'] = createExportWrapper('dynCall_iiifffffii', 10);
  assert(typeof wasmExports['dynCall_jji'] != 'undefined', 'missing Wasm export: dynCall_jji');
  dynCall_jji = dynCalls['jji'] = createExportWrapper('dynCall_jji', 4);
  assert(typeof wasmExports['dynCall_viffiii'] != 'undefined', 'missing Wasm export: dynCall_viffiii');
  dynCall_viffiii = dynCalls['viffiii'] = createExportWrapper('dynCall_viffiii', 7);
  assert(typeof wasmExports['dynCall_ijiiiii'] != 'undefined', 'missing Wasm export: dynCall_ijiiiii');
  dynCall_ijiiiii = dynCalls['ijiiiii'] = createExportWrapper('dynCall_ijiiiii', 8);
  assert(typeof wasmExports['dynCall_iijiiii'] != 'undefined', 'missing Wasm export: dynCall_iijiiii');
  dynCall_iijiiii = dynCalls['iijiiii'] = createExportWrapper('dynCall_iijiiii', 8);
  assert(typeof wasmExports['dynCall_viiiiijijii'] != 'undefined', 'missing Wasm export: dynCall_viiiiijijii');
  dynCall_viiiiijijii = dynCalls['viiiiijijii'] = createExportWrapper('dynCall_viiiiijijii', 13);
  assert(typeof wasmExports['dynCall_viiijii'] != 'undefined', 'missing Wasm export: dynCall_viiijii');
  dynCall_viiijii = dynCalls['viiijii'] = createExportWrapper('dynCall_viiijii', 8);
  assert(typeof wasmExports['dynCall_viiiiiijijii'] != 'undefined', 'missing Wasm export: dynCall_viiiiiijijii');
  dynCall_viiiiiijijii = dynCalls['viiiiiijijii'] = createExportWrapper('dynCall_viiiiiijijii', 14);
  assert(typeof wasmExports['dynCall_viijji'] != 'undefined', 'missing Wasm export: dynCall_viijji');
  dynCall_viijji = dynCalls['viijji'] = createExportWrapper('dynCall_viijji', 8);
  assert(typeof wasmExports['dynCall_vijji'] != 'undefined', 'missing Wasm export: dynCall_vijji');
  dynCall_vijji = dynCalls['vijji'] = createExportWrapper('dynCall_vijji', 7);
  assert(typeof wasmExports['dynCall_vijiji'] != 'undefined', 'missing Wasm export: dynCall_vijiji');
  dynCall_vijiji = dynCalls['vijiji'] = createExportWrapper('dynCall_vijiji', 8);
  assert(typeof wasmExports['dynCall_iiffffiii'] != 'undefined', 'missing Wasm export: dynCall_iiffffiii');
  dynCall_iiffffiii = dynCalls['iiffffiii'] = createExportWrapper('dynCall_iiffffiii', 9);
  assert(typeof wasmExports['dynCall_iiidfi'] != 'undefined', 'missing Wasm export: dynCall_iiidfi');
  dynCall_iiidfi = dynCalls['iiidfi'] = createExportWrapper('dynCall_iiidfi', 6);
  assert(typeof wasmExports['dynCall_iiijfi'] != 'undefined', 'missing Wasm export: dynCall_iiijfi');
  dynCall_iiijfi = dynCalls['iiijfi'] = createExportWrapper('dynCall_iiijfi', 7);
  assert(typeof wasmExports['dynCall_iiiffii'] != 'undefined', 'missing Wasm export: dynCall_iiiffii');
  dynCall_iiiffii = dynCalls['iiiffii'] = createExportWrapper('dynCall_iiiffii', 7);
  assert(typeof wasmExports['dynCall_iifffi'] != 'undefined', 'missing Wasm export: dynCall_iifffi');
  dynCall_iifffi = dynCalls['iifffi'] = createExportWrapper('dynCall_iifffi', 6);
  assert(typeof wasmExports['dynCall_iiiififi'] != 'undefined', 'missing Wasm export: dynCall_iiiififi');
  dynCall_iiiififi = dynCalls['iiiififi'] = createExportWrapper('dynCall_iiiififi', 8);
  assert(typeof wasmExports['dynCall_iiiffifiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiffifiiii');
  dynCall_iiiffifiiii = dynCalls['iiiffifiiii'] = createExportWrapper('dynCall_iiiffifiiii', 11);
  assert(typeof wasmExports['dynCall_iiifiifiii'] != 'undefined', 'missing Wasm export: dynCall_iiifiifiii');
  dynCall_iiifiifiii = dynCalls['iiifiifiii'] = createExportWrapper('dynCall_iiifiifiii', 10);
  assert(typeof wasmExports['dynCall_iiifiifiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiifiifiiiii');
  dynCall_iiifiifiiiii = dynCalls['iiifiifiiiii'] = createExportWrapper('dynCall_iiifiifiiiii', 12);
  assert(typeof wasmExports['dynCall_ifii'] != 'undefined', 'missing Wasm export: dynCall_ifii');
  dynCall_ifii = dynCalls['ifii'] = createExportWrapper('dynCall_ifii', 4);
  assert(typeof wasmExports['dynCall_ifffii'] != 'undefined', 'missing Wasm export: dynCall_ifffii');
  dynCall_ifffii = dynCalls['ifffii'] = createExportWrapper('dynCall_ifffii', 6);
  assert(typeof wasmExports['dynCall_ffffii'] != 'undefined', 'missing Wasm export: dynCall_ffffii');
  dynCall_ffffii = dynCalls['ffffii'] = createExportWrapper('dynCall_ffffii', 6);
  assert(typeof wasmExports['dynCall_ffffifi'] != 'undefined', 'missing Wasm export: dynCall_ffffifi');
  dynCall_ffffifi = dynCalls['ffffifi'] = createExportWrapper('dynCall_ffffifi', 7);
  assert(typeof wasmExports['dynCall_ffffiffi'] != 'undefined', 'missing Wasm export: dynCall_ffffiffi');
  dynCall_ffffiffi = dynCalls['ffffiffi'] = createExportWrapper('dynCall_ffffiffi', 8);
  assert(typeof wasmExports['dynCall_viiififi'] != 'undefined', 'missing Wasm export: dynCall_viiififi');
  dynCall_viiififi = dynCalls['viiififi'] = createExportWrapper('dynCall_viiififi', 8);
  assert(typeof wasmExports['dynCall_viiififfi'] != 'undefined', 'missing Wasm export: dynCall_viiififfi');
  dynCall_viiififfi = dynCalls['viiififfi'] = createExportWrapper('dynCall_viiififfi', 9);
  assert(typeof wasmExports['dynCall_ifiii'] != 'undefined', 'missing Wasm export: dynCall_ifiii');
  dynCall_ifiii = dynCalls['ifiii'] = createExportWrapper('dynCall_ifiii', 5);
  assert(typeof wasmExports['dynCall_vifiii'] != 'undefined', 'missing Wasm export: dynCall_vifiii');
  dynCall_vifiii = dynCalls['vifiii'] = createExportWrapper('dynCall_vifiii', 6);
  assert(typeof wasmExports['dynCall_iifiiiiii'] != 'undefined', 'missing Wasm export: dynCall_iifiiiiii');
  dynCall_iifiiiiii = dynCalls['iifiiiiii'] = createExportWrapper('dynCall_iifiiiiii', 9);
  assert(typeof wasmExports['dynCall_iifiiiii'] != 'undefined', 'missing Wasm export: dynCall_iifiiiii');
  dynCall_iifiiiii = dynCalls['iifiiiii'] = createExportWrapper('dynCall_iifiiiii', 8);
  assert(typeof wasmExports['dynCall_iiffiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiffiiiii');
  dynCall_iiffiiiii = dynCalls['iiffiiiii'] = createExportWrapper('dynCall_iiffiiiii', 9);
  assert(typeof wasmExports['dynCall_iiffifiii'] != 'undefined', 'missing Wasm export: dynCall_iiffifiii');
  dynCall_iiffifiii = dynCalls['iiffifiii'] = createExportWrapper('dynCall_iiffifiii', 9);
  assert(typeof wasmExports['dynCall_iifiifiii'] != 'undefined', 'missing Wasm export: dynCall_iifiifiii');
  dynCall_iifiifiii = dynCalls['iifiifiii'] = createExportWrapper('dynCall_iifiifiii', 9);
  assert(typeof wasmExports['dynCall_iififi'] != 'undefined', 'missing Wasm export: dynCall_iififi');
  dynCall_iififi = dynCalls['iififi'] = createExportWrapper('dynCall_iififi', 6);
  assert(typeof wasmExports['dynCall_iiififi'] != 'undefined', 'missing Wasm export: dynCall_iiififi');
  dynCall_iiififi = dynCalls['iiififi'] = createExportWrapper('dynCall_iiififi', 7);
  assert(typeof wasmExports['dynCall_iifiii'] != 'undefined', 'missing Wasm export: dynCall_iifiii');
  dynCall_iifiii = dynCalls['iifiii'] = createExportWrapper('dynCall_iifiii', 6);
  assert(typeof wasmExports['dynCall_iiiiifiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiifiiii');
  dynCall_iiiiifiiii = dynCalls['iiiiifiiii'] = createExportWrapper('dynCall_iiiiifiiii', 10);
  assert(typeof wasmExports['dynCall_fiifii'] != 'undefined', 'missing Wasm export: dynCall_fiifii');
  dynCall_fiifii = dynCalls['fiifii'] = createExportWrapper('dynCall_fiifii', 6);
  assert(typeof wasmExports['dynCall_viiiiiifiifiiii'] != 'undefined', 'missing Wasm export: dynCall_viiiiiifiifiiii');
  dynCall_viiiiiifiifiiii = dynCalls['viiiiiifiifiiii'] = createExportWrapper('dynCall_viiiiiifiifiiii', 15);
  assert(typeof wasmExports['dynCall_viidiii'] != 'undefined', 'missing Wasm export: dynCall_viidiii');
  dynCall_viidiii = dynCalls['viidiii'] = createExportWrapper('dynCall_viidiii', 7);
  assert(typeof wasmExports['dynCall_diidi'] != 'undefined', 'missing Wasm export: dynCall_diidi');
  dynCall_diidi = dynCalls['diidi'] = createExportWrapper('dynCall_diidi', 5);
  assert(typeof wasmExports['dynCall_fiifdi'] != 'undefined', 'missing Wasm export: dynCall_fiifdi');
  dynCall_fiifdi = dynCalls['fiifdi'] = createExportWrapper('dynCall_fiifdi', 6);
  assert(typeof wasmExports['dynCall_viiiiiifddfiiii'] != 'undefined', 'missing Wasm export: dynCall_viiiiiifddfiiii');
  dynCall_viiiiiifddfiiii = dynCalls['viiiiiifddfiiii'] = createExportWrapper('dynCall_viiiiiifddfiiii', 15);
  assert(typeof wasmExports['dynCall_fiifji'] != 'undefined', 'missing Wasm export: dynCall_fiifji');
  dynCall_fiifji = dynCalls['fiifji'] = createExportWrapper('dynCall_fiifji', 7);
  assert(typeof wasmExports['dynCall_viiiiiifjjfiiii'] != 'undefined', 'missing Wasm export: dynCall_viiiiiifjjfiiii');
  dynCall_viiiiiifjjfiiii = dynCalls['viiiiiifjjfiiii'] = createExportWrapper('dynCall_viiiiiifjjfiiii', 17);
  assert(typeof wasmExports['dynCall_viiiifiii'] != 'undefined', 'missing Wasm export: dynCall_viiiifiii');
  dynCall_viiiifiii = dynCalls['viiiifiii'] = createExportWrapper('dynCall_viiiifiii', 9);
  assert(typeof wasmExports['dynCall_viifiii'] != 'undefined', 'missing Wasm export: dynCall_viifiii');
  dynCall_viifiii = dynCalls['viifiii'] = createExportWrapper('dynCall_viifiii', 7);
  assert(typeof wasmExports['dynCall_fiifi'] != 'undefined', 'missing Wasm export: dynCall_fiifi');
  dynCall_fiifi = dynCalls['fiifi'] = createExportWrapper('dynCall_fiifi', 5);
  assert(typeof wasmExports['dynCall_viiiiiiffffiiii'] != 'undefined', 'missing Wasm export: dynCall_viiiiiiffffiiii');
  dynCall_viiiiiiffffiiii = dynCalls['viiiiiiffffiiii'] = createExportWrapper('dynCall_viiiiiiffffiiii', 15);
  assert(typeof wasmExports['dynCall_viifiiii'] != 'undefined', 'missing Wasm export: dynCall_viifiiii');
  dynCall_viifiiii = dynCalls['viifiiii'] = createExportWrapper('dynCall_viifiiii', 8);
  assert(typeof wasmExports['dynCall_viifii'] != 'undefined', 'missing Wasm export: dynCall_viifii');
  dynCall_viifii = dynCalls['viifii'] = createExportWrapper('dynCall_viifii', 6);
  assert(typeof wasmExports['dynCall_iiiiifiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiifiii');
  dynCall_iiiiifiii = dynCalls['iiiiifiii'] = createExportWrapper('dynCall_iiiiifiii', 9);
  assert(typeof wasmExports['dynCall_fffffi'] != 'undefined', 'missing Wasm export: dynCall_fffffi');
  dynCall_fffffi = dynCalls['fffffi'] = createExportWrapper('dynCall_fffffi', 6);
  assert(typeof wasmExports['dynCall_fiiffffi'] != 'undefined', 'missing Wasm export: dynCall_fiiffffi');
  dynCall_fiiffffi = dynCalls['fiiffffi'] = createExportWrapper('dynCall_fiiffffi', 8);
  assert(typeof wasmExports['dynCall_fffifffi'] != 'undefined', 'missing Wasm export: dynCall_fffifffi');
  dynCall_fffifffi = dynCalls['fffifffi'] = createExportWrapper('dynCall_fffifffi', 8);
  assert(typeof wasmExports['dynCall_viiiiffi'] != 'undefined', 'missing Wasm export: dynCall_viiiiffi');
  dynCall_viiiiffi = dynCalls['viiiiffi'] = createExportWrapper('dynCall_viiiiffi', 8);
  assert(typeof wasmExports['dynCall_viiiffi'] != 'undefined', 'missing Wasm export: dynCall_viiiffi');
  dynCall_viiiffi = dynCalls['viiiffi'] = createExportWrapper('dynCall_viiiffi', 7);
  assert(typeof wasmExports['dynCall_viffffi'] != 'undefined', 'missing Wasm export: dynCall_viffffi');
  dynCall_viffffi = dynCalls['viffffi'] = createExportWrapper('dynCall_viffffi', 7);
  assert(typeof wasmExports['dynCall_viifiifi'] != 'undefined', 'missing Wasm export: dynCall_viifiifi');
  dynCall_viifiifi = dynCalls['viifiifi'] = createExportWrapper('dynCall_viifiifi', 8);
  assert(typeof wasmExports['dynCall_vifiifi'] != 'undefined', 'missing Wasm export: dynCall_vifiifi');
  dynCall_vifiifi = dynCalls['vifiifi'] = createExportWrapper('dynCall_vifiifi', 7);
  assert(typeof wasmExports['dynCall_viffii'] != 'undefined', 'missing Wasm export: dynCall_viffii');
  dynCall_viffii = dynCalls['viffii'] = createExportWrapper('dynCall_viffii', 6);
  assert(typeof wasmExports['dynCall_viiffii'] != 'undefined', 'missing Wasm export: dynCall_viiffii');
  dynCall_viiffii = dynCalls['viiffii'] = createExportWrapper('dynCall_viiffii', 7);
  assert(typeof wasmExports['dynCall_viddfffi'] != 'undefined', 'missing Wasm export: dynCall_viddfffi');
  dynCall_viddfffi = dynCalls['viddfffi'] = createExportWrapper('dynCall_viddfffi', 8);
  assert(typeof wasmExports['dynCall_viidfffi'] != 'undefined', 'missing Wasm export: dynCall_viidfffi');
  dynCall_viidfffi = dynCalls['viidfffi'] = createExportWrapper('dynCall_viidfffi', 8);
  assert(typeof wasmExports['dynCall_vidifffi'] != 'undefined', 'missing Wasm export: dynCall_vidifffi');
  dynCall_vidifffi = dynCalls['vidifffi'] = createExportWrapper('dynCall_vidifffi', 8);
  assert(typeof wasmExports['dynCall_viiifffi'] != 'undefined', 'missing Wasm export: dynCall_viiifffi');
  dynCall_viiifffi = dynCalls['viiifffi'] = createExportWrapper('dynCall_viiifffi', 8);
  assert(typeof wasmExports['dynCall_viddi'] != 'undefined', 'missing Wasm export: dynCall_viddi');
  dynCall_viddi = dynCalls['viddi'] = createExportWrapper('dynCall_viddi', 5);
  assert(typeof wasmExports['dynCall_vidii'] != 'undefined', 'missing Wasm export: dynCall_vidii');
  dynCall_vidii = dynCalls['vidii'] = createExportWrapper('dynCall_vidii', 5);
  assert(typeof wasmExports['dynCall_viiiiiiifi'] != 'undefined', 'missing Wasm export: dynCall_viiiiiiifi');
  dynCall_viiiiiiifi = dynCalls['viiiiiiifi'] = createExportWrapper('dynCall_viiiiiiifi', 10);
  assert(typeof wasmExports['dynCall_viiiiffffffffii'] != 'undefined', 'missing Wasm export: dynCall_viiiiffffffffii');
  dynCall_viiiiffffffffii = dynCalls['viiiiffffffffii'] = createExportWrapper('dynCall_viiiiffffffffii', 15);
  assert(typeof wasmExports['dynCall_viidii'] != 'undefined', 'missing Wasm export: dynCall_viidii');
  dynCall_viidii = dynCalls['viidii'] = createExportWrapper('dynCall_viidii', 6);
  assert(typeof wasmExports['dynCall_iddi'] != 'undefined', 'missing Wasm export: dynCall_iddi');
  dynCall_iddi = dynCalls['iddi'] = createExportWrapper('dynCall_iddi', 4);
  assert(typeof wasmExports['dynCall_ifi'] != 'undefined', 'missing Wasm export: dynCall_ifi');
  dynCall_ifi = dynCalls['ifi'] = createExportWrapper('dynCall_ifi', 3);
  assert(typeof wasmExports['dynCall_idi'] != 'undefined', 'missing Wasm export: dynCall_idi');
  dynCall_idi = dynCalls['idi'] = createExportWrapper('dynCall_idi', 3);
  assert(typeof wasmExports['dynCall_ffffi'] != 'undefined', 'missing Wasm export: dynCall_ffffi');
  dynCall_ffffi = dynCalls['ffffi'] = createExportWrapper('dynCall_ffffi', 5);
  assert(typeof wasmExports['dynCall_ddddi'] != 'undefined', 'missing Wasm export: dynCall_ddddi');
  dynCall_ddddi = dynCalls['ddddi'] = createExportWrapper('dynCall_ddddi', 5);
  assert(typeof wasmExports['dynCall_ddi'] != 'undefined', 'missing Wasm export: dynCall_ddi');
  dynCall_ddi = dynCalls['ddi'] = createExportWrapper('dynCall_ddi', 3);
  assert(typeof wasmExports['dynCall_iiiji'] != 'undefined', 'missing Wasm export: dynCall_iiiji');
  dynCall_iiiji = dynCalls['iiiji'] = createExportWrapper('dynCall_iiiji', 6);
  assert(typeof wasmExports['dynCall_viiiiiiiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_viiiiiiiiiiiiii');
  dynCall_viiiiiiiiiiiiii = dynCalls['viiiiiiiiiiiiii'] = createExportWrapper('dynCall_viiiiiiiiiiiiii', 15);
  assert(typeof wasmExports['dynCall_iiiiji'] != 'undefined', 'missing Wasm export: dynCall_iiiiji');
  dynCall_iiiiji = dynCalls['iiiiji'] = createExportWrapper('dynCall_iiiiji', 7);
  assert(typeof wasmExports['dynCall_iiiiiji'] != 'undefined', 'missing Wasm export: dynCall_iiiiiji');
  dynCall_iiiiiji = dynCalls['iiiiiji'] = createExportWrapper('dynCall_iiiiiji', 8);
  assert(typeof wasmExports['dynCall_ifiiifiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_ifiiifiiiiiii');
  dynCall_ifiiifiiiiiii = dynCalls['ifiiifiiiiiii'] = createExportWrapper('dynCall_ifiiifiiiiiii', 13);
  assert(typeof wasmExports['dynCall_jjii'] != 'undefined', 'missing Wasm export: dynCall_jjii');
  dynCall_jjii = dynCalls['jjii'] = createExportWrapper('dynCall_jjii', 5);
  assert(typeof wasmExports['dynCall_ijiiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_ijiiiiiiiii');
  dynCall_ijiiiiiiiii = dynCalls['ijiiiiiiiii'] = createExportWrapper('dynCall_ijiiiiiiiii', 12);
  assert(typeof wasmExports['dynCall_viiidii'] != 'undefined', 'missing Wasm export: dynCall_viiidii');
  dynCall_viiidii = dynCalls['viiidii'] = createExportWrapper('dynCall_viiidii', 7);
  assert(typeof wasmExports['dynCall_ijiii'] != 'undefined', 'missing Wasm export: dynCall_ijiii');
  dynCall_ijiii = dynCalls['ijiii'] = createExportWrapper('dynCall_ijiii', 6);
  assert(typeof wasmExports['dynCall_ijjiii'] != 'undefined', 'missing Wasm export: dynCall_ijjiii');
  dynCall_ijjiii = dynCalls['ijjiii'] = createExportWrapper('dynCall_ijjiii', 8);
  assert(typeof wasmExports['dynCall_jjjii'] != 'undefined', 'missing Wasm export: dynCall_jjjii');
  dynCall_jjjii = dynCalls['jjjii'] = createExportWrapper('dynCall_jjjii', 7);
  assert(typeof wasmExports['dynCall_fji'] != 'undefined', 'missing Wasm export: dynCall_fji');
  dynCall_fji = dynCalls['fji'] = createExportWrapper('dynCall_fji', 4);
  assert(typeof wasmExports['dynCall_dji'] != 'undefined', 'missing Wasm export: dynCall_dji');
  dynCall_dji = dynCalls['dji'] = createExportWrapper('dynCall_dji', 4);
  assert(typeof wasmExports['dynCall_vjii'] != 'undefined', 'missing Wasm export: dynCall_vjii');
  dynCall_vjii = dynCalls['vjii'] = createExportWrapper('dynCall_vjii', 5);
  assert(typeof wasmExports['dynCall_ijii'] != 'undefined', 'missing Wasm export: dynCall_ijii');
  dynCall_ijii = dynCalls['ijii'] = createExportWrapper('dynCall_ijii', 5);
  assert(typeof wasmExports['dynCall_ijiiii'] != 'undefined', 'missing Wasm export: dynCall_ijiiii');
  dynCall_ijiiii = dynCalls['ijiiii'] = createExportWrapper('dynCall_ijiiii', 7);
  assert(typeof wasmExports['dynCall_iiiifiiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiifiiiiii');
  dynCall_iiiifiiiiii = dynCalls['iiiifiiiiii'] = createExportWrapper('dynCall_iiiifiiiiii', 11);
  assert(typeof wasmExports['dynCall_iiiifiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiifiiiii');
  dynCall_iiiifiiiii = dynCalls['iiiifiiiii'] = createExportWrapper('dynCall_iiiifiiiii', 10);
  assert(typeof wasmExports['dynCall_iffffi'] != 'undefined', 'missing Wasm export: dynCall_iffffi');
  dynCall_iffffi = dynCalls['iffffi'] = createExportWrapper('dynCall_iffffi', 6);
  assert(typeof wasmExports['dynCall_viiiiiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_viiiiiiiiiiii');
  dynCall_viiiiiiiiiiii = dynCalls['viiiiiiiiiiii'] = createExportWrapper('dynCall_viiiiiiiiiiii', 13);
  assert(typeof wasmExports['dynCall_vfffi'] != 'undefined', 'missing Wasm export: dynCall_vfffi');
  dynCall_vfffi = dynCalls['vfffi'] = createExportWrapper('dynCall_vfffi', 5);
  assert(typeof wasmExports['dynCall_vifffi'] != 'undefined', 'missing Wasm export: dynCall_vifffi');
  dynCall_vifffi = dynCalls['vifffi'] = createExportWrapper('dynCall_vifffi', 6);
  assert(typeof wasmExports['dynCall_vffffi'] != 'undefined', 'missing Wasm export: dynCall_vffffi');
  dynCall_vffffi = dynCalls['vffffi'] = createExportWrapper('dynCall_vffffi', 6);
  assert(typeof wasmExports['dynCall_viiiffii'] != 'undefined', 'missing Wasm export: dynCall_viiiffii');
  dynCall_viiiffii = dynCalls['viiiffii'] = createExportWrapper('dynCall_viiiffii', 8);
  assert(typeof wasmExports['dynCall_vffffffii'] != 'undefined', 'missing Wasm export: dynCall_vffffffii');
  dynCall_vffffffii = dynCalls['vffffffii'] = createExportWrapper('dynCall_vffffffii', 9);
  assert(typeof wasmExports['dynCall_vffffii'] != 'undefined', 'missing Wasm export: dynCall_vffffii');
  dynCall_vffffii = dynCalls['vffffii'] = createExportWrapper('dynCall_vffffii', 7);
  assert(typeof wasmExports['dynCall_vfiii'] != 'undefined', 'missing Wasm export: dynCall_vfiii');
  dynCall_vfiii = dynCalls['vfiii'] = createExportWrapper('dynCall_vfiii', 5);
  assert(typeof wasmExports['dynCall_fdi'] != 'undefined', 'missing Wasm export: dynCall_fdi');
  dynCall_fdi = dynCalls['fdi'] = createExportWrapper('dynCall_fdi', 3);
  assert(typeof wasmExports['dynCall_vfii'] != 'undefined', 'missing Wasm export: dynCall_vfii');
  dynCall_vfii = dynCalls['vfii'] = createExportWrapper('dynCall_vfii', 4);
  assert(typeof wasmExports['dynCall_vjiiii'] != 'undefined', 'missing Wasm export: dynCall_vjiiii');
  dynCall_vjiiii = dynCalls['vjiiii'] = createExportWrapper('dynCall_vjiiii', 7);
  assert(typeof wasmExports['dynCall_viifffi'] != 'undefined', 'missing Wasm export: dynCall_viifffi');
  dynCall_viifffi = dynCalls['viifffi'] = createExportWrapper('dynCall_viifffi', 7);
  assert(typeof wasmExports['dynCall_vijiiii'] != 'undefined', 'missing Wasm export: dynCall_vijiiii');
  dynCall_vijiiii = dynCalls['vijiiii'] = createExportWrapper('dynCall_vijiiii', 8);
  assert(typeof wasmExports['dynCall_viiijiiii'] != 'undefined', 'missing Wasm export: dynCall_viiijiiii');
  dynCall_viiijiiii = dynCalls['viiijiiii'] = createExportWrapper('dynCall_viiijiiii', 10);
  assert(typeof wasmExports['dynCall_viiiijiii'] != 'undefined', 'missing Wasm export: dynCall_viiiijiii');
  dynCall_viiiijiii = dynCalls['viiiijiii'] = createExportWrapper('dynCall_viiiijiii', 10);
  assert(typeof wasmExports['dynCall_vijjii'] != 'undefined', 'missing Wasm export: dynCall_vijjii');
  dynCall_vijjii = dynCalls['vijjii'] = createExportWrapper('dynCall_vijjii', 8);
  assert(typeof wasmExports['dynCall_vjji'] != 'undefined', 'missing Wasm export: dynCall_vjji');
  dynCall_vjji = dynCalls['vjji'] = createExportWrapper('dynCall_vjji', 6);
  assert(typeof wasmExports['dynCall_viiiiiiiijijiiiii'] != 'undefined', 'missing Wasm export: dynCall_viiiiiiiijijiiiii');
  dynCall_viiiiiiiijijiiiii = dynCalls['viiiiiiiijijiiiii'] = createExportWrapper('dynCall_viiiiiiiijijiiiii', 19);
  assert(typeof wasmExports['dynCall_viiiiiiiiiiifii'] != 'undefined', 'missing Wasm export: dynCall_viiiiiiiiiiifii');
  dynCall_viiiiiiiiiiifii = dynCalls['viiiiiiiiiiifii'] = createExportWrapper('dynCall_viiiiiiiiiiifii', 15);
  assert(typeof wasmExports['dynCall_viiiiiiiiiifiii'] != 'undefined', 'missing Wasm export: dynCall_viiiiiiiiiifiii');
  dynCall_viiiiiiiiiifiii = dynCalls['viiiiiiiiiifiii'] = createExportWrapper('dynCall_viiiiiiiiiifiii', 15);
  assert(typeof wasmExports['dynCall_viiiiidddddii'] != 'undefined', 'missing Wasm export: dynCall_viiiiidddddii');
  dynCall_viiiiidddddii = dynCalls['viiiiidddddii'] = createExportWrapper('dynCall_viiiiidddddii', 13);
  assert(typeof wasmExports['dynCall_viiiiiiiiidddddii'] != 'undefined', 'missing Wasm export: dynCall_viiiiiiiiidddddii');
  dynCall_viiiiiiiiidddddii = dynCalls['viiiiiiiiidddddii'] = createExportWrapper('dynCall_viiiiiiiiidddddii', 17);
  assert(typeof wasmExports['dynCall_ifffi'] != 'undefined', 'missing Wasm export: dynCall_ifffi');
  dynCall_ifffi = dynCalls['ifffi'] = createExportWrapper('dynCall_ifffi', 5);
  assert(typeof wasmExports['dynCall_ifffffi'] != 'undefined', 'missing Wasm export: dynCall_ifffffi');
  dynCall_ifffffi = dynCalls['ifffffi'] = createExportWrapper('dynCall_ifffffi', 7);
  assert(typeof wasmExports['dynCall_viiiiiffii'] != 'undefined', 'missing Wasm export: dynCall_viiiiiffii');
  dynCall_viiiiiffii = dynCalls['viiiiiffii'] = createExportWrapper('dynCall_viiiiiffii', 10);
  assert(typeof wasmExports['dynCall_viffffiii'] != 'undefined', 'missing Wasm export: dynCall_viffffiii');
  dynCall_viffffiii = dynCalls['viffffiii'] = createExportWrapper('dynCall_viffffiii', 9);
  assert(typeof wasmExports['dynCall_viffffii'] != 'undefined', 'missing Wasm export: dynCall_viffffii');
  dynCall_viffffii = dynCalls['viffffii'] = createExportWrapper('dynCall_viffffii', 8);
  assert(typeof wasmExports['dynCall_vifffffffffi'] != 'undefined', 'missing Wasm export: dynCall_vifffffffffi');
  dynCall_vifffffffffi = dynCalls['vifffffffffi'] = createExportWrapper('dynCall_vifffffffffi', 12);
  assert(typeof wasmExports['dynCall_jdi'] != 'undefined', 'missing Wasm export: dynCall_jdi');
  dynCall_jdi = dynCalls['jdi'] = createExportWrapper('dynCall_jdi', 3);
  assert(typeof wasmExports['dynCall_viffffffffffffffffi'] != 'undefined', 'missing Wasm export: dynCall_viffffffffffffffffi');
  dynCall_viffffffffffffffffi = dynCalls['viffffffffffffffffi'] = createExportWrapper('dynCall_viffffffffffffffffi', 19);
  assert(typeof wasmExports['dynCall_viiifiii'] != 'undefined', 'missing Wasm export: dynCall_viiifiii');
  dynCall_viiifiii = dynCalls['viiifiii'] = createExportWrapper('dynCall_viiifiii', 8);
  assert(typeof wasmExports['dynCall_viiffiiii'] != 'undefined', 'missing Wasm export: dynCall_viiffiiii');
  dynCall_viiffiiii = dynCalls['viiffiiii'] = createExportWrapper('dynCall_viiffiiii', 9);
  assert(typeof wasmExports['dynCall_viiffiiiiii'] != 'undefined', 'missing Wasm export: dynCall_viiffiiiiii');
  dynCall_viiffiiiiii = dynCalls['viiffiiiiii'] = createExportWrapper('dynCall_viiffiiiiii', 11);
  assert(typeof wasmExports['dynCall_viiffiiiii'] != 'undefined', 'missing Wasm export: dynCall_viiffiiiii');
  dynCall_viiffiiiii = dynCalls['viiffiiiii'] = createExportWrapper('dynCall_viiffiiiii', 10);
  assert(typeof wasmExports['dynCall_viiiiiiffi'] != 'undefined', 'missing Wasm export: dynCall_viiiiiiffi');
  dynCall_viiiiiiffi = dynCalls['viiiiiiffi'] = createExportWrapper('dynCall_viiiiiiffi', 10);
  assert(typeof wasmExports['dynCall_viiiffiii'] != 'undefined', 'missing Wasm export: dynCall_viiiffiii');
  dynCall_viiiffiii = dynCalls['viiiffiii'] = createExportWrapper('dynCall_viiiffiii', 9);
  assert(typeof wasmExports['dynCall_viiiiiifi'] != 'undefined', 'missing Wasm export: dynCall_viiiiiifi');
  dynCall_viiiiiifi = dynCalls['viiiiiifi'] = createExportWrapper('dynCall_viiiiiifi', 9);
  assert(typeof wasmExports['dynCall_iiiiiifi'] != 'undefined', 'missing Wasm export: dynCall_iiiiiifi');
  dynCall_iiiiiifi = dynCalls['iiiiiifi'] = createExportWrapper('dynCall_iiiiiifi', 8);
  assert(typeof wasmExports['dynCall_vifffffi'] != 'undefined', 'missing Wasm export: dynCall_vifffffi');
  dynCall_vifffffi = dynCalls['vifffffi'] = createExportWrapper('dynCall_vifffffi', 8);
  assert(typeof wasmExports['dynCall_iiiiiiiiiiifiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiiiiiiifiii');
  dynCall_iiiiiiiiiiifiii = dynCalls['iiiiiiiiiiifiii'] = createExportWrapper('dynCall_iiiiiiiiiiifiii', 15);
  assert(typeof wasmExports['dynCall_viffiiii'] != 'undefined', 'missing Wasm export: dynCall_viffiiii');
  dynCall_viffiiii = dynCalls['viffiiii'] = createExportWrapper('dynCall_viffiiii', 8);
  assert(typeof wasmExports['dynCall_viiiffffiiii'] != 'undefined', 'missing Wasm export: dynCall_viiiffffiiii');
  dynCall_viiiffffiiii = dynCalls['viiiffffiiii'] = createExportWrapper('dynCall_viiiffffiiii', 12);
  assert(typeof wasmExports['dynCall_viifffffffiiiii'] != 'undefined', 'missing Wasm export: dynCall_viifffffffiiiii');
  dynCall_viifffffffiiiii = dynCalls['viifffffffiiiii'] = createExportWrapper('dynCall_viifffffffiiiii', 15);
  assert(typeof wasmExports['dynCall_iiiiiiffiiiiiiiiiffffiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiiffiiiiiiiiiffffiiii');
  dynCall_iiiiiiffiiiiiiiiiffffiiii = dynCalls['iiiiiiffiiiiiiiiiffffiiii'] = createExportWrapper('dynCall_iiiiiiffiiiiiiiiiffffiiii', 25);
  assert(typeof wasmExports['dynCall_iiiiiiffiiiiiiiiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiiffiiiiiiiiiiiiiii');
  dynCall_iiiiiiffiiiiiiiiiiiiiii = dynCalls['iiiiiiffiiiiiiiiiiiiiii'] = createExportWrapper('dynCall_iiiiiiffiiiiiiiiiiiiiii', 23);
  assert(typeof wasmExports['dynCall_iiffiiiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiffiiiiiiiiii');
  dynCall_iiffiiiiiiiiii = dynCalls['iiffiiiiiiiiii'] = createExportWrapper('dynCall_iiffiiiiiiiiii', 14);
  assert(typeof wasmExports['dynCall_viiiiiiiiiiffiii'] != 'undefined', 'missing Wasm export: dynCall_viiiiiiiiiiffiii');
  dynCall_viiiiiiiiiiffiii = dynCalls['viiiiiiiiiiffiii'] = createExportWrapper('dynCall_viiiiiiiiiiffiii', 16);
  assert(typeof wasmExports['dynCall_viiiiiiifffiii'] != 'undefined', 'missing Wasm export: dynCall_viiiiiiifffiii');
  dynCall_viiiiiiifffiii = dynCalls['viiiiiiifffiii'] = createExportWrapper('dynCall_viiiiiiifffiii', 14);
  assert(typeof wasmExports['dynCall_fffffffi'] != 'undefined', 'missing Wasm export: dynCall_fffffffi');
  dynCall_fffffffi = dynCalls['fffffffi'] = createExportWrapper('dynCall_fffffffi', 8);
  assert(typeof wasmExports['dynCall_viffifi'] != 'undefined', 'missing Wasm export: dynCall_viffifi');
  dynCall_viffifi = dynCalls['viffifi'] = createExportWrapper('dynCall_viffifi', 7);
  assert(typeof wasmExports['dynCall_fifffi'] != 'undefined', 'missing Wasm export: dynCall_fifffi');
  dynCall_fifffi = dynCalls['fifffi'] = createExportWrapper('dynCall_fifffi', 6);
  assert(typeof wasmExports['dynCall_viiffifi'] != 'undefined', 'missing Wasm export: dynCall_viiffifi');
  dynCall_viiffifi = dynCalls['viiffifi'] = createExportWrapper('dynCall_viiffifi', 8);
  assert(typeof wasmExports['dynCall_viiiiiiifiiiii'] != 'undefined', 'missing Wasm export: dynCall_viiiiiiifiiiii');
  dynCall_viiiiiiifiiiii = dynCalls['viiiiiiifiiiii'] = createExportWrapper('dynCall_viiiiiiifiiiii', 14);
  assert(typeof wasmExports['dynCall_viifiiiii'] != 'undefined', 'missing Wasm export: dynCall_viifiiiii');
  dynCall_viifiiiii = dynCalls['viifiiiii'] = createExportWrapper('dynCall_viifiiiii', 9);
  assert(typeof wasmExports['dynCall_iiiffiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiffiiii');
  dynCall_iiiffiiii = dynCalls['iiiffiiii'] = createExportWrapper('dynCall_iiiffiiii', 9);
  assert(typeof wasmExports['dynCall_viififii'] != 'undefined', 'missing Wasm export: dynCall_viififii');
  dynCall_viififii = dynCalls['viififii'] = createExportWrapper('dynCall_viififii', 8);
  assert(typeof wasmExports['dynCall_vififiii'] != 'undefined', 'missing Wasm export: dynCall_vififiii');
  dynCall_vififiii = dynCalls['vififiii'] = createExportWrapper('dynCall_vififiii', 8);
  assert(typeof wasmExports['dynCall_viifiiiiii'] != 'undefined', 'missing Wasm export: dynCall_viifiiiiii');
  dynCall_viifiiiiii = dynCalls['viifiiiiii'] = createExportWrapper('dynCall_viifiiiiii', 10);
  assert(typeof wasmExports['dynCall_vifiiiiii'] != 'undefined', 'missing Wasm export: dynCall_vifiiiiii');
  dynCall_vifiiiiii = dynCalls['vifiiiiii'] = createExportWrapper('dynCall_vifiiiiii', 9);
  assert(typeof wasmExports['dynCall_iiiifiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiifiiiiiii');
  dynCall_iiiifiiiiiii = dynCalls['iiiifiiiiiii'] = createExportWrapper('dynCall_iiiifiiiiiii', 12);
  assert(typeof wasmExports['dynCall_viiiffiiiiii'] != 'undefined', 'missing Wasm export: dynCall_viiiffiiiiii');
  dynCall_viiiffiiiiii = dynCalls['viiiffiiiiii'] = createExportWrapper('dynCall_viiiffiiiiii', 12);
  assert(typeof wasmExports['dynCall_viiiffiiiii'] != 'undefined', 'missing Wasm export: dynCall_viiiffiiiii');
  dynCall_viiiffiiiii = dynCalls['viiiffiiiii'] = createExportWrapper('dynCall_viiiffiiiii', 11);
  assert(typeof wasmExports['dynCall_viiffiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_viiffiiiiiii');
  dynCall_viiffiiiiiii = dynCalls['viiffiiiiiii'] = createExportWrapper('dynCall_viiffiiiiiii', 12);
  assert(typeof wasmExports['dynCall_iiiiffiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiffiiii');
  dynCall_iiiiffiiii = dynCalls['iiiiffiiii'] = createExportWrapper('dynCall_iiiiffiiii', 10);
  assert(typeof wasmExports['dynCall_vffifi'] != 'undefined', 'missing Wasm export: dynCall_vffifi');
  dynCall_vffifi = dynCalls['vffifi'] = createExportWrapper('dynCall_vffifi', 6);
  assert(typeof wasmExports['dynCall_viiififiii'] != 'undefined', 'missing Wasm export: dynCall_viiififiii');
  dynCall_viiififiii = dynCalls['viiififiii'] = createExportWrapper('dynCall_viiififiii', 10);
  assert(typeof wasmExports['dynCall_viiififii'] != 'undefined', 'missing Wasm export: dynCall_viiififii');
  dynCall_viiififii = dynCalls['viiififii'] = createExportWrapper('dynCall_viiififii', 9);
  assert(typeof wasmExports['dynCall_viiifififi'] != 'undefined', 'missing Wasm export: dynCall_viiifififi');
  dynCall_viiifififi = dynCalls['viiifififi'] = createExportWrapper('dynCall_viiifififi', 10);
  assert(typeof wasmExports['dynCall_iijjjiii'] != 'undefined', 'missing Wasm export: dynCall_iijjjiii');
  dynCall_iijjjiii = dynCalls['iijjjiii'] = createExportWrapper('dynCall_iijjjiii', 11);
  assert(typeof wasmExports['dynCall_viiiiiffiii'] != 'undefined', 'missing Wasm export: dynCall_viiiiiffiii');
  dynCall_viiiiiffiii = dynCalls['viiiiiffiii'] = createExportWrapper('dynCall_viiiiiffiii', 11);
  assert(typeof wasmExports['dynCall_viiifiiii'] != 'undefined', 'missing Wasm export: dynCall_viiifiiii');
  dynCall_viiifiiii = dynCalls['viiifiiii'] = createExportWrapper('dynCall_viiifiiii', 9);
  assert(typeof wasmExports['dynCall_fifii'] != 'undefined', 'missing Wasm export: dynCall_fifii');
  dynCall_fifii = dynCalls['fifii'] = createExportWrapper('dynCall_fifii', 5);
  assert(typeof wasmExports['dynCall_fiiifii'] != 'undefined', 'missing Wasm export: dynCall_fiiifii');
  dynCall_fiiifii = dynCalls['fiiifii'] = createExportWrapper('dynCall_fiiifii', 7);
  assert(typeof wasmExports['dynCall_fiiiifi'] != 'undefined', 'missing Wasm export: dynCall_fiiiifi');
  dynCall_fiiiifi = dynCalls['fiiiifi'] = createExportWrapper('dynCall_fiiiifi', 7);
  assert(typeof wasmExports['dynCall_viiiiiffi'] != 'undefined', 'missing Wasm export: dynCall_viiiiiffi');
  dynCall_viiiiiffi = dynCalls['viiiiiffi'] = createExportWrapper('dynCall_viiiiiffi', 9);
  assert(typeof wasmExports['dynCall_fiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_fiiiiiii');
  dynCall_fiiiiiii = dynCalls['fiiiiiii'] = createExportWrapper('dynCall_fiiiiiii', 8);
  assert(typeof wasmExports['dynCall_jjiji'] != 'undefined', 'missing Wasm export: dynCall_jjiji');
  dynCall_jjiji = dynCalls['jjiji'] = createExportWrapper('dynCall_jjiji', 7);
  assert(typeof wasmExports['dynCall_jjijji'] != 'undefined', 'missing Wasm export: dynCall_jjijji');
  dynCall_jjijji = dynCalls['jjijji'] = createExportWrapper('dynCall_jjijji', 9);
  assert(typeof wasmExports['dynCall_jjijii'] != 'undefined', 'missing Wasm export: dynCall_jjijii');
  dynCall_jjijii = dynCalls['jjijii'] = createExportWrapper('dynCall_jjijii', 8);
  assert(typeof wasmExports['dynCall_vjiii'] != 'undefined', 'missing Wasm export: dynCall_vjiii');
  dynCall_vjiii = dynCalls['vjiii'] = createExportWrapper('dynCall_vjiii', 6);
  assert(typeof wasmExports['dynCall_didii'] != 'undefined', 'missing Wasm export: dynCall_didii');
  dynCall_didii = dynCalls['didii'] = createExportWrapper('dynCall_didii', 5);
  assert(typeof wasmExports['dynCall_iidii'] != 'undefined', 'missing Wasm export: dynCall_iidii');
  dynCall_iidii = dynCalls['iidii'] = createExportWrapper('dynCall_iidii', 5);
  assert(typeof wasmExports['dynCall_iijjii'] != 'undefined', 'missing Wasm export: dynCall_iijjii');
  dynCall_iijjii = dynCalls['iijjii'] = createExportWrapper('dynCall_iijjii', 8);
  assert(typeof wasmExports['dynCall_iiddii'] != 'undefined', 'missing Wasm export: dynCall_iiddii');
  dynCall_iiddii = dynCalls['iiddii'] = createExportWrapper('dynCall_iiddii', 6);
  assert(typeof wasmExports['dynCall_viiffiii'] != 'undefined', 'missing Wasm export: dynCall_viiffiii');
  dynCall_viiffiii = dynCalls['viiffiii'] = createExportWrapper('dynCall_viiffiii', 8);
  assert(typeof wasmExports['dynCall_viifffii'] != 'undefined', 'missing Wasm export: dynCall_viifffii');
  dynCall_viifffii = dynCalls['viifffii'] = createExportWrapper('dynCall_viifffii', 8);
  assert(typeof wasmExports['dynCall_viififfi'] != 'undefined', 'missing Wasm export: dynCall_viififfi');
  dynCall_viififfi = dynCalls['viififfi'] = createExportWrapper('dynCall_viififfi', 8);
  assert(typeof wasmExports['dynCall_viififi'] != 'undefined', 'missing Wasm export: dynCall_viififi');
  dynCall_viififi = dynCalls['viififi'] = createExportWrapper('dynCall_viififi', 7);
  assert(typeof wasmExports['dynCall_iijjijii'] != 'undefined', 'missing Wasm export: dynCall_iijjijii');
  dynCall_iijjijii = dynCalls['iijjijii'] = createExportWrapper('dynCall_iijjijii', 11);
  assert(typeof wasmExports['dynCall_iijjiijii'] != 'undefined', 'missing Wasm export: dynCall_iijjiijii');
  dynCall_iijjiijii = dynCalls['iijjiijii'] = createExportWrapper('dynCall_iijjiijii', 12);
  assert(typeof wasmExports['dynCall_iiiiijji'] != 'undefined', 'missing Wasm export: dynCall_iiiiijji');
  dynCall_iiiiijji = dynCalls['iiiiijji'] = createExportWrapper('dynCall_iiiiijji', 10);
  assert(typeof wasmExports['dynCall_viiiijii'] != 'undefined', 'missing Wasm export: dynCall_viiiijii');
  dynCall_viiiijii = dynCalls['viiiijii'] = createExportWrapper('dynCall_viiiijii', 9);
  assert(typeof wasmExports['dynCall_viiijji'] != 'undefined', 'missing Wasm export: dynCall_viiijji');
  dynCall_viiijji = dynCalls['viiijji'] = createExportWrapper('dynCall_viiijji', 9);
  assert(typeof wasmExports['dynCall_jiijiji'] != 'undefined', 'missing Wasm export: dynCall_jiijiji');
  dynCall_jiijiji = dynCalls['jiijiji'] = createExportWrapper('dynCall_jiijiji', 9);
  assert(typeof wasmExports['dynCall_viijijii'] != 'undefined', 'missing Wasm export: dynCall_viijijii');
  dynCall_viijijii = dynCalls['viijijii'] = createExportWrapper('dynCall_viijijii', 10);
  assert(typeof wasmExports['dynCall_jijiji'] != 'undefined', 'missing Wasm export: dynCall_jijiji');
  dynCall_jijiji = dynCalls['jijiji'] = createExportWrapper('dynCall_jijiji', 8);
  assert(typeof wasmExports['dynCall_vijijii'] != 'undefined', 'missing Wasm export: dynCall_vijijii');
  dynCall_vijijii = dynCalls['vijijii'] = createExportWrapper('dynCall_vijijii', 9);
  assert(typeof wasmExports['dynCall_viiiiiji'] != 'undefined', 'missing Wasm export: dynCall_viiiiiji');
  dynCall_viiiiiji = dynCalls['viiiiiji'] = createExportWrapper('dynCall_viiiiiji', 9);
  assert(typeof wasmExports['dynCall_iiiijiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiijiiii');
  dynCall_iiiijiiii = dynCalls['iiiijiiii'] = createExportWrapper('dynCall_iiiijiiii', 10);
  assert(typeof wasmExports['dynCall_iiiijiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiijiiiii');
  dynCall_iiiijiiiii = dynCalls['iiiijiiiii'] = createExportWrapper('dynCall_iiiijiiiii', 11);
  assert(typeof wasmExports['dynCall_jijji'] != 'undefined', 'missing Wasm export: dynCall_jijji');
  dynCall_jijji = dynCalls['jijji'] = createExportWrapper('dynCall_jijji', 7);
  assert(typeof wasmExports['dynCall_viiiidii'] != 'undefined', 'missing Wasm export: dynCall_viiiidii');
  dynCall_viiiidii = dynCalls['viiiidii'] = createExportWrapper('dynCall_viiiidii', 8);
  assert(typeof wasmExports['dynCall_vidiiiii'] != 'undefined', 'missing Wasm export: dynCall_vidiiiii');
  dynCall_vidiiiii = dynCalls['vidiiiii'] = createExportWrapper('dynCall_vidiiiii', 8);
  assert(typeof wasmExports['dynCall_viiidjii'] != 'undefined', 'missing Wasm export: dynCall_viiidjii');
  dynCall_viiidjii = dynCalls['viiidjii'] = createExportWrapper('dynCall_viiidjii', 9);
  assert(typeof wasmExports['dynCall_viijijji'] != 'undefined', 'missing Wasm export: dynCall_viijijji');
  dynCall_viijijji = dynCalls['viijijji'] = createExportWrapper('dynCall_viijijji', 11);
  assert(typeof wasmExports['dynCall_vijijji'] != 'undefined', 'missing Wasm export: dynCall_vijijji');
  dynCall_vijijji = dynCalls['vijijji'] = createExportWrapper('dynCall_vijijji', 10);
  assert(typeof wasmExports['dynCall_vifdi'] != 'undefined', 'missing Wasm export: dynCall_vifdi');
  dynCall_vifdi = dynCalls['vifdi'] = createExportWrapper('dynCall_vifdi', 5);
  assert(typeof wasmExports['dynCall_viiiiifffiii'] != 'undefined', 'missing Wasm export: dynCall_viiiiifffiii');
  dynCall_viiiiifffiii = dynCalls['viiiiifffiii'] = createExportWrapper('dynCall_viiiiifffiii', 12);
  assert(typeof wasmExports['dynCall_viiiiffiffiiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_viiiiffiffiiiiiiiii');
  dynCall_viiiiffiffiiiiiiiii = dynCalls['viiiiffiffiiiiiiiii'] = createExportWrapper('dynCall_viiiiffiffiiiiiiiii', 19);
  assert(typeof wasmExports['dynCall_viiiiffiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_viiiiffiiiiiiii');
  dynCall_viiiiffiiiiiiii = dynCalls['viiiiffiiiiiiii'] = createExportWrapper('dynCall_viiiiffiiiiiiii', 15);
  assert(typeof wasmExports['dynCall_viiiiiffiffiiiiiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_viiiiiffiffiiiiiiiiiiii');
  dynCall_viiiiiffiffiiiiiiiiiiii = dynCalls['viiiiiffiffiiiiiiiiiiii'] = createExportWrapper('dynCall_viiiiiffiffiiiiiiiiiiii', 23);
  assert(typeof wasmExports['dynCall_viiffiiiiiiiiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_viiffiiiiiiiiiiiiiii');
  dynCall_viiffiiiiiiiiiiiiiii = dynCalls['viiffiiiiiiiiiiiiiii'] = createExportWrapper('dynCall_viiffiiiiiiiiiiiiiii', 20);
  assert(typeof wasmExports['dynCall_viifffffi'] != 'undefined', 'missing Wasm export: dynCall_viifffffi');
  dynCall_viifffffi = dynCalls['viifffffi'] = createExportWrapper('dynCall_viifffffi', 9);
  assert(typeof wasmExports['dynCall_viiiiiffiiiii'] != 'undefined', 'missing Wasm export: dynCall_viiiiiffiiiii');
  dynCall_viiiiiffiiiii = dynCalls['viiiiiffiiiii'] = createExportWrapper('dynCall_viiiiiffiiiii', 13);
  assert(typeof wasmExports['dynCall_viiiiiiiifii'] != 'undefined', 'missing Wasm export: dynCall_viiiiiiiifii');
  dynCall_viiiiiiiifii = dynCalls['viiiiiiiifii'] = createExportWrapper('dynCall_viiiiiiiifii', 12);
  assert(typeof wasmExports['dynCall_viiiiiiji'] != 'undefined', 'missing Wasm export: dynCall_viiiiiiji');
  dynCall_viiiiiiji = dynCalls['viiiiiiji'] = createExportWrapper('dynCall_viiiiiiji', 10);
  assert(typeof wasmExports['dynCall_iiiiiiiji'] != 'undefined', 'missing Wasm export: dynCall_iiiiiiiji');
  dynCall_iiiiiiiji = dynCalls['iiiiiiiji'] = createExportWrapper('dynCall_iiiiiiiji', 10);
  assert(typeof wasmExports['dynCall_iiiiiiiiiiiiiiifiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiiiiiiiiiiifiiiiiiii');
  dynCall_iiiiiiiiiiiiiiifiiiiiiii = dynCalls['iiiiiiiiiiiiiiifiiiiiiii'] = createExportWrapper('dynCall_iiiiiiiiiiiiiiifiiiiiiii', 24);
  assert(typeof wasmExports['dynCall_iiiiiiiiiiiiiifiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiiiiiiiiiifiiiiiiii');
  dynCall_iiiiiiiiiiiiiifiiiiiiii = dynCalls['iiiiiiiiiiiiiifiiiiiiii'] = createExportWrapper('dynCall_iiiiiiiiiiiiiifiiiiiiii', 23);
  assert(typeof wasmExports['dynCall_iiiiiiiiiiiiiiiiifiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiiiiiiiiiiiiifiiiiiiii');
  dynCall_iiiiiiiiiiiiiiiiifiiiiiiii = dynCalls['iiiiiiiiiiiiiiiiifiiiiiiii'] = createExportWrapper('dynCall_iiiiiiiiiiiiiiiiifiiiiiiii', 26);
  assert(typeof wasmExports['dynCall_iiiiiiiiiiiiiiiifiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiiiiiiiiiiiifiiiiiiii');
  dynCall_iiiiiiiiiiiiiiiifiiiiiiii = dynCalls['iiiiiiiiiiiiiiiifiiiiiiii'] = createExportWrapper('dynCall_iiiiiiiiiiiiiiiifiiiiiiii', 25);
  assert(typeof wasmExports['dynCall_iiiiiiiiiiiiiiiifiiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiiiiiiiiiiiifiiiiiiiii');
  dynCall_iiiiiiiiiiiiiiiifiiiiiiiii = dynCalls['iiiiiiiiiiiiiiiifiiiiiiiii'] = createExportWrapper('dynCall_iiiiiiiiiiiiiiiifiiiiiiiii', 26);
  assert(typeof wasmExports['dynCall_iiiiiiiiiiiiifiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiiiiiiiiifiiiiiiii');
  dynCall_iiiiiiiiiiiiifiiiiiiii = dynCalls['iiiiiiiiiiiiifiiiiiiii'] = createExportWrapper('dynCall_iiiiiiiiiiiiifiiiiiiii', 22);
  assert(typeof wasmExports['dynCall_iiiiiiiiiiiiiifiiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiiiiiiiiiifiiiiiiiii');
  dynCall_iiiiiiiiiiiiiifiiiiiiiii = dynCalls['iiiiiiiiiiiiiifiiiiiiiii'] = createExportWrapper('dynCall_iiiiiiiiiiiiiifiiiiiiiii', 24);
  assert(typeof wasmExports['dynCall_iiiiiifii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiifii');
  dynCall_iiiiiifii = dynCalls['iiiiiifii'] = createExportWrapper('dynCall_iiiiiifii', 9);
  assert(typeof wasmExports['dynCall_viiiiifii'] != 'undefined', 'missing Wasm export: dynCall_viiiiifii');
  dynCall_viiiiifii = dynCalls['viiiiifii'] = createExportWrapper('dynCall_viiiiifii', 9);
  assert(typeof wasmExports['dynCall_iiiiiiiiiiiifiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiiiiiiiifiiiiiiii');
  dynCall_iiiiiiiiiiiifiiiiiiii = dynCalls['iiiiiiiiiiiifiiiiiiii'] = createExportWrapper('dynCall_iiiiiiiiiiiifiiiiiiii', 21);
  assert(typeof wasmExports['dynCall_iiiiiiifii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiiifii');
  dynCall_iiiiiiifii = dynCalls['iiiiiiifii'] = createExportWrapper('dynCall_iiiiiiifii', 10);
  assert(typeof wasmExports['dynCall_iiiijiii'] != 'undefined', 'missing Wasm export: dynCall_iiiijiii');
  dynCall_iiiijiii = dynCalls['iiiijiii'] = createExportWrapper('dynCall_iiiijiii', 9);
  assert(typeof wasmExports['dynCall_vijjjji'] != 'undefined', 'missing Wasm export: dynCall_vijjjji');
  dynCall_vijjjji = dynCalls['vijjjji'] = createExportWrapper('dynCall_vijjjji', 11);
  assert(typeof wasmExports['dynCall_iijjjji'] != 'undefined', 'missing Wasm export: dynCall_iijjjji');
  dynCall_iijjjji = dynCalls['iijjjji'] = createExportWrapper('dynCall_iijjjji', 11);
  assert(typeof wasmExports['dynCall_viiiffffi'] != 'undefined', 'missing Wasm export: dynCall_viiiffffi');
  dynCall_viiiffffi = dynCalls['viiiffffi'] = createExportWrapper('dynCall_viiiffffi', 9);
  assert(typeof wasmExports['dynCall_ffiiifffi'] != 'undefined', 'missing Wasm export: dynCall_ffiiifffi');
  dynCall_ffiiifffi = dynCalls['ffiiifffi'] = createExportWrapper('dynCall_ffiiifffi', 9);
  assert(typeof wasmExports['dynCall_fifiii'] != 'undefined', 'missing Wasm export: dynCall_fifiii');
  dynCall_fifiii = dynCalls['fifiii'] = createExportWrapper('dynCall_fifiii', 6);
  assert(typeof wasmExports['dynCall_viiiifffi'] != 'undefined', 'missing Wasm export: dynCall_viiiifffi');
  dynCall_viiiifffi = dynCalls['viiiifffi'] = createExportWrapper('dynCall_viiiifffi', 9);
  assert(typeof wasmExports['dynCall_vifffii'] != 'undefined', 'missing Wasm export: dynCall_vifffii');
  dynCall_vifffii = dynCalls['vifffii'] = createExportWrapper('dynCall_vifffii', 7);
  assert(typeof wasmExports['dynCall_iiiiiiiiiiiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiiiiiiiiiiiiii');
  dynCall_iiiiiiiiiiiiiiiiii = dynCalls['iiiiiiiiiiiiiiiiii'] = createExportWrapper('dynCall_iiiiiiiiiiiiiiiiii', 18);
  assert(typeof wasmExports['dynCall_viiiiiiiiiiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_viiiiiiiiiiiiiiiii');
  dynCall_viiiiiiiiiiiiiiiii = dynCalls['viiiiiiiiiiiiiiiii'] = createExportWrapper('dynCall_viiiiiiiiiiiiiiiii', 18);
  assert(typeof wasmExports['dynCall_viiiiiiiiiiiiiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_viiiiiiiiiiiiiiiiiiii');
  dynCall_viiiiiiiiiiiiiiiiiiii = dynCalls['viiiiiiiiiiiiiiiiiiii'] = createExportWrapper('dynCall_viiiiiiiiiiiiiiiiiiii', 21);
  assert(typeof wasmExports['dynCall_iiidi'] != 'undefined', 'missing Wasm export: dynCall_iiidi');
  dynCall_iiidi = dynCalls['iiidi'] = createExportWrapper('dynCall_iiidi', 5);
  assert(typeof wasmExports['dynCall_iijjjjiii'] != 'undefined', 'missing Wasm export: dynCall_iijjjjiii');
  dynCall_iijjjjiii = dynCalls['iijjjjiii'] = createExportWrapper('dynCall_iijjjjiii', 13);
  assert(typeof wasmExports['dynCall_iiiidi'] != 'undefined', 'missing Wasm export: dynCall_iiiidi');
  dynCall_iiiidi = dynCalls['iiiidi'] = createExportWrapper('dynCall_iiiidi', 6);
  assert(typeof wasmExports['dynCall_viifffifi'] != 'undefined', 'missing Wasm export: dynCall_viifffifi');
  dynCall_viifffifi = dynCalls['viifffifi'] = createExportWrapper('dynCall_viifffifi', 9);
  assert(typeof wasmExports['dynCall_viifiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_viifiiiiiii');
  dynCall_viifiiiiiii = dynCalls['viifiiiiiii'] = createExportWrapper('dynCall_viifiiiiiii', 11);
  assert(typeof wasmExports['dynCall_iiiiiifiiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiifiiiiii');
  dynCall_iiiiiifiiiiii = dynCalls['iiiiiifiiiiii'] = createExportWrapper('dynCall_iiiiiifiiiiii', 13);
  assert(typeof wasmExports['dynCall_iiiiiiiifii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiiiifii');
  dynCall_iiiiiiiifii = dynCalls['iiiiiiiifii'] = createExportWrapper('dynCall_iiiiiiiifii', 11);
  assert(typeof wasmExports['dynCall_iiiiiiiifiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiiiifiiiii');
  dynCall_iiiiiiiifiiiii = dynCalls['iiiiiiiifiiiii'] = createExportWrapper('dynCall_iiiiiiiifiiiii', 14);
  assert(typeof wasmExports['dynCall_iiiiiiiifiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiiiifiii');
  dynCall_iiiiiiiifiii = dynCalls['iiiiiiiifiii'] = createExportWrapper('dynCall_iiiiiiiifiii', 12);
  assert(typeof wasmExports['dynCall_iiiiifiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiifiiiii');
  dynCall_iiiiifiiiii = dynCalls['iiiiifiiiii'] = createExportWrapper('dynCall_iiiiifiiiii', 11);
  assert(typeof wasmExports['dynCall_vffiii'] != 'undefined', 'missing Wasm export: dynCall_vffiii');
  dynCall_vffiii = dynCalls['vffiii'] = createExportWrapper('dynCall_vffiii', 6);
  assert(typeof wasmExports['dynCall_vifffiii'] != 'undefined', 'missing Wasm export: dynCall_vifffiii');
  dynCall_vifffiii = dynCalls['vifffiii'] = createExportWrapper('dynCall_vifffiii', 8);
  assert(typeof wasmExports['dynCall_ifiiiifiii'] != 'undefined', 'missing Wasm export: dynCall_ifiiiifiii');
  dynCall_ifiiiifiii = dynCalls['ifiiiifiii'] = createExportWrapper('dynCall_ifiiiifiii', 10);
  assert(typeof wasmExports['dynCall_viiffffiiiii'] != 'undefined', 'missing Wasm export: dynCall_viiffffiiiii');
  dynCall_viiffffiiiii = dynCalls['viiffffiiiii'] = createExportWrapper('dynCall_viiffffiiiii', 12);
  assert(typeof wasmExports['dynCall_vifiifiifi'] != 'undefined', 'missing Wasm export: dynCall_vifiifiifi');
  dynCall_vifiifiifi = dynCalls['vifiifiifi'] = createExportWrapper('dynCall_vifiifiifi', 10);
  assert(typeof wasmExports['dynCall_viiffffffi'] != 'undefined', 'missing Wasm export: dynCall_viiffffffi');
  dynCall_viiffffffi = dynCalls['viiffffffi'] = createExportWrapper('dynCall_viiffffffi', 10);
  assert(typeof wasmExports['dynCall_viifffffffi'] != 'undefined', 'missing Wasm export: dynCall_viifffffffi');
  dynCall_viifffffffi = dynCalls['viifffffffi'] = createExportWrapper('dynCall_viifffffffi', 11);
  assert(typeof wasmExports['dynCall_viiffffffffi'] != 'undefined', 'missing Wasm export: dynCall_viiffffffffi');
  dynCall_viiffffffffi = dynCalls['viiffffffffi'] = createExportWrapper('dynCall_viiffffffffi', 12);
  assert(typeof wasmExports['dynCall_vifiiii'] != 'undefined', 'missing Wasm export: dynCall_vifiiii');
  dynCall_vifiiii = dynCalls['vifiiii'] = createExportWrapper('dynCall_vifiiii', 7);
  assert(typeof wasmExports['dynCall_vidiii'] != 'undefined', 'missing Wasm export: dynCall_vidiii');
  dynCall_vidiii = dynCalls['vidiii'] = createExportWrapper('dynCall_vidiii', 6);
  assert(typeof wasmExports['dynCall_viifffffffiii'] != 'undefined', 'missing Wasm export: dynCall_viifffffffiii');
  dynCall_viifffffffiii = dynCalls['viifffffffiii'] = createExportWrapper('dynCall_viifffffffiii', 13);
  assert(typeof wasmExports['dynCall_viiiiffffii'] != 'undefined', 'missing Wasm export: dynCall_viiiiffffii');
  dynCall_viiiiffffii = dynCalls['viiiiffffii'] = createExportWrapper('dynCall_viiiiffffii', 11);
  assert(typeof wasmExports['dynCall_fiiiiii'] != 'undefined', 'missing Wasm export: dynCall_fiiiiii');
  dynCall_fiiiiii = dynCalls['fiiiiii'] = createExportWrapper('dynCall_fiiiiii', 7);
  assert(typeof wasmExports['dynCall_idiiii'] != 'undefined', 'missing Wasm export: dynCall_idiiii');
  dynCall_idiiii = dynCalls['idiiii'] = createExportWrapper('dynCall_idiiii', 6);
  assert(typeof wasmExports['dynCall_vijiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_vijiiiiiii');
  dynCall_vijiiiiiii = dynCalls['vijiiiiiii'] = createExportWrapper('dynCall_vijiiiiiii', 11);
  assert(typeof wasmExports['dynCall_vijiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_vijiiiiiiii');
  dynCall_vijiiiiiiii = dynCalls['vijiiiiiiii'] = createExportWrapper('dynCall_vijiiiiiiii', 12);
  assert(typeof wasmExports['dynCall_jijiii'] != 'undefined', 'missing Wasm export: dynCall_jijiii');
  dynCall_jijiii = dynCalls['jijiii'] = createExportWrapper('dynCall_jijiii', 7);
  assert(typeof wasmExports['dynCall_jjiiii'] != 'undefined', 'missing Wasm export: dynCall_jjiiii');
  dynCall_jjiiii = dynCalls['jjiiii'] = createExportWrapper('dynCall_jjiiii', 7);
  assert(typeof wasmExports['dynCall_jjiiiii'] != 'undefined', 'missing Wasm export: dynCall_jjiiiii');
  dynCall_jjiiiii = dynCalls['jjiiiii'] = createExportWrapper('dynCall_jjiiiii', 8);
  assert(typeof wasmExports['dynCall_viijiiiiii'] != 'undefined', 'missing Wasm export: dynCall_viijiiiiii');
  dynCall_viijiiiiii = dynCalls['viijiiiiii'] = createExportWrapper('dynCall_viijiiiiii', 11);
  assert(typeof wasmExports['dynCall_iijiiiiii'] != 'undefined', 'missing Wasm export: dynCall_iijiiiiii');
  dynCall_iijiiiiii = dynCalls['iijiiiiii'] = createExportWrapper('dynCall_iijiiiiii', 10);
  assert(typeof wasmExports['dynCall_iiiijjii'] != 'undefined', 'missing Wasm export: dynCall_iiiijjii');
  dynCall_iiiijjii = dynCalls['iiiijjii'] = createExportWrapper('dynCall_iiiijjii', 10);
  assert(typeof wasmExports['dynCall_jijjji'] != 'undefined', 'missing Wasm export: dynCall_jijjji');
  dynCall_jijjji = dynCalls['jijjji'] = createExportWrapper('dynCall_jijjji', 9);
  assert(typeof wasmExports['dynCall_jijjjii'] != 'undefined', 'missing Wasm export: dynCall_jijjjii');
  dynCall_jijjjii = dynCalls['jijjjii'] = createExportWrapper('dynCall_jijjjii', 10);
  assert(typeof wasmExports['dynCall_jjiii'] != 'undefined', 'missing Wasm export: dynCall_jjiii');
  dynCall_jjiii = dynCalls['jjiii'] = createExportWrapper('dynCall_jjiii', 6);
  assert(typeof wasmExports['dynCall_ijijiiiii'] != 'undefined', 'missing Wasm export: dynCall_ijijiiiii');
  dynCall_ijijiiiii = dynCalls['ijijiiiii'] = createExportWrapper('dynCall_ijijiiiii', 11);
  assert(typeof wasmExports['dynCall_ijjjiii'] != 'undefined', 'missing Wasm export: dynCall_ijjjiii');
  dynCall_ijjjiii = dynCalls['ijjjiii'] = createExportWrapper('dynCall_ijjjiii', 10);
  assert(typeof wasmExports['dynCall_vijjjiijii'] != 'undefined', 'missing Wasm export: dynCall_vijjjiijii');
  dynCall_vijjjiijii = dynCalls['vijjjiijii'] = createExportWrapper('dynCall_vijjjiijii', 14);
  assert(typeof wasmExports['dynCall_ijjjiijii'] != 'undefined', 'missing Wasm export: dynCall_ijjjiijii');
  dynCall_ijjjiijii = dynCalls['ijjjiijii'] = createExportWrapper('dynCall_ijjjiijii', 13);
  assert(typeof wasmExports['dynCall_vijiiiiii'] != 'undefined', 'missing Wasm export: dynCall_vijiiiiii');
  dynCall_vijiiiiii = dynCalls['vijiiiiii'] = createExportWrapper('dynCall_vijiiiiii', 10);
  assert(typeof wasmExports['dynCall_jfi'] != 'undefined', 'missing Wasm export: dynCall_jfi');
  dynCall_jfi = dynCalls['jfi'] = createExportWrapper('dynCall_jfi', 3);
  assert(typeof wasmExports['dynCall_dfi'] != 'undefined', 'missing Wasm export: dynCall_dfi');
  dynCall_dfi = dynCalls['dfi'] = createExportWrapper('dynCall_dfi', 3);
  assert(typeof wasmExports['dynCall_jidii'] != 'undefined', 'missing Wasm export: dynCall_jidii');
  dynCall_jidii = dynCalls['jidii'] = createExportWrapper('dynCall_jidii', 5);
  assert(typeof wasmExports['dynCall_jidi'] != 'undefined', 'missing Wasm export: dynCall_jidi');
  dynCall_jidi = dynCalls['jidi'] = createExportWrapper('dynCall_jidi', 4);
  assert(typeof wasmExports['dynCall_ijiijii'] != 'undefined', 'missing Wasm export: dynCall_ijiijii');
  dynCall_ijiijii = dynCalls['ijiijii'] = createExportWrapper('dynCall_ijiijii', 9);
  assert(typeof wasmExports['dynCall_vjjiiiii'] != 'undefined', 'missing Wasm export: dynCall_vjjiiiii');
  dynCall_vjjiiiii = dynCalls['vjjiiiii'] = createExportWrapper('dynCall_vjjiiiii', 10);
  assert(typeof wasmExports['dynCall_vjjii'] != 'undefined', 'missing Wasm export: dynCall_vjjii');
  dynCall_vjjii = dynCalls['vjjii'] = createExportWrapper('dynCall_vjjii', 7);
  assert(typeof wasmExports['dynCall_ijiiji'] != 'undefined', 'missing Wasm export: dynCall_ijiiji');
  dynCall_ijiiji = dynCalls['ijiiji'] = createExportWrapper('dynCall_ijiiji', 8);
  assert(typeof wasmExports['dynCall_ijiiiiji'] != 'undefined', 'missing Wasm export: dynCall_ijiiiiji');
  dynCall_ijiiiiji = dynCalls['ijiiiiji'] = createExportWrapper('dynCall_ijiiiiji', 10);
  assert(typeof wasmExports['dynCall_ddii'] != 'undefined', 'missing Wasm export: dynCall_ddii');
  dynCall_ddii = dynCalls['ddii'] = createExportWrapper('dynCall_ddii', 4);
  assert(typeof wasmExports['dynCall_idiii'] != 'undefined', 'missing Wasm export: dynCall_idiii');
  dynCall_idiii = dynCalls['idiii'] = createExportWrapper('dynCall_idiii', 5);
  assert(typeof wasmExports['dynCall_idiiiii'] != 'undefined', 'missing Wasm export: dynCall_idiiiii');
  dynCall_idiiiii = dynCalls['idiiiii'] = createExportWrapper('dynCall_idiiiii', 7);
  assert(typeof wasmExports['dynCall_iidiii'] != 'undefined', 'missing Wasm export: dynCall_iidiii');
  dynCall_iidiii = dynCalls['iidiii'] = createExportWrapper('dynCall_iidiii', 6);
  assert(typeof wasmExports['dynCall_ifiiiii'] != 'undefined', 'missing Wasm export: dynCall_ifiiiii');
  dynCall_ifiiiii = dynCalls['ifiiiii'] = createExportWrapper('dynCall_ifiiiii', 7);
  assert(typeof wasmExports['dynCall_vdiii'] != 'undefined', 'missing Wasm export: dynCall_vdiii');
  dynCall_vdiii = dynCalls['vdiii'] = createExportWrapper('dynCall_vdiii', 5);
  assert(typeof wasmExports['dynCall_jdii'] != 'undefined', 'missing Wasm export: dynCall_jdii');
  dynCall_jdii = dynCalls['jdii'] = createExportWrapper('dynCall_jdii', 4);
  assert(typeof wasmExports['dynCall_iijjji'] != 'undefined', 'missing Wasm export: dynCall_iijjji');
  dynCall_iijjji = dynCalls['iijjji'] = createExportWrapper('dynCall_iijjji', 9);
  assert(typeof wasmExports['dynCall_viijjji'] != 'undefined', 'missing Wasm export: dynCall_viijjji');
  dynCall_viijjji = dynCalls['viijjji'] = createExportWrapper('dynCall_viijjji', 10);
  assert(typeof wasmExports['dynCall_vdii'] != 'undefined', 'missing Wasm export: dynCall_vdii');
  dynCall_vdii = dynCalls['vdii'] = createExportWrapper('dynCall_vdii', 4);
  assert(typeof wasmExports['dynCall_diddi'] != 'undefined', 'missing Wasm export: dynCall_diddi');
  dynCall_diddi = dynCalls['diddi'] = createExportWrapper('dynCall_diddi', 5);
  assert(typeof wasmExports['dynCall_didi'] != 'undefined', 'missing Wasm export: dynCall_didi');
  dynCall_didi = dynCalls['didi'] = createExportWrapper('dynCall_didi', 4);
  assert(typeof wasmExports['dynCall_viijijiii'] != 'undefined', 'missing Wasm export: dynCall_viijijiii');
  dynCall_viijijiii = dynCalls['viijijiii'] = createExportWrapper('dynCall_viijijiii', 11);
  assert(typeof wasmExports['dynCall_viijiijiii'] != 'undefined', 'missing Wasm export: dynCall_viijiijiii');
  dynCall_viijiijiii = dynCalls['viijiijiii'] = createExportWrapper('dynCall_viijiijiii', 12);
  assert(typeof wasmExports['dynCall_viiiijiiii'] != 'undefined', 'missing Wasm export: dynCall_viiiijiiii');
  dynCall_viiiijiiii = dynCalls['viiiijiiii'] = createExportWrapper('dynCall_viiiijiiii', 11);
  assert(typeof wasmExports['dynCall_jiiiiii'] != 'undefined', 'missing Wasm export: dynCall_jiiiiii');
  dynCall_jiiiiii = dynCalls['jiiiiii'] = createExportWrapper('dynCall_jiiiiii', 7);
  assert(typeof wasmExports['dynCall_vijjji'] != 'undefined', 'missing Wasm export: dynCall_vijjji');
  dynCall_vijjji = dynCalls['vijjji'] = createExportWrapper('dynCall_vijjji', 9);
  assert(typeof wasmExports['dynCall_jiiiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_jiiiiiiiiii');
  dynCall_jiiiiiiiiii = dynCalls['jiiiiiiiiii'] = createExportWrapper('dynCall_jiiiiiiiiii', 11);
  assert(typeof wasmExports['dynCall_viijjii'] != 'undefined', 'missing Wasm export: dynCall_viijjii');
  dynCall_viijjii = dynCalls['viijjii'] = createExportWrapper('dynCall_viijjii', 9);
  assert(typeof wasmExports['dynCall_fiff'] != 'undefined', 'missing Wasm export: dynCall_fiff');
  dynCall_fiff = dynCalls['fiff'] = createExportWrapper('dynCall_fiff', 4);
  assert(typeof wasmExports['dynCall_iiff'] != 'undefined', 'missing Wasm export: dynCall_iiff');
  dynCall_iiff = dynCalls['iiff'] = createExportWrapper('dynCall_iiff', 4);
  assert(typeof wasmExports['dynCall_iiiiiiiiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiiiiiiiiiii');
  dynCall_iiiiiiiiiiiiiii = dynCalls['iiiiiiiiiiiiiii'] = createExportWrapper('dynCall_iiiiiiiiiiiiiii', 15);
  assert(typeof wasmExports['dynCall_iiiiiiiiiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiiiiiiiiiiii');
  dynCall_iiiiiiiiiiiiiiii = dynCalls['iiiiiiiiiiiiiiii'] = createExportWrapper('dynCall_iiiiiiiiiiiiiiii', 16);
  assert(typeof wasmExports['dynCall_iiiiijii'] != 'undefined', 'missing Wasm export: dynCall_iiiiijii');
  dynCall_iiiiijii = dynCalls['iiiiijii'] = createExportWrapper('dynCall_iiiiijii', 9);
  assert(typeof wasmExports['dynCall_iiidiii'] != 'undefined', 'missing Wasm export: dynCall_iiidiii');
  dynCall_iiidiii = dynCalls['iiidiii'] = createExportWrapper('dynCall_iiidiii', 7);
  assert(typeof wasmExports['dynCall_jiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_jiiiiiii');
  dynCall_jiiiiiii = dynCalls['jiiiiiii'] = createExportWrapper('dynCall_jiiiiiii', 8);
  assert(typeof wasmExports['dynCall_iidfii'] != 'undefined', 'missing Wasm export: dynCall_iidfii');
  dynCall_iidfii = dynCalls['iidfii'] = createExportWrapper('dynCall_iidfii', 6);
  assert(typeof wasmExports['dynCall_iidfi'] != 'undefined', 'missing Wasm export: dynCall_iidfi');
  dynCall_iidfi = dynCalls['iidfi'] = createExportWrapper('dynCall_iidfi', 5);
  assert(typeof wasmExports['dynCall_iiddfi'] != 'undefined', 'missing Wasm export: dynCall_iiddfi');
  dynCall_iiddfi = dynCalls['iiddfi'] = createExportWrapper('dynCall_iiddfi', 6);
  assert(typeof wasmExports['dynCall_iijfii'] != 'undefined', 'missing Wasm export: dynCall_iijfii');
  dynCall_iijfii = dynCalls['iijfii'] = createExportWrapper('dynCall_iijfii', 7);
  assert(typeof wasmExports['dynCall_iijfi'] != 'undefined', 'missing Wasm export: dynCall_iijfi');
  dynCall_iijfi = dynCalls['iijfi'] = createExportWrapper('dynCall_iijfi', 6);
  assert(typeof wasmExports['dynCall_iijjfi'] != 'undefined', 'missing Wasm export: dynCall_iijjfi');
  dynCall_iijjfi = dynCalls['iijjfi'] = createExportWrapper('dynCall_iijjfi', 8);
  assert(typeof wasmExports['dynCall_viiiddi'] != 'undefined', 'missing Wasm export: dynCall_viiiddi');
  dynCall_viiiddi = dynCalls['viiiddi'] = createExportWrapper('dynCall_viiiddi', 7);
  assert(typeof wasmExports['dynCall_iiiiiiffidi'] != 'undefined', 'missing Wasm export: dynCall_iiiiiiffidi');
  dynCall_iiiiiiffidi = dynCalls['iiiiiiffidi'] = createExportWrapper('dynCall_iiiiiiffidi', 11);
  assert(typeof wasmExports['dynCall_iiiiffffidi'] != 'undefined', 'missing Wasm export: dynCall_iiiiffffidi');
  dynCall_iiiiffffidi = dynCalls['iiiiffffidi'] = createExportWrapper('dynCall_iiiiffffidi', 11);
  assert(typeof wasmExports['dynCall_vjjiii'] != 'undefined', 'missing Wasm export: dynCall_vjjiii');
  dynCall_vjjiii = dynCalls['vjjiii'] = createExportWrapper('dynCall_vjjiii', 8);
  assert(typeof wasmExports['dynCall_iiidfii'] != 'undefined', 'missing Wasm export: dynCall_iiidfii');
  dynCall_iiidfii = dynCalls['iiidfii'] = createExportWrapper('dynCall_iiidfii', 7);
  assert(typeof wasmExports['dynCall_iiijfii'] != 'undefined', 'missing Wasm export: dynCall_iiijfii');
  dynCall_iiijfii = dynCalls['iiijfii'] = createExportWrapper('dynCall_iiijfii', 8);
  assert(typeof wasmExports['dynCall_iiiiiidi'] != 'undefined', 'missing Wasm export: dynCall_iiiiiidi');
  dynCall_iiiiiidi = dynCalls['iiiiiidi'] = createExportWrapper('dynCall_iiiiiidi', 8);
  assert(typeof wasmExports['dynCall_iiiiiiji'] != 'undefined', 'missing Wasm export: dynCall_iiiiiiji');
  dynCall_iiiiiiji = dynCalls['iiiiiiji'] = createExportWrapper('dynCall_iiiiiiji', 9);
  assert(typeof wasmExports['dynCall_iiiiffiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiffiiiii');
  dynCall_iiiiffiiiii = dynCalls['iiiiffiiiii'] = createExportWrapper('dynCall_iiiiffiiiii', 11);
  assert(typeof wasmExports['dynCall_iiiidfii'] != 'undefined', 'missing Wasm export: dynCall_iiiidfii');
  dynCall_iiiidfii = dynCalls['iiiidfii'] = createExportWrapper('dynCall_iiiidfii', 8);
  assert(typeof wasmExports['dynCall_iiiijfii'] != 'undefined', 'missing Wasm export: dynCall_iiiijfii');
  dynCall_iiiijfii = dynCalls['iiiijfii'] = createExportWrapper('dynCall_iiiijfii', 9);
  assert(typeof wasmExports['dynCall_iiiiffii'] != 'undefined', 'missing Wasm export: dynCall_iiiiffii');
  dynCall_iiiiffii = dynCalls['iiiiffii'] = createExportWrapper('dynCall_iiiiffii', 8);
  assert(typeof wasmExports['dynCall_jijiiii'] != 'undefined', 'missing Wasm export: dynCall_jijiiii');
  dynCall_jijiiii = dynCalls['jijiiii'] = createExportWrapper('dynCall_jijiiii', 8);
  assert(typeof wasmExports['dynCall_viijiiii'] != 'undefined', 'missing Wasm export: dynCall_viijiiii');
  dynCall_viijiiii = dynCalls['viijiiii'] = createExportWrapper('dynCall_viijiiii', 9);
  assert(typeof wasmExports['dynCall_vidiji'] != 'undefined', 'missing Wasm export: dynCall_vidiji');
  dynCall_vidiji = dynCalls['vidiji'] = createExportWrapper('dynCall_vidiji', 7);
  assert(typeof wasmExports['dynCall_vidjii'] != 'undefined', 'missing Wasm export: dynCall_vidjii');
  dynCall_vidjii = dynCalls['vidjii'] = createExportWrapper('dynCall_vidjii', 7);
  assert(typeof wasmExports['dynCall_vdi'] != 'undefined', 'missing Wasm export: dynCall_vdi');
  dynCall_vdi = dynCalls['vdi'] = createExportWrapper('dynCall_vdi', 3);
  assert(typeof wasmExports['dynCall_iiiij'] != 'undefined', 'missing Wasm export: dynCall_iiiij');
  dynCall_iiiij = dynCalls['iiiij'] = createExportWrapper('dynCall_iiiij', 6);
  assert(typeof wasmExports['dynCall_vif'] != 'undefined', 'missing Wasm export: dynCall_vif');
  dynCall_vif = dynCalls['vif'] = createExportWrapper('dynCall_vif', 3);
  assert(typeof wasmExports['dynCall_viif'] != 'undefined', 'missing Wasm export: dynCall_viif');
  dynCall_viif = dynCalls['viif'] = createExportWrapper('dynCall_viif', 4);
  assert(typeof wasmExports['dynCall_viij'] != 'undefined', 'missing Wasm export: dynCall_viij');
  dynCall_viij = dynCalls['viij'] = createExportWrapper('dynCall_viij', 5);
  assert(typeof wasmExports['dynCall_ijj'] != 'undefined', 'missing Wasm export: dynCall_ijj');
  dynCall_ijj = dynCalls['ijj'] = createExportWrapper('dynCall_ijj', 5);
  assert(typeof wasmExports['dynCall_fff'] != 'undefined', 'missing Wasm export: dynCall_fff');
  dynCall_fff = dynCalls['fff'] = createExportWrapper('dynCall_fff', 3);
  assert(typeof wasmExports['dynCall_viiiiijii'] != 'undefined', 'missing Wasm export: dynCall_viiiiijii');
  dynCall_viiiiijii = dynCalls['viiiiijii'] = createExportWrapper('dynCall_viiiiijii', 10);
  assert(typeof wasmExports['dynCall_viffff'] != 'undefined', 'missing Wasm export: dynCall_viffff');
  dynCall_viffff = dynCalls['viffff'] = createExportWrapper('dynCall_viffff', 6);
  assert(typeof wasmExports['dynCall_vj'] != 'undefined', 'missing Wasm export: dynCall_vj');
  dynCall_vj = dynCalls['vj'] = createExportWrapper('dynCall_vj', 3);
  assert(typeof wasmExports['dynCall_vf'] != 'undefined', 'missing Wasm export: dynCall_vf');
  dynCall_vf = dynCalls['vf'] = createExportWrapper('dynCall_vf', 2);
  assert(typeof wasmExports['dynCall_vffff'] != 'undefined', 'missing Wasm export: dynCall_vffff');
  dynCall_vffff = dynCalls['vffff'] = createExportWrapper('dynCall_vffff', 5);
  assert(typeof wasmExports['dynCall_vff'] != 'undefined', 'missing Wasm export: dynCall_vff');
  dynCall_vff = dynCalls['vff'] = createExportWrapper('dynCall_vff', 3);
  assert(typeof wasmExports['dynCall_iiij'] != 'undefined', 'missing Wasm export: dynCall_iiij');
  dynCall_iiij = dynCalls['iiij'] = createExportWrapper('dynCall_iiij', 5);
  assert(typeof wasmExports['dynCall_viiiiiif'] != 'undefined', 'missing Wasm export: dynCall_viiiiiif');
  dynCall_viiiiiif = dynCalls['viiiiiif'] = createExportWrapper('dynCall_viiiiiif', 8);
  assert(typeof wasmExports['dynCall_iiijiiiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_iiijiiiiiiiiii');
  dynCall_iiijiiiiiiiiii = dynCalls['iiijiiiiiiiiii'] = createExportWrapper('dynCall_iiijiiiiiiiiii', 15);
  assert(typeof wasmExports['dynCall_viiiiif'] != 'undefined', 'missing Wasm export: dynCall_viiiiif');
  dynCall_viiiiif = dynCalls['viiiiif'] = createExportWrapper('dynCall_viiiiif', 7);
  assert(typeof wasmExports['dynCall_viiff'] != 'undefined', 'missing Wasm export: dynCall_viiff');
  dynCall_viiff = dynCalls['viiff'] = createExportWrapper('dynCall_viiff', 5);
  assert(typeof wasmExports['dynCall_viiiiiiiiiiiiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_viiiiiiiiiiiiiiiiii');
  dynCall_viiiiiiiiiiiiiiiiii = dynCalls['viiiiiiiiiiiiiiiiii'] = createExportWrapper('dynCall_viiiiiiiiiiiiiiiiii', 19);
  assert(typeof wasmExports['dynCall_vifff'] != 'undefined', 'missing Wasm export: dynCall_vifff');
  dynCall_vifff = dynCalls['vifff'] = createExportWrapper('dynCall_vifff', 5);
  assert(typeof wasmExports['dynCall_viifff'] != 'undefined', 'missing Wasm export: dynCall_viifff');
  dynCall_viifff = dynCalls['viifff'] = createExportWrapper('dynCall_viifff', 6);
  assert(typeof wasmExports['dynCall_viff'] != 'undefined', 'missing Wasm export: dynCall_viff');
  dynCall_viff = dynCalls['viff'] = createExportWrapper('dynCall_viff', 4);
  assert(typeof wasmExports['dynCall_vij'] != 'undefined', 'missing Wasm export: dynCall_vij');
  dynCall_vij = dynCalls['vij'] = createExportWrapper('dynCall_vij', 4);
  assert(typeof wasmExports['dynCall_viiidd'] != 'undefined', 'missing Wasm export: dynCall_viiidd');
  dynCall_viiidd = dynCalls['viiidd'] = createExportWrapper('dynCall_viiidd', 6);
  assert(typeof wasmExports['dynCall_vjiiiiiii'] != 'undefined', 'missing Wasm export: dynCall_vjiiiiiii');
  dynCall_vjiiiiiii = dynCalls['vjiiiiiii'] = createExportWrapper('dynCall_vjiiiiiii', 10);
  assert(typeof wasmExports['dynCall_ij'] != 'undefined', 'missing Wasm export: dynCall_ij');
  dynCall_ij = dynCalls['ij'] = createExportWrapper('dynCall_ij', 3);
  assert(typeof wasmExports['dynCall_vid'] != 'undefined', 'missing Wasm export: dynCall_vid');
  dynCall_vid = dynCalls['vid'] = createExportWrapper('dynCall_vid', 3);
  assert(typeof wasmExports['dynCall_viijj'] != 'undefined', 'missing Wasm export: dynCall_viijj');
  dynCall_viijj = dynCalls['viijj'] = createExportWrapper('dynCall_viijj', 7);
  assert(typeof wasmExports['dynCall_iiijj'] != 'undefined', 'missing Wasm export: dynCall_iiijj');
  dynCall_iiijj = dynCalls['iiijj'] = createExportWrapper('dynCall_iiijj', 7);
  assert(typeof wasmExports['dynCall_viiiif'] != 'undefined', 'missing Wasm export: dynCall_viiiif');
  dynCall_viiiif = dynCalls['viiiif'] = createExportWrapper('dynCall_viiiif', 6);
  assert(typeof wasmExports['dynCall_iiif'] != 'undefined', 'missing Wasm export: dynCall_iiif');
  dynCall_iiif = dynCalls['iiif'] = createExportWrapper('dynCall_iiif', 4);
  assert(typeof wasmExports['dynCall_fif'] != 'undefined', 'missing Wasm export: dynCall_fif');
  dynCall_fif = dynCalls['fif'] = createExportWrapper('dynCall_fif', 3);
  assert(typeof wasmExports['dynCall_iiijji'] != 'undefined', 'missing Wasm export: dynCall_iiijji');
  dynCall_iiijji = dynCalls['iiijji'] = createExportWrapper('dynCall_iiijji', 8);
  assert(typeof wasmExports['dynCall_ijjiiiii'] != 'undefined', 'missing Wasm export: dynCall_ijjiiiii');
  dynCall_ijjiiiii = dynCalls['ijjiiiii'] = createExportWrapper('dynCall_ijjiiiii', 10);
  assert(typeof wasmExports['dynCall_iiiiiifffiiifiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiifffiiifiii');
  dynCall_iiiiiifffiiifiii = dynCalls['iiiiiifffiiifiii'] = createExportWrapper('dynCall_iiiiiifffiiifiii', 16);
  assert(typeof wasmExports['dynCall_viiiffffffi'] != 'undefined', 'missing Wasm export: dynCall_viiiffffffi');
  dynCall_viiiffffffi = dynCalls['viiiffffffi'] = createExportWrapper('dynCall_viiiffffffi', 11);
  assert(typeof wasmExports['dynCall_iijjiii'] != 'undefined', 'missing Wasm export: dynCall_iijjiii');
  dynCall_iijjiii = dynCalls['iijjiii'] = createExportWrapper('dynCall_iijjiii', 9);
  assert(typeof wasmExports['dynCall_vijjjii'] != 'undefined', 'missing Wasm export: dynCall_vijjjii');
  dynCall_vijjjii = dynCalls['vijjjii'] = createExportWrapper('dynCall_vijjjii', 10);
  assert(typeof wasmExports['dynCall_viid'] != 'undefined', 'missing Wasm export: dynCall_viid');
  dynCall_viid = dynCalls['viid'] = createExportWrapper('dynCall_viid', 4);
  assert(typeof wasmExports['dynCall_viiif'] != 'undefined', 'missing Wasm export: dynCall_viiif');
  dynCall_viiif = dynCalls['viiif'] = createExportWrapper('dynCall_viiif', 5);
  assert(typeof wasmExports['dynCall_ffjfj'] != 'undefined', 'missing Wasm export: dynCall_ffjfj');
  dynCall_ffjfj = dynCalls['ffjfj'] = createExportWrapper('dynCall_ffjfj', 7);
  assert(typeof wasmExports['dynCall_fiiiif'] != 'undefined', 'missing Wasm export: dynCall_fiiiif');
  dynCall_fiiiif = dynCalls['fiiiif'] = createExportWrapper('dynCall_fiiiif', 6);
  assert(typeof wasmExports['dynCall_iiiiiifff'] != 'undefined', 'missing Wasm export: dynCall_iiiiiifff');
  dynCall_iiiiiifff = dynCalls['iiiiiifff'] = createExportWrapper('dynCall_iiiiiifff', 9);
  assert(typeof wasmExports['dynCall_iiiiiifiif'] != 'undefined', 'missing Wasm export: dynCall_iiiiiifiif');
  dynCall_iiiiiifiif = dynCalls['iiiiiifiif'] = createExportWrapper('dynCall_iiiiiifiif', 10);
  assert(typeof wasmExports['dynCall_iiiiiifiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiifiii');
  dynCall_iiiiiifiii = dynCalls['iiiiiifiii'] = createExportWrapper('dynCall_iiiiiifiii', 10);
  assert(typeof wasmExports['dynCall_iiiiiiifiif'] != 'undefined', 'missing Wasm export: dynCall_iiiiiiifiif');
  dynCall_iiiiiiifiif = dynCalls['iiiiiiifiif'] = createExportWrapper('dynCall_iiiiiiifiif', 11);
  assert(typeof wasmExports['dynCall_fiiiiiifiifif'] != 'undefined', 'missing Wasm export: dynCall_fiiiiiifiifif');
  dynCall_fiiiiiifiifif = dynCalls['fiiiiiifiifif'] = createExportWrapper('dynCall_fiiiiiifiifif', 13);
  assert(typeof wasmExports['dynCall_fiiiiiifiiiif'] != 'undefined', 'missing Wasm export: dynCall_fiiiiiifiiiif');
  dynCall_fiiiiiifiiiif = dynCalls['fiiiiiifiiiif'] = createExportWrapper('dynCall_fiiiiiifiiiif', 13);
  assert(typeof wasmExports['dynCall_iifiiiijii'] != 'undefined', 'missing Wasm export: dynCall_iifiiiijii');
  dynCall_iifiiiijii = dynCalls['iifiiiijii'] = createExportWrapper('dynCall_iifiiiijii', 11);
  assert(typeof wasmExports['dynCall_vifif'] != 'undefined', 'missing Wasm export: dynCall_vifif');
  dynCall_vifif = dynCalls['vifif'] = createExportWrapper('dynCall_vifif', 5);
  assert(typeof wasmExports['dynCall_vifijii'] != 'undefined', 'missing Wasm export: dynCall_vifijii');
  dynCall_vifijii = dynCalls['vifijii'] = createExportWrapper('dynCall_vifijii', 8);
  assert(typeof wasmExports['dynCall_iiiifffiii'] != 'undefined', 'missing Wasm export: dynCall_iiiifffiii');
  dynCall_iiiifffiii = dynCalls['iiiifffiii'] = createExportWrapper('dynCall_iiiifffiii', 10);
  assert(typeof wasmExports['dynCall_iiiifffffi'] != 'undefined', 'missing Wasm export: dynCall_iiiifffffi');
  dynCall_iiiifffffi = dynCalls['iiiifffffi'] = createExportWrapper('dynCall_iiiifffffi', 10);
  assert(typeof wasmExports['dynCall_viffiiiif'] != 'undefined', 'missing Wasm export: dynCall_viffiiiif');
  dynCall_viffiiiif = dynCalls['viffiiiif'] = createExportWrapper('dynCall_viffiiiif', 9);
  assert(typeof wasmExports['dynCall_viffiifffffiii'] != 'undefined', 'missing Wasm export: dynCall_viffiifffffiii');
  dynCall_viffiifffffiii = dynCalls['viffiifffffiii'] = createExportWrapper('dynCall_viffiifffffiii', 14);
  assert(typeof wasmExports['dynCall_viffffiifffiiiiif'] != 'undefined', 'missing Wasm export: dynCall_viffffiifffiiiiif');
  dynCall_viffffiifffiiiiif = dynCalls['viffffiifffiiiiif'] = createExportWrapper('dynCall_viffffiifffiiiiif', 17);
  assert(typeof wasmExports['dynCall_iiiifffffii'] != 'undefined', 'missing Wasm export: dynCall_iiiifffffii');
  dynCall_iiiifffffii = dynCalls['iiiifffffii'] = createExportWrapper('dynCall_iiiifffffii', 11);
  assert(typeof wasmExports['dynCall_iiiiifiiiiif'] != 'undefined', 'missing Wasm export: dynCall_iiiiifiiiiif');
  dynCall_iiiiifiiiiif = dynCalls['iiiiifiiiiif'] = createExportWrapper('dynCall_iiiiifiiiiif', 12);
  assert(typeof wasmExports['dynCall_viiifiiiii'] != 'undefined', 'missing Wasm export: dynCall_viiifiiiii');
  dynCall_viiifiiiii = dynCalls['viiifiiiii'] = createExportWrapper('dynCall_viiifiiiii', 10);
  assert(typeof wasmExports['dynCall_viiiifiiiiif'] != 'undefined', 'missing Wasm export: dynCall_viiiifiiiiif');
  dynCall_viiiifiiiiif = dynCalls['viiiifiiiiif'] = createExportWrapper('dynCall_viiiifiiiiif', 12);
  assert(typeof wasmExports['dynCall_iifff'] != 'undefined', 'missing Wasm export: dynCall_iifff');
  dynCall_iifff = dynCalls['iifff'] = createExportWrapper('dynCall_iifff', 5);
  assert(typeof wasmExports['dynCall_viijijj'] != 'undefined', 'missing Wasm export: dynCall_viijijj');
  dynCall_viijijj = dynCalls['viijijj'] = createExportWrapper('dynCall_viijijj', 10);
  assert(typeof wasmExports['dynCall_viiiij'] != 'undefined', 'missing Wasm export: dynCall_viiiij');
  dynCall_viiiij = dynCalls['viiiij'] = createExportWrapper('dynCall_viiiij', 7);
  assert(typeof wasmExports['dynCall_viffffffffffffiiii'] != 'undefined', 'missing Wasm export: dynCall_viffffffffffffiiii');
  dynCall_viffffffffffffiiii = dynCalls['viffffffffffffiiii'] = createExportWrapper('dynCall_viffffffffffffiiii', 18);
  assert(typeof wasmExports['dynCall_iif'] != 'undefined', 'missing Wasm export: dynCall_iif');
  dynCall_iif = dynCalls['iif'] = createExportWrapper('dynCall_iif', 3);
  assert(typeof wasmExports['dynCall_jiij'] != 'undefined', 'missing Wasm export: dynCall_jiij');
  dynCall_jiij = dynCalls['jiij'] = createExportWrapper('dynCall_jiij', 5);
  assert(typeof wasmExports['dynCall_ijjii'] != 'undefined', 'missing Wasm export: dynCall_ijjii');
  dynCall_ijjii = dynCalls['ijjii'] = createExportWrapper('dynCall_ijjii', 7);
  assert(typeof wasmExports['dynCall_f'] != 'undefined', 'missing Wasm export: dynCall_f');
  dynCall_f = dynCalls['f'] = createExportWrapper('dynCall_f', 1);
  assert(typeof wasmExports['dynCall_vfff'] != 'undefined', 'missing Wasm export: dynCall_vfff');
  dynCall_vfff = dynCalls['vfff'] = createExportWrapper('dynCall_vfff', 4);
  assert(typeof wasmExports['dynCall_vffffffi'] != 'undefined', 'missing Wasm export: dynCall_vffffffi');
  dynCall_vffffffi = dynCalls['vffffffi'] = createExportWrapper('dynCall_vffffffi', 8);
  assert(typeof wasmExports['dynCall_ff'] != 'undefined', 'missing Wasm export: dynCall_ff');
  dynCall_ff = dynCalls['ff'] = createExportWrapper('dynCall_ff', 2);
  assert(typeof wasmExports['dynCall_if'] != 'undefined', 'missing Wasm export: dynCall_if');
  dynCall_if = dynCalls['if'] = createExportWrapper('dynCall_if', 2);
  assert(typeof wasmExports['dynCall_d'] != 'undefined', 'missing Wasm export: dynCall_d');
  dynCall_d = dynCalls['d'] = createExportWrapper('dynCall_d', 1);
  assert(typeof wasmExports['dynCall_iiiiiiifiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiiifiii');
  dynCall_iiiiiiifiii = dynCalls['iiiiiiifiii'] = createExportWrapper('dynCall_iiiiiiifiii', 11);
  assert(typeof wasmExports['dynCall_viiiiiiiiiifii'] != 'undefined', 'missing Wasm export: dynCall_viiiiiiiiiifii');
  dynCall_viiiiiiiiiifii = dynCalls['viiiiiiiiiifii'] = createExportWrapper('dynCall_viiiiiiiiiifii', 14);
  assert(typeof wasmExports['dynCall_viiiiiiiiidddddi'] != 'undefined', 'missing Wasm export: dynCall_viiiiiiiiidddddi');
  dynCall_viiiiiiiiidddddi = dynCalls['viiiiiiiiidddddi'] = createExportWrapper('dynCall_viiiiiiiiidddddi', 16);
  assert(typeof wasmExports['dynCall_fiif'] != 'undefined', 'missing Wasm export: dynCall_fiif');
  dynCall_fiif = dynCalls['fiif'] = createExportWrapper('dynCall_fiif', 4);
  assert(typeof wasmExports['dynCall_iiiiiiffiiiiiiiiiffffiii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiiffiiiiiiiiiffffiii');
  dynCall_iiiiiiffiiiiiiiiiffffiii = dynCalls['iiiiiiffiiiiiiiiiffffiii'] = createExportWrapper('dynCall_iiiiiiffiiiiiiiiiffffiii', 24);
  assert(typeof wasmExports['dynCall_iiiiiiiiiiifii'] != 'undefined', 'missing Wasm export: dynCall_iiiiiiiiiiifii');
  dynCall_iiiiiiiiiiifii = dynCalls['iiiiiiiiiiifii'] = createExportWrapper('dynCall_iiiiiiiiiiifii', 14);
  assert(typeof wasmExports['dynCall_viiiiiiiiji'] != 'undefined', 'missing Wasm export: dynCall_viiiiiiiiji');
  dynCall_viiiiiiiiji = dynCalls['viiiiiiiiji'] = createExportWrapper('dynCall_viiiiiiiiji', 12);
  assert(typeof wasmExports['memory'] != 'undefined', 'missing Wasm export: memory');
  memory = wasmMemory = wasmExports['memory'];
  assert(typeof wasmExports['__indirect_function_table'] != 'undefined', 'missing Wasm export: __indirect_function_table');
  __indirect_function_table = wasmTable = wasmExports['__indirect_function_table'];
}

var wasmImports = {
  /** @export */
  ChatSocket_Close: _ChatSocket_Close,
  /** @export */
  ChatSocket_Open: _ChatSocket_Open,
  /** @export */
  ChatSocket_Poll: _ChatSocket_Poll,
  /** @export */
  GetJSLoadTimeInfo: _GetJSLoadTimeInfo,
  /** @export */
  GetJSMemoryInfo: _GetJSMemoryInfo,
  /** @export */
  JS_Accelerometer_IsRunning: _JS_Accelerometer_IsRunning,
  /** @export */
  JS_Accelerometer_Start: _JS_Accelerometer_Start,
  /** @export */
  JS_Accelerometer_Stop: _JS_Accelerometer_Stop,
  /** @export */
  JS_CallAsLongAsNoExceptionsSeen: _JS_CallAsLongAsNoExceptionsSeen,
  /** @export */
  JS_Cursor_SetImage: _JS_Cursor_SetImage,
  /** @export */
  JS_Cursor_SetShow: _JS_Cursor_SetShow,
  /** @export */
  JS_DOM_MapViewportCoordinateToElementLocalCoordinate: _JS_DOM_MapViewportCoordinateToElementLocalCoordinate,
  /** @export */
  JS_DOM_UnityCanvasSelector: _JS_DOM_UnityCanvasSelector,
  /** @export */
  JS_DOM_UnityFullscreenElementSelector: _JS_DOM_UnityFullscreenElementSelector,
  /** @export */
  JS_DownloadTextFile: _JS_DownloadTextFile,
  /** @export */
  JS_Eval_OpenURL: _JS_Eval_OpenURL,
  /** @export */
  JS_FileSystem_Initialize: _JS_FileSystem_Initialize,
  /** @export */
  JS_FileSystem_Sync: _JS_FileSystem_Sync,
  /** @export */
  JS_GetDownloadProgress: _JS_GetDownloadProgress,
  /** @export */
  JS_GetRandomBytes: _JS_GetRandomBytes,
  /** @export */
  JS_Get_WASM_Size: _JS_Get_WASM_Size,
  /** @export */
  JS_GravitySensor_IsRunning: _JS_GravitySensor_IsRunning,
  /** @export */
  JS_GravitySensor_Start: _JS_GravitySensor_Start,
  /** @export */
  JS_GravitySensor_Stop: _JS_GravitySensor_Stop,
  /** @export */
  JS_Gyroscope_IsRunning: _JS_Gyroscope_IsRunning,
  /** @export */
  JS_Gyroscope_Start: _JS_Gyroscope_Start,
  /** @export */
  JS_Gyroscope_Stop: _JS_Gyroscope_Stop,
  /** @export */
  JS_Init_ContextMenuHandler: _JS_Init_ContextMenuHandler,
  /** @export */
  JS_Init_CopyPaste: _JS_Init_CopyPaste,
  /** @export */
  JS_IsProgressiveAssetLoadingEnabled: _JS_IsProgressiveAssetLoadingEnabled,
  /** @export */
  JS_LinearAccelerationSensor_IsRunning: _JS_LinearAccelerationSensor_IsRunning,
  /** @export */
  JS_LinearAccelerationSensor_Start: _JS_LinearAccelerationSensor_Start,
  /** @export */
  JS_LinearAccelerationSensor_Stop: _JS_LinearAccelerationSensor_Stop,
  /** @export */
  JS_Log_Dump: _JS_Log_Dump,
  /** @export */
  JS_Log_StackTrace: _JS_Log_StackTrace,
  /** @export */
  JS_MobileKeyboard_GetIgnoreBlurEvent: _JS_MobileKeyboard_GetIgnoreBlurEvent,
  /** @export */
  JS_MobileKeyboard_GetKeyboardStatus: _JS_MobileKeyboard_GetKeyboardStatus,
  /** @export */
  JS_MobileKeyboard_GetText: _JS_MobileKeyboard_GetText,
  /** @export */
  JS_MobileKeyboard_GetTextSelection: _JS_MobileKeyboard_GetTextSelection,
  /** @export */
  JS_MobileKeyboard_Hide: _JS_MobileKeyboard_Hide,
  /** @export */
  JS_MobileKeyboard_SetCharacterLimit: _JS_MobileKeyboard_SetCharacterLimit,
  /** @export */
  JS_MobileKeyboard_SetText: _JS_MobileKeyboard_SetText,
  /** @export */
  JS_MobileKeyboard_SetTextSelection: _JS_MobileKeyboard_SetTextSelection,
  /** @export */
  JS_MobileKeyboard_Show: _JS_MobileKeyboard_Show,
  /** @export */
  JS_Module_WebGLContextAttributes_PowerPreference: _JS_Module_WebGLContextAttributes_PowerPreference,
  /** @export */
  JS_Module_WebGLContextAttributes_PremultipliedAlpha: _JS_Module_WebGLContextAttributes_PremultipliedAlpha,
  /** @export */
  JS_Module_WebGLContextAttributes_PreserveDrawingBuffer: _JS_Module_WebGLContextAttributes_PreserveDrawingBuffer,
  /** @export */
  JS_OrientationSensor_IsRunning: _JS_OrientationSensor_IsRunning,
  /** @export */
  JS_OrientationSensor_Start: _JS_OrientationSensor_Start,
  /** @export */
  JS_OrientationSensor_Stop: _JS_OrientationSensor_Stop,
  /** @export */
  JS_RequestDeviceSensorPermissionsOnTouch: _JS_RequestDeviceSensorPermissionsOnTouch,
  /** @export */
  JS_RunQuitCallbacks: _JS_RunQuitCallbacks,
  /** @export */
  JS_ScreenOrientation_DeInit: _JS_ScreenOrientation_DeInit,
  /** @export */
  JS_ScreenOrientation_Init: _JS_ScreenOrientation_Init,
  /** @export */
  JS_ScreenOrientation_Lock: _JS_ScreenOrientation_Lock,
  /** @export */
  JS_SetLoadingBarProgress: _JS_SetLoadingBarProgress,
  /** @export */
  JS_SetMainLoop: _JS_SetMainLoop,
  /** @export */
  JS_Sound_Create_Channel: _JS_Sound_Create_Channel,
  /** @export */
  JS_Sound_Create_With_Buffer: _JS_Sound_Create_With_Buffer,
  /** @export */
  JS_Sound_GetAudioBufferSampleRate: _JS_Sound_GetAudioBufferSampleRate,
  /** @export */
  JS_Sound_GetAudioContextSampleRate: _JS_Sound_GetAudioContextSampleRate,
  /** @export */
  JS_Sound_GetData: _JS_Sound_GetData,
  /** @export */
  JS_Sound_GetLength: _JS_Sound_GetLength,
  /** @export */
  JS_Sound_GetLoadState: _JS_Sound_GetLoadState,
  /** @export */
  JS_Sound_GetMetaData: _JS_Sound_GetMetaData,
  /** @export */
  JS_Sound_GetPosition: _JS_Sound_GetPosition,
  /** @export */
  JS_Sound_Init: _JS_Sound_Init,
  /** @export */
  JS_Sound_Load: _JS_Sound_Load,
  /** @export */
  JS_Sound_Load_PCM: _JS_Sound_Load_PCM,
  /** @export */
  JS_Sound_Play: _JS_Sound_Play,
  /** @export */
  JS_Sound_ReleaseInstance: _JS_Sound_ReleaseInstance,
  /** @export */
  JS_Sound_ResumeIfNeeded: _JS_Sound_ResumeIfNeeded,
  /** @export */
  JS_Sound_Set3D: _JS_Sound_Set3D,
  /** @export */
  JS_Sound_SetListenerOrientation: _JS_Sound_SetListenerOrientation,
  /** @export */
  JS_Sound_SetListenerPosition: _JS_Sound_SetListenerPosition,
  /** @export */
  JS_Sound_SetLoop: _JS_Sound_SetLoop,
  /** @export */
  JS_Sound_SetLoopPoints: _JS_Sound_SetLoopPoints,
  /** @export */
  JS_Sound_SetPaused: _JS_Sound_SetPaused,
  /** @export */
  JS_Sound_SetPitch: _JS_Sound_SetPitch,
  /** @export */
  JS_Sound_SetPosition: _JS_Sound_SetPosition,
  /** @export */
  JS_Sound_SetVolume: _JS_Sound_SetVolume,
  /** @export */
  JS_Sound_Stop: _JS_Sound_Stop,
  /** @export */
  JS_SystemInfo_GetAnimationFrameRate: _JS_SystemInfo_GetAnimationFrameRate,
  /** @export */
  JS_SystemInfo_GetBrowserName: _JS_SystemInfo_GetBrowserName,
  /** @export */
  JS_SystemInfo_GetBrowserVersionString: _JS_SystemInfo_GetBrowserVersionString,
  /** @export */
  JS_SystemInfo_GetCanvasClientSize: _JS_SystemInfo_GetCanvasClientSize,
  /** @export */
  JS_SystemInfo_GetDocumentURL: _JS_SystemInfo_GetDocumentURL,
  /** @export */
  JS_SystemInfo_GetGPUInfo: _JS_SystemInfo_GetGPUInfo,
  /** @export */
  JS_SystemInfo_GetMatchWebGLToCanvasSize: _JS_SystemInfo_GetMatchWebGLToCanvasSize,
  /** @export */
  JS_SystemInfo_GetOS: _JS_SystemInfo_GetOS,
  /** @export */
  JS_SystemInfo_GetPreferredDevicePixelRatio: _JS_SystemInfo_GetPreferredDevicePixelRatio,
  /** @export */
  JS_SystemInfo_GetScreenSize: _JS_SystemInfo_GetScreenSize,
  /** @export */
  JS_SystemInfo_GetStreamingAssetsURL: _JS_SystemInfo_GetStreamingAssetsURL,
  /** @export */
  JS_SystemInfo_HasAstcHdr: _JS_SystemInfo_HasAstcHdr,
  /** @export */
  JS_SystemInfo_HasCursorLock: _JS_SystemInfo_HasCursorLock,
  /** @export */
  JS_SystemInfo_HasFullscreen: _JS_SystemInfo_HasFullscreen,
  /** @export */
  JS_SystemInfo_HasWebGL: _JS_SystemInfo_HasWebGL,
  /** @export */
  JS_SystemInfo_HasWebGPU: _JS_SystemInfo_HasWebGPU,
  /** @export */
  JS_SystemInfo_IsMobile: _JS_SystemInfo_IsMobile,
  /** @export */
  JS_UnityEngineShouldQuit: _JS_UnityEngineShouldQuit,
  /** @export */
  JS_WebCamVideo_GetNativeHeight: _JS_WebCamVideo_GetNativeHeight,
  /** @export */
  JS_WebCamVideo_GetNativeWidth: _JS_WebCamVideo_GetNativeWidth,
  /** @export */
  JS_WebCamVideo_GrabFrame: _JS_WebCamVideo_GrabFrame,
  /** @export */
  JS_WebGPU_SetCommandEncoder: _JS_WebGPU_SetCommandEncoder,
  /** @export */
  JS_WebGPU_Setup: _JS_WebGPU_Setup,
  /** @export */
  JS_WebPlayer_FinishInitialization: _JS_WebPlayer_FinishInitialization,
  /** @export */
  JS_WebRequest_Abort: _JS_WebRequest_Abort,
  /** @export */
  JS_WebRequest_Create: _JS_WebRequest_Create,
  /** @export */
  JS_WebRequest_GetResponseMetaData: _JS_WebRequest_GetResponseMetaData,
  /** @export */
  JS_WebRequest_GetResponseMetaDataLengths: _JS_WebRequest_GetResponseMetaDataLengths,
  /** @export */
  JS_WebRequest_Release: _JS_WebRequest_Release,
  /** @export */
  JS_WebRequest_Send: _JS_WebRequest_Send,
  /** @export */
  JS_WebRequest_SetRedirectLimit: _JS_WebRequest_SetRedirectLimit,
  /** @export */
  JS_WebRequest_SetRequestHeader: _JS_WebRequest_SetRequestHeader,
  /** @export */
  JS_WebRequest_SetTimeout: _JS_WebRequest_SetTimeout,
  /** @export */
  Telegram_CloseWebApp: _Telegram_CloseWebApp,
  /** @export */
  Telegram_EnsureWebAppScript: _Telegram_EnsureWebAppScript,
  /** @export */
  Telegram_GetUserData: _Telegram_GetUserData,
  /** @export */
  Telegram_GetUserId: _Telegram_GetUserId,
  /** @export */
  __assert_fail: ___assert_fail,
  /** @export */
  __cxa_begin_catch: ___cxa_begin_catch,
  /** @export */
  __cxa_end_catch: ___cxa_end_catch,
  /** @export */
  __cxa_find_matching_catch_2: ___cxa_find_matching_catch_2,
  /** @export */
  __cxa_find_matching_catch_3: ___cxa_find_matching_catch_3,
  /** @export */
  __cxa_find_matching_catch_4: ___cxa_find_matching_catch_4,
  /** @export */
  __cxa_rethrow: ___cxa_rethrow,
  /** @export */
  __cxa_throw: ___cxa_throw,
  /** @export */
  __cxa_uncaught_exceptions: ___cxa_uncaught_exceptions,
  /** @export */
  __resumeException: ___resumeException,
  /** @export */
  __syscall__newselect: ___syscall__newselect,
  /** @export */
  __syscall_accept4: ___syscall_accept4,
  /** @export */
  __syscall_chmod: ___syscall_chmod,
  /** @export */
  __syscall_connect: ___syscall_connect,
  /** @export */
  __syscall_faccessat: ___syscall_faccessat,
  /** @export */
  __syscall_fcntl64: ___syscall_fcntl64,
  /** @export */
  __syscall_fstat64: ___syscall_fstat64,
  /** @export */
  __syscall_ftruncate64: ___syscall_ftruncate64,
  /** @export */
  __syscall_getcwd: ___syscall_getcwd,
  /** @export */
  __syscall_getdents64: ___syscall_getdents64,
  /** @export */
  __syscall_getsockopt: ___syscall_getsockopt,
  /** @export */
  __syscall_ioctl: ___syscall_ioctl,
  /** @export */
  __syscall_lstat64: ___syscall_lstat64,
  /** @export */
  __syscall_mkdirat: ___syscall_mkdirat,
  /** @export */
  __syscall_newfstatat: ___syscall_newfstatat,
  /** @export */
  __syscall_openat: ___syscall_openat,
  /** @export */
  __syscall_readlinkat: ___syscall_readlinkat,
  /** @export */
  __syscall_recvfrom: ___syscall_recvfrom,
  /** @export */
  __syscall_renameat: ___syscall_renameat,
  /** @export */
  __syscall_rmdir: ___syscall_rmdir,
  /** @export */
  __syscall_sendto: ___syscall_sendto,
  /** @export */
  __syscall_socket: ___syscall_socket,
  /** @export */
  __syscall_stat64: ___syscall_stat64,
  /** @export */
  __syscall_statfs64: ___syscall_statfs64,
  /** @export */
  __syscall_symlinkat: ___syscall_symlinkat,
  /** @export */
  __syscall_truncate64: ___syscall_truncate64,
  /** @export */
  __syscall_unlinkat: ___syscall_unlinkat,
  /** @export */
  __syscall_utimensat: ___syscall_utimensat,
  /** @export */
  _abort_js: __abort_js,
  /** @export */
  _emscripten_log_formatted: __emscripten_log_formatted,
  /** @export */
  _emscripten_lookup_name: __emscripten_lookup_name,
  /** @export */
  _emscripten_throw_longjmp: __emscripten_throw_longjmp,
  /** @export */
  _gmtime_js: __gmtime_js,
  /** @export */
  _localtime_js: __localtime_js,
  /** @export */
  _mktime_js: __mktime_js,
  /** @export */
  _tzset_js: __tzset_js,
  /** @export */
  clock_res_get: _clock_res_get,
  /** @export */
  clock_time_get: _clock_time_get,
  /** @export */
  emscripten_cancel_main_loop: _emscripten_cancel_main_loop,
  /** @export */
  emscripten_clear_interval: _emscripten_clear_interval,
  /** @export */
  emscripten_console_error: _emscripten_console_error,
  /** @export */
  emscripten_date_now: _emscripten_date_now,
  /** @export */
  emscripten_debugger: _emscripten_debugger,
  /** @export */
  emscripten_err: _emscripten_err,
  /** @export */
  emscripten_exit_fullscreen: _emscripten_exit_fullscreen,
  /** @export */
  emscripten_exit_pointerlock: _emscripten_exit_pointerlock,
  /** @export */
  emscripten_get_canvas_element_size: _emscripten_get_canvas_element_size,
  /** @export */
  emscripten_get_fullscreen_status: _emscripten_get_fullscreen_status,
  /** @export */
  emscripten_get_gamepad_status: _emscripten_get_gamepad_status,
  /** @export */
  emscripten_get_heap_max: _emscripten_get_heap_max,
  /** @export */
  emscripten_get_now: _emscripten_get_now,
  /** @export */
  emscripten_get_num_gamepads: _emscripten_get_num_gamepads,
  /** @export */
  emscripten_html5_remove_all_event_listeners: _emscripten_html5_remove_all_event_listeners,
  /** @export */
  emscripten_is_webgl_context_lost: _emscripten_is_webgl_context_lost,
  /** @export */
  emscripten_performance_now: _emscripten_performance_now,
  /** @export */
  emscripten_request_fullscreen: _emscripten_request_fullscreen,
  /** @export */
  emscripten_request_pointerlock: _emscripten_request_pointerlock,
  /** @export */
  emscripten_resize_heap: _emscripten_resize_heap,
  /** @export */
  emscripten_sample_gamepad_data: _emscripten_sample_gamepad_data,
  /** @export */
  emscripten_set_blur_callback_on_thread: _emscripten_set_blur_callback_on_thread,
  /** @export */
  emscripten_set_canvas_element_size: _emscripten_set_canvas_element_size,
  /** @export */
  emscripten_set_focus_callback_on_thread: _emscripten_set_focus_callback_on_thread,
  /** @export */
  emscripten_set_fullscreenchange_callback_on_thread: _emscripten_set_fullscreenchange_callback_on_thread,
  /** @export */
  emscripten_set_gamepadconnected_callback_on_thread: _emscripten_set_gamepadconnected_callback_on_thread,
  /** @export */
  emscripten_set_gamepaddisconnected_callback_on_thread: _emscripten_set_gamepaddisconnected_callback_on_thread,
  /** @export */
  emscripten_set_interval: _emscripten_set_interval,
  /** @export */
  emscripten_set_keydown_callback_on_thread: _emscripten_set_keydown_callback_on_thread,
  /** @export */
  emscripten_set_keypress_callback_on_thread: _emscripten_set_keypress_callback_on_thread,
  /** @export */
  emscripten_set_keyup_callback_on_thread: _emscripten_set_keyup_callback_on_thread,
  /** @export */
  emscripten_set_main_loop_timing: _emscripten_set_main_loop_timing,
  /** @export */
  emscripten_set_mousedown_callback_on_thread: _emscripten_set_mousedown_callback_on_thread,
  /** @export */
  emscripten_set_mousemove_callback_on_thread: _emscripten_set_mousemove_callback_on_thread,
  /** @export */
  emscripten_set_mouseup_callback_on_thread: _emscripten_set_mouseup_callback_on_thread,
  /** @export */
  emscripten_set_pointerlockchange_callback_on_thread: _emscripten_set_pointerlockchange_callback_on_thread,
  /** @export */
  emscripten_set_touchcancel_callback_on_thread: _emscripten_set_touchcancel_callback_on_thread,
  /** @export */
  emscripten_set_touchend_callback_on_thread: _emscripten_set_touchend_callback_on_thread,
  /** @export */
  emscripten_set_touchmove_callback_on_thread: _emscripten_set_touchmove_callback_on_thread,
  /** @export */
  emscripten_set_touchstart_callback_on_thread: _emscripten_set_touchstart_callback_on_thread,
  /** @export */
  emscripten_set_wheel_callback_on_thread: _emscripten_set_wheel_callback_on_thread,
  /** @export */
  emscripten_webgl_create_context: _emscripten_webgl_create_context,
  /** @export */
  emscripten_webgl_destroy_context: _emscripten_webgl_destroy_context,
  /** @export */
  emscripten_webgl_enable_extension: _emscripten_webgl_enable_extension,
  /** @export */
  emscripten_webgl_get_current_context: _emscripten_webgl_get_current_context,
  /** @export */
  emscripten_webgl_make_context_current: _emscripten_webgl_make_context_current,
  /** @export */
  environ_get: _environ_get,
  /** @export */
  environ_sizes_get: _environ_sizes_get,
  /** @export */
  exit: _exit,
  /** @export */
  fd_close: _fd_close,
  /** @export */
  fd_fdstat_get: _fd_fdstat_get,
  /** @export */
  fd_read: _fd_read,
  /** @export */
  fd_seek: _fd_seek,
  /** @export */
  fd_write: _fd_write,
  /** @export */
  getnameinfo: _getnameinfo,
  /** @export */
  glActiveTexture: _glActiveTexture,
  /** @export */
  glAttachShader: _glAttachShader,
  /** @export */
  glBeginQuery: _glBeginQuery,
  /** @export */
  glBindAttribLocation: _glBindAttribLocation,
  /** @export */
  glBindBuffer: _glBindBuffer,
  /** @export */
  glBindBufferBase: _glBindBufferBase,
  /** @export */
  glBindBufferRange: _glBindBufferRange,
  /** @export */
  glBindFramebuffer: _glBindFramebuffer,
  /** @export */
  glBindRenderbuffer: _glBindRenderbuffer,
  /** @export */
  glBindSampler: _glBindSampler,
  /** @export */
  glBindTexture: _glBindTexture,
  /** @export */
  glBindVertexArray: _glBindVertexArray,
  /** @export */
  glBlendEquation: _glBlendEquation,
  /** @export */
  glBlendEquationSeparate: _glBlendEquationSeparate,
  /** @export */
  glBlendFuncSeparate: _glBlendFuncSeparate,
  /** @export */
  glBlitFramebuffer: _glBlitFramebuffer,
  /** @export */
  glBufferData: _glBufferData,
  /** @export */
  glBufferSubData: _glBufferSubData,
  /** @export */
  glCheckFramebufferStatus: _glCheckFramebufferStatus,
  /** @export */
  glClear: _glClear,
  /** @export */
  glClearBufferfi: _glClearBufferfi,
  /** @export */
  glClearBufferfv: _glClearBufferfv,
  /** @export */
  glClearBufferuiv: _glClearBufferuiv,
  /** @export */
  glClearColor: _glClearColor,
  /** @export */
  glClearDepthf: _glClearDepthf,
  /** @export */
  glClearStencil: _glClearStencil,
  /** @export */
  glClientWaitSync: _glClientWaitSync,
  /** @export */
  glColorMask: _glColorMask,
  /** @export */
  glCompileShader: _glCompileShader,
  /** @export */
  glCompressedTexImage2D: _glCompressedTexImage2D,
  /** @export */
  glCompressedTexImage3D: _glCompressedTexImage3D,
  /** @export */
  glCompressedTexSubImage2D: _glCompressedTexSubImage2D,
  /** @export */
  glCompressedTexSubImage3D: _glCompressedTexSubImage3D,
  /** @export */
  glCopyBufferSubData: _glCopyBufferSubData,
  /** @export */
  glCopyTexImage2D: _glCopyTexImage2D,
  /** @export */
  glCopyTexSubImage2D: _glCopyTexSubImage2D,
  /** @export */
  glCreateProgram: _glCreateProgram,
  /** @export */
  glCreateShader: _glCreateShader,
  /** @export */
  glCullFace: _glCullFace,
  /** @export */
  glDeleteBuffers: _glDeleteBuffers,
  /** @export */
  glDeleteFramebuffers: _glDeleteFramebuffers,
  /** @export */
  glDeleteProgram: _glDeleteProgram,
  /** @export */
  glDeleteQueries: _glDeleteQueries,
  /** @export */
  glDeleteRenderbuffers: _glDeleteRenderbuffers,
  /** @export */
  glDeleteSamplers: _glDeleteSamplers,
  /** @export */
  glDeleteShader: _glDeleteShader,
  /** @export */
  glDeleteSync: _glDeleteSync,
  /** @export */
  glDeleteTextures: _glDeleteTextures,
  /** @export */
  glDeleteVertexArrays: _glDeleteVertexArrays,
  /** @export */
  glDepthFunc: _glDepthFunc,
  /** @export */
  glDepthMask: _glDepthMask,
  /** @export */
  glDetachShader: _glDetachShader,
  /** @export */
  glDisable: _glDisable,
  /** @export */
  glDisableVertexAttribArray: _glDisableVertexAttribArray,
  /** @export */
  glDrawArrays: _glDrawArrays,
  /** @export */
  glDrawArraysInstanced: _glDrawArraysInstanced,
  /** @export */
  glDrawBuffers: _glDrawBuffers,
  /** @export */
  glDrawElements: _glDrawElements,
  /** @export */
  glDrawElementsInstanced: _glDrawElementsInstanced,
  /** @export */
  glEnable: _glEnable,
  /** @export */
  glEnableVertexAttribArray: _glEnableVertexAttribArray,
  /** @export */
  glEndQuery: _glEndQuery,
  /** @export */
  glFenceSync: _glFenceSync,
  /** @export */
  glFinish: _glFinish,
  /** @export */
  glFlush: _glFlush,
  /** @export */
  glFlushMappedBufferRange: _glFlushMappedBufferRange,
  /** @export */
  glFramebufferRenderbuffer: _glFramebufferRenderbuffer,
  /** @export */
  glFramebufferTexture2D: _glFramebufferTexture2D,
  /** @export */
  glFramebufferTextureLayer: _glFramebufferTextureLayer,
  /** @export */
  glFrontFace: _glFrontFace,
  /** @export */
  glGenBuffers: _glGenBuffers,
  /** @export */
  glGenFramebuffers: _glGenFramebuffers,
  /** @export */
  glGenQueries: _glGenQueries,
  /** @export */
  glGenRenderbuffers: _glGenRenderbuffers,
  /** @export */
  glGenSamplers: _glGenSamplers,
  /** @export */
  glGenTextures: _glGenTextures,
  /** @export */
  glGenVertexArrays: _glGenVertexArrays,
  /** @export */
  glGenerateMipmap: _glGenerateMipmap,
  /** @export */
  glGetActiveAttrib: _glGetActiveAttrib,
  /** @export */
  glGetActiveUniform: _glGetActiveUniform,
  /** @export */
  glGetActiveUniformBlockName: _glGetActiveUniformBlockName,
  /** @export */
  glGetActiveUniformBlockiv: _glGetActiveUniformBlockiv,
  /** @export */
  glGetActiveUniformsiv: _glGetActiveUniformsiv,
  /** @export */
  glGetAttribLocation: _glGetAttribLocation,
  /** @export */
  glGetBufferSubData: _glGetBufferSubData,
  /** @export */
  glGetError: _glGetError,
  /** @export */
  glGetFramebufferAttachmentParameteriv: _glGetFramebufferAttachmentParameteriv,
  /** @export */
  glGetIntegeri_v: _glGetIntegeri_v,
  /** @export */
  glGetIntegerv: _glGetIntegerv,
  /** @export */
  glGetInternalformativ: _glGetInternalformativ,
  /** @export */
  glGetProgramBinary: _glGetProgramBinary,
  /** @export */
  glGetProgramInfoLog: _glGetProgramInfoLog,
  /** @export */
  glGetProgramiv: _glGetProgramiv,
  /** @export */
  glGetQueryObjectuiv: _glGetQueryObjectuiv,
  /** @export */
  glGetQueryiv: _glGetQueryiv,
  /** @export */
  glGetRenderbufferParameteriv: _glGetRenderbufferParameteriv,
  /** @export */
  glGetShaderInfoLog: _glGetShaderInfoLog,
  /** @export */
  glGetShaderPrecisionFormat: _glGetShaderPrecisionFormat,
  /** @export */
  glGetShaderSource: _glGetShaderSource,
  /** @export */
  glGetShaderiv: _glGetShaderiv,
  /** @export */
  glGetString: _glGetString,
  /** @export */
  glGetStringi: _glGetStringi,
  /** @export */
  glGetTexParameteriv: _glGetTexParameteriv,
  /** @export */
  glGetUniformBlockIndex: _glGetUniformBlockIndex,
  /** @export */
  glGetUniformIndices: _glGetUniformIndices,
  /** @export */
  glGetUniformLocation: _glGetUniformLocation,
  /** @export */
  glGetUniformiv: _glGetUniformiv,
  /** @export */
  glGetVertexAttribiv: _glGetVertexAttribiv,
  /** @export */
  glInvalidateFramebuffer: _glInvalidateFramebuffer,
  /** @export */
  glIsEnabled: _glIsEnabled,
  /** @export */
  glIsVertexArray: _glIsVertexArray,
  /** @export */
  glLinkProgram: _glLinkProgram,
  /** @export */
  glMapBufferRange: _glMapBufferRange,
  /** @export */
  glPixelStorei: _glPixelStorei,
  /** @export */
  glPolygonOffset: _glPolygonOffset,
  /** @export */
  glProgramBinary: _glProgramBinary,
  /** @export */
  glProgramParameteri: _glProgramParameteri,
  /** @export */
  glReadBuffer: _glReadBuffer,
  /** @export */
  glReadPixels: _glReadPixels,
  /** @export */
  glRenderbufferStorage: _glRenderbufferStorage,
  /** @export */
  glRenderbufferStorageMultisample: _glRenderbufferStorageMultisample,
  /** @export */
  glSamplerParameteri: _glSamplerParameteri,
  /** @export */
  glScissor: _glScissor,
  /** @export */
  glShaderSource: _glShaderSource,
  /** @export */
  glStencilFuncSeparate: _glStencilFuncSeparate,
  /** @export */
  glStencilMask: _glStencilMask,
  /** @export */
  glStencilOpSeparate: _glStencilOpSeparate,
  /** @export */
  glTexImage2D: _glTexImage2D,
  /** @export */
  glTexImage3D: _glTexImage3D,
  /** @export */
  glTexParameterf: _glTexParameterf,
  /** @export */
  glTexParameteri: _glTexParameteri,
  /** @export */
  glTexParameteriv: _glTexParameteriv,
  /** @export */
  glTexStorage2D: _glTexStorage2D,
  /** @export */
  glTexStorage3D: _glTexStorage3D,
  /** @export */
  glTexSubImage2D: _glTexSubImage2D,
  /** @export */
  glTexSubImage3D: _glTexSubImage3D,
  /** @export */
  glUniform1fv: _glUniform1fv,
  /** @export */
  glUniform1i: _glUniform1i,
  /** @export */
  glUniform1iv: _glUniform1iv,
  /** @export */
  glUniform1uiv: _glUniform1uiv,
  /** @export */
  glUniform2fv: _glUniform2fv,
  /** @export */
  glUniform2iv: _glUniform2iv,
  /** @export */
  glUniform2uiv: _glUniform2uiv,
  /** @export */
  glUniform3fv: _glUniform3fv,
  /** @export */
  glUniform3iv: _glUniform3iv,
  /** @export */
  glUniform3uiv: _glUniform3uiv,
  /** @export */
  glUniform4fv: _glUniform4fv,
  /** @export */
  glUniform4iv: _glUniform4iv,
  /** @export */
  glUniform4uiv: _glUniform4uiv,
  /** @export */
  glUniformBlockBinding: _glUniformBlockBinding,
  /** @export */
  glUniformMatrix3fv: _glUniformMatrix3fv,
  /** @export */
  glUniformMatrix4fv: _glUniformMatrix4fv,
  /** @export */
  glUnmapBuffer: _glUnmapBuffer,
  /** @export */
  glUseProgram: _glUseProgram,
  /** @export */
  glValidateProgram: _glValidateProgram,
  /** @export */
  glVertexAttrib4f: _glVertexAttrib4f,
  /** @export */
  glVertexAttrib4fv: _glVertexAttrib4fv,
  /** @export */
  glVertexAttribIPointer: _glVertexAttribIPointer,
  /** @export */
  glVertexAttribPointer: _glVertexAttribPointer,
  /** @export */
  glViewport: _glViewport,
  /** @export */
  invoke_dddi,
  /** @export */
  invoke_ddiii,
  /** @export */
  invoke_di,
  /** @export */
  invoke_dii,
  /** @export */
  invoke_diidi,
  /** @export */
  invoke_diii,
  /** @export */
  invoke_diiiii,
  /** @export */
  invoke_fffi,
  /** @export */
  invoke_ffi,
  /** @export */
  invoke_ffii,
  /** @export */
  invoke_fi,
  /** @export */
  invoke_fiffi,
  /** @export */
  invoke_fifi,
  /** @export */
  invoke_fii,
  /** @export */
  invoke_fiiffi,
  /** @export */
  invoke_fiifi,
  /** @export */
  invoke_fiii,
  /** @export */
  invoke_fiiii,
  /** @export */
  invoke_fiiiii,
  /** @export */
  invoke_i,
  /** @export */
  invoke_iffi,
  /** @export */
  invoke_ii,
  /** @export */
  invoke_iiffi,
  /** @export */
  invoke_iifi,
  /** @export */
  invoke_iifii,
  /** @export */
  invoke_iii,
  /** @export */
  invoke_iiif,
  /** @export */
  invoke_iiifi,
  /** @export */
  invoke_iiifii,
  /** @export */
  invoke_iiifiiiiiii,
  /** @export */
  invoke_iiii,
  /** @export */
  invoke_iiiidii,
  /** @export */
  invoke_iiiifii,
  /** @export */
  invoke_iiiifiiii,
  /** @export */
  invoke_iiiii,
  /** @export */
  invoke_iiiiidii,
  /** @export */
  invoke_iiiiiffiffiiiiiiiiiiii,
  /** @export */
  invoke_iiiiifi,
  /** @export */
  invoke_iiiiii,
  /** @export */
  invoke_iiiiiiffiiiiiiiiiffffiii,
  /** @export */
  invoke_iiiiiii,
  /** @export */
  invoke_iiiiiiidii,
  /** @export */
  invoke_iiiiiiifiiii,
  /** @export */
  invoke_iiiiiiii,
  /** @export */
  invoke_iiiiiiiii,
  /** @export */
  invoke_iiiiiiiiii,
  /** @export */
  invoke_iiiiiiiiiii,
  /** @export */
  invoke_iiiiiiiiiiifii,
  /** @export */
  invoke_iiiiiiiiiiii,
  /** @export */
  invoke_iiiiiiiiiiiii,
  /** @export */
  invoke_iiiiiiiiiiiiii,
  /** @export */
  invoke_iiiiiiiiiji,
  /** @export */
  invoke_iiiijii,
  /** @export */
  invoke_iiijii,
  /** @export */
  invoke_iiijiii,
  /** @export */
  invoke_iij,
  /** @export */
  invoke_iiji,
  /** @export */
  invoke_iijii,
  /** @export */
  invoke_iijiii,
  /** @export */
  invoke_iijiiii,
  /** @export */
  invoke_iijji,
  /** @export */
  invoke_iji,
  /** @export */
  invoke_ijji,
  /** @export */
  invoke_j,
  /** @export */
  invoke_ji,
  /** @export */
  invoke_jii,
  /** @export */
  invoke_jiii,
  /** @export */
  invoke_jiiii,
  /** @export */
  invoke_jiiiii,
  /** @export */
  invoke_jiiiiiiiiii,
  /** @export */
  invoke_jiiji,
  /** @export */
  invoke_jiijii,
  /** @export */
  invoke_jiji,
  /** @export */
  invoke_jijii,
  /** @export */
  invoke_jjji,
  /** @export */
  invoke_v,
  /** @export */
  invoke_vffi,
  /** @export */
  invoke_vfi,
  /** @export */
  invoke_vi,
  /** @export */
  invoke_vidi,
  /** @export */
  invoke_viffffffi,
  /** @export */
  invoke_viffi,
  /** @export */
  invoke_viffiiiii,
  /** @export */
  invoke_vifi,
  /** @export */
  invoke_vififiiii,
  /** @export */
  invoke_vifii,
  /** @export */
  invoke_vifiiiii,
  /** @export */
  invoke_vii,
  /** @export */
  invoke_viidi,
  /** @export */
  invoke_viidiji,
  /** @export */
  invoke_viiff,
  /** @export */
  invoke_viiffffi,
  /** @export */
  invoke_viiffi,
  /** @export */
  invoke_viifi,
  /** @export */
  invoke_viififiii,
  /** @export */
  invoke_viifiii,
  /** @export */
  invoke_viii,
  /** @export */
  invoke_viiidi,
  /** @export */
  invoke_viiidiii,
  /** @export */
  invoke_viiiffiii,
  /** @export */
  invoke_viiifi,
  /** @export */
  invoke_viiifii,
  /** @export */
  invoke_viiii,
  /** @export */
  invoke_viiiidi,
  /** @export */
  invoke_viiiiffiiifiiii,
  /** @export */
  invoke_viiiifi,
  /** @export */
  invoke_viiiifiiii,
  /** @export */
  invoke_viiiii,
  /** @export */
  invoke_viiiiidi,
  /** @export */
  invoke_viiiiifi,
  /** @export */
  invoke_viiiiii,
  /** @export */
  invoke_viiiiiifddfiiii,
  /** @export */
  invoke_viiiiiiffffiiii,
  /** @export */
  invoke_viiiiiifiifiiii,
  /** @export */
  invoke_viiiiiifjjfiiii,
  /** @export */
  invoke_viiiiiii,
  /** @export */
  invoke_viiiiiiifiiiiii,
  /** @export */
  invoke_viiiiiiii,
  /** @export */
  invoke_viiiiiiiii,
  /** @export */
  invoke_viiiiiiiiii,
  /** @export */
  invoke_viiiiiiiiiii,
  /** @export */
  invoke_viiiiiiiiiiiffiiiiiiiiii,
  /** @export */
  invoke_viiiiiiiiiiiii,
  /** @export */
  invoke_viiiiiiiiiiiiiii,
  /** @export */
  invoke_viiijiii,
  /** @export */
  invoke_viiji,
  /** @export */
  invoke_viijii,
  /** @export */
  invoke_viijiii,
  /** @export */
  invoke_viijiiii,
  /** @export */
  invoke_viji,
  /** @export */
  invoke_vijii,
  /** @export */
  invoke_vijiii,
  /** @export */
  invoke_vji,
  /** @export */
  invoke_vjiiiii,
  /** @export */
  invoke_vjjjiiii,
  /** @export */
  llvm_eh_typeid_for: _llvm_eh_typeid_for,
  /** @export */
  navigator_gpu_get_preferred_canvas_format: _navigator_gpu_get_preferred_canvas_format,
  /** @export */
  navigator_gpu_request_adapter_async: _navigator_gpu_request_adapter_async,
  /** @export */
  wgpu_adapter_or_device_get_features: _wgpu_adapter_or_device_get_features,
  /** @export */
  wgpu_adapter_or_device_get_limits: _wgpu_adapter_or_device_get_limits,
  /** @export */
  wgpu_adapter_request_device_async: _wgpu_adapter_request_device_async,
  /** @export */
  wgpu_buffer_get_mapped_range: _wgpu_buffer_get_mapped_range,
  /** @export */
  wgpu_buffer_map_async: _wgpu_buffer_map_async,
  /** @export */
  wgpu_buffer_read_mapped_range: _wgpu_buffer_read_mapped_range,
  /** @export */
  wgpu_buffer_unmap: _wgpu_buffer_unmap,
  /** @export */
  wgpu_canvas_context_configure: _wgpu_canvas_context_configure,
  /** @export */
  wgpu_canvas_context_get_current_texture: _wgpu_canvas_context_get_current_texture,
  /** @export */
  wgpu_canvas_get_webgpu_context: _wgpu_canvas_get_webgpu_context,
  /** @export */
  wgpu_command_encoder_begin_compute_pass: _wgpu_command_encoder_begin_compute_pass,
  /** @export */
  wgpu_command_encoder_begin_render_pass: _wgpu_command_encoder_begin_render_pass,
  /** @export */
  wgpu_command_encoder_copy_buffer_to_buffer: _wgpu_command_encoder_copy_buffer_to_buffer,
  /** @export */
  wgpu_command_encoder_copy_texture_to_buffer: _wgpu_command_encoder_copy_texture_to_buffer,
  /** @export */
  wgpu_command_encoder_copy_texture_to_texture: _wgpu_command_encoder_copy_texture_to_texture,
  /** @export */
  wgpu_compute_pass_encoder_dispatch_workgroups: _wgpu_compute_pass_encoder_dispatch_workgroups,
  /** @export */
  wgpu_compute_pass_encoder_dispatch_workgroups_indirect: _wgpu_compute_pass_encoder_dispatch_workgroups_indirect,
  /** @export */
  wgpu_device_create_bind_group: _wgpu_device_create_bind_group,
  /** @export */
  wgpu_device_create_bind_group_layout: _wgpu_device_create_bind_group_layout,
  /** @export */
  wgpu_device_create_buffer: _wgpu_device_create_buffer,
  /** @export */
  wgpu_device_create_command_encoder: _wgpu_device_create_command_encoder,
  /** @export */
  wgpu_device_create_command_encoder_simple: _wgpu_device_create_command_encoder_simple,
  /** @export */
  wgpu_device_create_compute_pipeline: _wgpu_device_create_compute_pipeline,
  /** @export */
  wgpu_device_create_pipeline_layout: _wgpu_device_create_pipeline_layout,
  /** @export */
  wgpu_device_create_render_pipeline: _wgpu_device_create_render_pipeline,
  /** @export */
  wgpu_device_create_sampler: _wgpu_device_create_sampler,
  /** @export */
  wgpu_device_create_shader_module: _wgpu_device_create_shader_module,
  /** @export */
  wgpu_device_create_texture: _wgpu_device_create_texture,
  /** @export */
  wgpu_device_get_queue: _wgpu_device_get_queue,
  /** @export */
  wgpu_device_pop_error_scope_async: _wgpu_device_pop_error_scope_async,
  /** @export */
  wgpu_device_push_error_scope: _wgpu_device_push_error_scope,
  /** @export */
  wgpu_device_set_uncapturederror_callback: _wgpu_device_set_uncapturederror_callback,
  /** @export */
  wgpu_encoder_end: _wgpu_encoder_end,
  /** @export */
  wgpu_encoder_finish: _wgpu_encoder_finish,
  /** @export */
  wgpu_encoder_pop_debug_group: _wgpu_encoder_pop_debug_group,
  /** @export */
  wgpu_encoder_push_debug_group: _wgpu_encoder_push_debug_group,
  /** @export */
  wgpu_encoder_set_bind_group: _wgpu_encoder_set_bind_group,
  /** @export */
  wgpu_encoder_set_pipeline: _wgpu_encoder_set_pipeline,
  /** @export */
  wgpu_is_valid_object: _wgpu_is_valid_object,
  /** @export */
  wgpu_object_destroy: _wgpu_object_destroy,
  /** @export */
  wgpu_object_set_label: _wgpu_object_set_label,
  /** @export */
  wgpu_queue_submit_multiple_and_destroy: _wgpu_queue_submit_multiple_and_destroy,
  /** @export */
  wgpu_queue_submit_one_and_destroy: _wgpu_queue_submit_one_and_destroy,
  /** @export */
  wgpu_queue_write_buffer: _wgpu_queue_write_buffer,
  /** @export */
  wgpu_queue_write_texture: _wgpu_queue_write_texture,
  /** @export */
  wgpu_render_commands_mixin_draw: _wgpu_render_commands_mixin_draw,
  /** @export */
  wgpu_render_commands_mixin_draw_indexed: _wgpu_render_commands_mixin_draw_indexed,
  /** @export */
  wgpu_render_commands_mixin_draw_indexed_indirect: _wgpu_render_commands_mixin_draw_indexed_indirect,
  /** @export */
  wgpu_render_commands_mixin_draw_indirect: _wgpu_render_commands_mixin_draw_indirect,
  /** @export */
  wgpu_render_commands_mixin_set_index_buffer: _wgpu_render_commands_mixin_set_index_buffer,
  /** @export */
  wgpu_render_commands_mixin_set_vertex_buffer: _wgpu_render_commands_mixin_set_vertex_buffer,
  /** @export */
  wgpu_render_pass_encoder_set_scissor_rect: _wgpu_render_pass_encoder_set_scissor_rect,
  /** @export */
  wgpu_render_pass_encoder_set_stencil_reference: _wgpu_render_pass_encoder_set_stencil_reference,
  /** @export */
  wgpu_render_pass_encoder_set_viewport: _wgpu_render_pass_encoder_set_viewport,
  /** @export */
  wgpu_texture_create_view: _wgpu_texture_create_view,
  /** @export */
  wgpu_texture_create_view_simple: _wgpu_texture_create_view_simple
};

function invoke_ii(index,a1) {
  var sp = stackSave();
  try {
    return dynCall_ii(index,a1);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_v(index) {
  var sp = stackSave();
  try {
    dynCall_v(index);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vii(index,a1,a2) {
  var sp = stackSave();
  try {
    dynCall_vii(index,a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vi(index,a1) {
  var sp = stackSave();
  try {
    dynCall_vi(index,a1);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiii(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    dynCall_viiii(index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viii(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    dynCall_viii(index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iii(index,a1,a2) {
  var sp = stackSave();
  try {
    return dynCall_iii(index,a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return dynCall_iiiiii(index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    dynCall_viiiiiii(index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiii(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return dynCall_iiii(index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiii(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return dynCall_iiiii(index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fiii(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return dynCall_fiii(index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_diii(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return dynCall_diii(index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_i(index) {
  var sp = stackSave();
  try {
    return dynCall_i(index);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiii(index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiii(index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10) {
  var sp = stackSave();
  try {
    dynCall_viiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15) {
  var sp = stackSave();
  try {
    dynCall_viiiiiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    dynCall_viiiiii(index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    dynCall_viiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    dynCall_viiiii(index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiffiiiiiiiiiffffiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16,a17,a18,a19,a20,a21,a22,a23) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiffiiiiiiiiiffffiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16,a17,a18,a19,a20,a21,a22,a23);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viffi(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    dynCall_viffi(index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fifi(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return dynCall_fifi(index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vifi(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    dynCall_vifi(index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fii(index,a1,a2) {
  var sp = stackSave();
  try {
    return dynCall_fii(index,a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viifi(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    dynCall_viifi(index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiidii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return dynCall_iiiidii(index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viifiii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    dynCall_viifiii(index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_dii(index,a1,a2) {
  var sp = stackSave();
  try {
    return dynCall_dii(index,a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vidi(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    dynCall_vidi(index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viidi(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    dynCall_viidi(index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiffffi(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    dynCall_viiffffi(index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ffi(index,a1,a2) {
  var sp = stackSave();
  try {
    return dynCall_ffi(index,a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiifi(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    dynCall_viiifi(index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    dynCall_viiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ffii(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return dynCall_ffii(index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13) {
  var sp = stackSave();
  try {
    dynCall_viiiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fi(index,a1) {
  var sp = stackSave();
  try {
    return dynCall_fi(index,a1);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiifi(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return dynCall_iiiiifi(index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iffi(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return dynCall_iffi(index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiifi(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    dynCall_viiiiifi(index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiiiiiffiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16,a17,a18,a19,a20,a21,a22,a23) {
  var sp = stackSave();
  try {
    dynCall_viiiiiiiiiiiffiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16,a17,a18,a19,a20,a21,a22,a23);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiifiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiifiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiifiiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    return dynCall_iiiifiiii(index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11) {
  var sp = stackSave();
  try {
    dynCall_viiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiffi(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return dynCall_iiffi(index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiifii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    dynCall_viiifii(index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_dddi(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return dynCall_dddi(index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fffi(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return dynCall_fffi(index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viffiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    dynCall_viffiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiffiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    dynCall_viiiffiii(index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_diidi(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return dynCall_diidi(index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fiifi(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return dynCall_fiifi(index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiifiifiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14) {
  var sp = stackSave();
  try {
    dynCall_viiiiiifiifiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiifddfiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14) {
  var sp = stackSave();
  try {
    dynCall_viiiiiifddfiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiffffiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14) {
  var sp = stackSave();
  try {
    dynCall_viiiiiiffffiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiidi(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    dynCall_viiidi(index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiffiffiiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16,a17,a18,a19,a20,a21) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiffiffiiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16,a17,a18,a19,a20,a21);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fiiiii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return dynCall_fiiiii(index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiffiiifiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14) {
  var sp = stackSave();
  try {
    dynCall_viiiiffiiifiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vffi(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    dynCall_vffi(index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fiiii(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return dynCall_fiiii(index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iifii(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return dynCall_iifii(index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vfi(index,a1,a2) {
  var sp = stackSave();
  try {
    dynCall_vfi(index,a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiifiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10) {
  var sp = stackSave();
  try {
    return dynCall_iiifiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ddiii(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return dynCall_ddiii(index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vifiiiii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    dynCall_vifiiiii(index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viffffffi(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    dynCall_viffffffi(index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiiifiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14) {
  var sp = stackSave();
  try {
    dynCall_viiiiiiifiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiifi(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return dynCall_iiifi(index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiidi(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    dynCall_viiiidi(index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vififiiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    dynCall_vififiiii(index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viififiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    dynCall_viififiii(index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fiffi(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return dynCall_fiffi(index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_fiiffi(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return dynCall_fiiffi(index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiifi(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    dynCall_viiiifi(index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iifi(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return dynCall_iifi(index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vifii(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    dynCall_vifii(index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiifii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return dynCall_iiiifii(index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiiifii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiiiiiifii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_di(index,a1) {
  var sp = stackSave();
  try {
    return dynCall_di(index,a1);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiifii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return dynCall_iiifii(index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiidii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiidii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiidiii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    dynCall_viiidiii(index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiidii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    return dynCall_iiiiidii(index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiidi(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    dynCall_viiiiidi(index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiffi(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    dynCall_viiffi(index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiifiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    dynCall_viiiifiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiff(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    dynCall_viiff(index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_diiiii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return dynCall_diiiii(index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiif(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return dynCall_iiif(index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_jiiii(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return dynCall_jiiii(index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ji(index,a1) {
  var sp = stackSave();
  try {
    return dynCall_ji(index,a1);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_jii(index,a1,a2) {
  var sp = stackSave();
  try {
    return dynCall_jii(index,a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viijii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    dynCall_viijii(index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iij(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return dynCall_iij(index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiijiii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    return dynCall_iiijiii(index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_j(index) {
  var sp = stackSave();
  try {
    return dynCall_j(index);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iji(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return dynCall_iji(index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_jiii(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return dynCall_jiii(index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiijii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    return dynCall_iiiijii(index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_jjji(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return dynCall_jjji(index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_jiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10) {
  var sp = stackSave();
  try {
    return dynCall_jiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_jiiiii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return dynCall_jiiiii(index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iijiii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return dynCall_iijiii(index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vijii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    dynCall_vijii(index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viji(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    dynCall_viji(index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiji(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return dynCall_iiji(index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiji(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    dynCall_viiji(index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_jiiji(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return dynCall_jiiji(index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiiiiifjjfiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16) {
  var sp = stackSave();
  try {
    dynCall_viiiiiifjjfiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iijiiii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    return dynCall_iijiiii(index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiijii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return dynCall_iiijii(index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_jijii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return dynCall_jijii(index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiiiiiiji(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11) {
  var sp = stackSave();
  try {
    return dynCall_iiiiiiiiiji(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vji(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    dynCall_vji(index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_jiijii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return dynCall_jiijii(index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viijiii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    dynCall_viijiii(index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiijiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    dynCall_viiijiii(index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viidiji(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    dynCall_viidiji(index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viijiiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    dynCall_viijiiii(index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ijji(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return dynCall_ijji(index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vijiii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    dynCall_vijiii(index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vjjjiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10) {
  var sp = stackSave();
  try {
    dynCall_vjjjiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vjiiiii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    dynCall_vjiiiii(index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iijii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return dynCall_iijii(index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_jiji(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return dynCall_jiji(index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iijji(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return dynCall_iijji(index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}


// include: postamble.js
// === Auto-generated postamble setup entry stuff ===

var calledRun;

function callMain(args = []) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on Module["onRuntimeInitialized"])');
  assert(typeof onPreRuns === 'undefined' || onPreRuns.length == 0, 'cannot call main when preRun functions remain to be called');

  var entryFunction = _main;

  args.unshift(thisProgram);

  var argc = args.length;
  var argv = stackAlloc((argc + 1) * 4);
  var argv_ptr = argv;
  for (var arg of args) {
    HEAPU32[((argv_ptr)>>2)] = stringToUTF8OnStack(arg);
    argv_ptr += 4;
  }
  HEAPU32[((argv_ptr)>>2)] = 0;

  try {

    var ret = entryFunction(argc, argv);

    // if we're not running an evented main loop, it's time to exit
    exitJS(ret, /* implicit = */ true);
    return ret;
  } catch (e) {
    return handleException(e);
  }
}

function stackCheckInit() {
  // This is normally called automatically during __wasm_call_ctors but need to
  // get these values before even running any of the ctors so we call it redundantly
  // here.
  _emscripten_stack_init();
  // TODO(sbc): Move writeStackCookie to native to to avoid this.
  writeStackCookie();
}

function run(args = arguments_) {

  if (runDependencies > 0) {
    dependenciesFulfilled = run;
    return;
  }

  stackCheckInit();

  preRun();

  // a preRun added a dependency, run will be called later
  if (runDependencies > 0) {
    dependenciesFulfilled = run;
    return;
  }

  function doRun() {
    // run may have just been called through dependencies being fulfilled just in this very frame,
    // or while the async setStatus time below was happening
    assert(!calledRun);
    calledRun = true;
    Module['calledRun'] = true;

    if (ABORT) return;

    initRuntime();

    preMain();

    readyPromiseResolve?.(Module);
    Module['onRuntimeInitialized']?.();
    consumedModuleProp('onRuntimeInitialized');

    var noInitialRun = Module['noInitialRun'] || false;
    if (!noInitialRun) callMain(args);

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(() => {
      setTimeout(() => Module['setStatus'](''), 1);
      doRun();
    }, 1);
  } else
  {
    doRun();
  }
  checkStackCookie();
}

function checkUnflushedContent() {
  // Compiler settings do not allow exiting the runtime, so flushing
  // the streams is not possible. but in ASSERTIONS mode we check
  // if there was something to flush, and if so tell the user they
  // should request that the runtime be exitable.
  // Normally we would not even include flush() at all, but in ASSERTIONS
  // builds we do so just for this check, and here we see if there is any
  // content to flush, that is, we check if there would have been
  // something a non-ASSERTIONS build would have not seen.
  // How we flush the streams depends on whether we are in SYSCALLS_REQUIRE_FILESYSTEM=0
  // mode (which has its own special function for this; otherwise, all
  // the code is inside libc)
  var oldOut = out;
  var oldErr = err;
  var has = false;
  out = err = (x) => {
    has = true;
  }
  try { // it doesn't matter if it fails
    _fflush(0);
    // also flush in the JS FS layer
    for (var name of ['stdout', 'stderr']) {
      var info = FS.analyzePath('/dev/' + name);
      if (!info) return;
      var stream = info.object;
      var rdev = stream.rdev;
      var tty = TTY.ttys[rdev];
      if (tty?.output?.length) {
        has = true;
      }
    }
  } catch(e) {}
  out = oldOut;
  err = oldErr;
  if (has) {
    warnOnce('stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the Emscripten FAQ), or make sure to emit a newline when you printf etc.');
  }
}

var wasmExports;

// In modularize mode the generated code is within a factory function so we
// can use await here (since it's not top-level-await).
wasmExports = await (createWasm());

run();

// end include: postamble.js

// include: postamble_modularize.js
// In MODULARIZE mode we wrap the generated code in a factory function
// and return either the Module itself, or a promise of the module.
//
// We assign to the `moduleRtn` global here and configure closure to see
// this as and extern so it won't get minified.

if (runtimeInitialized)  {
  moduleRtn = Module;
} else {
  // Set up the promise that indicates the Module is initialized
  moduleRtn = new Promise((resolve, reject) => {
    readyPromiseResolve = resolve;
    readyPromiseReject = reject;
  });
}

// Assertion for attempting to access module properties on the incoming
// moduleArg.  In the past we used this object as the prototype of the module
// and assigned properties to it, but now we return a distinct object.  This
// keeps the instance private until it is ready (i.e the promise has been
// resolved).
for (const prop of Object.keys(Module)) {
  if (!(prop in moduleArg)) {
    Object.defineProperty(moduleArg, prop, {
      configurable: true,
      get() {
        abort(`Access to module property ('${prop}') is no longer possible via the module constructor argument; Instead, use the result of the module constructor.`)
      }
    });
  }
}
// end include: postamble_modularize.js



    return moduleRtn;
  };
})();

// Export using a UMD style export, or ES6 exports if selected
if (typeof exports === 'object' && typeof module === 'object') {
  module.exports = unityFramework;
  // This default export looks redundant, but it allows TS to import this
  // commonjs style module.
  module.exports.default = unityFramework;
} else if (typeof define === 'function' && define['amd'])
  define([], () => unityFramework);

