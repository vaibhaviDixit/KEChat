// Variables
const prompt = document.querySelector("#prompt")
const clear = document.querySelector("#clear")
const send = document.querySelector("#send")
const conversations = document.querySelector(".conversations")
const examples = document.querySelector(".examples")
const allExamples = document.querySelectorAll(".examples .btn")
const allConversations = document.querySelectorAll(".conversation")
let myModal = new bootstrap.Modal(document.querySelector("#announcement"))
let buttons = document.querySelectorAll('.btn') 
const currentTime = Math.floor(Date.now() / 1000)
const twoHoursAgo = currentTime - (2 * 60 * 60)

function expandPromptField() {

  if(prompt.scrollHeight > 120){
    return;
  }
  if(prompt.value != "" && prompt.scrollHeight > 60){
    prompt.style.height = "50px"
    prompt.style.height = `${prompt.scrollHeight}px`
    prompt.classList.remove("rounded-pill")
    prompt.classList.add("rounded")
  }else{
    prompt.style.height = "50px"
    prompt.classList.remove("rounded")
    prompt.classList.add("rounded-pill")
  }
}

prompt.onchange = expandPromptField
// Enable send button when there is input in the prompt
prompt.onkeyup = () => {
  send.classList.toggle("text-success", prompt.value.trim() !== "")
  expandPromptField()
}

// Scroll to the latest conversation
function scroll() {
  const lastConversation = document.querySelector(
    ".conversations .conversation:last-child"
  );
  lastConversation.scrollIntoView({ behavior: "smooth", block: "start" });
}


// Enable chat input and buttons
function enable() {
  prompt.disabled = false
  send.innerHTML = '<i class="bi bi-send-fill"></i>'
  buttons.forEach(button => {
    button.classList.remove('not-allowed')
    button.disabled = false
  })
  prompt.focus()
  scroll()
}

// Disable chat input and buttons
function disable() {
  prompt.disabled = true
  buttons.forEach(button => {
    button.classList.add('not-allowed')
    button.disabled = true
  })
  send.innerHTML =
    '<span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>'
}

// Simulate typing effect
function type(text) {
  scroll()
  disable()

  let lastConversation = document.querySelector(
    ".conversations .conversation:last-child .message"
  )
  let index = 0

  let typingInterval = setInterval(() => {
    lastConversation.innerHTML += text[index]
    scroll()
    index++
    if (index >= text.length) {
      clearInterval(typingInterval)
      renderlinks(text);
      enable()
    }
  }, 10);  

}

// render links by parsing anchor tags
function renderlinks(text){

   let lastConversation = document.querySelector(
    ".conversations .conversation:last-child .message"
  )

  // temporary container element
    var tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;

    // Select all anchor tags within the container
    var links = tempDiv.getElementsByTagName('a');

    // visit each anchor tag
    for (var i = 0; i < links.length; i++) {
        var link = links[i];
        var href = link.getAttribute('href');
        var text = link.textContent;

        // Create a new anchor tag
        var newLink = document.createElement('a');
        newLink.setAttribute('href', href);
        newLink.textContent = text;
        newLink.target = '_blank'; 

        // Replace the original anchor tag with the new anchor element
        link.parentNode.replaceChild(newLink, link);
    }

  lastConversation.innerHTML = tempDiv.innerHTML; // set html to last response div
}

// Greet the user and initiate the conversation
function greetings() {
  let greeting =
    "Hello! I am KEChat, an AI chat assistant for career guidance and college counseling. \n\nHow may I help you today?"
  type(greeting)
}

