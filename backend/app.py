from flask import (
    Flask, request, session, redirect,
    jsonify, send_from_directory
)
import sqlite3
<<<<<<< HEAD
import os
=======
>>>>>>> 16ae3b74d7912ffbf277e95057b5bbea63b8384e
from werkzeug.security import generate_password_hash, check_password_hash

# ——— App Setup ——————————————————————————————————————————————————————————

# Serve static files from the `static/` directory at the web root
app = Flask(__name__, static_folder='static', static_url_path='')
app.secret_key = 'CHANGE_THIS_SECRET_KEY'  # replace with a secure random key

def get_db_connection():
<<<<<<< HEAD
    conn = sqlite3.connect('backend/game.db')
=======
    conn = sqlite3.connect('game.db')
>>>>>>> 16ae3b74d7912ffbf277e95057b5bbea63b8384e
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
<<<<<<< HEAD
    # Check if database already exists
    db_exists = os.path.exists('backend/game.db')
    
    # Connect to the database
    conn = get_db_connection()
    
    # Create tables if they don't exist yet
=======
    conn = get_db_connection()
>>>>>>> 16ae3b74d7912ffbf277e95057b5bbea63b8384e
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
<<<<<<< HEAD
    
    # Check if email column exists in users table
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'email' not in columns:
        print("Adding email column to users table...")
        try:
            # Add email column with default value to prevent NOT NULL constraint issues
            conn.execute("ALTER TABLE users ADD COLUMN email TEXT DEFAULT ''")
            
            # Update existing users with placeholder emails
            conn.execute("UPDATE users SET email = username || '@placeholder.com'")
            
            # Add UNIQUE constraint on email (SQLite doesn't support adding constraints in ALTER TABLE)
            conn.executescript("""
            CREATE TABLE users_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL
            );
            
            INSERT INTO users_new SELECT id, username, password_hash, email FROM users;
            
            DROP TABLE users;
            ALTER TABLE users_new RENAME TO users;
            """)
            print("Email column added successfully")
        except Exception as e:
            print(f"Error adding email column: {e}")
    
=======
>>>>>>> 16ae3b74d7912ffbf277e95057b5bbea63b8384e
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
<<<<<<< HEAD
    email = request.form['email']
    password = request.form['password']
    confirm_password = request.form['confirmPassword']
    
    # Validate passwords match
    if password != confirm_password:
        return jsonify({'error': 'Passwords do not match'}), 400
    
    pw_hash = generate_password_hash(password)

    conn = get_db_connection()
    
    # Check if username exists
    existing_user = conn.execute(
        'SELECT id FROM users WHERE username = ?', (username,)
    ).fetchone()
    
    if existing_user:
        conn.close()
        return jsonify({'error': 'Username already taken'}), 400
    
    # Check if email exists
    existing_email = conn.execute(
        'SELECT id FROM users WHERE email = ?', (email,)
    ).fetchone()
    
    if existing_email:
        conn.close()
        return jsonify({'error': 'Email already registered'}), 400
    
    try:
        conn.execute(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            (username, email, pw_hash)
        )
        conn.commit()
        
        user_id = conn.execute(
            'SELECT id FROM users WHERE username = ?', (username,)
        ).fetchone()['id']
        conn.close()

        session['user_id'] = user_id
        return jsonify({'success': True, 'redirect': '/main/HNMgames.html'}), 200
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500
=======
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
>>>>>>> 16ae3b74d7912ffbf277e95057b5bbea63b8384e

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
<<<<<<< HEAD
        return jsonify({'success': True, 'redirect': '/main/HNMgames.html'}), 200
    return jsonify({'error': 'Invalid username or password'}), 401
=======
        return redirect('/main/HNMgames.html')
    return 'Invalid credentials', 401
>>>>>>> 16ae3b74d7912ffbf277e95057b5bbea63b8384e

@app.route('/logout')
def logout():
    session.clear()
    return redirect('/login.html')

<<<<<<< HEAD
# ——— Authentication Status Check ————————————————————————————————————————

@app.route('/check_auth')
def check_auth():
    if 'user_id' not in session:
        return jsonify({'authenticated': False}), 200
    
    conn = get_db_connection()
    user = conn.execute(
        'SELECT username FROM users WHERE id = ?', (session['user_id'],)
    ).fetchone()
    conn.close()
    
    if user:
        return jsonify({
            'authenticated': True,
            'username': user['username'],
            'user_id': session['user_id']
        }), 200
    else:
        # Session exists but user doesn't - clear invalid session
        session.clear()
        return jsonify({'authenticated': False}), 200

# ——— High-Score & Leaderboard Endpoints —————————————————————————————————

@app.route('/get_highscore')
def get_highscore():
    game = request.args.get('game')
    
    if 'user_id' not in session:
        return jsonify({'error': 'Not logged in', 'highscore': 0}), 200
    
    user_id = session['user_id']
    
    conn = get_db_connection()
    row = conn.execute(
        'SELECT highscore FROM high_scores WHERE user_id = ? AND game_name = ?',
        (user_id, game)
    ).fetchone()
    conn.close()
    
    if row:
        return jsonify({'highscore': row['highscore']}), 200
    else:
        # No high score found for this game
        return jsonify({'highscore': 0}), 200

=======
# ——— High-Score & Leaderboard Endpoints —————————————————————————————————

>>>>>>> 16ae3b74d7912ffbf277e95057b5bbea63b8384e
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
<<<<<<< HEAD
    return jsonify({'status': 'ok', 'highscore': new_high})
=======
    return jsonify({'highscore': new_high})
>>>>>>> 16ae3b74d7912ffbf277e95057b5bbea63b8384e

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