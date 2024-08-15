const container = document.getElementById('fibonacci-container');
const seeds = 5000;
const phi = (Math.sqrt(5) + 1) / 2 - 1;  // Golden ratio minus 1
let rotation = 0;
let dimensions = { width: window.innerWidth, height: window.innerHeight };

// Audio context and analyzer
let audioContext, analyzer, dataArray, microphone;

// Pulsation variables
let pulsation = 0;
let pulsationSpeed = 0.1;

// Create seeds
const seedElements = new Array(seeds);
for (let i = 0; i < seeds; i++) {
    const seed = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    seed.setAttribute("r", "1");
    seed.setAttribute("fill", "white");
    container.appendChild(seed);
    seedElements[i] = seed;
}

// Variable to track whether the animation is playing or paused
let isPlaying = false;

// Create a button for mobile devices
const startButton = document.createElement('button');
startButton.textContent = 'Start Visualizer';
startButton.style.position = 'fixed';
startButton.style.top = '50%';
startButton.style.left = '50%';
startButton.style.transform = 'translate(-50%, -50%)';
startButton.style.padding = '15px 30px';
startButton.style.fontSize = '18px';
startButton.style.backgroundColor = '#4CAF50';
startButton.style.color = 'white';
startButton.style.border = 'none';
startButton.style.borderRadius = '5px';
startButton.style.cursor = 'pointer';
startButton.style.zIndex = '1000';
document.body.appendChild(startButton);

// Initialize audio context and analyzer
async function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyzer = audioContext.createAnalyser();
        analyzer.fftSize = 256;
        const bufferLength = analyzer.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        // Get microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyzer);

        isPlaying = true;
        updatePattern();
        startButton.style.display = 'none'; // Hide the button after starting
    } catch (error) {
        console.error("Error accessing the microphone:", error);
        alert("Error accessing the microphone. Please ensure you've granted permission and try again.");
    }
}

// Start or pause audio context and animation
function toggleAudio() {
    if (!audioContext) {
        initAudio();
    } else {
        isPlaying = !isPlaying;
        if (isPlaying) {
            audioContext.resume();
            requestAnimationFrame(updatePattern);
        } else {
            audioContext.suspend();
        }
    }
}

// Event listener for the start button
startButton.addEventListener('click', toggleAudio);

// Event listener for desktop devices
document.body.addEventListener('click', function(event) {
    if (event.target !== startButton) {
        toggleAudio();
    }
});

function updatePattern() {
    if (!isPlaying) return; // Exit if paused

    rotation = (rotation + 0.001) % (2 * Math.PI);
    const scaleFactor = Math.min(dimensions.width, dimensions.height) / 50;

    // Get frequency data
    analyzer.getByteFrequencyData(dataArray);

    // Calculate bass intensity (first quarter of frequency bands)
    const bassRange = Math.floor(dataArray.length / 4);
    let bassIntensity = dataArray.slice(0, bassRange).reduce((sum, value) => sum + value, 0) / (bassRange * 255);
    
    // Increase sensitivity by 50%
    bassIntensity = Math.min(1, bassIntensity * 1.5);

    // Adjust pulsation speed based on bass intensity
    pulsationSpeed = 0.05 + bassIntensity * 0.2;

    // Sync pulsation with beat
    pulsation += pulsationSpeed * bassIntensity;
    if (pulsation > Math.PI * 2) pulsation -= Math.PI * 2;

    const maxDistance = Math.max(dimensions.width, dimensions.height) / 2;

    for (let i = 0; i < seeds; i++) {
        const angle = i * 2 * Math.PI * phi + rotation;
        const distance = Math.sqrt(i) * scaleFactor;

        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;

        // Calculate distance from center
        const distanceFromCenter = Math.sqrt(x * x + y * y);

        // Add some randomness to the ripple effect
        const noise = (Math.random() - 0.5) * 0.2;  // Random value between -0.1 and 0.1
        const adjustedPulsation = pulsation + noise;

        // Calculate scale based on pulsation, distance from center, and noise
        const pulseFactor = Math.sin(adjustedPulsation - distanceFromCenter * 0.05) * 0.5 + 0.5;
        const baseBassScale = 1 + (bassIntensity * 28.8);  // Increased by 20% (24 * 1.2 = 28.8)
        const bassScale = baseBassScale * pulseFactor;
        
        // Enhanced dissipation effect
        const dissipationFactor = Math.pow(1 - distanceFromCenter / maxDistance, 2);
        const scale = bassScale * dissipationFactor * 1.2;  // Additional 20% increase in overall scale

        const seedX = dimensions.width / 2 + x;
        const seedY = dimensions.height / 2 + y;

        seedElements[i].setAttribute("cx", seedX);
        seedElements[i].setAttribute("cy", seedY);
        seedElements[i].setAttribute("r", Math.max(0.5, scale)); // Ensure minimum size of 0.5
    }

    requestAnimationFrame(updatePattern);
}

function handleResize() {
    dimensions.width = window.innerWidth;
    dimensions.height = window.innerHeight;
    container.setAttribute("width", dimensions.width);
    container.setAttribute("height", dimensions.height);
}

window.addEventListener('resize', handleResize);

handleResize();  // Set initial size