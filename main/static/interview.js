let timerInterval;
let seconds = 0;
let mediaRecorder; 
let audioChunks = []; 

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
let isManualStop = false; // New flag to track manual clicks

async function startInterview() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    isManualStop = false;
    if (!SpeechRecognition) {
        alert("Speech recognition not supported in this browser.");
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false; // Set to true if you want to see text live
    recognition.lang = 'en-IN';
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
        if (!isManualStop) {
            console.log("Silence detected, restarting recognition...");
            recognition.start(); // Keep listening!
            return; 
        }

        
        console.log("Transcript:", transcriptBuffer);
        if (transcriptBuffer.trim().length > 0 && transcriptBuffer !== " ") {
            sessionStorage.setItem('transcript', transcriptBuffer);
            
        }else{
            // sessionStorage.setItem('transcript', "...");
            // await sendTranscriptToServer(); 
           // window.location.href = '/feedback';
           sessionStorage.setItem('transcript', '...');
           transcriptBuffer= "no answer"
        }
        await sendTranscriptToServer(); // This triggers recognition.onend
        
    };

    // UI Updates
    startBtn.style.display = 'none';
    endBtn.style.display = 'block';
     
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
        isManualStop = true;
        recognition.stop(); // This triggers recognition.onend
    }
    clearInterval(timerInterval);
    endBtn.innerText = "Processing Text...";
    endBtn.disabled = true;
    seconds = 0;
    timeDisplay.innerText = "00:00";
}

// async function sendTranscriptToServer() {
//     const formData = new FormData();
//     // Sending text instead of a blob
//     formData.append('transcript', transcriptBuffer); 
//     formData.append('type', type); 
//     formData.append('difficulty', diff);
//     formData.append('question', nextQ);

//     try {
//         showLoader();
//         const response = await fetch('/interview/save', { 
//             method: 'POST',
//             body: formData
//         });

//         if (response.ok) {
//             const result = await response.json();
            
//             sessionStorage.setItem('lastFeedback', JSON.stringify(result.data));
//             window.location.href = '/feedback';
//         }
//     } catch (err) {
//         console.error("Upload failed:", err);
//         endBtn.innerText = "Retry Upload";
//         endBtn.disabled = false;
//     }
// }

async function sendTranscriptToServer() {
    const formData = new FormData();
    formData.append('transcript', transcriptBuffer); 
    formData.append('type', type); 
    formData.append('difficulty', diff);
    formData.append('question', nextQ); // Send the question the user just answered

    try {
        showLoader(); // Show the loading overlay
        
        const response = await fetch('/interview/save', { 
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            
            // 1. Check if the interview is complete
            if (result.status === "complete") {
                // If the backend says complete, store feedback and redirect
                sessionStorage.setItem('lastFeedback', JSON.stringify(result.data));
                window.location.href = '/feedback';
                return;
            }

            // 2. If not complete, update the screen with the NEXT question from AI
            nextQ = result.reply; // AI's next live question/follow-up
            document.getElementById('questionDisplay').innerText = nextQ;
            
            // Update the question counter
            count++;
            document.getElementById('currQuestionCount').innerText = count;
            sessionStorage.setItem('currQCount', count);

            // 3. Reset the UI Buttons so the user can click "Start" again
            const loader = document.getElementById('loader-overlay');
            loader.style.display = 'none'; // Close loader
            
            timerBadge.style.display = 'none'; // Hide old timer
            startBtn.style.display = 'block';  // Show Start button for Q2
            endBtn.style.display = 'none';    // Hide Stop button
            endBtn.disabled = false;          // Re-enable for the next click
            endBtn.innerText = "⏹ Stop Answering";

            // 4. Have the AI speak the new question
            speakQuestion(nextQ);

        }
    } catch (err) {
        console.error("Communication failed:", err);
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


// Function to handle the male voice selection
function getMaleVoice() {
    const voices = window.speechSynthesis.getVoices();
    return voices.find(v => 
        v.name.includes('Male') || 
        v.name.includes('David') || 
        v.name.includes('Alex') ||
        v.name.includes('Google UK English Male')
    );
}


// 3. FIXED: Added 'async' to SpeakerOn so 'await' works
async function SpeakerOn() {
    pulseRing.style.display = 'block';

    const questionText = document.getElementById('questionDisplay').innerText || nextQ ;
    const speech = new SpeechSynthesisUtterance(questionText);
    const maleVoice = getMaleVoice();

     if (maleVoice) {
        speech.voice = maleVoice;
    } else {
        // Fallback: Lower the pitch if no male voice is found
        speech.pitch = 0.7; 
    }

    speech.lang = 'en-GB';
    speech.rate = 1;
    window.speechSynthesis.speak(speech);
	
    // Wait for the duration of speech
    await new Promise(resolve => setTimeout(resolve, 8000));
    pulseRing.style.display = 'none';
}

// --- Global Drag Variables ---
let active = false, currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;
const dragItem = document.getElementById("draggableCamera");

// --- 1. Start Live Camera Feed ---
let localStream = null; // Store the stream globally to stop it later

async function startLiveCamera() {
    const video = document.getElementById('webcam');

    // If localStream exists, we want to STOP it
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop()); // Kill hardware connection
        video.srcObject = null;
        localStream = null;
        console.log("Camera Off");
        document.getElementById('draggableCamera').style.display = 'none';
        document.getElementById('cameraBtn').innerHTML = '<i class="fa fa-video-slash"></i>';
    } 
    // If localStream is null, we want to START it
    else {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            video.srcObject = stream;
            localStream = stream; // Save it so we can stop it later
            console.log("Camera On");
            document.getElementById('draggableCamera').style.display = 'block';
            document.getElementById('cameraBtn').innerHTML = '<i class="fa fa-video"></i>';
        } catch (err) {
            console.warn("Camera access blocked or not found.", err);
        }
    }
}

