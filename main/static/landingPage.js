
document.addEventListener("DOMContentLoaded", () => {
    const questions = document.querySelectorAll(".faq-question");

    questions.forEach(question => {
        question.addEventListener("click", () => {
            const answer = question.nextElementSibling;

            answer.style.maxHeight = 
                answer.style.maxHeight ? null : answer.scrollHeight + "px";
        });
    });
});
function scrollToPercentage() {
  // Calculate 50% of the total page height
  const targetScroll = document.documentElement.scrollHeight * 0.5;

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