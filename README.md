
# 🧾 E-Certificate Generator

A full-stack web application that allows users to generate single or bulk certificates using pre-defined templates. With a real-time canvas editor, you can insert custom text, images, and signatures onto certificates, preview the output, and generate high-quality PDFs — all from your browser.

> “Design once. Certify endlessly.”

---

## ✨ Features

- 🎨 **Choose from Ready-Made Templates**
- 🖊️ **Add Text, Signatures & Images via Canvas Editor**
- 🔍 **Preview Certificates Before Generating**
- 🔁 **Single Certificate or Bulk Generation**
- 📊 **CSV Integration for Bulk Data**
- 🧼 **Error Fixing Tools in Preview**
- 🧾 **Download High-Quality PDF Certificates**

---

## 🛠️ Tech Stack

| Layer       | Tools/Libraries                                 |
|-------------|-------------------------------------------------|
| Backend     | Node.js, Express.js                             |
| Frontend    | HTML5 Canvas, JavaScript, jQuery                |
| Templating  | Handlebars                                       |
| PDF Engine  | PDFKit                                           |
| CSV Parser  | fast-csv                                         |
| File System | multer, fs, path                                |

---

## 📂 Folder Structure

```

E-Certificate Generator/
├── bin/
├── output/                  # Final PDF exports
├── public/
│   ├── fonts/
│   ├── images/
│   ├── javascripts/
│   ├── stylesheets/
│   └── templates/           # Frontend template previews
├── server/
│   ├── Config/
│   ├── controllers/
│   ├── middleware/
│   ├── output/              # Backend PDF generation logic
│   ├── routes/
│   ├── services/
│   ├── templates/           # Certificate template logic
│   └── uploads/             # Uploaded user files
├── uploads/
├── views/                   # Handlebars templates
├── .gitignore
├── app.js
├── package.json
├── package-lock.json

````

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- npm

### Installation

```bash
https://github.com/SABAH-K-J/QuickCert
cd e-certificate-generator
npm install
````

### Run the app

```bash
npm start
```

Then open:

```
http://localhost:3000
```

---

## 📸 Screenshots / Demo

<img width="2879" height="1386" alt="image1" src="https://github.com/user-attachments/assets/95c2f529-00ac-42b7-a390-c98344c2d9bd" />

<img width="2879" height="1392" alt="image2" src="https://github.com/user-attachments/assets/dc988cfb-96b3-42d6-a810-fc6fd5e86fec" />

<img width="2879" height="1391" alt="image3" src="https://github.com/user-attachments/assets/5e450d8f-58df-4e17-81b3-5b44fa698c25" />

---

## 🤝 Collaborators

This project was built by a focused and collaborative team:

* 👨‍💻 **[Sabah K J](https://github.com/yourusername)** – Backend Development, PDF Generation, Core Logic
* 🛠️ **Radhesyam Raghav K R** – Backend Integration, Route Management
* 🎨 **Mohammed Farhan** – Frontend Development, UI Enhancements
* 🖋️ **Mohammed Nowfal** – Frontend Development, Canvas & Interaction Handling

---

## 📄 License

This project is licensed under the **MIT License** — open to use, modify, and contribute.

---

## 💬 Feedback & Contributions

Feel free to open issues or submit pull requests. We welcome contributions and feedback!

> ✨ *Designed visually. Generated instantly. Delivered professionally.*
