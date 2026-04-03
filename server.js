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

// Initialisation des fichiers s'ils n'existent pas
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');
if (!fs.existsSync(VENTES_FILE)) fs.writeFileSync(VENTES_FILE, '[]');

app.get('/api/produits', (req, res) => {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    res.json(data);
});

// NOUVEAU : Route pour le BILAN TOTAL
app.get('/api/stats', (req, res) => {
    const produits = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const ventes = JSON.parse(fs.readFileSync(VENTES_FILE, 'utf8'));

    const caTotal = ventes.reduce((sum, v) => sum + v.total, 0);
    const nbVendus = ventes.reduce((sum, v) => sum + v.articles.reduce((s, a) => s + a.quantite, 0), 0);
    const valeurStock = produits.reduce((sum, p) => sum + (p.stock * p.prix), 0);
    
    // Calcul du bénéfice (Prix vente - Prix achat)
    let benefice = 0;
    ventes.forEach(v => {
        v.articles.forEach(art => {
            const marge = art.prix - (art.prixAchat || 0);
            benefice += (marge * art.quantite);
        });
    });

    res.json({ caTotal, nbVendus, valeurStock, benefice });
});

app.post('/api/vendre', (req, res) => {
    const { panier, total, encaisse, monnaie } = req.body;
    let produits = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    let ventes = JSON.parse(fs.readFileSync(VENTES_FILE, 'utf8'));

    const nouvelleVente = {
        id: uuidv4().slice(0, 8),
        date: new Date().toLocaleString(),
        articles: panier, // Contient prix et prixAchat pour le calcul du bilan
        total, encaisse, monnaie
    };

    panier.forEach(item => {
        const index = produits.findIndex(p => p.nom === item.nom);
        if (index !== -1) produits[index].stock -= item.quantite;
    });

    ventes.push(nouvelleVente);
    fs.writeFileSync(DATA_FILE, JSON.stringify(produits, null, 2));
    fs.writeFileSync(VENTES_FILE, JSON.stringify(ventes, null, 2));
    res.json({ success: true, ticket: nouvelleVente });
});

// Route pour ajouter un produit avec PRIX ACHAT
app.post('/api/ajouter', (req, res) => {
    const nouveau = req.body;
    let produits = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    produits.push(nouveau);
    fs.writeFileSync(DATA_FILE, JSON.stringify(produits, null, 2));
    res.json({ success: true });
});

app.listen(3000, () => console.log("Serveur Expert lancé sur http://localhost:3000"));