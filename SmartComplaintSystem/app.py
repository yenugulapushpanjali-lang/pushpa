from flask import Flask, render_template, request, redirect, url_for
import datetime
import os
import random
import string
from whitenoise import WhiteNoise   # ✅ ADDED

# ✅ Flask app with static config
app = Flask(__name__, static_folder='static', static_url_path='/static')

# ✅ Enable static serving in production (Render fix)
app.wsgi_app = WhiteNoise(app.wsgi_app, root='static/')


# ─────────────────────────────────────────
#  HELPER FUNCTIONS
# ─────────────────────────────────────────

COMPLAINTS_FILE = "complaints.txt"

def generate_id():
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"CMP-{suffix}"

def save_complaint(data: dict):
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
    for c in load_complaints():
        if c["id"].upper() == complaint_id.upper():
            return c
    return None

def update_complaint(complaint_id: str, new_status: str, new_response: str):
    complaints = load_complaints()
    updated = []

    for c in complaints:
        if c["id"].upper() == complaint_id.upper():
            c["status"]   = new_status
            c["response"] = new_response
        updated.append(c)

    with open(COMPLAINTS_FILE, "w") as f:
        for c in updated:
            line = (
                f"{c['id']}|{c['name']}|{c['email']}|{c['phone']}|"
                f"{c['category']}|{c['subject']}|{c['description']}|"
                f"{c['priority']}|{c['status']}|{c['timestamp']}|{c['response']}\n"
            )
            f.write(line)


# ─────────────────────────────────────────
#  CUSTOMER ROUTES
# ─────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/submit", methods=["POST"])
def submit():
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
    complaint_id = request.args.get("complaint_id", "")
    complaint = find_complaint(complaint_id)
    return render_template("success.html", complaint=complaint)


@app.route("/track")
def track():
    complaint_id = request.args.get("id", "").strip()
    complaint = None
    error = None

    if complaint_id:
        complaint = find_complaint(complaint_id)
        if not complaint:
            error = f"No complaint found with ID: {complaint_id.upper()}"

    return render_template(
        "track.html",
        complaint=complaint,
        error=error,
        searched_id=complaint_id
    )


# ─────────────────────────────────────────
#  ADMIN ROUTES
# ─────────────────────────────────────────

@app.route("/admin")
def admin():
    complaints = load_complaints()

    total      = len(complaints)
    open_count = sum(1 for c in complaints if c["status"] == "Open")
    inprog     = sum(1 for c in complaints if c["status"] == "In Progress")
    resolved   = sum(1 for c in complaints if c["status"] == "Resolved")

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
    new_status   = request.form.get("status", "In Progress")
    new_response = request.form.get("response", "").strip()

    update_complaint(complaint_id, new_status, new_response)
    return redirect(url_for("admin"))


# ─────────────────────────────────────────
#  RUN
# ─────────────────────────────────────────

if __name__ == "__main__":
    if not os.path.exists(COMPLAINTS_FILE):
        open(COMPLAINTS_FILE, "w").close()

    app.run(debug=True, port=5000)