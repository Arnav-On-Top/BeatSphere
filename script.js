const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const audio = document.getElementById("audio");
const musicFile = document.getElementById("musicFile");
const playlistElement = document.getElementById("playlist");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const screenshotBtn = document.getElementById("screenshotBtn");
const visualizerArea = document.getElementById("visualizerArea");
let tracks = [];
let audioContext;
let analyser;
let data;
let animationStarted = false;
async function playAudio(url) {
    try {
        if (!audioContext) {
            audioContext = new AudioContext();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;
            analyser.smoothingTimeConstant = 0.8;
            const source = audioContext.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            data = new Uint8Array(analyser.frequencyBinCount);
        }
        audio.src = url;
        await audioContext.resume();
        await audio.play();

        if (!animationStarted) {
            animationStarted = true;
            draw();
        }
    } catch (error) {
        console.error("Audio playback error:", error);
    }
}
musicFile.addEventListener("change", () => {
    const files = Array.from(musicFile.files);
    for (const file of files) {
        tracks.push({
            name: file.name,
            url: URL.createObjectURL(file)
        });
    }
    renderPlaylist();
    if (tracks.length && !audio.src) {
        playAudio(tracks[0].url);
    }
    musicFile.value = "";
});
function renderPlaylist() {
    playlistElement.innerHTML = "";
    tracks.forEach((track, index) => {
        const item = document.createElement("li");
        item.textContent = track.name;
        item.addEventListener("click", () => {
            playAudio(track.url);
        });
        playlistElement.appendChild(item);
    });
}
function drawSection(
    startAngle,
    endAngle,
    lowBin,
    highBin,
    color1,
    color2
) {
    const cx = canvas.clientWidth / 2;
    const cy = canvas.clientHeight / 2;
    const radius = Math.min(canvas.clientWidth, canvas.clientHeight) * 0.22;
    const bars = 35;
    for (let i = 0; i < bars; i++) {
        const angle =
            startAngle + (endAngle - startAngle) * i / bars;
        const bin = Math.floor(
            lowBin + (highBin - lowBin) * i / bars
        );
        const volume = data ? (data[bin] || 0) / 255 : 0;
        const length = 5 + volume * 100;
        const x1 = cx + Math.cos(angle) * radius;
        const y1 = cy + Math.sin(angle) * radius;
        const x2 = cx + Math.cos(angle) * (radius + length);
        const y2 = cy + Math.sin(angle) * (radius + length);
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.stroke();
    }
}
function draw() {
    requestAnimationFrame(draw);
    if (analyser && data) {
        analyser.getByteFrequencyData(data);
    }
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    ctx.clearRect(0, 0, width, height);
    drawSection(
        -Math.PI / 2, -Math.PI / 6,
        1, 8, "#00f5ff", "#2563eb"
    );
    drawSection(
        -Math.PI / 6, Math.PI / 6,
        4, 15, "#a78bfa", "#7c3aed"
    );
    drawSection(
        Math.PI / 6, Math.PI / 2,
        12, 90, "#ffe66d", "#ff8c42"
    );
    drawSection(
        Math.PI / 2, Math.PI,
        20, 180, "#ff4d8d", "#ff9f43"
    );
    drawSection(
        Math.PI, Math.PI * 1.5,
        90, 450, "#38f9d7", "#8a2be2"
    );
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.22;
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 5, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
}
function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * pixelRatio);
    canvas.height = Math.round(rect.height * pixelRatio);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    if (!animationStarted) {
        drawStaticCircle();
    }
}
function drawStaticCircle() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.22;
    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 5, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();
fullscreenBtn.addEventListener("click", async () => {
    try {
        if (!document.fullscreenElement) {
            await visualizerArea.requestFullscreen();
        } else {
            await document.exitFullscreen();
        }
    } catch (error) {
        console.error("Fullscreen error:", error);
    }
});
screenshotBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "BeatSphere.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
});
document.addEventListener("fullscreenchange", resizeCanvas);