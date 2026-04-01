const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());

const DATA_FILE = "produits.json";

function lireDonnees() {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8") || "[]");
}

function sauvegarderDonnees(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.get("/products", (req, res) => res.json(lireDonnees()));

app.post("/add", (req, res) => {
    let produits = lireDonnees();
    produits.push(req.body);
    sauvegarderDonnees(produits);
    res.send("Ajouté");
});

app.delete("/delete/:index", (req, res) => {
    let produits = lireDonnees();
    produits.splice(req.params.index, 1);
    sauvegarderDonnees(produits);
    res.send("Supprimé");
});

// VÉRIFIE BIEN QUE CETTE ROUTE EST LÀ :
app.put("/update/:index", (req, res) => {
    let produits = lireDonnees();
    produits[req.params.index] = req.body;
    sauvegarderDonnees(produits);
    res.send("Mis à jour");
});

app.listen(3000, () => console.log("Serveur lancé sur le port 3000"));

app.use(express.static('.'));