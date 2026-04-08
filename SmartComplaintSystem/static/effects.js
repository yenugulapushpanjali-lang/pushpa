from flask import Flask, render_template, request, redirect, url_for
import datetime
import os
import random
import string

app = Flask(__name__)

# ─────────────────────────────────────────
#  HELPER FUNCTIONS
# ─────────────────────────────────────────

COMPLAINTS_FILE = "complaints.txt"

def generate_id():
    """Generate a unique complaint ID like CMP-A3F9"""
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"CMP-{suffix}"

def save_complaint(data: dict):
    """Append one complaint as a line in complaints.txt"""
    with open(COMPLAINTS_FILE, "a") as f:
        line = (
            f"{data['id']}|"
            f"{data['name']}|"
            f"{data['email']}|"
            f"{data['phone']}|"
            f"{data['category']}|"
            f"{data['subject']}|"
            f"{data['description']}|"
            f"{data['priority']}|"
            f"{data['status']}|"
            f"{data['timestamp']}|"
            f"{data['response']}\n"
        )
        f.write(line)

def load_complaints():
    """Read all complaints from complaints.txt and return as list of dicts"""
    complaints = []
    if not os.path.exists(COMPLAINTS_FILE):
        return complaints
    with open(COMPLAINTS_FILE, "r") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            parts = line.split("|")
            if len(parts) < 11:
                continue
            complaints.append({
                "id":          parts[0],
                "name":        parts[1],
                "email":       parts[2],
                "phone":       parts[3],
                "category":    parts[4],
                "subject":     parts[5],
                "description": parts[6],
                "priority":    parts[7],
                "status":      parts[8],
                "timestamp":   parts[9],
                "response":    parts[10]
            })
    return complaints

def find_complaint(complaint_id: str):
    """Find a single complaint by ID"""
    for c in load_complaints():
        if c["id"].upper() == complaint_id.upper():
            return c
    return None

def update_complaint(complaint_id: str, new_status: str, new_response: str):
    """Update status and response for a complaint in complaints.txt"""
    complaints = load_complaints()
    updated = []
    for c in complaints:
        if c["id"].upper() == complaint_id.upper():
            c["status"]   = new_status
            c["response"] = new_response
        updated.append(c)
    # Rewrite entire file
    with open(COMPLAINTS_FILE, "w") as f:
        for c in updated:
            line = (
                f"{c['id']}|{c['name']}|{c['email']}|{c['phone']}|"
                f"{c['category']}|{c['subject']}|{c['description']}|"
                f"{c['priority']}|{c['status']}|{c['timestamp']}|{c['response']}\n"
            )
            f.write(line)


# ─────────────────────────────────────────
#  SERVER 1  — CUSTOMER ROUTES
# ─────────────────────────────────────────

@app.route("/")
def index():
    """Home page — complaint submission form"""
    return render_template("index.html")


@app.route("/submit", methods=["POST"])
def submit():
    """Handle complaint form submission"""
    data = {
        "id":          generate_id(),
        "name":        request.form.get("name", "").strip(),
        "email":       request.form.get("email", "").strip(),
        "phone":       request.form.get("phone", "").strip(),
        "category":    request.form.get("category", "").strip(),
        "subject":     request.form.get("subject", "").strip(),
        "description": request.form.get("description", "").strip(),
        "priority":    request.form.get("priority", "Low").strip(),
        "status":      "Open",
        "timestamp":   datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
        "response":    "Pending"
    }
    save_complaint(data)
    return redirect(url_for("success", complaint_id=data["id"]))


@app.route("/success")
def success():
    """Show success page after complaint submission"""
    complaint_id = request.args.get("complaint_id", "")
    complaint = find_complaint(complaint_id)
    return render_template("success.html", complaint=complaint)


@app.route("/track")
def track():
    """Track a complaint by ID"""
    complaint_id = request.args.get("id", "").strip()
    complaint = None
    error = None

    if complaint_id:
        complaint = find_complaint(complaint_id)
        if not complaint:
            error = f"No complaint found with ID: {complaint_id.upper()}"

    return render_template("track.html", complaint=complaint, error=error, searched_id=complaint_id)


# ─────────────────────────────────────────
#  SERVER 2  — WORKER / ADMIN ROUTES
# ─────────────────────────────────────────

@app.route("/admin")
def admin():
    """Worker dashboard — view all complaints"""
    complaints = load_complaints()

    # Stats for KPI cards
    total      = len(complaints)
    open_count = sum(1 for c in complaints if c["status"] == "Open")
    inprog     = sum(1 for c in complaints if c["status"] == "In Progress")
    resolved   = sum(1 for c in complaints if c["status"] == "Resolved")

    # Filter by status (optional query param)
    status_filter = request.args.get("filter", "All")
    if status_filter != "All":
        complaints = [c for c in complaints if c["status"] == status_filter]

    return render_template(
        "admin.html",
        complaints=complaints,
        total=total,
        open_count=open_count,
        inprog=inprog,
        resolved=resolved,
        status_filter=status_filter
    )


@app.route("/respond/<complaint_id>", methods=["POST"])
def respond(complaint_id):
    """Worker submits a response to a complaint"""
    new_status   = request.form.get("status", "In Progress")
    new_response = request.form.get("response", "").strip()
    update_complaint(complaint_id, new_status, new_response)
    return redirect(url_for("admin"))


# ─────────────────────────────────────────
#  RUN
# ─────────────────────────────────────────

if __name__ == "__main__":
    # Create empty complaints file if not exists
    if not os.path.exists(COMPLAINTS_FILE):
        open(COMPLAINTS_FILE, "w").close()
    app.run(debug=True, port=5000)