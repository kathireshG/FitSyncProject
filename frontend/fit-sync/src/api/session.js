export function saveSession({ token, user }) {
  window.localStorage.setItem("accessToken", token);
  window.localStorage.setItem("isLoggedIn", "true");
  window.localStorage.setItem("userID", user._id);
  window.localStorage.setItem("name", user.name);
  window.localStorage.setItem("role", user.role);
}

export function clearSession() {
  for (const key of ["accessToken", "isLoggedIn", "userID", "name", "role"]) {
    window.localStorage.removeItem(key);
  }
}

export function isAuthenticated() {
  return Boolean(window.localStorage.getItem("accessToken"));
}
