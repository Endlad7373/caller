// Получаем элементы видео
const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');

// Функция обработки ошибок
function handleVideoError(videoElement, type) {
    videoElement.addEventListener('error', () => {
        const error = videoElement.error;
        console.error(`${type} video error:`, error);
        alert(`Ошибка видео: ${error.message}`);
    });
}

// Инициализация видео потоков
async function initVideo() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            },
            audio: true
        });
        
        localVideo.srcObject = stream;
        localVideo.play().catch(e => console.error("Play error:", e));
        
        // Инициализация PeerJS после успешного получения медиа
        initPeerConnection(stream);
        
    } catch (err) {
        console.error("Media error:", err);
        alert(`Не удалось получить доступ к камере: ${err.message}`);
    }
}

// Инициализация PeerJS
function initPeerConnection(localStream) {
    const peer = new Peer({
        host: "эндлад.рф",
        port: 9547,
        path: "/peer",
        secure: true,
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { 
                    urls: 'turn:94.198.220.57:3478',
                    username: "your_username",
                    credential: "your_password"
                }
            ]
        }
    });

    peer.on('error', err => {
        console.error('PeerJS error:', err);
        alert(`Ошибка соединения: ${err.message}`);
    });

    // Остальная логика звонка...
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    handleVideoError(localVideo, 'Local');
    handleVideoError(remoteVideo, 'Remote');
    
    // Задержка для инициализации WebApp
    setTimeout(initVideo, 500);
});

// Особый случай для Telegram WebApp
if (window.Telegram && Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
}

