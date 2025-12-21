function showSignUp() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'block';
}

function showLogin() {
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
}

function continueAsGuest() {
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const db = firebase.firestore();

    // Sign Up
    const signupBtn = document.getElementById('signup-btn');
    signupBtn.addEventListener('click', () => {
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        auth.createUserWithEmailAndPassword(email, password)
            .then(userCredential => {
                // Signed in 
                const user = userCredential.user;
                // Add user to Firestore
                db.collection('users').doc(user.uid).set({
                    email: user.email
                }).then(() => {
                    window.location.href = 'index.html';
                });
            })
            .catch(error => {
                alert(error.message);
            });
    });

    // Login
    const loginBtn = document.getElementById('login-btn');
    loginBtn.addEventListener('click', () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        auth.signInWithEmailAndPassword(email, password)
            .then(userCredential => {
                // Signed in
                window.location.href = 'index.html';
            })
            .catch(error => {
                alert(error.message);
            });
    });
});
