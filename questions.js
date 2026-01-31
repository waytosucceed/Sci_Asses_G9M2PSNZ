var questions = [];
var count = 0;
var score = 0;
var Ansgiven = []; // Store answers given by the user
var topicName = ''; // Variable to store the topic name
const submitSound = document.getElementById("submit-sound");
// let timeLeft = 50 * 60;
let timerId = null;

const uniqueKey = "Sci_Asses_G9M2PSNZ";

// Helper functions for localStorage
function saveToLocalStorage(key, value) {
  let storageData = JSON.parse(localStorage.getItem(uniqueKey)) || {};
  storageData[key] = value;
  localStorage.setItem(uniqueKey, JSON.stringify(storageData));
}

function getFromLocalStorage(key) {
  let storageData = JSON.parse(localStorage.getItem(uniqueKey)) || {};
  return storageData[key];
}

// Fetch the questions from the JSON file
fetch('questions.json')
  .then(response => response.json())
  .then(data => {
    const urlParams = new URLSearchParams(window.location.search);
    topicName = urlParams.get('topic');
    const selectedTopic = data.topics.find(t => t.heading === topicName);

    if (selectedTopic) {
      questions = selectedTopic.questions;
      count = questions.length;



      saveToLocalStorage(topicName + '_totalQuestions', count);
      document.getElementById('heading').innerText = topicName || 'PS';

      // Load all questions at once
      loadAllQuestions();

      // Start the timer
      // startTimer();

      // Store topics in local storage
      const topics = JSON.parse(localStorage.getItem('topics')) || [];
      if (!topics.find(t => t.heading === topicName)) {
        topics.push(selectedTopic);
        saveToLocalStorage('topics', topics);
      }
    } else {
      document.getElementById('heading').innerText = 'Topic not found';
      document.getElementById('questiondiv').innerHTML = 'No questions available for this topic.';
    }
  })
  .catch(err => {
    console.error('Failed to load questions.json', err);
    document.getElementById('questiondiv').innerHTML = 'Failed to load questions.';
  });

/* =========================
   Render all questions grouped by section
   ========================= */
function loadAllQuestions() {
  const questionDiv = document.getElementById('questiondiv');
  questionDiv.innerHTML = '';

  const allQuestionsContainer = document.createElement('div');
  allQuestionsContainer.className = 'all-questions-container';

  // Group questions by section (fallback to 'mcq' if missing)
  const mcqQuestions = questions.filter(q => (q.section || 'mcq') === 'mcq');
  const shortQuestions = questions.filter(q => (q.section || 'mcq') === 'short');
  const longQuestions = questions.filter(q => (q.section || 'mcq') === 'long');

  // MCQ Section
  if (mcqQuestions.length > 0) {
    const secTitle = document.createElement('h2');
    secTitle.innerText = `1 Mark Questions (MCQ) — Total: ${mcqQuestions.length}`;
    secTitle.style.color= 'blue';
    allQuestionsContainer.appendChild(secTitle);

    mcqQuestions.forEach((question, idx) => {
      const globalIndex = questions.indexOf(question);
      const container = buildQuestionContainer(question, globalIndex);
      allQuestionsContainer.appendChild(container);
    });
  }

  // Short answer section (note: "Attempt any 7")
  if (shortQuestions.length > 0) {
    const secTitle = document.createElement('h2');
    secTitle.innerText = `Short Answer Questions (3 Marks) — Attempt any 7 — Total: 8`;
    secTitle.style.color= 'blue';
    allQuestionsContainer.appendChild(secTitle);

    shortQuestions.forEach(question => {
      const globalIndex = questions.indexOf(question);
      const container = buildQuestionContainer(question, globalIndex);
      allQuestionsContainer.appendChild(container);
    });
  }

  // Long answer section (note: "Attempt any 3")
  if (longQuestions.length > 0) {
    const secTitle = document.createElement('h2');
    secTitle.innerText = `Long Answer Questions (5 Marks) — Attempt any 3 — Total: ${longQuestions.length}`;
    secTitle.style.color= 'blue';
    allQuestionsContainer.appendChild(secTitle);

    longQuestions.forEach(question => {
      const globalIndex = questions.indexOf(question);
      const container = buildQuestionContainer(question, globalIndex);
      allQuestionsContainer.appendChild(container);
    });
  }

  questionDiv.appendChild(allQuestionsContainer);

  const submitButton = document.createElement('button');
submitButton.className = 'submit-btn-centered';
submitButton.textContent = 'Submit Answers';
submitButton.onclick = submitAllAnswers;
questionDiv.appendChild(submitButton);

}

