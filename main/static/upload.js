// 1. Create a global variable to store the file
let uploadedFile = null;

// Select elements
const dropZone = document.querySelector('.uploadBox');
const fileInput = document.getElementById('fileInput');
const browseLink = document.querySelector('.browseLink');

// 2. Trigger file browse when clicking the box or link
dropZone.addEventListener('click', () => fileInput.click());

// 3. LISTEN for when a user actually selects a file
fileInput.addEventListener('change', function(event) {
    // The file is located in event.target.files array
    if (event.target.files.length > 0) {
        uploadedFile = event.target.files[0]; // SAVE the file to our variable
        
        // VISUAL FEEDBACK: Change the text inside the box to show the filename
        updateUIWithFileName(uploadedFile.name);
        
        console.log("File saved to variable:", uploadedFile);
    }
});

// Helper function to update the screen
function updateUIWithFileName(name) {
    // Find the text div inside the box
    const textBox = dropZone.querySelector('div');
    
    // Change the HTML to show the file icon and name
    textBox.innerHTML = `
        <strong style="color: #2563eb;">${name}</strong>
        <br>
        <span style="font-size: 0.8rem; color: green;">✅ Ready to upload</span>
    `;
    
    // Optional: Change border to solid green or blue to show success
    dropZone.style.borderColor = "#2563eb";
    dropZone.style.backgroundColor = "#f0f9ff";
}

// 4. Handle the Continue Button
async function saveAndContinue() {
    const type = document.getElementById('interviewType').value;
    const diff = document.getElementById('difficultyType').value;
    
    // VALIDATION: Check if file and dropdowns are selected
    if (!uploadedFile) {
        alert("Please upload your Resume or JD first!");
        return;
    }
    if (type === "" || diff === "") {
        alert("Please select both an Interview Type and Difficulty Level.");
        return;
    }

    // SAVE DATA for the next page
    // Note: We can't save the whole PDF file object in LocalStorage (it's too big).
    // For now, we save the CONFIGURATION. In a real app, you'd send 'uploadedFile' to a server here.
    sessionStorage.setItem('interviewType', type);
    sessionStorage.setItem('difficulty', diff);
    sessionStorage.setItem('fileName', uploadedFile.name); // Save name to show on next page

     // 1. Create FormData object
    const formData = new FormData();
    formData.append('resume', uploadedFile); // The file
    formData.append('interview_type', type);  // The dropdown values
    formData.append('difficulty', diff);
    console.log("Sending to Flask:", formData);
    try {
        showLoader();
        // 2. Send to Flask Blueprint route
        const response = await fetch('/upload/process', {
            method: 'POST',
            body: formData // No Headers needed, browser sets them for FormData
        });

        const data = await response.json();
        if (data.status === "success") {
    // Save the array of questions for the next page
        sessionStorage.setItem('interviewQuestions', JSON.stringify(data.questions));
        console.log("Success:", JSON.stringify(data.questions));
    // Redirect to the interview screen
        window.location.href = "/interview";
    }
    } catch (error) {
        console.error("Error:", error);
    } 
}




function showLoader() {
    const loader = document.getElementById('loader-overlay');
    const mainText = document.getElementById('loader-text');
    const subText = document.getElementById('loader-subtext');

    loader.style.display = 'flex';
	startAiAudio(); // This triggers the browser-generated sound

    // Optional: Dynamic text changes if the wait is long
    setTimeout(() => {
        mainText.innerText = "Analyzing your Data...";
	subText.innerText = "Almost there!..";
    }, 7000);
	
setTimeout(() => {
        mainText.innerText = "Constructing the question...";
	subText.innerText = "Preparing your challenge...";
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
