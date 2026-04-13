# 🤝 Contributing Guide

Thank you for your interest in contributing! 🎉  
This project prioritizes **security, stability, and maintainability**.

---

## 📌 Getting Started

1. Fork the repository  
2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
````

3. Make your changes
4. Test thoroughly
5. Submit a Pull Request (PR)

---

## 🧱 Core Principles

All contributions must follow:

* 🔒 Security-first mindset
* 🧼 Clean and readable code
* ⚡ Minimal and efficient logic
* 🧩 Modular and reusable structure

---

## 🔒 Secure Coding Guidelines

### 1. Input Validation

* Always validate and sanitize external input
* Never trust user-provided data
* Use strict schemas where possible

✅ Good:

```js
if (typeof input === "string") { ... }
```

❌ Bad:

```js
process(input) // unchecked
```

---

### 2. No Unsafe Execution

The following are **strictly forbidden**:

* `eval()`
* `new Function()`
* `child_process.exec()`

Never execute raw strings as code.

---

### 3. Command System Safety

* Commands must be **parsed, not executed directly**
* Use a controlled dispatcher
* Prevent command injection

✅ Good:

```js
commands["say"](args)
```

❌ Bad:

```js
run(commandString)
```

---

### 4. Sandboxing

* Do not expose:

  * File system (`fs`)
  * Network (`http`, `fetch`)
  * OS-level APIs
* Keep execution isolated

---

### 5. Error Handling

* Never leak internal details
* Avoid stack traces in production output
* Use safe error messages

---

### 6. Dependency Safety

* Avoid adding unnecessary dependencies
* Prefer audited and well-known packages
* Check for vulnerabilities before adding

---

### 7. Data Safety

* Validate all serialization/deserialization
* Avoid unsafe JSON parsing patterns
* Never trust external structured data blindly

---

## 🧪 Testing Requirements

Before submitting a PR:

* ✅ All features must be tested
* ✅ Edge cases must be handled
* ✅ No regressions introduced
* ✅ Security-sensitive paths must be verified

---

## 🧹 Code Style

* Use consistent formatting
* Prefer descriptive variable names
* Avoid overly complex logic
* Keep functions small and focused

---

## 🚫 What Will Be Rejected

PRs will be rejected if they:

* Introduce security risks
* Use unsafe execution methods
* Add unnecessary complexity
* Break existing functionality
* Include untested code

---

## 🛠️ Commit Guidelines

Use clear commit messages:

```
feat: add multi-command support
fix: prevent command injection
refactor: improve parser safety
```

---

## 🔍 Review Process

* All PRs are reviewed before merging
* Security-related changes are reviewed more strictly
* Changes may be requested before approval

---

## 💬 Questions?

Open a discussion or ask in issues (non-security topics only).

---

## 🛡️ Security Reminder

If you discover a vulnerability, follow **SECURITY.md** instead of opening a public issue.

---