function getDisplayQuestionNumber(question, index) {
  if (question.questionNo !== undefined && question.questionNo !== null) {
    return question.questionNo;
  }
  return index + 1;
}


// build single question container (shared)
function buildQuestionContainer(question, index) {
  const singleQuestionContainer = document.createElement('div');
  singleQuestionContainer.className = 'question-container';
  singleQuestionContainer.style.marginBottom = '30px';
  singleQuestionContainer.style.padding = '20px';
  singleQuestionContainer.style.border = '1px solid #ddd';
  singleQuestionContainer.style.borderRadius = '8px';
  singleQuestionContainer.style.fontSize = '2.4rem';

// Question number (always show)
const questionNumber = document.createElement('div');
questionNumber.className = 'question-text';
const displayNo = getDisplayQuestionNumber(question, index);
questionNumber.innerHTML = `<strong>Question ${displayNo}:</strong>`;

singleQuestionContainer.appendChild(questionNumber);

// Render question text ONLY if it's NOT inline-blank type
const isInlineBlank =
  question.input &&
  question.question &&
  question.question.includes("______");

if (!isInlineBlank) {
  const questionText = document.createElement('div');
  questionText.innerHTML = question.question;
  singleQuestionContainer.appendChild(questionText);
}


  // Choose rendering based on type (table/text/input/options)
  if (question.text_area !== undefined || question.type === 'text') {
    const textAreaContainer = createTextAreaQuestion(question, index);
    singleQuestionContainer.appendChild(textAreaContainer);
  } else if (question.type === "table" && question.table) {
    const tableContainer = createTableQuestion(question, index);
    singleQuestionContainer.appendChild(tableContainer);
  } else if (question.input && question.question.includes("______")) {
  const inlineInputQuestion = createInlineBlankQuestion(question, index);
  singleQuestionContainer.appendChild(inlineInputQuestion);
} else if (question.options && Array.isArray(question.options)) {
    const optionsContainer = createRadioQuestion(question, index);
    singleQuestionContainer.appendChild(optionsContainer);
  } else {
    // fallback text area
    const textAreaContainer = createTextAreaQuestion(question, index);
    singleQuestionContainer.appendChild(textAreaContainer);
  }

  return singleQuestionContainer;
}

/* =========================
   Text area question
   ========================= */
function createTextAreaQuestion(question, questionIndex) {
  const textAreaContainer = document.createElement('div');
  textAreaContainer.className = 'textarea-container';
  textAreaContainer.style.marginTop = '20px';

  const textArea = document.createElement('textarea');
  textArea.className = 'answer-textarea';
  textArea.style.width = '100%';
  textArea.style.minHeight = '200px';
  textArea.style.padding = '10px';
  textArea.style.fontSize = '18px';
  textArea.style.border = '2px solid #D6B65B';
  textArea.style.borderRadius = '4px';
  textArea.style.resize = 'vertical';
  textArea.placeholder = 'Enter your answer here...';

  // Load saved answer if exists
  if (Ansgiven[questionIndex]) {
    // For table style answers, Ansgiven may be array; for text area keep string
    if (typeof Ansgiven[questionIndex] === 'string') {
      textArea.value = Ansgiven[questionIndex];
    } else if (Array.isArray(Ansgiven[questionIndex]) && question.type !== 'table') {
      // try to convert to string
      textArea.value = Ansgiven[questionIndex].join(' ');
    }
  }

  // Save answer when input changes
  textArea.oninput = (e) => {
    saveAnswer(questionIndex, e.target.value);
  };

  textAreaContainer.appendChild(textArea);
  return textAreaContainer;
}