// Render the conversation history
function render() {
  let getConversations =
    JSON.parse(localStorage.getItem("conversations")) || []
  let html = ""

  for (const conversation of getConversations) {
    if (!conversation.removed) {
      html += `
        <div class="conversation mb-3">
          <div class="you text-light">You</div>
          <div class="message bg-you">${conversation.prompt}</div>
        </div>

        <div class="conversation mb-5">
          <div class="ai text-light">KEChat</div>
          <div class="message bg-ai">${conversation.aiResponse}</div>
        </div>
      `
    }
  }

  conversations.innerHTML = html

  if (conversations.innerHTML === "") {
    examples.style.display = "block"
    conversations.innerHTML += `
      <div class="conversation mb-5">
        <div class="ai text-light">KEChat</div>
        <div class="message bg-ai"></div>
      </div>
    `
    greetings()
  } else {
    examples.style.display = "none"
  }

  prompt.focus()
  scroll()
  loginModal()
}

// Clear the conversation history
function clearConversations() {
  conversations.innerHTML = ""
  let getConversations = JSON.parse(localStorage.getItem("conversations"))

  if (getConversations) {
    conversations.innerHTML = ""
    getConversations.forEach((conversation) => {
      conversation.removed = true
    })
    localStorage.setItem("conversations", JSON.stringify(getConversations))
  }
  conversations.innerHTML += `
    <div class="conversation mb-5">
      <div class="ai text-light">KEChat</div>
      <div class="message bg-ai"></div>
    </div>
  `
  examples.style.display = "block"
  greetings()
}

// Event listener for clearing conversations
clear.onclick = clearConversations


// Calculate the token count for the last 2 hours
function limit() {
  let conversations = JSON.parse(localStorage.getItem("conversations")) || []
  let count = 0
  let tokenCount = 0

  // for (const conversation of conversations) {
  //   let conversationTime = conversation.time
  //   let tokens = conversation.total_tokens
  //   if (conversationTime >= twoHoursAgo) {
  //     count++
  //     tokenCount += tokens
  //   }
  // }

  return [count, tokenCount]
}

// Send request to the AI model
async function sendRequest(promptValue) {
  let data = new FormData()
  data.append("message", promptValue)
  data.append("count", limit()[0])
  data.append("tokens", limit()[1])
  examples.style.display = "none"

  try {
    let response = await axios.post(url, data)

    if (response.status === 200) {
      let responseData = response.data

      if (
        responseData.status === "200" &&
        responseData.message === "Success"
      ) {
        let aiResponse = responseData.data.response.replace(
          /<br\s*[\/]?>/gi,
          "\n"
        )
        let id = responseData.data[0].id
        let total_tokens = responseData.data[0].usage.total_tokens
        let finish_reason = responseData.data[0].choices[0].finish_reason
        let time = currentTime
        return {
          promptValue: promptValue,
          id: id,
          total_tokens: total_tokens,
          finish_reason: finish_reason,
          time: time,
          aiResponse: aiResponse,
        }
      } else {
        return false
      }
    }
  } catch (error) {
    console.log("Error: " + error)
    return false
  }
}

// Render conversation history on page load
window.onload = render

// Send user's message to the AI model

send.onclick = async function (e) {
  e.preventDefault()

  if (limit()[0] > 2 && !getCookie("auth")) {
    myModal.show()
    return
  }

  // Check if prompt value is empty
  if (prompt.value.trim() === "") {
    prompt.focus()
    return // Stop executing the function
  }
  promptValue = prompt.value

  conversations.innerHTML += `
              <div class="conversation mb-3">
                <div class="you text-light">You</div>
                <div class="message bg-you">${promptValue}</div>
              </div>
            `
  prompt.value = ""

  scroll()
  disable()

  const response = await sendRequest(promptValue)

  if (response) {
    conversations.innerHTML += `
              <div class="conversation mb-5">
                <div class="ai text-light">KEChat</div>
                <div class="message bg-ai"></div>
              </div>
  `
    scroll()

    save(
      response.promptValue,
      response.id,
      response.total_tokens,
      response.finish_reason,
      response.time,
      response.aiResponse
    )
    type(response.aiResponse)
  } else {
    conversations.innerHTML += `
            <div class="conversation mb-5">
              <div class="ai text-light">KEChat</div>
              <div class="message bg-ai"></div>
            </div>
          `
    errorMsg = "Limit exceeded. Try again after 2 hrs"
    type(errorMsg)
  }
}

