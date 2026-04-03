const express = require('express');
const fs = require('fs');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const DATA_FILE = './produits.json';
const VENTES_FILE = './ventes.json';

// Initialisation
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');
if (!fs.existsSync(VENTES_FILE)) fs.writeFileSync(VENTES_FILE, '[]');

// Routes
app.get('/api/produits', (req, res) => res.json(JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))));
app.get('/api/ventes', (req, res) => res.json(JSON.parse(fs.readFileSync(VENTES_FILE, 'utf8'))));

app.get('/api/stats', (req, res) => {
    const produits = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const ventes = JSON.parse(fs.readFileSync(VENTES_FILE, 'utf8'));
    const caTotal = ventes.reduce((sum, v) => sum + v.total, 0);
    const valeurStock = produits.reduce((sum, p) => sum + (p.stock * p.prix), 0);
    let benefice = 0;
    ventes.forEach(v => v.articles.forEach(a => benefice += (a.prix - (a.prixAchat || 0)) * a.quantite));
    res.json({ caTotal, valeurStock, benefice, nbVentes: ventes.length });
});

app.post('/api/ajouter', (req, res) => {
    let produits = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    produits.push(req.body);
    fs.writeFileSync(DATA_FILE, JSON.stringify(produits, null, 2));
    res.json({ success: true });
});

app.post('/api/vendre', (req, res) => {
    const { panier, total, encaisse, monnaie } = req.body;
    let produits = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    let ventes = JSON.parse(fs.readFileSync(VENTES_FILE, 'utf8'));

    const nouvelleVente = { id: uuidv4().slice(0,8), date: new Date().toLocaleString(), articles: panier, total, encaisse, monnaie };
    
    panier.forEach(item => {
        const idx = produits.findIndex(p => p.nom === item.nom);
        if (idx !== -1) produits[idx].stock -= item.quantite;
    });

    ventes.unshift(nouvelleVente); // Les plus récentes en premier
    fs.writeFileSync(DATA_FILE, JSON.stringify(produits, null, 2));
    fs.writeFileSync(VENTES_FILE, JSON.stringify(ventes, null, 2));
    res.json({ success: true, ticket: nouvelleVente });
});

app.delete('/api/vente/:id', (req, res) => {
    let ventes = JSON.parse(fs.readFileSync(VENTES_FILE, 'utf8'));
    ventes = ventes.filter(v => v.id !== req.params.id);
    fs.writeFileSync(VENTES_FILE, JSON.stringify(ventes, null, 2));
    res.json({ success: true });
});

app.listen(3000, () => console.log("Logiciel lancé sur http://localhost:3000"));