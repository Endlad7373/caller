const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');
const statusElement = document.getElementById('status');
const videoToggleBtn = document.getElementById('video-toggle');
const audioToggleBtn = document.getElementById('audio-toggle');
const hangupBtn = document.getElementById('hangup-btn');

const urlParams = new URLSearchParams(window.location.search);
const callerId = urlParams.get('id');

let localStream = null;
let currentCall = null;
let isVideoEnabled = true;
let isAudioEnabled = true;

// Инициализация Peer
const peer = new Peer({
    host: 'эндлад.рф',
    port: 9547,
    path: "/peer",
    secure: true,
    debug: 3,
    config: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
        ]
    }
});

function updateStatus(message) {
    statusElement.textContent = message;
    console.log(message);
}

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        localStream = stream;
        localVideo.srcObject = stream;
        updateStatus('Подключение...');

        peer.on('open', () => {
            updateStatus('Звонок...');
            currentCall = peer.call(callerId, stream);
            
            currentCall.on('stream', remoteStream => {
                updateStatus('Разговор начат');
                remoteVideo.srcObject = remoteStream;
            });
            
            currentCall.on('close', () => {
                updateStatus('Звонок завершен');
                remoteVideo.srcObject = null;
            });
        });

        peer.on('error', err => {
            updateStatus(`Ошибка: ${err.message}`);
        });
    })
    .catch(err => {
        updateStatus(`Ошибка камеры: ${err.message}`);
    });

// Управление медиа (аналогично caller.js)
videoToggleBtn.addEventListener('click', () => {
    if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            isVideoEnabled = !videoTrack.enabled;
            videoTrack.enabled = isVideoEnabled;
            videoToggleBtn.textContent = isVideoEnabled ? '🎥' : '❌';
            videoToggleBtn.style.background = isVideoEnabled 
                ? 'rgba(255,255,255,0.2)' 
                : 'rgba(255,0,0,0.5)';
        }
    }
});

audioToggleBtn.addEventListener('click', () => {
    if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            isAudioEnabled = !audioTrack.enabled;
            audioTrack.enabled = isAudioEnabled;
            audioToggleBtn.textContent = isAudioEnabled ? '🎤' : '❌';
            audioToggleBtn.style.background = isAudioEnabled 
                ? 'rgba(255,255,255,0.2)' 
                : 'rgba(255,0,0,0.5)';
        }
    }
});

hangupBtn.addEventListener('click', () => {
    if (currentCall) {
        currentCall.close();
    }
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    window.close();

});