// --- 2. Drag Logic Functions ---
function dragStart(e) {
    let clientX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
    let clientY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;
    
    initialX = clientX - xOffset;
    initialY = clientY - yOffset;

    if (e.target === dragItem || dragItem.contains(e.target)) {
        active = true;
    }
}

function drag(e) {
    if (active) {
        e.preventDefault();
        let clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
        let clientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;

        currentX = clientX - initialX;
        currentY = clientY - initialY;
        xOffset = currentX;
        yOffset = currentY;

        dragItem.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    }
}

function dragEnd() { active = false; }


// Define this globally so all functions see the SAME question
let nextQ = sessionStorage.getItem('firstQuestion'); 
let count = parseInt(sessionStorage.getItem('currQCount')) || 1;

document.addEventListener('DOMContentLoaded', () => {
        //startLiveCamera();

        // ENABLE DRAGGING
        document.addEventListener("mousedown", dragStart);
        document.addEventListener("mousemove", drag);
        document.addEventListener("mouseup", dragEnd);
        document.addEventListener("touchstart", dragStart, {passive: false});
        document.addEventListener("touchmove", drag, {passive: false});
        document.addEventListener("touchend", dragEnd);
    if (nextQ) {
        nextQ = nextQ.replace(/\\n/g, '\n');
        document.getElementById('questionDisplay').innerText = nextQ;
        document.getElementById('currQuestionCount').innerText = count;
        // if (type.includes('Standard Introductory/HR')) { 
        //     document.getElementById('interviewType').innerText = "HR"; 
        // } else if (type.includes('Behavioral (STAR method)')) { 
        //     document.getElementById('interviewType').innerText = "Behavioral"; 
        // } else if (type.includes('Technical (Skill-based)')) { 
        //     document.getElementById('interviewType').innerText = "Technical"; 
        // } else if (type.includes('Case Study (Problem Solving)')) { 
        //     document.getElementById('interviewType').innerText = "Case Study"; 
        // } else if (type.includes('Stress (High Pressure)')) { 
        //     document.getElementById('interviewType').innerText = "Stress"; 
        // } else { 
        //     document.getElementById('interviewType').innerText = "Interview"; 
        // }

        const interviewMap = {
            'Standard Introductory/HR': 'HR',
            'Behavioral (STAR method)': 'Behavioral',
            'Technical (Skill-based)': 'Technical',
            'Case Study (Problem Solving)': 'Case Study',
            'Stress (High Pressure)': 'Stress'
        };

        // Find the key that is contained within the 'type' string
        const matchedKey = Object.keys(interviewMap).find(key => type.includes(key));

        document.getElementById('interviewType').innerText = matchedKey ? interviewMap[matchedKey] : "Interview";

        document.getElementById('difficulty').innerText = diff;
        // Wrap speech in a user interaction if possible, 
        // or keep your timeout and check the console for "Interrupted" errors
        
        
        
        setTimeout(() => {
            speakQuestion(nextQ);
        }, 2000);
    } else {
        //alert("No more questions! Redirecting to feedback...");
        //window.location.href = '/feedback';
    }
});

function speakQuestion(text) {
    const speech = new SpeechSynthesisUtterance(text);
    
    const maleVoice = getMaleVoice();
     if (maleVoice) {
        speech.voice = maleVoice;
    } else {
        // Fallback: Lower the pitch if no male voice is found
        speech.pitch = 0.7; 
    }

    speech.lang = 'en-GB';
    speech.rate = 1;
    window.speechSynthesis.speak(speech);
    //speech.pitch = 0.5; 
    
    
    pulseRing.style.display = 'block';
    
    speech.onend = () => {
        pulseRing.style.display = 'none';
        console.log("Speech finished.");
        // Optional: startInterview(); // Uncomment if you want auto-start
    };

}


function showLoader() {
    const loader = document.getElementById('loader-overlay');
    const mainText = document.getElementById('loader-text');
    const subText = document.getElementById('loader-subtext');
    const fill = document.getElementById('progress-fill');
    const status = document.getElementById('progress-status');

    loader.style.display = 'flex';
    //startAiAudio();

    const circumference = 283; // 2 * PI * 45
    let progress = 0;
    
    const updateProgress = (target, duration) => {
        // Calculate the offset for the circle
        const offset = circumference - (target / 100) * circumference;
        fill.style.strokeDashoffset = offset;

        let start = progress;
        let interval = setInterval(() => {
            if (start >= target) clearInterval(interval);
            status.innerText = Math.floor(start) + "%";
            start++;
        }, duration / (target - progress));
        progress = target;
    };

    // Phase 1: Initial jump
    setTimeout(() => {
        updateProgress(35, 1000);
        mainText.innerText = "Calibrating your feedback...";
        subText.innerText = "Almost there!..";
    }, 1500);

    // Phase 2: The "Thinking" crawl
    setTimeout(() => {
        updateProgress(62, 3000);
        mainText.innerText = "Synthesizing your answer...";
        subText.innerText = "Preparing your challenge...";
    }, 7000);

    // Phase 3: The "Infinite" limit
    setTimeout(() => {
        updateProgress(95, 5000);
        mainText.innerText = "Generating personalized feedback...";
        subText.innerText = "we're generating your results...";
    }, 14000);
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