/* =========================
   TABLE question (prefill + save)
   ========================= */
function createTableQuestion(question, questionIndex) {
  const tableContainer = document.createElement('div');
  tableContainer.style.marginTop = '20px';

  const table = document.createElement('table');
  table.style.border = '2px solid #D6B65B';
  table.style.borderCollapse = 'collapse';
  table.style.width = '100%';

  const headerRow = document.createElement('tr');
  question.table.columns.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col;
    th.style.border = '1px solid #D6B65B';
    th.style.padding = '10px';
    th.style.backgroundColor = '#f0f0f0';
    th.style.fontSize = '20px';
    th.style.textAlign = 'center';
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  // ensure Ansgiven structure exists for this question
  if (!Ansgiven[questionIndex]) Ansgiven[questionIndex] = [];

  question.table.rows.forEach((row, rowIndex) => {
    const tr = document.createElement('tr');

    if (!Ansgiven[questionIndex][rowIndex]) Ansgiven[questionIndex][rowIndex] = [];

    row.forEach((cellValue, colIndex) => {
      const td = document.createElement('td');
      td.style.border = '1px solid #D6B65B';
      td.style.padding = '10px';
      td.style.fontSize = '18px';
      td.style.textAlign = 'center';

      // If cell has pre-filled data → show as label (NOT editable) but store it
      if (cellValue && cellValue.trim() !== "") {
        td.innerHTML = `<span style="font-size:18px;">${cellValue}</span>`;

        // Save prefilled into answers if not already saved
        if (!Ansgiven[questionIndex][rowIndex][colIndex]) {
          Ansgiven[questionIndex][rowIndex][colIndex] = cellValue;
          saveToLocalStorage('Ansgiven', Ansgiven);
        }
      } else {
        // Editable input for empty cells
        const input = document.createElement('input');
        input.type = 'text';
        input.style.width = '100%';
        input.style.textAlign = 'center';
        input.style.fontSize = '18px';
        input.style.border = 'none';
        input.style.backgroundColor = '#f9f9f9';

        // Load saved answers
        if (Ansgiven[questionIndex]?.[rowIndex]?.[colIndex]) {
          input.value = Ansgiven[questionIndex][rowIndex][colIndex];
        }

        // Save new answer
        input.oninput = (e) => {
          if (!Ansgiven[questionIndex]) Ansgiven[questionIndex] = [];
          if (!Ansgiven[questionIndex][rowIndex]) Ansgiven[questionIndex][rowIndex] = [];

          Ansgiven[questionIndex][rowIndex][colIndex] = e.target.value;
          saveToLocalStorage('Ansgiven', Ansgiven);
        };

        td.appendChild(input);
      }

      tr.appendChild(td);
    });

    table.appendChild(tr);
  });

  tableContainer.appendChild(table);
  return tableContainer;
}

/* =========================
   Regular input question (operands)
   ========================= */
function createInputQuestion(question, questionIndex) {
  const inputContainer = document.createElement('div');
  inputContainer.className = 'input-container';
  inputContainer.style.marginTop = '20px';
  inputContainer.style.display = 'flex';
  inputContainer.style.gap = '10px';
  inputContainer.style.alignItems = 'center';

  // Initialize answers array with fixed operands
  const answers = Ansgiven[questionIndex] || [];
  question.input.forEach((field, idx) => {
    if (field.operand !== "") {
      answers[idx] = field.operand;
    }
  });
  Ansgiven[questionIndex] = answers;
  saveAnswer(questionIndex, answers);

  question.input.forEach((field, fieldIndex) => {
    if (field.operand !== "") {
      // For fixed operands, create a disabled input
      const fixedInput = document.createElement('input');
      fixedInput.type = 'text';
      fixedInput.className = 'numeric-input';
      fixedInput.value = field.operand;
      fixedInput.disabled = true;
      fixedInput.style.width = '50px';
      fixedInput.style.height = '50px';
      fixedInput.style.fontSize = '24px';
      fixedInput.style.textAlign = 'center';
      fixedInput.style.border = 'none';
      inputContainer.appendChild(fixedInput);
    } else {
      // For empty operands, create an editable input
      const inputField = document.createElement('input');
      inputField.type = 'text';
      inputField.className = 'numeric-input';
      inputField.style.width = '70px';
      inputField.style.height = '50px';
      inputField.style.fontSize = '24px';
      inputField.style.textAlign = 'center';
      inputField.style.border = '2px solid #D6B65B';
      inputField.style.borderRadius = '4px';

      // Save answer when input changes
      inputField.oninput = (e) => {
        const currentAnswers = Ansgiven[questionIndex] || [];
        currentAnswers[fieldIndex] = e.target.value;
        saveAnswer(questionIndex, currentAnswers);
      };

      inputContainer.appendChild(inputField);
    }
  });

  return inputContainer;
}

