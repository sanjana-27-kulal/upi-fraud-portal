const form = document.getElementById("reportForm");
const reportsList = document.getElementById("reportsList");
const message = document.getElementById("message");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const reportCount = document.getElementById("reportCount");

let reports = [];

document.addEventListener("DOMContentLoaded", loadReports);

form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const reportId = document.getElementById("reportId").value;

    const reportData = {
        reporterName: document.getElementById("reporterName").value.trim(),
        contact: document.getElementById("contact").value.trim(),
        incidentDate: document.getElementById("incidentDate").value,
        transactionId: document.getElementById("transactionId").value.trim(),
        amount: document.getElementById("amount").value,
        fraudType: document.getElementById("fraudType").value,
        description: document.getElementById("description").value.trim(),
        additionalInfo: document.getElementById("additionalInfo").value.trim()
    };

    if (
        !reportData.reporterName ||
        !reportData.contact ||
        !reportData.incidentDate ||
        !reportData.transactionId ||
        !reportData.amount ||
        !reportData.fraudType ||
        !reportData.description
    ) {
        showMessage("Please fill all required fields.", "error");
        return;
    }

    try {
        let response;

        if (reportId) {
            const existingReport = reports.find(report => report.id === reportId);

            reportData.status = existingReport ? existingReport.status : "Pending";

            response = await fetch(`/api/reports/${reportId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(reportData)
            });
        } else {
            response = await fetch("/api/reports", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(reportData)
            });
        }

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message, "error");
            return;
        }

        showMessage(data.message, "success");
        resetForm();
        loadReports();

    } catch (error) {
        showMessage("Could not connect to the server.", "error");
        console.error(error);
    }
});

async function loadReports() {
    try {
        const response = await fetch("/api/reports");
        reports = await response.json();
        displayReports();
    } catch (error) {
        showMessage("Failed to load reports.", "error");
    }
}

function displayReports() {
    const searchText = searchInput.value.toLowerCase();
    const selectedStatus = statusFilter.value;

    const filteredReports = reports.filter(report => {
        const matchesSearch =
            report.reporterName.toLowerCase().includes(searchText) ||
            report.transactionId.toLowerCase().includes(searchText) ||
            report.fraudType.toLowerCase().includes(searchText);

        const matchesStatus =
            selectedStatus === "All" ||
            report.status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    reportCount.textContent = `${filteredReports.length} report(s)`;

    if (filteredReports.length === 0) {
        reportsList.innerHTML = "<p>No reports found.</p>";
        return;
    }

    reportsList.innerHTML = filteredReports.map(report => `
        <div class="report">
            <div class="report-top">
                <div>
                    <h3>${escapeHTML(report.fraudType)}</h3>
                    <p><strong>Reporter:</strong> ${escapeHTML(report.reporterName)}</p>
                    <p><strong>Transaction ID:</strong> ${escapeHTML(report.transactionId)}</p>
                    <p><strong>Amount:</strong> ₹${Number(report.amount).toLocaleString("en-IN")}</p>
                    <p><strong>Date:</strong> ${escapeHTML(report.incidentDate)}</p>
                </div>

                <div>
                    <span class="badge">${escapeHTML(report.status)}</span>
                </div>
            </div>

            <div class="actions">
                <button onclick="viewReport('${report.id}')">View</button>
                <button onclick="editReport('${report.id}')">Edit</button>
                <button class="success" onclick="changeStatus('${report.id}')">Change Status</button>
                <button class="danger" onclick="deleteReport('${report.id}')">Delete</button>
            </div>
        </div>
    `).join("");
}

async function viewReport(id) {
    try {
        const response = await fetch(`/api/reports/${id}`);
        const report = await response.json();

        if (!response.ok) {
            showMessage(report.message, "error");
            return;
        }

        alert(
            `REPORT DETAILS\n\n` +
            `Reporter: ${report.reporterName}\n` +
            `Contact: ${report.contact}\n` +
            `Date: ${report.incidentDate}\n` +
            `Transaction ID: ${report.transactionId}\n` +
            `Amount: ₹${report.amount}\n` +
            `Type: ${report.fraudType}\n` +
            `Status: ${report.status}\n\n` +
            `Description:\n${report.description}\n\n` +
            `Additional Information:\n${report.additionalInfo || "None"}`
        );
    } catch (error) {
        showMessage("Could not retrieve the report.", "error");
    }
}

function editReport(id) {
    const report = reports.find(item => item.id === id);

    if (!report) {
        showMessage("Report not found.", "error");
        return;
    }

    document.getElementById("reportId").value = report.id;
    document.getElementById("reporterName").value = report.reporterName;
    document.getElementById("contact").value = report.contact;
    document.getElementById("incidentDate").value = report.incidentDate;
    document.getElementById("transactionId").value = report.transactionId;
    document.getElementById("amount").value = report.amount;
    document.getElementById("fraudType").value = report.fraudType;
    document.getElementById("description").value = report.description;
    document.getElementById("additionalInfo").value = report.additionalInfo || "";

    document.getElementById("submitButton").textContent = "Update Report";
    document.getElementById("cancelButton").style.display = "inline-block";

    window.scrollTo({ top: 0, behavior: "smooth" });
}

async function changeStatus(id) {
    const report = reports.find(item => item.id === id);

    if (!report) {
        showMessage("Report not found.", "error");
        return;
    }

    const newStatus = prompt(
        "Enter new status:\nPending\nUnder Review\nResolved",
        report.status
    );

    if (!newStatus) return;

    const allowedStatuses = ["Pending", "Under Review", "Resolved"];

    if (!allowedStatuses.includes(newStatus)) {
        showMessage("Invalid status.", "error");
        return;
    }

    const updatedReport = {
        reporterName: report.reporterName,
        contact: report.contact,
        incidentDate: report.incidentDate,
        transactionId: report.transactionId,
        amount: report.amount,
        fraudType: report.fraudType,
        description: report.description,
        additionalInfo: report.additionalInfo,
        status: newStatus
    };

    try {
        const response = await fetch(`/api/reports/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedReport)
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message, "error");
            return;
        }

        showMessage(data.message, "success");
        loadReports();

    } catch (error) {
        showMessage("Could not update status.", "error");
    }
}

async function deleteReport(id) {
    const confirmed = confirm("Are you sure you want to delete this report?");

    if (!confirmed) return;

    try {
        const response = await fetch(`/api/reports/${id}`, {
            method: "DELETE"
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message, "error");
            return;
        }

        showMessage(data.message, "success");
        loadReports();

    } catch (error) {
        showMessage("Could not delete the report.", "error");
    }
}

function resetForm() {
    form.reset();
    document.getElementById("reportId").value = "";
    document.getElementById("submitButton").textContent = "Submit Report";
    document.getElementById("cancelButton").style.display = "none";
}

function showMessage(text, type) {
    message.innerHTML = `
        <div class="message ${type === "success" ? "success-message" : "error-message"}">
            ${escapeHTML(text)}
        </div>
    `;

    setTimeout(() => {
        message.innerHTML = "";
    }, 4000);
}

searchInput.addEventListener("input", displayReports);
statusFilter.addEventListener("change", displayReports);

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}