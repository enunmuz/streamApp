var input = document.getElementById("broadcast-name").select();

if (!location.hash.replace("#", "").length) {
  location.href =
    location.href.split("#")[0] +
    "#" +
    (Math.random() * 100).toString().replace(".", "");
  location.reload();
}
var config = {
  openSocket: function(config) {
    var SIGNALING_SERVER = "https://socketio-over-nodejs2.herokuapp.com:443/";

    config.channel =
      config.channel || location.href.replace(/\/|:|#|%|\.|\[|\]/g, "");
    var sender = Math.round(Math.random() * 999999999) + 999999999;

    io.connect(SIGNALING_SERVER).emit("new-channel", {
      channel: config.channel,
      sender: sender
    });

    var socket = io.connect(SIGNALING_SERVER + config.channel);
    socket.channel = config.channel;
    socket.on("connect", function() {
      if (config.callback) config.callback(socket);
    });

    socket.send = function(message) {
      socket.emit("message", {
        sender: sender,
        data: message
      });
    };

    socket.on("message", config.onmessage);
  },
  onRemoteStream: function(htmlElement) {
    videosContainer.appendChild(htmlElement);
    rotateInCircle(htmlElement);
  },
  onRoomFound: function(room) {
    var alreadyExist = document.querySelector(
      'button[data-broadcaster="' + room.broadcaster + '"]'
    );
    if (alreadyExist) return;

    if (typeof roomsList === "undefined") roomsList = document.body;

    var tr = document.createElement("tr");
    tr.innerHTML =
      "<td><strong>" +
      room.roomName +
      "</strong> is broadcasting his media!</td>" +
      '<td><button class="join" style="margin: 5px 0px;" >Join</button></td>';
    roomsList.appendChild(tr);

    var joinRoomButton = tr.querySelector(".join");
    joinRoomButton.setAttribute("data-broadcaster", room.broadcaster);
    joinRoomButton.setAttribute("data-roomToken", room.broadcaster);
    joinRoomButton.onclick = function() {
      this.disabled = true;

      var broadcaster = this.getAttribute("data-broadcaster");
      var roomToken = this.getAttribute("data-roomToken");
      broadcastUI.joinRoom({
        roomToken: roomToken,
        joinUser: broadcaster
      });
      hideUnnecessaryStuff();
    };
  },
  onNewParticipant: function(numberOfViewers) {
    document.title = "Viewers: " + numberOfViewers;
  },
  onReady: function() {
    console.log("now you can open or join rooms");
  }
};

function setupNewBroadcastButtonClickHandler() {
  document.getElementById("broadcast-name").disabled = true;
  document.getElementById("setup-new-broadcast").disabled = true;

  DetectRTC.load(function() {
    captureUserMedia(function() {
      var shared = "video";
      if (window.option == "Only Audio") {
        shared = "audio";
      }
      if (window.option == "Screen") {
        shared = "screen";
      }

      broadcastUI.createRoom({
        roomName:
          (document.getElementById("broadcast-name") || {}).value ||
          "Anonymous",
        isAudio: shared === "audio"
      });
    });
    hideUnnecessaryStuff();
  });
}

function captureUserMedia(callback) {
  var constraints = null;
  window.option = broadcastingOption ? broadcastingOption.value : "";
  if (option === "Only Audio") {
    constraints = {
      audio: true,
      video: false
    };

    if (DetectRTC.hasMicrophone !== true) {
      alert(
        "DetectRTC library is unable to find microphone; maybe you denied microphone access once and it is still denied or maybe microphone device is not attached to your system or another app is using same microphone."
      );
    }
  }
  if (option === "Screen") {
    var video_constraints = {
      mandatory: {
        chromeMediaSource: "screen"
      },
      optional: []
    };
    constraints = {
      audio: false,
      video: video_constraints
    };

    if (DetectRTC.isScreenCapturingSupported !== false) {
      alert(
        'DetectRTC library is unable to find screen capturing support. You MUST run chrome with command line flag "chrome --enable-usermedia-screen-capturing"'
      );
    }
  }

  if (
    option != "Only Audio" &&
    option != "Screen" &&
    DetectRTC.hasWebcam !== true
  ) {
    alert(
      "DetectRTC library is unable to find webcam; maybe you denied webcam access once and it is still denied or maybe webcam device is not attached to your system or another app is using same webcam."
    );
  }

  var htmlElement = document.createElement(
    option === "Only Audio" ? "audio" : "video"
  );

  htmlElement.muted = true;
  htmlElement.volume = 0;

  try {
    htmlElement.setAttributeNode(document.createAttribute("autoplay"));
    htmlElement.setAttributeNode(document.createAttribute("playsinline"));
    htmlElement.setAttributeNode(document.createAttribute("controls"));
  } catch (e) {
    htmlElement.setAttribute("autoplay", true);
    htmlElement.setAttribute("playsinline", true);
    htmlElement.setAttribute("controls", true);
  }

  var mediaConfig = {
    video: htmlElement,
    onsuccess: function(stream) {
      config.attachStream = stream;

      videosContainer.appendChild(htmlElement);
      rotateInCircle(htmlElement);

      callback && callback();
    },
    onerror: function() {
      if (option === "Only Audio")
        alert("unable to get access to your microphone");
      else if (option === "Screen") {
        if (location.protocol === "http:")
          alert("Please test this WebRTC experiment on HTTPS.");
        else
          alert(
            'Screen capturing is either denied or not supported. Are you enabled flag: "Enable screen capture support in getUserMedia"?'
          );
      } else alert("unable to get access to your webcam");
    }
  };
  if (constraints) mediaConfig.constraints = constraints;
  getUserMedia(mediaConfig);
}

var broadcastUI = broadcast(config);

/* UI specific */
var videosContainer =
  document.getElementById("videos-container") || document.body;
var setupNewBroadcast = document.getElementById("setup-new-broadcast");
var roomsList = document.getElementById("rooms-list");

var broadcastingOption = document.getElementById("broadcasting-option");

if (setupNewBroadcast)
  setupNewBroadcast.onclick = setupNewBroadcastButtonClickHandler;

function hideUnnecessaryStuff() {
  var visibleElements = document.getElementsByClassName("visible"),
    length = visibleElements.length;
  for (var i = 0; i < length; i++) {
    visibleElements[i].style.display = "none";
  }
}

function rotateInCircle(video) {
  video.style[navigator.mozGetUserMedia ? "transform" : "-webkit-transform"] =
    "rotate(0deg)";
  setTimeout(function() {
    video.style[navigator.mozGetUserMedia ? "transform" : "-webkit-transform"] =
      "rotate(360deg)";
  }, 1000);
}
