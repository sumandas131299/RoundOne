const stars = document.querySelectorAll('.star');
const overlay = document.querySelector('.popUpOverlay');
const crossBtn = document.querySelector('.crossBtn');
const submitBtn = document.querySelector('.submitBtn');

const careerSelect = document.getElementById('careerSelect');

function showPopUp() {
    overlay.style.display = 'flex';
}

careerSelect.addEventListener('change', function() {
    // Change the text color to black once an option is picked
    this.style.color = 'black';
});



// 1. Star Rating Logic
stars.forEach((star, index) => {
    star.addEventListener('click', () => {
        stars.forEach((s, i) => {
            // Fill stars up to the clicked one
            s.classList.toggle('selected', i <= index);
        });
    });
});

// 2. Close Modal
crossBtn.addEventListener('click', () => {
    overlay.style.display = 'none';
});

// 3. Submit Data
submitBtn.addEventListener('click', () => {
    const rating = document.querySelectorAll('.star.selected').length;
    const career = document.querySelector('.currentCareer').value;
    const comment = document.querySelector('.userComment').value;

    if (rating === 0) {
        alert("Please select a star rating!");
        return;
    }

    console.log({ rating, career, comment });
    
	
	const content = document.querySelector('.popUpContent');
    content.innerHTML = `
    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; text-align: center; padding: 20px;">
        <h3>Thank You!</h3>
        <p>We've noted you are a <strong>${career}</strong>. Your feedback is valuable!</p>
    </div>
`;


    // 4. Close and redirect
    setTimeout(() => {
        sessionStorage.clear();
        window.location.href = "/";
        overlay.style.display = 'none';
    }, 4000);
	
	
});



document.addEventListener('DOMContentLoaded', () => {
    const data = JSON.parse(sessionStorage.getItem('lastFeedback'));
    if (!data) return;

    // Update main scores
    document.querySelector('.score').innerText = data.overall_score;
    document.querySelector('.score-label').innerText = data.score_label;
    document.querySelector('.transcript-text').innerText = `"${data.transcript}"`;

    // Update the 4 boxes (mapping the categories array)
    const boxes = document.querySelectorAll('.feedback-box');
    data.categories.forEach((cat, index) => {
        if (boxes[index]) {
            const box = boxes[index];
            box.querySelector('.circle-inner').innerText = cat.score;
            box.querySelector('.circle-chart').style.background = 
                `conic-gradient(#ef4444 ${cat.percentage}%, #f3f4f6 0)`;
            box.querySelector('h3').innerHTML = `${cat.title} <span class="status-badge">${cat.status}</span>`;
            box.querySelector('p').innerText = cat.feedback;
        }
    });
});


async function aiAnswer() {
    // Show a loading state if you want
    const btn = document.querySelector('.btn-outline-ai');
    const originalText = btn.innerText;
    btn.innerText = "Loading...";

    // Get data from your session or page state
    // Note: Ensure these variables match how you store question/type/diff
    const payload = new FormData();
    payload.append('type', sessionStorage.getItem('interviewType')); // or dynamic value
    payload.append('difficulty', sessionStorage.getItem('difficulty')); 
    payload.append('question', sessionStorage.getItem('lastQuestion')); 

    try {
        showLoader();
        console.log("Sending to Flask:", payload);
        const response = await fetch('/feedback/save', {
            method: 'POST',
            body: payload
        });

        const result = await response.json();

        if (result.status === 'success') {
            const data = result.data;
            
            // Update the UI with AI results
            document.querySelector('.score').innerText = data.overall_score;
            document.querySelector('.score-label').innerText = data.score_label;
            document.querySelector('.transcript-text').innerText = data.transcript;

            // Update the 4 feedback boxes
            const boxes = document.querySelectorAll('.feedback-box');
            data.categories.forEach((cat, index) => {
                if (boxes[index]) {
                    const box = boxes[index];
                    box.querySelector('.circle-inner').innerText = cat.score;
                    box.querySelector('.circle-chart').style.background = 
                        `conic-gradient(#ef4444 ${cat.percentage}%, #f3f4f6 0)`;
                    box.querySelector('h3').innerHTML = `${cat.title} <span class="status-badge">${cat.status}</span>`;
                    box.querySelector('p').innerText = cat.feedback;
                }
            });
            document.getElementById('loader-overlay').style.display = 'none';
        } else {
            alert("Error: " + result.message);
        }
    } catch (error) {
        console.error("Fetch error:", error);
    } finally {
        btn.innerText = originalText;
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
        mainText.innerText = "Generating personalized feedback...";
	subText.innerText = "Processing according to expert insights...";
    }, 7000);
	
setTimeout(() => {
        mainText.innerText = "Hang tight, we're generating pro answer...";
	subText.innerText = "Here we go...";
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