function save(prompt, id, total_tokens, finish_reason, time, aiResponse) {
  let conversation = {
    prompt: prompt,
    id: id,
    total_tokens: total_tokens,
    finish_reason: finish_reason,
    time: time,
    aiResponse: aiResponse,
    removed: false, // Set removed attribute to false initially
  }

  let getConversations =
    JSON.parse(localStorage.getItem("conversations")) || []
  getConversations.push(conversation)
  set = localStorage.setItem("conversations", JSON.stringify(getConversations))

  return set
}

const data = {
  "Top 10 IITs for Computer Science":
    "Here are the top 10 IITs for Computer Science:\n\n1. Indian Institute of Technology Bombay (IITB)\n2. Indian Institute of Technology Delhi (IITD)\n3. Indian Institute of Technology Kanpur (IITK)\n4. Indian Institute of Technology Madras (IITM)\n5. Indian Institute of Technology Kharagpur (IITKGP)\n6. Indian Institute of Technology Roorkee (IITR)\n7. Indian Institute of Technology Guwahati (IITG)\n8. Indian Institute of Technology Hyderabad (IITH)\n9. Indian Institute of Technology Patna (IITP)\n10. Indian Institute of Technology Gandhinagar (IITGN)\n",

  "Preparation strategy for JEE Mains":
    "To prepare for JEE Mains, you should follow a well-planned strategy that includes the following steps:\n\n1. Understand the syllabus and exam pattern: Before starting your preparation, you should have a clear understanding of the JEE Mains syllabus and exam pattern. This will help you to focus on the important topics and prepare accordingly.\n\n2. Create a study plan: Once you have a clear understanding of the syllabus and exam pattern, create a study plan that includes a daily schedule for studying, revising, and practicing.\n\n3. Focus on the basics: JEE Mains is all about understanding the basics of Physics, Chemistry, and Mathematics. So, focus on building a strong foundation by understanding the concepts and practicing the problems.\n\n4. Practice regularly: Regular practice is the key to success in JEE Mains. Solve as many problems as possible from different sources, including previous year question papers, mock tests, and sample papers.\n\n5. Revise regularly: Revision is important to retain what you have learned. Make sure to revise the topics regularly and keep a track of your progress.\n\n6. Stay motivated: JEE Mains is a tough exam, and it requires a lot of hard work and dedication. Stay motivated and focused on your goal, and don't let any setbacks demotivate you.\n\nRemember, consistency and hard work are the keys to success in JEE Mains. Good luck with your preparation!\n",
  "Rank Prediction for JEE Mains": "It will be updated soon! Please wait",
}

function getMsg(element) {
  disable()
  examples.style.display = "none"
  msg = element.dataset.prompt
  let currentTime = new Date().getTime()
  save(msg, "", 0, "stop", currentTime, data[msg])
  conversations.innerHTML += `
            <div class="conversation mb-3">
              <div class="you text-light">You</div>
              <div class="message bg-you">${msg}</div>
            </div>
    
            <div class="conversation mb-5">
              <div class="ai text-light">KEChat</div>
              <div class="message bg-ai"></div>
            </div>
            `
  scroll()
  type(data[msg])
}

allExamples.forEach((example) => {
  example.addEventListener("click", () => getMsg(example))
})

function getCookie(cookieName) {
  const name = cookieName + "="
  const cDecoded = decodeURIComponent(document.cookie)
  const cArr = cDecoded.split(" ")
  let res
  cArr.forEach((val) => {
    if (val.indexOf(name) === 0) res = val.substring(name.length)
  })
  return res
}

function loginModal() {
  if (limit()[0] > 2 && !getCookie("auth")) myModal.show()
}

function unixToIST(unixTimestamp) {
  const date = new Date(unixTimestamp * 1000) // Convert Unix timestamp to milliseconds
  const options = {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }
  return date.toLocaleString('en-IN', options)
}