
document.addEventListener("DOMContentLoaded", () => {
    const questions = document.querySelectorAll(".faq-question");

    questions.forEach(question => {
        question.addEventListener("click", () => {
            const answer = question.nextElementSibling;
            const isOpen = answer.style.maxHeight;

            // 1. Close all other open answers
            document.querySelectorAll(".faq-answer").forEach(el => {
                el.style.maxHeight = null;
            });

            // 2. Remove 'active' class from all other questions (if you use it for icon rotation)
            questions.forEach(q => q.classList.remove("active"));

            // 3. If the clicked one wasn't already open, open it
            if (!isOpen) {
                answer.style.maxHeight = answer.scrollHeight + "px";
                question.classList.add("active");
            }
        });
    });
});
function scrollToPercentage() {
  // Calculate 50% of the total page height
  const targetScroll = document.documentElement.scrollHeight * 0.71;

  window.scrollTo({
    top: targetScroll,
    behavior: 'smooth'
  });
}

// const tryBtn = document.querySelector('.tryBtn');
// const toptryBtn = document.querySelector('.toptryBtn');

// const observer = new IntersectionObserver(entries => {
//     entries.forEach(entry => {
//         if (!entry.isIntersecting) {
//             toptryBtn.style.display ='inline-block';
            
//         } else {
//             toptryBtn.style.display = 'none';
//         }
//     });
// }, {
//     threshold: 0.9 // Adjust the threshold as needed (0 to 1)
// });

// observer.observe(tryBtn)