/* =========================
   Radio / MCQ rendering
   ========================= */
function createRadioQuestion(question, questionIndex) {
  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'options-container';
  const hasImageOptions = question.options?.some(opt => opt.image) || false;

  if (hasImageOptions) {
    optionsContainer.style.display = 'grid';
    optionsContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
    optionsContainer.style.gap = '1rem';
  } else {
    optionsContainer.style.display = 'flex';
    optionsContainer.style.flexDirection = 'column';
    optionsContainer.style.gap = '10px';
  }

  question.options.forEach((option, optIndex) => {
    const optionWrapper = createOptionElement(option, questionIndex, optIndex);
    optionsContainer.appendChild(optionWrapper);
  });

  return optionsContainer;
}

// Helper function to create option elements
function createOptionElement(option, questionIndex, optionIndex) {
  const optionWrapper = document.createElement('div');
  optionWrapper.className = 'option-wrapper';
  optionWrapper.style.position = 'relative';
  optionWrapper.style.display = 'flex';
  optionWrapper.style.alignItems = 'center';
  optionWrapper.style.gap = '10px';
  optionWrapper.style.cursor = 'pointer';

  const radio = document.createElement('input');
  radio.type = 'radio';
  radio.name = `question${questionIndex}`;
  radio.value = optionIndex; // store selected option index
  radio.style.marginRight = '10px';

  // If we previously saved answer for this question, set radio checked
  if (Number(Ansgiven[questionIndex]) === optionIndex) {
  radio.checked = true;
}


  if (option.image) {
    const img = document.createElement('img');
    img.src = option.image;
    img.alt = 'Option Image';
    img.style.height = '150px';
    img.style.borderRadius = '12px';
    img.style.cursor = 'pointer';

    if (option.sound) {
      img.onmouseover = () => playOptionSound(option.sound);
    }

    optionWrapper.appendChild(radio);
    optionWrapper.appendChild(img);
  } else {
    const textSpan = document.createElement('span');
    textSpan.innerHTML = option.text;
    textSpan.style.flex = '1';

    optionWrapper.appendChild(radio);
    optionWrapper.appendChild(textSpan);
  }

  optionWrapper.addEventListener('click', (e) => {
    // set radio checked and save answer as the option index
    radio.checked = true;
    saveAnswer(questionIndex, Number(optionIndex));

    // stop propagation if nested clickable
    e.stopPropagation();
  });

  return optionWrapper;
}

function createInlineBlankQuestion(question, questionIndex) {
  const container = document.createElement('div');
  container.style.marginTop = '10px';
  container.style.fontSize = '2.2rem';

  let blankIndex = 0;
  if (!Ansgiven[questionIndex]) Ansgiven[questionIndex] = [];

  const html = question.question.replace(/______+/g, () => {
    const value = Ansgiven[questionIndex][blankIndex] || "";
    const currentIndex = blankIndex;
    blankIndex++;

    return `
      <input
        type="text"
        data-q="${questionIndex}"
        data-i="${currentIndex}"
        value="${value}"
        style="
          width:200px;
          height:42px;
          font-size:20px;
          text-align:center;
          border:2px solid #D6B65B;
          border-radius:6px;
          margin:4px 6px;
        "
        oninput="handleInlineInput(event)"
      />
    `;
  });

  container.innerHTML = html;
  return container;
}



