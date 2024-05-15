from flask import Flask, render_template, session, redirect, url_for, g, request, flash
from database import get_db, close_db
from flask_session import Session
from forms import RegistrationFrom
from functools import wraps


app = Flask(__name__)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
app.config["SECRET_KEY"] = "XYU"
Session(app)


@app.before_request
def load_logged_in_user():
    g.user = session.get("player_id", None)


def login_required(view):
    @wraps(view)
    def wrapped_view(*args, **kwargs):
        if g.user is None:
            return redirect(url_for("index", next=request.url))
        return view(*args, **kwargs)
    return wrapped_view


@app.route("/", methods=['GET', 'POST'])
def index():
    form = RegistrationFrom()
    if request.method == 'POST' and form.validate_on_submit():
        player_id = form.player_id.data
        amount_of_enemies = form.amount_of_enemies.data
        session["player_id"] = player_id
        g.user = player_id
        session['amount_of_enemies'] = amount_of_enemies
        return redirect(url_for("game"))
    return render_template("index.html", form=form)


@app.route("/game")
@login_required
def game():
    amount_of_enemies = session['amount_of_enemies']
    return render_template("game.html", amount_of_enemies=amount_of_enemies)


@app.route('/instruction')
def instruction():
    return render_template('instruction.html')


@app.route("/store_score", methods=['GET', 'POST'])
@login_required
def store_score():
    player_id = session["player_id"]
    points = int(request.form["points"])
    time = float(request.form["time"])
    beenSeen = request.form["beenSeen"]
    amount_of_enemies = int(request.form["amount_of_enemies"])
    db = get_db()
    records = db.execute("SELECT * FROM records WHERE player_id = ? ORDER BY points DESC LIMIT 10;", (player_id,)).fetchall()
    if len(records) == 10:
        lowest_points_record = records[-1]
        
        if points > lowest_points_record['score']:
            db.execute("DELETE FROM records WHERE id = ?;", (lowest_points_record['id'],))
            db.execute("INSERT INTO records (player_id, points, recordTime, beenSeen, amount_of_enemies) VALUES (?, ?, ?, ?, ?);", (player_id, points, time, beenSeen, amount_of_enemies))
    else:
        db.execute("INSERT INTO records (player_id, points, recordTime, beenSeen, amount_of_enemies) VALUES (?, ?, ?, ?, ?);", (player_id, points, time, beenSeen, amount_of_enemies))
    db.commit()
    return "success"


@app.route("/score_board", methods=['GET', 'POST'])
def score_board():
    db = get_db()
    records = db.execute("""SELECT * 
                         FROM records 
                         ORDER BY points 
                         DESC LIMIT 10;""").fetchall()
    return render_template('score_board.html', records=records)
