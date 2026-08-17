const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const DATA_FILE = path.join(__dirname, "reports.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function readReports() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            fs.writeFileSync(DATA_FILE, "[]");
        }

        const data = fs.readFileSync(DATA_FILE, "utf8");
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading reports:", error);
        return [];
    }
}

function saveReports(reports) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(reports, null, 2));
}

function validateReport(body) {
    const requiredFields = [
        "reporterName",
        "contact",
        "incidentDate",
        "transactionId",
        "amount",
        "fraudType",
        "description"
    ];

    const missingFields = requiredFields.filter(
        (field) => !body[field] && body[field] !== 0
    );

    if (missingFields.length > 0) {
        return `Missing required fields: ${missingFields.join(", ")}`;
    }

    if (Number(body.amount) <= 0) {
        return "Amount must be greater than 0";
    }

    return null;
}

// GET all reports
app.get("/api/reports", (req, res) => {
    const reports = readReports();
    res.status(200).json(reports);
});

// GET one report
app.get("/api/reports/:id", (req, res) => {
    const reports = readReports();
    const report = reports.find((item) => item.id === req.params.id);

    if (!report) {
        return res.status(404).json({
            message: "Report not found"
        });
    }

    res.status(200).json(report);
});

// CREATE report
app.post("/api/reports", (req, res) => {
    const validationError = validateReport(req.body);

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }

    const reports = readReports();

    const newReport = {
        id: Date.now().toString(),
        reporterName: req.body.reporterName,
        contact: req.body.contact,
        incidentDate: req.body.incidentDate,
        transactionId: req.body.transactionId,
        amount: Number(req.body.amount),
        fraudType: req.body.fraudType,
        description: req.body.description,
        additionalInfo: req.body.additionalInfo || "",
        status: "Pending",
        createdAt: new Date().toISOString()
    };

    reports.push(newReport);
    saveReports(reports);

    res.status(201).json({
        message: "Fraud report created successfully",
        report: newReport
    });
});

// UPDATE report
app.put("/api/reports/:id", (req, res) => {
    const reports = readReports();
    const index = reports.findIndex((item) => item.id === req.params.id);

    if (index === -1) {
        return res.status(404).json({
            message: "Report not found"
        });
    }

    const validationError = validateReport(req.body);

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }

    reports[index] = {
        ...reports[index],
        reporterName: req.body.reporterName,
        contact: req.body.contact,
        incidentDate: req.body.incidentDate,
        transactionId: req.body.transactionId,
        amount: Number(req.body.amount),
        fraudType: req.body.fraudType,
        description: req.body.description,
        additionalInfo: req.body.additionalInfo || "",
        status: req.body.status || reports[index].status
    };

    saveReports(reports);

    res.status(200).json({
        message: "Report updated successfully",
        report: reports[index]
    });
});

// DELETE report
app.delete("/api/reports/:id", (req, res) => {
    const reports = readReports();
    const index = reports.findIndex((item) => item.id === req.params.id);

    if (index === -1) {
        return res.status(404).json({
            message: "Report not found"
        });
    }

    const deletedReport = reports.splice(index, 1)[0];
    saveReports(reports);

    res.status(200).json({
        message: "Report deleted successfully",
        report: deletedReport
    });
});

// Handle unknown API routes
app.use("/api", (req, res) => {
    res.status(404).json({
        message: "API endpoint not found"
    });
});

app.listen(PORT, () => {
    console.log(`UPI Fraud Portal running at http://localhost:${PORT}`);
});