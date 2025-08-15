const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');
const statusElement = document.getElementById('status');
const videoToggleBtn = document.getElementById('video-toggle');
const audioToggleBtn = document.getElementById('audio-toggle');
const hangupBtn = document.getElementById('hangup-btn');

// Получаем user_id из URL или генерируем случайный
const urlParams = new URLSearchParams(window.location.search);
let userId = urlParams.get('user_id');

// Если user_id не указан, генерируем случайный
if (!userId) {
    userId = 'user-' + Math.random().toString(36).substr(2, 8);
    console.warn('user_id не указан, сгенерирован случайный:', userId);
}

let localStream = null;
let currentCall = null;
let isVideoEnabled = true;
let isAudioEnabled = true;

// Инициализация Peer с фиксированным ID
const peer = new Peer(userId, {
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
        updateStatus(`Ожидаем собеседника...`);

        peer.on('open', () => {
            console.log('Фиксированный Peer ID:', userId);
            
            // Формируем ссылку с именем (если есть)
            const name = urlParams.get('name') || 'Аноним';
            const link = `receiver.html?id=${userId}&name=${encodeURIComponent(name)}`;
            console.log('Ссылка для подключения:', link);
        });

        peer.on('call', call => {
            updateStatus(`Входящий звонок от ${call.peer}`);
            currentCall = call;
            call.answer(localStream);
            
            call.on('stream', remoteStream => {
                updateStatus('Разговор начат');
                remoteVideo.srcObject = remoteStream;
            });
            
            call.on('close', () => {
                updateStatus('Звонок завершен');
                remoteVideo.srcObject = null;
                currentCall = null;
            });
        });

        peer.on('error', err => {
            updateStatus(`Ошибка: ${err.message}`);
            if (err.type === 'peer-unavailable') {
                console.error('Этот user_id уже занят');
            }
        });
    })
    .catch(err => {
        updateStatus(`Ошибка камеры: ${err.message}`);
    });

// Остальной код управления кнопками остается без изменений
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
