# 🔒 Security Policy

## 📌 Supported Versions

The following versions are currently receiving security updates:

| Version | Supported |
|--------|----------|
| 1.x.x  | ✅ Yes   |
| <1.0   | ❌ No    |

---

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability, please **do not open a public issue**. Instead:

📧 Report via email:
- security@yourdomain.com *(replace with your actual email)*

Or use GitHub:
- **Security Advisory / Private report**

---

## 🧠 What to Include

To help us resolve the issue quickly, please include:

- Description of the vulnerability  
- Affected version(s)  
- Steps to reproduce  
- Proof of Concept (PoC), if available  
- Expected vs. actual behavior  
- Potential impact (e.g., RCE, DoS, data leak)

---

## ⏱️ Response Policy

- 📩 Initial response: **within 48 hours**  
- 🔍 Investigation: **1–5 days**  
- 🛠️ Fix timeline: depends on severity  

---

## 🧱 Security Principles

This project follows these core security principles:

### 1. Input Validation
- All user inputs are validated  
- Unsafe parsing is not allowed  

### 2. No Code Execution from Strings
- Risky constructs like `eval`, `Function`, `exec` are **not used**  
- Commands are parsed, not directly executed  

### 3. Sandboxed Command System
- Commands run in an isolated environment  
- No access to system resources (fs, network, etc.) by default  

### 4. Least Privilege
- Every operation runs with minimal required permissions  

### 5. Safe Defaults
- Default configurations are secure  
- Potentially risky features are disabled by default  

---

## 🧪 Known Security Considerations

- Be cautious when exposing the command system to external input  
- Do not trust third-party plugins or extensions  
- Validate all serialization / deserialization processes  

---

## 🔄 Dependency Policy

- Minimal dependency approach is followed  
- Dependencies are regularly updated  
- Supply chain risks are considered  

---

## 🛡️ Responsible Disclosure

- Do not publicly disclose vulnerabilities before they are fixed  
- Contributors will be credited 🙌  

---

## 📜 License Note

This project is open source, but exploiting security vulnerabilities is unethical.

---

💡 Security is not a feature — it’s a process.