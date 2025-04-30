from flask import (
    Flask, request, session, redirect,
    jsonify, send_from_directory
)
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash

# ——— App Setup ——————————————————————————————————————————————————————————

# Serve static files from the `static/` directory at the web root
app = Flask(__name__, static_folder='static', static_url_path='')
app.secret_key = 'CHANGE_THIS_SECRET_KEY'  # replace with a secure random key

def get_db_connection():
    conn = sqlite3.connect('game.db')
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS high_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      game_name TEXT NOT NULL,
      highscore INTEGER NOT NULL DEFAULT 0,
      UNIQUE(user_id, game_name),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      game_name TEXT NOT NULL,
      UNIQUE(user_id, game_name),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
    """)
    conn.commit()
    conn.close()

# Initialize tables
init_db()

# ——— Redirect Signed-In Users Away from Login/Signup —————————————————————

@app.before_request
def redirect_if_logged_in():
    if 'user_id' in session and request.path in ['/login.html', '/signup.html']:
        return redirect('/favorites.html')

# ——— Routes for Static Pages ——————————————————————————————————————————

@app.route('/')
def home():
    return redirect('/login.html')

@app.route('/favorites.html')
def favorites_page():
    if 'user_id' not in session:
        return redirect('/login.html')
    return send_from_directory('static', 'favorites.html')

# ——— Authentication ——————————————————————————————————————————————————

@app.route('/signup', methods=['POST'])
def signup():
    username = request.form['username']
    password = request.form['password']
    pw_hash = generate_password_hash(password)

    conn = get_db_connection()
    try:
        conn.execute(
            'INSERT INTO users (username, password_hash) VALUES (?, ?)',
            (username, pw_hash)
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return 'Username already taken', 400

    user_id = conn.execute(
        'SELECT id FROM users WHERE username = ?', (username,)
    ).fetchone()['id']
    conn.close()

    session['user_id'] = user_id
    return redirect('/main/HNMgames.html')

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']

    conn = get_db_connection()
    user = conn.execute(
        'SELECT * FROM users WHERE username = ?', (username,)
    ).fetchone()
    conn.close()

    if user and check_password_hash(user['password_hash'], password):
        session['user_id'] = user['id']
        return redirect('/main/HNMgames.html')
    return 'Invalid credentials', 401

@app.route('/logout')
def logout():
    session.clear()
    return redirect('/login.html')

# ——— High-Score & Leaderboard Endpoints —————————————————————————————————

@app.route('/submit_score', methods=['POST'])
def submit_score():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401

    user_id = session['user_id']
    game    = request.form['game']
    score   = int(request.form['score'])

    conn = get_db_connection()
    # insert or update high_scores
    row = conn.execute(
        'SELECT highscore FROM high_scores WHERE user_id = ? AND game_name = ?',
        (user_id, game)
    ).fetchone()

    if row is None:
        conn.execute(
            'INSERT INTO high_scores (user_id, game_name, highscore) VALUES (?, ?, ?)',
            (user_id, game, score)
        )
        new_high = score
    else:
        current_high = row['highscore']
        if score > current_high:
            conn.execute(
                'UPDATE high_scores SET highscore = ? WHERE user_id = ? AND game_name = ?',
                (score, user_id, game)
            )
            new_high = score
        else:
            new_high = current_high

    conn.commit()
    conn.close()
    return jsonify({'highscore': new_high})

@app.route('/leaderboard')
def leaderboard():
    game  = request.args.get('game')
    top_n = int(request.args.get('top', 10))

    conn = get_db_connection()
    rows = conn.execute(
        '''SELECT u.username, h.highscore
           FROM high_scores h
           JOIN users u ON u.id = h.user_id
           WHERE h.game_name = ?
           ORDER BY h.highscore DESC
           LIMIT ?''',
        (game, top_n)
    ).fetchall()
    conn.close()

    return jsonify([dict(r) for r in rows])

# ——— Favorites Management ——————————————————————————————————————————

@app.route('/favorite', methods=['POST'])
def add_favorite():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    game = request.form['game']
    conn = get_db_connection()
    try:
        conn.execute(
            'INSERT INTO favorites (user_id, game_name) VALUES (?, ?)',
            (session['user_id'], game)
        )
        conn.commit()
    except sqlite3.IntegrityError:
        pass
    conn.close()
    return jsonify({'status': 'added'})

@app.route('/unfavorite', methods=['POST'])
def remove_favorite():
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    game = request.form['game']
    conn = get_db_connection()
    conn.execute(
        'DELETE FROM favorites WHERE user_id = ? AND game_name = ?',
        (session['user_id'], game)
    )
    conn.commit()
    conn.close()
    return jsonify({'status': 'removed'})

@app.route('/my_favorites')
def my_favorites():
    if 'user_id' not in session:
        return jsonify([])
    conn = get_db_connection()
    rows = conn.execute(
        'SELECT game_name FROM favorites WHERE user_id = ?',
        (session['user_id'],)
    ).fetchall()
    conn.close()
    return jsonify([r['game_name'] for r in rows])

# ——— Run the App ——————————————————————————————————————————————————————

if __name__ == '__main__':
    app.run(debug=True)