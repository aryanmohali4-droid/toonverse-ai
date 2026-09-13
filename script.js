const chips = document.querySelectorAll('.chip');
const promptInput = document.getElementById('promptInput');
const generateBtn = document.getElementById('generateBtn');
const btnText = document.getElementById('btnText');
const resultArea = document.getElementById('resultArea');
const downloadBtn = document.getElementById('downloadBtn');

let selectedStyle = chips[0].dataset.style;

chips.forEach(chip => {
  chip.addEventListener('click', () => {
    chips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    selectedStyle = chip.dataset.style;
  });
});

generateBtn.addEventListener('click', async () => {
  const userPrompt = promptInput.value.trim();

  if (!userPrompt) {
    resultArea.innerHTML = '<span class="error-msg">Please enter a prompt first</span>';
    return;
  }

  generateBtn.disabled = true;
  btnText.textContent = 'Generating...';
  resultArea.innerHTML = '<div class="spinner"></div>';
  downloadBtn.style.display = 'none';

  const fullPrompt = `${userPrompt}, ${selectedStyle}`;

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: fullPrompt })
    });

    const data = await response.json();

    if (!response.ok || !data.imageUrl) {
      throw new Error(data.error || 'Generation failed');
    }

    resultArea.innerHTML = `<img src="${data.imageUrl}" alt="Generated anime art" />`;
    downloadBtn.style.display = 'block';
    downloadBtn.onclick = () => {
      const a = document.createElement('a');
      a.href = data.imageUrl;
      a.download = 'toonverse-art.png';
      a.target = '_blank';
      a.click();
    };

  } catch (err) {
    resultArea.innerHTML = `<span class="error-msg">Something went wrong. Try again.</span>`;
    console.error(err);
  } finally {
    generateBtn.disabled = false;
    btnText.textContent = 'Generate';
  }
});
