if (!location.hash) {
  location.hash = Math.floor(Math.random() * 0xffffff).toString(16);
}
const roomHash = location.hash.substring(1);
const drone = new ScaleDrone('uNj04mqxLk247RTW');
const roomName = "observable-" + roomHash;
const configuration = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302"
    }
  ]
};
let room;
let pc;

function onSuccess() {}
function onError(error) {
  console.error(error);
}

drone.on("open", error => {
  if (error) {
    return console.error(error);
  }
  room = drone.subscribe(roomName);
  room.on("open", error => {
    if (error) {
      onError(error);
    }
  });
  room.on("members", members => {
    console.log("MEMBERS", members);
    const isOfferer = members.length === 2;
    startWebRTC(isOfferer);
  });
});

function sendMessage(message) {
  drone.publish({
    room: roomName,
    message
  });
}

function startWebRTC(isOfferer) {
  pc = new RTCPeerConnection(configuration);
  pc.onicecandidate = event => {
    if (event.candidate) {
      sendMessage({ candidate: event.candidate });
    }
  };

  if (isOfferer) {
    pc.onnegotiationneeded = () => {
      pc.createOffer()
        .then(localDescCreated)
        .catch(onError);
    };
  }

  pc.ontrack = event => {
    const stream = event.streams[0];
    if (!remoteVideo.srcObject || remoteVideo.srcObject.id !== stream.id) {
      remoteVideo.srcObject = stream;
    }
  };

  navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true
    })
    .then(stream => {
      // Display your local video in #localVideo element
      localVideo.srcObject = stream;
      // Add your stream to be sent to the conneting peer
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
    }, onError);

  // Listen to signaling data from Scaledrone
  room.on("data", (message, client) => {
    // Message was sent by us
    if (client.id === drone.clientId) {
      return;
    }

    if (message.sdp) {
      // This is called after receiving an offer or answer from another peer
      pc.setRemoteDescription(
        new RTCSessionDescription(message.sdp),
        () => {
          // When receiving an offer lets answer it
          if (pc.remoteDescription.type === "offer") {
            pc.createAnswer()
              .then(localDescCreated)
              .catch(onError);
          }
        },
        onError
      );
    } else if (message.candidate) {
      // Add the new ICE candidate to our connections remote description
      pc.addIceCandidate(
        new RTCIceCandidate(message.candidate),
        onSuccess,
        onError
      );
    }
  });
}

function localDescCreated(desc) {
  pc.setLocalDescription(
    desc,
    () => sendMessage({ sdp: pc.localDescription }),
    onError
  );
}
