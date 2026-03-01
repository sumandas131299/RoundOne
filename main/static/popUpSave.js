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
    fetch('/feedback/save_review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ career, rating, comment })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        // Show your thank you message here...
    })
    .catch(error => console.error('Error:', error));
	
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
