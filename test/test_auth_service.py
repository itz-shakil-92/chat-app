import requests

BASE_URL = "Your_auth_service_url"

# -------------------------------
# 1️⃣ Register a new user
# -------------------------------
register_payload = {
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
}

register_res = requests.post(f"{BASE_URL}/api/auth/register", json=register_payload)

# Log register response
print("🔐 Register Response:", register_res.status_code, register_res.json())

# Check if registration succeeded
if register_res.status_code != 201:
    print("❌ Registration failed. Test stopped.")
    exit()

# -------------------------------
# 2️⃣ Log in the user
# -------------------------------
login_payload = {
    "email": "test@example.com",
    "password": "password123"
}

login_res = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)

# Log login response
print("🔑 Login Response:", login_res.status_code, login_res.json())

# Check if login succeeded
if login_res.status_code != 200:
    print("❌ Login failed. Test stopped.")
    exit()

# Extract token from login response
token = login_res.json()["token"]

# -------------------------------
# 3️⃣ Test a protected route
# -------------------------------
headers = {
    "Authorization": f"Bearer {token}"
}

protected_res = requests.get(f"{BASE_URL}/api/users/me", headers=headers)

# Log protected route response
print("🛡️ Protected Route Response: ", protected_res.status_code, protected_res.json())

# Check if protected route is accessible
if protected_res.status_code == 200:
    print("✅ Authentication service test passed!")
else:
    print("❌ Protected route access failed.")
