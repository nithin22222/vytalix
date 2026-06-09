<script>
    function toggleAuth(mode) {
      document.getElementById('error-message').style.display = 'none';
      if (mode === 'signup') {
        document.getElementById('login-section').classList.remove('active');
        document.getElementById('signup-section').classList.add('active');
      } else {
        document.getElementById('signup-section').classList.remove('active');
        document.getElementById('login-section').classList.add('active');
      }
    }

    function showError(msg) {
      const err = document.getElementById('error-message');
      err.textContent = msg;
      err.style.display = 'block';
    }

    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const u = document.getElementById('login-username').value;
      const p = document.getElementById('login-password').value;

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
          showError(data.message || 'Login failed');
        }
      } catch (err) {
        showError('Network error');
      }
    });

    document.getElementById('signup-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const u = document.getElementById('signup-username').value;
      const p = document.getElementById('signup-password').value;

      try {
        const res = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: u, password: p })
        });
        const data = await res.json();

        if (data.status === 'success') {
          localStorage.setItem('loggedInUser', u);
          window.location.href = '/';
        } else {
          showError(data.message || 'Signup failed');
        }
      } catch (err) {
        showError('Network error');
      }
    });
  </script>
</body>

</html>