function handleInlineInput(e) {
  const qIndex = Number(e.target.dataset.q);
  const iIndex = Number(e.target.dataset.i);

  if (!Ansgiven[qIndex]) Ansgiven[qIndex] = [];
  Ansgiven[qIndex][iIndex] = e.target.value;

  saveToLocalStorage('Ansgiven', Ansgiven);
}


/* =========================
   Save answer helper
   ========================= */
function saveAnswer(questionIndex, answer) {
  Ansgiven[questionIndex] = answer;
  saveToLocalStorage('Ansgiven', Ansgiven);
}

/* =========================
   Submit all answers
   ========================= */
function submitAllAnswers() {
  try {
  

    // Validate required data exists
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      throw new Error('No questions available');
    }

    if (!Ansgiven) {
      Ansgiven = []; // Initialize if undefined
    }

    // Play submit sound with error handling
    const sound1 = new Audio('./assests/sounds/submit.mp3');
    sound1.onerror = () => console.warn('Submit sound failed to load');
    sound1.play().catch(err => console.warn('Submit sound failed to play:', err));

    // Validate topic name
    if (!topicName) {
      topicName = 'default_topic';
    }

    // Save results with error handling
    try {
      saveToLocalStorage(topicName + '_completed', 'true');
    } catch (storageError) {
      console.error('Failed to save results:', storageError);
    }

    // Calculate MCQ score
    const mcqScore = calculateMCQScore();
    try {
      saveToLocalStorage(uniqueKey + "_mcq_score", mcqScore);
    } catch (storageError) {
      console.error('Failed to save mcq score:', storageError);
    }

    // Generate results content (link to view report)
    const home = "<a href='./graph.html'><b class='btn btn-success next-btn-progress'>Click here to View Report</b></a><br>";
    try {
      saveToLocalStorage(topicName + '_results_content', home);
    } catch (storageError) {
      console.error('Failed to save results content:', storageError);
    }

    // Generate question review HTML and save
    let questionContent = generateQuestionReview(mcqScore);
    try {
      saveToLocalStorage(topicName + '_question_content', questionContent);
    } catch (storageError) {
      console.error('Failed to save question content:', storageError);
    }

    // Save the Ansgiven snapshot too
    try {
      saveToLocalStorage('Ansgiven', Ansgiven);
    } catch (storageError) {
      console.error('Failed to save Ansgiven', storageError);
    }

    // Hide quiz elements
    const questionDiv = document.getElementById("questiondiv");
    if (questionDiv) {
      questionDiv.style.display = "none";
    }

    // Play completion animation and sound
    try {
      confetti({
        particleCount: 200,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (confettiError) {
      console.warn('Confetti animation failed:', confettiError);
    }

    try {
      const sound = new Audio('./assests/sounds/well-done.mp3');
      sound.onerror = () => console.warn('Completion sound failed to load');
      sound.play().catch(err => console.warn('Completion sound failed to play:', err));
    } catch (soundError) {
      console.warn('Failed to play completion sound:', soundError);
    }

    // Redirect to results
    window.location.href = "./graph.html";
  } catch (error) {
    console.error('Error in submitAllAnswers:', error);
    alert('There was an error submitting your answers. Please try again or contact support.');
  }
}

/* =========================
   Calculate MCQ score
   ========================= */
function calculateMCQScore() {
  let total = 0;

  questions.forEach((q, idx) => {
    const section = q.section || 'mcq';
    if (section !== 'mcq') return;

    const correctIndex = Number(q.answer);
    const rawGiven = Ansgiven[idx];

    const given =
      Array.isArray(rawGiven)
        ? Number(rawGiven[0])
        : Number(rawGiven);

    const marks = Number(q.marks || 1);

    if (!isNaN(given) && given === correctIndex) {
      total += marks;
    }
  });

  return total;
}


/* =========================
   Generate full question review (with header + total score)
   ========================= */
/* =========================
   Generate full question review (NO header, custom pagination)
   ========================= */
function generateQuestionReview(mcqScore = 0) {
  try {
    let questionContent = '';
    
    // Separate questions by section
    const mcqQuestions = questions.filter((q, idx) => {
      const section = q.section || 'mcq';
      return section === 'mcq';
    }).map((q, idx) => ({question: q, originalIndex: questions.indexOf(q)}));
    
    const shortQuestions = questions.filter((q, idx) => {
      const section = q.section || 'mcq';
      return section === 'short';
    }).map((q, idx) => ({question: q, originalIndex: questions.indexOf(q)}));
    
    const longQuestions = questions.filter((q, idx) => {
      const section = q.section || 'mcq';
      return section === 'long';
    }).map((q, idx) => ({question: q, originalIndex: questions.indexOf(q)}));

    let pageNumber = 0;

    // MCQ Questions: 5 per page
    const mcqPerPage = 5;
    const mcqPages = Math.ceil(mcqQuestions.length / mcqPerPage);
    
    for (let page = 0; page < mcqPages; page++) {
      const start = page * mcqPerPage;
      const end = Math.min(start + mcqPerPage, mcqQuestions.length);
      let pageDiv = `<div class='question-page' style='display: ${pageNumber === 0 ? "block" : "none"};'><h2>Page ${pageNumber + 1}</h2>`;

      for (let j = start; j < end; j++) {
        const {question, originalIndex} = mcqQuestions[j];
        pageDiv += generateQuestionReviewItem(question, originalIndex);
      }

      pageDiv += "</div>";
      questionContent += pageDiv;
      pageNumber++;
    }

    // Short Questions: 1 per page
    for (let i = 0; i < shortQuestions.length; i++) {
      const {question, originalIndex} = shortQuestions[i];
      let pageDiv = `<div class='question-page' style='display: none;'><h2>Page ${pageNumber + 1}</h2>`;
      pageDiv += generateQuestionReviewItem(question, originalIndex);
      pageDiv += "</div>";
      questionContent += pageDiv;
      pageNumber++;
    }

    // Long Questions: 1 per page
    for (let i = 0; i < longQuestions.length; i++) {
      const {question, originalIndex} = longQuestions[i];
      let pageDiv = `<div class='question-page' style='display: none;'><h2>Page ${pageNumber + 1}</h2>`;
      pageDiv += generateQuestionReviewItem(question, originalIndex);
      pageDiv += "</div>";
      questionContent += pageDiv;
      pageNumber++;
    }

    return questionContent;
  } catch (error) {
    console.error('Error generating question review:', error);
    return "<div>Error generating question review</div>";
  }
}

/* =========================
   Generate review for single question
   - Shows MCQ score for options-based
   - Shows "Analyzed by Teacher" for short/long
   - Table shows prefilled + user answers
   ========================= */
function generateQuestionReviewItem(question, index) {
  try {
    const ques = question.question || 'Question not available';
    const section = question.section || 'mcq';
    const marks = question.marks || (section === 'short' ? 3 : section === 'long' ? 5 : 1);

    // ------------------ TABLE QUESTIONS ------------------
    if (question.type === "table" && question.table) {

      const userAns = Ansgiven[index] || [];
      const smeAns = question.answer || [];
      const baseRows = question.table.rows;

      // USER TABLE (includes prefilled inputs)
      let userTable = `
        <table class="review-table" style="width:100%; border-collapse:collapse; border:1px solid #ccc; margin-top:10px;">
          <tr>
            ${question.table.columns.map(c => `
              <th style="border:1px solid #ccc; padding:8px; background:#f5f5f5;">${c}</th>`
            ).join("")}
          </tr>
      `;

      baseRows.forEach((row, rIndex) => {
        userTable += "<tr>";
        row.forEach((originalCell, cIndex) => {

          let finalValue = "";

          // CASE 1: Prefilled from original table.rows
          if (originalCell && String(originalCell).trim() !== "") {
            finalValue = originalCell;
          }

          // CASE 2: User-entered value overrides prefilled
          if (userAns?.[rIndex]?.[cIndex]) {
            finalValue = userAns[rIndex][cIndex];
          }

          userTable += `
            <td style="border:1px solid #ccc; padding:8px; text-align:center;">
              ${String(finalValue).trim() === "" ? "<span style='color:red'>__</span>" : finalValue}
            </td>
          `;
        });
        userTable += "</tr>";
      });

      userTable += "</table>";

      // SME TABLE (if provided)
      let smeTable = '';
      if (Array.isArray(smeAns) && smeAns.length) {
        smeTable = `
          <br><strong>SME's Answer:</strong><br>
          <table class="review-table" style="width:100%; border-collapse:collapse; border:1px solid #ccc; margin-top:10px;">
            <tr>
              ${question.table.columns.map(c => `
                <th style="border:1px solid #ccc; padding:8px; background:#f5f5f5;">${c}</th>`
              ).join("")}
            </tr>
        `;

        smeAns.forEach(row => {
          smeTable += "<tr>";
          row.forEach(col => {
            smeTable += `
              <td style="border:1px solid #ccc; padding:8px; text-align:center;">
                ${col}
              </td>
            `;
          });
          smeTable += "</tr>";
        });

        smeTable += "</table>";
      }

      // For short/long mark analysis
      const analyzedByTeacher = (section === 'short' || section === 'long') ? "<p><strong>Score:</strong> Analyzed by Teacher</p>" : "";

      return `
        <div style="padding:15px; border:1px solid #ddd; border-radius:8px; margin-bottom:25px;">
          <strong>Q.${getDisplayQuestionNumber(question, index)}:</strong> ${ques}<br><br>

          <strong>Your Answer:</strong><br>
          ${userTable}

          ${smeTable}

         
        </div>
      `;
    }

    // ------------------ TEXT AREA QUESTIONS ------------------
    if (question.text_area !== undefined || question.type === 'text') {
      const correctAnswer = Array.isArray(question.answer) ? question.answer[0] : question.answer;
      const formattedCorrect = (correctAnswer || "").replace(/\n/g, "<br>");
      const rawUserAnswer = Ansgiven[index] || "";
      const userAnswer = (typeof rawUserAnswer === 'string' ? rawUserAnswer : String(rawUserAnswer)).replace(/\n/g, "<br>");

      const teacherLine = (section === 'short' || section === 'long') ? `<p><strong>Score:</strong> Analyzed by Teacher</p>` : '';

      return `
        <div style="padding:15px; border:1px solid #ddd; border-radius:8px; margin-bottom:25px;">
          <strong>Q.${getDisplayQuestionNumber(question, index)}:</strong> ${ques}<br><br>

          <strong>Your Answer:</strong><br>
          <div style="padding:10px; font-size:1.1rem;">
            ${userAnswer || "<span style='color:gray'>Not Answered</span>"}
          </div>

          <br><strong>SME's Answer:</strong><br>
          <div style="padding:10px; font-size:1.1rem;">
            ${formattedCorrect || "<span style='color:gray'>No sample answer</span>"}
          </div>

          
        </div>
      `;
    }

    // ------------------ INLINE BLANK QUESTIONS ------------------
if (
  question.question &&
  question.question.includes("______") &&
  Array.isArray(question.answer)
) {
  const userAnswers = Ansgiven[index] || [];

  const formattedUser = question.answer.map((ans, i) => {
    const userVal = userAnswers[i] || "";
    if (userVal.trim().toLowerCase() === ans.trim().toLowerCase()) {
      return userVal;
    }
    return `<span style="color:black">${userVal || "__"}</span>`;
  });

  return `
    <div style="padding:15px; border:1px solid #ddd; border-radius:8px; margin-bottom:25px;">
      <strong>Q.${getDisplayQuestionNumber(question, index)}:</strong> ${question.question}<br><br>

      <strong>SME's Answer:</strong>
      ${question.answer.join(", ")}<br><br>

      <strong>Your Answer:</strong>
      ${formattedUser.join(", ")}<br><br>

      <p><strong>Score:</strong> Analyzed by Teacher</p>
    </div>
  `;
}


    // ------------------ INPUT-TYPE QUESTIONS ------------------
    if (question.input && Array.isArray(question.answer)) {
      const userAnswers = Ansgiven[index] || [];

      const formatted = question.input.map((field, idx) => {
        let val = field.operand !== "" ? field.operand : userAnswers[idx] || "";
        if (String(val) === String(question.answer[idx])) {
          return val;
        }
        return `<span style="color:red">${val || "__"}</span>`;
      });

      const teacherLine = (section === 'short' || section === 'long') ? `<p><strong>Score:</strong> Analyzed by Teacher</p>` : '';

      return `
        <div style="padding:10px; border:1px solid #eee; border-radius:6px; margin-bottom:18px;">
          <strong>Q.${getDisplayQuestionNumber(question, index)}:</strong> ${ques}<br>
          SME's Answer: ${question.answer.join(", ")}<br>
          Your Answer: ${formatted.join(", ")}<br>
          ${teacherLine}
        </div>
      `;
    }

    // ------------------ RADIO / MCQ QUESTIONS ------------------
    if (question.options && Array.isArray(question.options)) {
      const correctOptIndex = question.answer;
      const givenIndex = (Ansgiven[index] !== undefined) ? Number(Ansgiven[index]) : null;
      const isCorrect = (givenIndex !== null && Number(givenIndex) === Number(correctOptIndex));
      const optionText = (i) => {
        const opt = question.options[i];
        if (!opt) return '';
        return opt.image ? `<img src="${opt.image}" style="width:60px; height:60px;">` : (opt.text || '');
      };

      // show SME answer
      const correctHtml = optionText(correctOptIndex) || (typeof question.answer === 'string' ? question.answer : 'N/A');

      // show given
      let givenHtml = "";
      if (givenIndex === null) {
        givenHtml = `<span style="color:red">Not Answered</span>`;
      } else {
        const gOpt = question.options[givenIndex];
        if (gOpt) {
          givenHtml = gOpt.image ? `<img src="${gOpt.image}" style="width:60px; height:60px; ${isCorrect ? '' : 'border:2px solid red;'}">` : `<span style="color:${isCorrect ? 'black' : 'red'}">${gOpt.text}</span>`;
        } else {
          givenHtml = `<span style="color:red">Invalid option</span>`;
        }
      }

      // Calculate marks for this question if MCQ
      let scoreLine = '';
      if (section === 'mcq') {
        const awarded = isCorrect ? marks : 0;
        scoreLine = `<p><strong>Score:</strong> ${awarded}/${marks}</p>`;
      } else {
        scoreLine = `<p><strong>Score:</strong> Analyzed by Teacher</p>`;
      }

      return `
        <div style="padding:10px; border:1px solid #eee; border-radius:6px; margin-bottom:18px;">
          <strong>Q.${getDisplayQuestionNumber(question, index)}:</strong> ${ques}<br>
          <strong>Correct Answer</strong> ${correctHtml}<br>
          <strong>Your Answer:</strong> ${givenHtml}
        </div>
      `;
    }

    // Default fallback
    return `<div><strong>Q.${getDisplayQuestionNumber(question, index)}:</strong> ${ques} <br> <em>No renderer</em></div>`;

  } catch (err) {
    console.error("Review generation error:", err);
    return `<div>Error in review</div>`;
  }
}

function showPage(pageNumber) {
  var pages = document.getElementsByClassName('question-page');
  for (var i = 0; i < pages.length; i++) {
    pages[i].style.display = "none";
  }
  if (pages[pageNumber]) pages[pageNumber].style.display = "block";
}

function playOptionSound(soundPath) {
  const sound = new Audio(soundPath);
  sound.play();
}

function getOptionLabel(option) {
  return typeof option === 'string' ? option : option.text || '';
}


