const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static('.')); // Permet de lire index.html directement

const DATA_FILE = "produits.json";

function lire() { return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8") || "[]"); }
function ecrire(d) { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2)); }

app.get("/products", (req, res) => res.json(lire()));

app.post("/add", (req, res) => {
    let p = lire(); p.push(req.body); ecrire(p);
    res.send("OK");
});

app.put("/update/:index", (req, res) => {
    let p = lire(); p[req.params.index] = req.body; ecrire(p);
    res.send("OK");
});

app.delete("/delete/:index", (req, res) => {
    let p = lire(); p.splice(req.params.index, 1); ecrire(p);
    res.send("OK");
});

app.listen(3000, () => console.log("Lien local: http://localhost:3000"));