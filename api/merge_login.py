import os

def merge_login():
    with open('login_stitch.html', 'r', encoding='utf-8') as f:
        html = f.read()

    auth_script = """
    <script>
    function showError(msg) {
        alert(msg);
    }
    
    // Wire up the button
    document.querySelector('.btn-glow').addEventListener('click', async (e) => {
      e.preventDefault();
      const u = document.getElementById('email').value;
      const p = document.getElementById('password').value;

      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: u, password: p })
        });
        const data = await res.json();

        if (data.status === 'success') {
          localStorage.setItem('loggedInUser', u);
          window.location.href = '/';
        } else {
          // Fallback: try signup if login fails for demonstration (since there's no signup button)
          const resSignup = await fetch('/api/signup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username: u, password: p })
          });
          const dataSignup = await resSignup.json();
          if (dataSignup.status === 'success') {
              localStorage.setItem('loggedInUser', u);
              window.location.href = '/';
          } else {
              showError(dataSignup.message || data.message || 'Authentication failed');
          }
        }
      } catch (err) {
        showError('Network error');
      }
    });
    </script>
    """

    # Replace </body> with script and </body>
    html = html.replace('</body>', auth_script + '\\n</body>')

    with open('auth.html', 'w', encoding='utf-8') as f:
        f.write(html)

if __name__ == '__main__':
    merge_login()
