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
const CONFIG_FILE = './config.json';

// Initialisation des fichiers si inexistants
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');
if (!fs.existsSync(VENTES_FILE)) fs.writeFileSync(VENTES_FILE, '[]');
if (!fs.existsSync(CONFIG_FILE)) fs.writeFileSync(CONFIG_FILE, JSON.stringify({ investissement: 0, devise: 'FCFA' }));

// --- ROUTES CONFIGURATION ---
app.get('/api/stats', (req, res) => {
    const produits = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const ventes = JSON.parse(fs.readFileSync(VENTES_FILE, 'utf8'));
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    const caTotal = ventes.reduce((sum, v) => sum + v.total, 0);
    const valeurStock = produits.reduce((sum, p) => sum + (p.stock * p.prix), 0);
    res.json({ caTotal, valeurStock, beneficeReel: caTotal - config.investissement, investissement: config.investissement, devise: config.devise });
});

app.post('/api/config', (req, res) => {
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    const nouvelleConfig = { ...config, ...req.body };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(nouvelleConfig, null, 2));
    res.json({ success: true });
});

// --- ROUTES PRODUITS ---
app.get('/api/produits', (req, res) => res.json(JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))));

app.post('/api/ajouter', (req, res) => {
    let produits = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    produits.push(req.body);
    fs.writeFileSync(DATA_FILE, JSON.stringify(produits, null, 2));
    res.json({ success: true });
});

app.delete('/api/produits/:nom', (req, res) => {
    let produits = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    produits = produits.filter(p => p.nom !== req.params.nom);
    fs.writeFileSync(DATA_FILE, JSON.stringify(produits, null, 2));
    res.json({ success: true });
});

// --- ROUTES VENTES ---
app.get('/api/ventes', (req, res) => res.json(JSON.parse(fs.readFileSync(VENTES_FILE, 'utf8'))));

app.post('/api/vendre', (req, res) => {
    const { panier, total, encaisse, monnaie } = req.body;
    let produits = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    let ventes = JSON.parse(fs.readFileSync(VENTES_FILE, 'utf8'));
    
    const nouvelleVente = { 
        id: uuidv4().slice(0,8).toUpperCase(), 
        date: new Date().toLocaleString('fr-FR'), 
        articles: panier, 
        total, 
        encaisse, 
        monnaie 
    };
    
    panier.forEach(item => {
        const idx = produits.findIndex(p => p.nom === item.nom);
        if (idx !== -1) produits[idx].stock -= item.quantite;
    });
    
    ventes.unshift(nouvelleVente);
    fs.writeFileSync(DATA_FILE, JSON.stringify(produits, null, 2));
    fs.writeFileSync(VENTES_FILE, JSON.stringify(ventes, null, 2));
    res.json({ success: true, ticket: nouvelleVente });
});

app.listen(3000, () => console.log("🚀 Serveur Business Pro sur http://localhost:3000"));