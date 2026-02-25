let timerInterval;
let seconds = 0;
let mediaRecorder; 
let audioChunks = []; 
let count = parseInt(sessionStorage.getItem('currQCount')) || 0; 

const startBtn = document.getElementById('startBtn');
const endBtn = document.getElementById('endBtn');
const timerBadge = document.getElementById('timerBadge');
const timeDisplay = document.getElementById('timeDisplay');
const pulseRing = document.getElementById('avatarPulse');

const type = sessionStorage.getItem('interviewType');
const diff = sessionStorage.getItem('difficulty');


function getAndRemoveNextQuestion() {
    // 1. Get the string from storage
    const storedData = sessionStorage.getItem('interviewQuestions');

    if (!storedData) {
        console.error("No questions found in local storage!");
        return null;
    }

    // 2. Parse the string into a real Javascript Array
    let questions = JSON.parse(storedData);

    if (questions.length === 0) {
        console.log("All questions have been answered.");
        return null;
    }

    // 3. Select (and remove) the top-most value
    // .shift() removes the first element and returns it
    const currentQuestion = questions.shift();
    count++;
    // 4. Save the remaining array back to storage
    sessionStorage.setItem('interviewQuestions', JSON.stringify(questions));
    sessionStorage.setItem('currQCount', JSON.stringify(count));
    // 5. Return the question so you can display it
    return currentQuestion;
}

// --- USAGE ---



// 1. FIXED: Added 'async' to the DOMContentLoaded listener

// 2. Start Interview Function

// async function startInterview() {
//     try {
//         const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//         mediaRecorder = new MediaRecorder(stream);
//         audioChunks = []; 

//         mediaRecorder.ondataavailable = (event) => { audioChunks.push(event.data); };
        
//         mediaRecorder.onstop = async () => {
//             const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            
//             const formData = new FormData();
//             // Matches 'audio_file' in your Python request.files
//             formData.append('audio_file', audioBlob, 'recording.wav'); 
//             formData.append('type', type); 
//             formData.append('difficulty', diff);
//             formData.append('question', nextQ);

//             try {
                
//                 showLoader();
//                 // Pointing specifically to your interviewBp route
//                 const response = await fetch('/interview/save', { 
//                     method: 'POST',
//                     body: formData
//                 });

//                 if (response.ok) {
//                     const result = await response.json();
//                     // Save the AI's feedback data
//                     sessionStorage.setItem('lastQuestion', nextQ);
//                     sessionStorage.setItem('lastFeedback', JSON.stringify(result.data));
//                     window.location.href = '/feedback';
//                 }
//             } catch (err) {
//                 console.error("Upload failed:", err);
//                 endBtn.innerText = "Retry Upload";
//             }
//         };

//         // UI Updates
//         startBtn.style.display = 'none';
//         endBtn.style.display = 'block';
//         endBtn.innerText = "Recording..."; 
//         timerBadge.style.display = 'flex';

//         mediaRecorder.start();
//         pulseRing.style.display = 'none';

//         seconds = 90; 
//         timeDisplay.innerText = "01:30";
//         clearInterval(timerInterval);
//         timerInterval = setInterval(updateTimer, 1000);
        
//     } catch (err) {
//         console.error("Error:", err);
//         alert("Microphone access is required.");
//     }
// }

let transcriptBuffer = ""; // Global variable to store the text
let recognition;

async function startInterview() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        alert("Speech recognition not supported in this browser.");
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false; // Set to true if you want to see text live
    transcriptBuffer = ""; // Reset buffer

    recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                transcriptBuffer += event.results[i][0].transcript + " ";
            }
        }
    };

    recognition.onend = async () => {
        // This acts like mediaRecorder.onstop
        sessionStorage.setItem('transcript', transcriptBuffer);
        console.log("Transcript:", transcriptBuffer);
        await sendTranscriptToServer();
    };

    // UI Updates
    startBtn.style.display = 'none';
    endBtn.style.display = 'block';
    endBtn.innerText = "Listening..."; 
    timerBadge.style.display = 'flex';

    recognition.start();
    
    // Timer logic remains the same
    seconds = 90; 
    timeDisplay.innerText = "01:30";
    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
}

function endInterview() {
    if (recognition) {
        recognition.stop(); // This triggers recognition.onend
    }
    clearInterval(timerInterval);
    endBtn.innerText = "Processing Text...";
    endBtn.disabled = true;
}

