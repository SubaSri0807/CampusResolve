
const API_URL = "/api/complaints";
const PUBLIC_RECENT_URL = "/api/complaints/public/recent";
const PUBLIC_SUMMARY_URL = "/api/complaints/public/summary";

const complaintForm = document.getElementById("complaintForm");
const submitButton = document.getElementById("submitButton");
const formMessage = document.getElementById("formMessage");
const complaintsList = document.getElementById("complaintsList");
const refreshButton = document.getElementById("refreshButton");

// Display a message to the student.
function showMessage(message, color = "#c0392b") {
  if (!formMessage) return;

  formMessage.replaceChildren();
  formMessage.style.color = color;

  const paragraph = document.createElement("p");
  paragraph.textContent = message;
  formMessage.appendChild(paragraph);
}

// Fetch JSON and handle server errors.
async function fetchJSON(url, options = {}) {
  const response = await fetch(url, options);

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok) {
    throw new Error(
      data.message || data.error || "The request failed."
    );
  }

  return data;
}

// Load dashboard statistics.
async function loadSummary() {
  try {
    const summary = await fetchJSON(PUBLIC_SUMMARY_URL);

    const totalCount = document.getElementById("totalCount");
    const pendingCount = document.getElementById("pendingCount");
    const resolvedCount = document.getElementById("resolvedCount");

    if (totalCount) {
      totalCount.textContent = summary.total ?? 0;
    }

    if (pendingCount) {
      pendingCount.textContent = summary.pending ?? 0;
    }

    if (resolvedCount) {
      resolvedCount.textContent = summary.resolved ?? 0;
    }
  } catch (error) {
    console.error("Could not load complaint totals:", error);
  }
}

// Display recent complaints on the student home page.
async function loadComplaints() {
  if (!complaintsList) return;

  complaintsList.replaceChildren();

  const loading = document.createElement("p");
  loading.className = "empty-state";
  loading.textContent = "Loading recent complaints...";
  complaintsList.appendChild(loading);

  try {
    const complaints = await fetchJSON(PUBLIC_RECENT_URL);

    complaintsList.replaceChildren();

    if (!Array.isArray(complaints) || complaints.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent =
        "No complaints have been submitted yet.";

      complaintsList.appendChild(empty);
      return;
    }

    complaints.forEach((complaint) => {
      const card = document.createElement("article");
      card.className = "complaint-card";

      const title = document.createElement("h3");
      title.textContent = complaint.title || "Untitled complaint";

      const category = document.createElement("p");
      category.textContent =
        `Category: ${complaint.category || "Other"}`;

      const status = document.createElement("p");
      status.className = "complaint-meta";
      status.textContent =
        `Status: ${complaint.status || "Pending"}`;

      const date = document.createElement("p");
      date.className = "complaint-date";

      if (complaint.createdAt) {
        const parsedDate = new Date(complaint.createdAt);

        if (!Number.isNaN(parsedDate.getTime())) {
          date.textContent =
            `Submitted: ${parsedDate.toLocaleDateString()}`;
        }
      }

      card.append(title, category, status);

      if (date.textContent) {
        card.appendChild(date);
      }

      complaintsList.appendChild(card);
    });
  } catch (error) {
    console.error("Could not load recent complaints:", error);

    complaintsList.replaceChildren();

    const message = document.createElement("p");
    message.className = "empty-state";
    message.textContent =
      "Could not load complaints. Please refresh the page or check the server.";

    complaintsList.appendChild(message);
  }
}

// Refresh dashboard counts and recent complaints.
async function refreshDashboard() {
  await Promise.all([
    loadComplaints(),
    loadSummary()
  ]);
}

// Display the successful submission and provide ID-copy and tracking options.
function showSubmissionSuccess(complaintId) {
  if (!formMessage) return;

  formMessage.replaceChildren();
  formMessage.style.color = "#16845b";

  const success = document.createElement("p");
  success.textContent = "Complaint submitted successfully!";
  formMessage.appendChild(success);

  const instruction = document.createElement("p");
  instruction.textContent =
    "Please save your Complaint ID to track its status later.";
  formMessage.appendChild(instruction);

  const idLabel = document.createElement("p");
  idLabel.textContent = "Your Complaint ID:";
  idLabel.style.fontWeight = "bold";
  formMessage.appendChild(idLabel);

  const idText = document.createElement("p");
  idText.textContent = complaintId;
  idText.style.fontWeight = "bold";
  idText.style.overflowWrap = "anywhere";
  idText.style.userSelect = "all";
  formMessage.appendChild(idText);

  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.textContent = "Copy Complaint ID";

  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(complaintId);
      copyButton.textContent = "ID Copied!";
    } catch (error) {
      console.error("Clipboard copy failed:", error);

      idText.textContent =
        `Please copy this ID manually: ${complaintId}`;
    }
  });

  formMessage.appendChild(copyButton);

  const trackLink = document.createElement("a");
  trackLink.href = "/track-complaint.html";
  trackLink.textContent = "Track My Complaint";
  trackLink.style.display = "block";
  trackLink.style.marginTop = "12px";

  // Pass the ID to the tracking page automatically.
  trackLink.href =
    "/track-complaint.html?id=" +
    encodeURIComponent(complaintId);

  formMessage.appendChild(trackLink);
}

// Submit a new complaint.
if (complaintForm && submitButton) {
  complaintForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    showMessage("");

    const formData = new FormData(complaintForm);
    const complaint = Object.fromEntries(formData.entries());

    try {
      const result = await fetchJSON(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(complaint)
      });

      if (!result.complaint?._id) {
        throw new Error(
          "The server did not return the Complaint ID. Please check your complaints API."
        );
      }

      const complaintId = result.complaint._id;

      complaintForm.reset();

      showSubmissionSuccess(complaintId);

      await refreshDashboard();
    } catch (error) {
      showMessage(error.message);
      console.error("Complaint submission failed:", error);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Submit Complaint →";
    }
  });
}

// Refresh button.
if (refreshButton) {
  refreshButton.addEventListener("click", refreshDashboard);
}

// Load dashboard data when the page opens.
refreshDashboard();