async function sendTranscriptToServer() {
    const formData = new FormData();
    // Sending text instead of a blob
    formData.append('transcript', transcriptBuffer); 
    formData.append('type', type); 
    formData.append('difficulty', diff);
    formData.append('question', nextQ);

    try {
        showLoader();
        const response = await fetch('/interview/save', { 
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            sessionStorage.setItem('lastQuestion', nextQ);
            sessionStorage.setItem('lastFeedback', JSON.stringify(result.data));
            window.location.href = '/feedback';
        }
    } catch (err) {
        console.error("Upload failed:", err);
        endBtn.innerText = "Retry Upload";
        endBtn.disabled = false;
    }
}




// function endInterview() {
//     if (mediaRecorder && mediaRecorder.state !== "inactive") {
//         mediaRecorder.stop();
//     }
    
//     clearInterval(timerInterval);
//     pulseRing.style.display = 'none';
//     endBtn.innerText = "Processing...";
//     endBtn.disabled = true;

//     setTimeout(() => {
//         alert("Recording saved and playing back!");
//     }, 1500);
// }

function updateTimer() {
    seconds--;
    if (seconds <= 0) {
        endInterview();
        return;
    }
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    timeDisplay.innerText = `${mins}:${secs}`;
}




// 3. FIXED: Added 'async' to SpeakerOn so 'await' works
async function SpeakerOn() {
    pulseRing.style.display = 'block';

    const questionText = document.getElementById('questionDisplay').innerText || nextQ ;
    const speech = new SpeechSynthesisUtterance(questionText);
    speech.lang = 'en-GB';
    speech.rate = 0.9;
    window.speechSynthesis.speak(speech);
	
    // Wait for the duration of speech
    await new Promise(resolve => setTimeout(resolve, 8000));
    pulseRing.style.display = 'none';
}
// Define this globally so all functions see the SAME question
let nextQ = getAndRemoveNextQuestion();

document.addEventListener('DOMContentLoaded', () => {
    if (nextQ) {
        document.getElementById('questionDisplay').innerText = nextQ;
        document.getElementById('currQuestionCount').innerText = count;
        document.getElementById('interviewType').innerText = type;
        document.getElementById('difficulty').innerText = diff;
        // Wrap speech in a user interaction if possible, 
        // or keep your timeout and check the console for "Interrupted" errors
        setTimeout(() => {
            speakQuestion(nextQ);
        }, 2000);
    } else {
        alert("No more questions! Redirecting to feedback...");
        //window.location.href = '/feedback';
    }
});

function speakQuestion(text) {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'en-GB';
    speech.rate = 0.9;
    
    pulseRing.style.display = 'block';
    
    speech.onend = () => {
        pulseRing.style.display = 'none';
        console.log("Speech finished.");
        // Optional: startInterview(); // Uncomment if you want auto-start
    };

    window.speechSynthesis.speak(speech);
}


function showLoader() {
    const loader = document.getElementById('loader-overlay');
    const mainText = document.getElementById('loader-text');
    const subText = document.getElementById('loader-subtext');

    loader.style.display = 'flex';
	//startAiAudio(); // This triggers the browser-generated sound

    // Optional: Dynamic text changes if the wait is long
    setTimeout(() => {
        mainText.innerText = "Analyzing your tone and confidence...";
	subText.innerText = "Synthesizing indetails...";
    }, 15000);
	
setTimeout(() => {
        mainText.innerText = "Analyzing your interview performance...";
	subText.innerText = "thinking through your response...";
    }, 30000);
}

// Example usage:
// document.querySelector('.start-Btn').addEventListener('click', () => {
//    showLoader();
//    // Then perform your fetch or navigation logic
// });
//"Calibrating your feedback..."
//"Our AI is revieweing your response..."
//"Analyzing your tone and confidence..."
//"Processing your answer for expert insights..."
//"Hang tight, we're generating your results..."
//"Almost there! Preparing your next challenge..."
//Professional & Sophisticated
//"AI is evaluating your response..."
//"Analyzing your interview performance..."
//"Generating personalized feedback..."
//"Synthesizing expert insights..."
//Encouraging & Friendly
//"Great job! Let’s see how you did..."
//"Processing your brilliant answer..."
//"The AI is thinking through your response..."
//"Preparing your next set of questions..."


let audioCtx = null;
let activeNodes = [];

function startAiAudio() {
    // Initialize context on first click
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    stopAiAudio(); // Clear previous nodes

    // Master Gain for smooth volume control
    const masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 1.5); // 1.5s Fade-in
    masterGain.connect(audioCtx.destination);

    // 1. THE "DEEP CORE" (Low Frequency)
    const baseOsc = audioCtx.createOscillator();
    baseOsc.type = 'sine';
    baseOsc.frequency.setValueAtTime(55, audioCtx.currentTime); // Deep 'G' note

    // 2. THE "SHIMMER" (Higher frequency for airiness)
    const shimmerOsc = audioCtx.createOscillator();
    shimmerOsc.type = 'sine';
    shimmerOsc.frequency.setValueAtTime(110.5, audioCtx.currentTime); // Slightly detuned for "beating"

    // 3. THE "BREATH" (Low frequency modulator for the 'pulse' feel)
    const lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.5, audioCtx.currentTime); // One pulse every 2 seconds

    const lfoGain = audioCtx.createGain();
    lfoGain.gain.setValueAtTime(0.05, audioCtx.currentTime);

    // Connect LFO to modulate volume of the shimmer
    lfo.connect(lfoGain);
    lfoGain.connect(masterGain.gain);

    // Start everything
    baseOsc.connect(masterGain);
    shimmerOsc.connect(masterGain);
    
    baseOsc.start();
    shimmerOsc.start();
    lfo.start();

    activeNodes = [baseOsc, shimmerOsc, lfo, masterGain, lfoGain];
}

function stopAiAudio() {
    activeNodes.forEach(node => {
        try { node.stop(); } catch(e) {}
        try { node.disconnect(); } catch(e) {}
    });
    activeNodes = [];
}
